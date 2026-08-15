const ZWSP: char = '\u{200B}';
const MYANMAR_RANGE: std::ops::RangeInclusive<char> = 'က'..='႟';
const MYANMAR_CONSONANT_RANGE: std::ops::RangeInclusive<char> = 'က'..='အ';
const VIRAMA: char = '္';
const KINZI_TONE: char = '်';

const HONORIFICS: &[&str] = &["ဆရာတော်ကြီး", "ဆရာတော်", "ဆရာမ", "ဉာဏ်တော်", "မဟာဂန္ဓဝိဟတ"];
const WORD_BOUNDARIES: &[&str] = &[
    "ဆရာတော်",
    "ဘုရားကြီး",
    "ဦး",
    "စင်္ကာပူ",
    "မြန်မာ",
    "ဘုန်းကြီးကျောင်းထိုင်",
    "အတွက်",
    "စာဝါများ",
];

const ENGLISH_TITLES: &[&str] = &[
    "Sayadaw", "Sayalay", "Ashin", "Maha", "Saya", "Sayado", "Ven.", "Dr.", "Prof.", "Maung", "Ma",
    "Ko", "Daw",
];

pub fn normalize_text(value: &str) -> String {
    let collapsed: String = value.split_whitespace().collect::<Vec<_>>().join(" ");
    let with_nbsp = glue_english_titles(&collapsed);
    if !contains_myanmar(&with_nbsp) {
        return with_nbsp;
    }
    add_myanmar_break_opportunities(&with_nbsp)
}

fn glue_english_titles(value: &str) -> String {
    let tokens: Vec<&str> = value.split(' ').collect();
    let mut out = String::with_capacity(value.len());
    for (index, token) in tokens.iter().enumerate() {
        if index > 0 {
            let prev = tokens[index - 1];
            if ENGLISH_TITLES.contains(&prev) {
                out.push('\u{00A0}');
            } else {
                out.push(' ');
            }
        }
        out.push_str(token);
    }
    out
}

fn contains_myanmar(value: &str) -> bool {
    value.chars().any(|ch| MYANMAR_RANGE.contains(&ch))
}

fn add_myanmar_break_opportunities(value: &str) -> String {
    let chars: Vec<char> = value.chars().collect();
    let mut out = String::with_capacity(value.len());
    let mut i = 0;
    while i < chars.len() {
        let ch = chars[i];
        if should_insert_before(i, &chars) && !out.ends_with(ZWSP) {
            out.push(ZWSP);
        }
        out.push(ch);
        i += 1;
    }
    out
}

fn should_insert_before(index: usize, chars: &[char]) -> bool {
    if index == 0 {
        return false;
    }
    let prev = chars[index - 1];
    let current = chars[index];
    let opens_word_parenthetical = current == '('
        && MYANMAR_RANGE.contains(&prev)
        && chars[index + 1..]
            .iter()
            .take_while(|&&ch| ch != ')')
            .any(|&ch| is_myanmar_consonant(ch));
    let starts_parenthetical_word = prev == '(' && is_myanmar_consonant(current);
    let closes_word_parenthetical = current == ')'
        && chars[..index]
            .iter()
            .rev()
            .take_while(|&&ch| ch != '(')
            .any(|&ch| is_myanmar_consonant(ch));
    if opens_word_parenthetical || starts_parenthetical_word || closes_word_parenthetical {
        return true;
    }
    if !MYANMAR_RANGE.contains(&prev) {
        return false;
    }
    for boundary in WORD_BOUNDARIES {
        let boundary_chars: Vec<char> = boundary.chars().collect();
        if chars[index..].starts_with(&boundary_chars) {
            return true;
        }
    }
    if matches!(prev, VIRAMA | KINZI_TONE) || is_myanmar_combining(prev) {
        return false;
    }
    if inside_virama_cluster(index, chars) {
        return false;
    }
    for honorific in HONORIFICS {
        let honorific_chars: Vec<char> = honorific.chars().collect();
        if chars[index..].starts_with(&honorific_chars) {
            return true;
        }
    }
    if starts_pali_name(index, chars) {
        return true;
    }
    false
}

fn inside_virama_cluster(index: usize, chars: &[char]) -> bool {
    let mut saw_virama = false;
    let mut j = index;
    while j > 0 {
        let c = chars[j - 1];
        if c == VIRAMA {
            saw_virama = true;
        } else if MYANMAR_RANGE.contains(&c) || is_myanmar_combining(c) || c == KINZI_TONE {
            // keep scanning
        } else {
            return saw_virama;
        }
        j -= 1;
    }
    saw_virama
}

fn is_myanmar_combining(ch: char) -> bool {
    matches!(
        ch,
        'ါ' | 'ာ'
            | 'ိ'
            | 'ီ'
            | 'ု'
            | 'ူ'
            | 'ေ'
            | 'ဲ'
            | 'ံ'
            | '့'
            | 'ျ'
            | 'ြ'
            | 'ွ'
            | 'ှ'
    )
}

fn is_myanmar_consonant(ch: char) -> bool {
    MYANMAR_CONSONANT_RANGE.contains(&ch)
}

fn starts_pali_name(index: usize, chars: &[char]) -> bool {
    let len = chars.len();
    if index + 1 >= len {
        return false;
    }
    let a = chars[index];
    if !MYANMAR_RANGE.contains(&a) {
        return false;
    }
    if index + 2 < len {
        let b = chars[index + 1];
        let c = chars[index + 2];
        if b == VIRAMA && MYANMAR_RANGE.contains(&c) {
            // consonant+virama+consonant — strong Pali signal
        } else if index + 3 < len {
            let d = chars[index + 3];
            if b != VIRAMA
                && MYANMAR_RANGE.contains(&b)
                && c == VIRAMA
                && MYANMAR_RANGE.contains(&d)
            {
                // consonant+consonant+virama+consonant — compound Pali start
            } else {
                return false;
            }
        } else {
            return false;
        }
    } else {
        return false;
    }
    !is_myanmar_consonant(chars[index - 1])
}

#[cfg(test)]
mod tests {
    use super::{ZWSP, normalize_text};

    fn has_zwsp(value: &str) -> bool {
        value.contains(ZWSP)
    }

    #[test]
    fn collapses_unicode_whitespace() {
        // "Sayadaw U Jotika" glues "Sayadaw" to "U" with NBSP so the title
        // and following name token stay on the same line.
        let out = normalize_text("  Venerable\n\tSayadaw   U Jotika  ");
        assert!(out.contains("Venerable Sayadaw U Jotika"), "got {out:?}");
    }

    #[test]
    fn preserves_myanmar_text() {
        assert_eq!(normalize_text("  မေတ္တာ   ပို့  "), "မေတ္တာ ပို့");
    }

    #[test]
    fn breaks_sayadaw_title_from_place() {
        let out = normalize_text("ဖားအောက်တောရဆရာတော်ကြီး ဘဒ္ဒန္တအာစိဏ္ဏ");
        assert!(has_zwsp(&out), "expected ZWSP in {out:?}");
        assert!(out.starts_with("ဖားအောက်တောရ"));
        assert!(
            out.contains(&format!("{ZWSP}ဆရာတော်ကြီး")),
            "expected ZWSP before ဆရာတော်ကြီး in {out:?}"
        );
    }

    #[test]
    fn preserves_existing_space_between_honorific_and_pali_name() {
        let out = normalize_text("ဖားအောက်တောရဆရာတော်ကြီး ဘဒ္ဒန္တအာစိဏ္ဏ");
        assert!(
            out.contains("ဆရာတော်ကြီး ဘဒ္ဒန္တအာစိဏ္ဏ"),
            "expected space preserved in {out:?}"
        );
    }

    #[test]
    fn does_not_break_inside_virama_cluster() {
        let out = normalize_text("ဘဒ္ဒန္တအာစိဏ္ဏ");
        assert!(!has_zwsp(&out), "Pali cluster must stay intact: {out:?}");
    }

    #[test]
    fn inserts_only_one_zwsp_when_idempotent() {
        let once = normalize_text("ဖားအောက်တောရဆရာတော် ဘဒ္ဒန္တ");
        let twice = normalize_text(&once);
        assert_eq!(once, twice, "normalize_text must be idempotent");
    }

    #[test]
    fn leaves_non_myanmar_input_untouched() {
        // "Sayadaw" at end of string has no following token, so no NBSP is
        // inserted.
        let out = normalize_text("Mahasi Sayadaw");
        assert!(!has_zwsp(&out));
        assert_eq!(out, "Mahasi Sayadaw");
    }

    #[test]
    fn glues_english_title_to_following_name() {
        // "Sayadaw Nandamalavivamsa(Sitagu)" — "Sayadaw" is the title, so
        // the space between it and the name becomes a non-breaking space so
        // they stay on the same line. The parenthetical stays attached to
        // the name (no space before "(").
        let out = normalize_text("Sayadaw Nandamalavivamsa(Sitagu)");
        assert!(!has_zwsp(&out), "no ZWSP in English names: {out:?}");
        assert!(
            out.contains("Sayadaw Nandamalavivamsa(Sitagu)"),
            "expected NBSP between Sayadaw and name in {out:?}"
        );
    }

    #[test]
    fn handles_pali_name_directly_after_unicode_only() {
        let out = normalize_text("ဦးဘဒ္ဒန္တအာစိဏ္ဏ");
        assert!(
            out.contains(&format!("ဦး{ZWSP}ဘဒ္ဒန္တအာစိဏ္ဏ")),
            "expected ZWSP before Pali name after ဦး in {out:?}"
        );
    }

    #[test]
    fn handles_sayalay_honorific() {
        let out = normalize_text("မြစိမ်းဆရာမ ဓမ္မသိင်္ဃာရုံ");
        assert!(
            out.contains(&format!("မြစိမ်း{ZWSP}ဆရာမ")),
            "expected ZWSP before ဆရာမ in {out:?}"
        );
    }

    #[test]
    fn adds_word_boundaries_to_compact_course_names() {
        let out = normalize_text("စာချတန်း(၃)ကျမ်းအတွက်စာဝါများ");
        assert_eq!(out, format!("စာချတန်း(၃)ကျမ်း{ZWSP}အတွက်{ZWSP}စာဝါများ"));
    }

    #[test]
    fn adds_semantic_boundaries_to_sayadaw_buragyi_titles() {
        let out = normalize_text("သဲအင်းဂူဆရာတော်ဘုရားကြီး ဦးဥက္ကဋ္ဌ");
        assert_eq!(
            out,
            format!("သဲအင်းဂူ{ZWSP}ဆရာတော်{ZWSP}ဘုရားကြီး ဦး{ZWSP}ဥ{ZWSP}က္ကဋ္ဌ")
        );
    }

    #[test]
    fn adds_reusable_boundaries_to_compact_parenthetical_names() {
        let out = normalize_text("ဆရာတော်ဦးပညာဝံသ(စင်္ကာပူမြန်မာဘုန်းကြီးကျောင်းထိုင်ဆရာတော်)");
        assert_eq!(
            out,
            format!(
                "ဆရာတော်{ZWSP}ဦးပညာဝံသ{ZWSP}({ZWSP}စင်္ကာပူ{ZWSP}မြန်မာ{ZWSP}ဘုန်းကြီးကျောင်းထိုင်{ZWSP}ဆရာတော်{ZWSP})"
            )
        );
    }

    #[test]
    fn adds_wrap_opportunities_around_attached_parentheses() {
        let out = normalize_text("အောင်ဆန်းဆရာတော်(မိုးကုတ်ဆရာတော်)");
        assert_eq!(
            out,
            format!("အောင်ဆန်း{ZWSP}ဆရာတော်{ZWSP}({ZWSP}မိုးကုတ်{ZWSP}ဆရာတော်{ZWSP})")
        );
    }
}
