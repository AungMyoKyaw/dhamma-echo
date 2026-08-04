pub fn normalize_text(value: &str) -> String {
    value.split_whitespace().collect::<Vec<_>>().join(" ")
}

#[cfg(test)]
mod tests {
    use super::normalize_text;

    #[test]
    fn collapses_unicode_whitespace() {
        assert_eq!(
            normalize_text("  Venerable\n\tSayadaw   U Jotika  "),
            "Venerable Sayadaw U Jotika"
        );
    }

    #[test]
    fn preserves_myanmar_text() {
        assert_eq!(normalize_text("  မေတ္တာ   ပို့  "), "မေတ္တာ ပို့");
    }
}
