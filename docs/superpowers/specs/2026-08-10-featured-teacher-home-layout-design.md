# Featured Teacher Home Layout Design

Date: 2026-08-10
Status: Approved

## Problem

The Home page uses a single horizontal featured-teacher carousel regardless of whether Continue Listening is present. With no recent listening content, this leaves a large empty area below one shallow row. Teacher names are also restricted to two lines, so longer Myanmar names are visibly truncated.

## Design

The Home page will use two featured-teacher layouts based on whether Continue Listening can render content:

- When Continue Listening has one or more resolved tracks, featured teachers remain in the compact horizontal carousel.
- When Continue Listening has no resolved tracks, all six featured teachers render in a three-column, two-row grid.

Teacher cards will use equal-height content structure. Names may wrap without line clamping, and the Featured badge will occupy its own row so it does not reduce the width available to Myanmar text. The existing teacher order remains:

1. မိုးကုတ်ဆရာတော်ဘုရားကြီး
2. သဲအင်းဂူဆရာတော်ဘုရားကြီး ဦးဥက္ကဋ္ဌ
3. ဖားအောက်တောရဆရာတော်ကြီး ဘဒ္ဒန္တအာစိဏ္ဏ
4. မဟာဗောဓိမြိုင် ဆရာတော် ဝနဝါသီ အရှင်ဉေယျဓမ္မသာမိမထေရ်
5. ဆရာတော်ဦးဇောတိက (မဟာမြိုင်တောရ)
6. ပါမောက္ခချုပ်ဆရာတော်ကြီး ဘဒ္ဒန္တ ဒေါက်တာ နန္ဒမာလာဘိဝံသ

## State Rule

The layout decision must use resolved recent-track state rather than raw history length. Stale history IDs can exist while `homeRecent.tracks` is empty; in that case the Home page must use the no-recent grid and show summary statistics.

Continue Listening is considered present only when `homeRecent.status` is `loading` or when `homeRecent.status` is `ready` with at least one track. Error, idle, and empty-ready states use the no-recent layout.

## Testing

View tests will verify:

- long teacher names are not line-clamped;
- the empty-ready and stale-history states render the three-column featured grid and summary statistics;
- a ready state with a resolved track retains the horizontal carousel;
- all six featured teachers remain in the approved order.

The full web and Rust verification suite must pass before publishing.
