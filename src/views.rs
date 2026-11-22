use std::{cell::Cell, rc::Rc};

use gpui::{
    App, Bounds, Context, Div, FocusHandle, Focusable, FontWeight, MouseButton, ObjectFit, Pixels,
    Point, Rgba, ScrollDelta, SharedString, Stateful, Window, canvas, deferred, div, img, point,
    prelude::*, px, relative, rgb, svg,
};

use crate::{
    AppDropdown, Echo, FormatFilter, LanguageFilter, LibraryTab, Palette, Route,
    WHEEL_LINE_MULTIPLIER,
    downloads::DownloadJobState,
    i18n::{
        CountKind, Locale, back_label, count_label, format_locale_duration, format_locale_number,
        route_heading, t, t_error, tf,
    },
    library::{Collection, Talk, Teacher},
    normalize::{is_myanmar_text, truncate_teacher_card_name, truncate_track_title},
    platform::primary_modifier_label,
    playback::{Playback, VideoFrame},
    state::ThemePreference,
};

pub const DISPLAY_FONT: &str = "Source Serif 4";
pub const FEATURED_TEACHERS: [i64; 8] = [16, 42, 40, 53, 61, 8, 55, 1307];
pub const RATES: [f32; 6] = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
pub const BROWSE_LIMITS: [i64; 3] = [25, 50, 100];

impl Echo {
    pub(crate) fn render_sidebar(
        &self,
        width: Pixels,
        compact: bool,
        cx: &mut Context<Self>,
    ) -> Div {
        let p = self.palette();
        let locale = self.settings.locale;
        let collapsed = self.ui.sidebar_collapsed;

        let mut sidebar = div()
            .flex()
            .flex_col()
            .flex_none()
            .h_full()
            .w(width)
            .px(if collapsed {
                px(12.)
            } else if compact {
                px(16.)
            } else {
                px(20.)
            })
            .pt_3()
            .pb(if compact { px(8.) } else { px(24.) })
            .border_r_1()
            .border_color(p.rule)
            .bg(p.page)
            .child(
                div()
                    .flex()
                    .items_center()
                    .when(!collapsed, |row| row.gap_3().px_2())
                    .when(collapsed, |row| row.justify_center())
                    .child(
                        div()
                            .flex_none()
                            .size_11()
                            .rounded(px(8.))
                            .child(img("assets/brand.png").size_11()),
                    )
                    .when(!collapsed, |row| {
                        row.child(
                            div()
                                .flex()
                                .flex_col()
                                .child(
                                    div()
                                        .text_lg()
                                        .font_weight(FontWeight::BOLD)
                                        .child(t(locale, "app.name")),
                                )
                                .child(
                                    div()
                                        .text_xs()
                                        .text_color(p.quiet)
                                        .child(t(locale, "app.tagline")),
                                ),
                        )
                    }),
            );

        let mut navigation = div()
            .flex()
            .flex_col()
            .gap_2()
            .mt(if compact { px(28.) } else { px(36.) })
            .w_full();
        for route in Route::NAVIGATION {
            let active = self.route == route
                || (self.route == Route::TeacherDetail && route == Route::Teachers)
                || (self.route == Route::CollectionDetail && route == Route::Collections);
            navigation = navigation.child(
                div()
                    .id(gpui::SharedString::from(format!("nav-{}", route.id_slug())))
                    .flex()
                    .items_center()
                    .h_12()
                    .w_full()
                    .rounded(px(8.))
                    .cursor_pointer()
                    .when(collapsed, |item| item.justify_center())
                    .when(!collapsed, |item| item.gap_3().px_4())
                    .text_sm()
                    .font_weight(FontWeight::SEMIBOLD)
                    .text_color(if active { p.on_primary } else { p.quiet })
                    .when(active, |item| item.bg(p.primary))
                    .when(!active, |item| {
                        item.hover(move |item| item.bg(p.panel).text_color(p.ink))
                    })
                    .child(icon(
                        route.icon(),
                        20.0,
                        if active { p.on_primary } else { p.quiet },
                    ))
                    .when(!collapsed, |item| item.child(t(locale, route.nav_key())))
                    .on_click(cx.listener(move |view, _, window, cx| {
                        view.navigate(route, window, cx);
                    })),
            );
        }
        sidebar = sidebar.child(navigation);

        let mut footer = div()
            .flex()
            .flex_col()
            .gap(if compact { px(4.) } else { px(12.) })
            .mt_auto()
            .w_full();
        if !collapsed {
            footer = footer.child(
                div()
                    .flex()
                    .flex_col()
                    .rounded(px(12.))
                    .border_1()
                    .border_color(p.rule)
                    .bg(p.panel)
                    .p(if compact { px(10.) } else { px(16.) })
                    .child(
                        div()
                            .flex()
                            .items_center()
                            .justify_center()
                            .size_9()
                            .mb(if compact { px(8.) } else { px(12.) })
                            .rounded_full()
                            .bg(p.hover)
                            .child(icon("leaf", 20.0, p.primary)),
                    )
                    .child(
                        div()
                            .text_sm()
                            .font_weight(FontWeight::BOLD)
                            .child(t(locale, "privacy.title")),
                    )
                    .child(
                        div()
                            .mt_1()
                            .text_xs()
                            .line_height(px(20.))
                            .text_color(p.quiet)
                            .child(t(locale, "privacy.body")),
                    ),
            );
        }
        footer = footer.child(
            div()
                .id("collapse-sidebar")
                .flex()
                .items_center()
                .h_11()
                .w_full()
                .rounded(px(8.))
                .cursor_pointer()
                .when(collapsed, |item| item.justify_center())
                .when(!collapsed, |item| item.gap_2().px_4())
                .text_xs()
                .font_weight(FontWeight::BOLD)
                .text_color(p.quiet)
                .hover(move |item| item.bg(p.panel).text_color(p.ink))
                .child(icon(
                    if collapsed {
                        "chevron-right"
                    } else {
                        "chevron-left"
                    },
                    16.0,
                    p.quiet,
                ))
                .when(!collapsed, |item| item.child(t(locale, "nav.collapse")))
                .on_click(cx.listener(|view, _, _, cx| {
                    view.toggle_sidebar(cx);
                })),
        );
        sidebar.child(footer)
    }

    pub(crate) fn render_header(&self, compact: bool) -> Div {
        let p = self.palette();
        let locale = self.settings.locale;
        let (eyebrow, default_title, detail) = route_heading(locale, self.route.kind());
        let title = match self.route {
            Route::TeacherDetail => self
                .teacher_detail
                .as_ref()
                .map(|t| t.name.clone())
                .unwrap_or_else(|| default_title.to_string()),
            Route::CollectionDetail => self
                .collection_detail
                .as_ref()
                .map(|c| c.name.clone())
                .unwrap_or_else(|| default_title.to_string()),
            _ => default_title.to_string(),
        };
        div()
            .flex()
            .flex_col()
            .w_full()
            .max_w(px(1520.))
            .mx_auto()
            .px(if compact { px(24.) } else { px(40.) })
            .pt(if compact { px(24.) } else { px(32.) })
            .pb_5()
            .child(
                div()
                    .text_xs()
                    .font_weight(FontWeight::BOLD)
                    .text_color(p.quiet)
                    .child(eyebrow),
            )
            .child(
                div()
                    .mt_2()
                    .font_family(DISPLAY_FONT)
                    .text_size(if compact { px(28.) } else { px(30.) })
                    .line_height(px(35.))
                    .font_weight(FontWeight::SEMIBOLD)
                    .child(title),
            )
            .child(
                div()
                    .mt_2()
                    .text_sm()
                    .line_height(px(24.))
                    .text_color(p.quiet)
                    .child(detail),
            )
    }

    pub(crate) fn render_home(&self, card_width: Pixels, cx: &mut Context<Self>) -> Div {
        let p = self.palette();
        let locale = self.settings.locale;
        let mut page = div().flex().flex_col().gap_8().w_full();

        if let Some(latest) = self.recent_tracks.first() {
            let is_current = self.talk.as_ref().is_some_and(|t| t.id == latest.id);
            let playing = is_current && self.audio.as_ref().is_some_and(Playback::wants_playback);
            let resume_pos = if is_current {
                self.position
            } else {
                self.resume_map.get(&latest.id).map(|r| r.0).unwrap_or(0.0)
            };
            let latest_clone = latest.clone();
            let teacher_line = if latest.teacher_name.is_empty() {
                t(locale, "player.unknownTeacher").to_string()
            } else {
                latest.teacher_name.clone()
            };
            let subtitle = if resume_pos > 0.0 {
                let time_str = format_locale_duration(resume_pos, locale);
                format!(
                    "{teacher_line} · {}",
                    tf(locale, "home.resumeAt", &[("time", time_str)])
                )
            } else {
                teacher_line
            };

            let mut continue_section = div()
                .flex()
                .flex_col()
                .gap_4()
                .child(
                    div()
                        .flex()
                        .flex_col()
                        .child(
                            div()
                                .font_family(DISPLAY_FONT)
                                .text_xl()
                                .font_weight(FontWeight::SEMIBOLD)
                                .child(t(locale, "home.continue")),
                        )
                        .child(
                            div()
                                .mt_1()
                                .text_sm()
                                .text_color(p.quiet)
                                .child(t(locale, "home.continue.detail")),
                        ),
                )
                .child(
                    div()
                        .id("resume-latest")
                        .flex()
                        .items_center()
                        .gap_4()
                        .overflow_hidden()
                        .rounded(px(12.))
                        .border_1()
                        .border_color(p.rule)
                        .bg(p.panel)
                        .p_5()
                        .when(latest.playable, |card| card.cursor_pointer())
                        .child(
                            div()
                                .flex()
                                .items_center()
                                .justify_center()
                                .size(px(56.))
                                .flex_none()
                                .rounded_full()
                                .bg(if latest.playable { p.primary } else { p.rule })
                                .child(icon(
                                    if !latest.playable {
                                        "close"
                                    } else if playing {
                                        "pause"
                                    } else {
                                        "play"
                                    },
                                    24.0,
                                    p.on_primary,
                                )),
                        )
                        .child(
                            div()
                                .flex()
                                .flex_col()
                                .min_w_0()
                                .flex_1()
                                .child(
                                    div()
                                        .font_weight(FontWeight::BOLD)
                                        .line_height(if is_myanmar_text(&latest.title) {
                                            px(28.)
                                        } else {
                                            px(24.)
                                        })
                                        .line_clamp(2)
                                        .child(truncate_track_title(&latest.title, 60)),
                                )
                                .child(
                                    div().mt_1().text_sm().text_color(p.quiet).truncate().child(
                                        if latest.playable {
                                            subtitle
                                        } else {
                                            format!(
                                                "{subtitle} · {}",
                                                t(locale, "home.unsupportedHint")
                                            )
                                        },
                                    ),
                                ),
                        )
                        .on_click(cx.listener(move |view, _, _, cx| {
                            if !latest_clone.playable {
                                return;
                            }
                            if view.talk.as_ref().is_some_and(|t| t.id == latest_clone.id) {
                                view.toggle(cx);
                            } else {
                                view.play_talk_resumed(latest_clone.clone(), cx);
                            }
                        })),
                );

            let rest: Vec<Talk> = self
                .recent_tracks
                .iter()
                .skip(1)
                .filter(|track| track.playable)
                .take(4)
                .cloned()
                .collect();
            if !rest.is_empty() {
                continue_section = continue_section.child(
                    div()
                        .flex()
                        .flex_col()
                        .gap_2()
                        .child(
                            div()
                                .text_xs()
                                .font_weight(FontWeight::BOLD)
                                .text_color(p.quiet)
                                .child(t(locale, "home.recentlyPlayed").to_uppercase()),
                        )
                        .child(self.track_list(&rest, "home-recent", cx)),
                );
            }
            page = page.child(continue_section);
        } else {
            let talks_str = count_label(locale, CountKind::Talk, self.summary.total_audio);
            let teachers_str = count_label(locale, CountKind::Teacher, self.summary.total_teachers);
            let body = tf(
                locale,
                "home.welcome.body",
                &[("talks", talks_str), ("teachers", teachers_str)],
            );
            page = page.child(
                div()
                    .flex()
                    .flex_col()
                    .gap_5()
                    .rounded(px(12.))
                    .border_1()
                    .border_color(p.rule)
                    .bg(p.panel)
                    .p_6()
                    .child(
                        div()
                            .text_xs()
                            .font_weight(FontWeight::BOLD)
                            .text_color(p.quiet)
                            .child(t(locale, "home.welcome.eyebrow").to_uppercase()),
                    )
                    .child(
                        div()
                            .font_family(DISPLAY_FONT)
                            .text_xl()
                            .font_weight(FontWeight::SEMIBOLD)
                            .child(t(locale, "home.welcome.title")),
                    )
                    .child(
                        div()
                            .max_w(px(576.))
                            .text_sm()
                            .line_height(px(24.))
                            .text_color(p.quiet)
                            .child(body),
                    )
                    .child(
                        div()
                            .flex()
                            .flex_wrap()
                            .gap_3()
                            .child(
                                primary_button(
                                    "home-explore",
                                    t(locale, "home.welcome.explore"),
                                    p,
                                )
                                .on_click(cx.listener(
                                    |view, _, window, cx| view.navigate(Route::Explore, window, cx),
                                )),
                            )
                            .child(
                                quiet_button(
                                    "home-teachers",
                                    t(locale, "home.welcome.teachers"),
                                    p,
                                )
                                .on_click(cx.listener(
                                    |view, _, window, cx| {
                                        view.navigate(Route::Teachers, window, cx)
                                    },
                                )),
                            ),
                    ),
            );
        }

        let featured = featured_teachers(&self.all_teachers);
        page.child(
            div()
                .flex()
                .flex_col()
                .child(
                    div()
                        .flex()
                        .items_end()
                        .justify_between()
                        .mb_4()
                        .child(
                            div()
                                .flex()
                                .flex_col()
                                .child(
                                    div()
                                        .font_family(DISPLAY_FONT)
                                        .text_xl()
                                        .font_weight(FontWeight::SEMIBOLD)
                                        .child(t(locale, "home.featured")),
                                )
                                .child(
                                    div()
                                        .mt_1()
                                        .text_sm()
                                        .text_color(p.quiet)
                                        .child(t(locale, "home.featured.detail")),
                                ),
                        )
                        .child(
                            div()
                                .id("view-all-teachers")
                                .flex()
                                .items_center()
                                .min_h_11()
                                .cursor_pointer()
                                .text_sm()
                                .font_weight(FontWeight::BOLD)
                                .child(t(locale, "home.featured.viewAll"))
                                .on_click(cx.listener(|view, _, window, cx| {
                                    view.navigate(Route::Teachers, window, cx)
                                })),
                        ),
                )
                .child(self.teacher_grid(&featured, card_width, cx)),
        )
    }

    pub(crate) fn render_search_input(
        &self,
        has_clear: bool,
        clear_id: &'static str,
        cx: &mut Context<Self>,
    ) -> Div {
        let p = self.palette();
        div()
            .flex()
            .items_center()
            .gap_3()
            .h_12()
            .min_w(px(260.))
            .flex_auto()
            .flex_basis(px(360.))
            .rounded(px(8.))
            .border_1()
            .border_color(p.rule)
            .bg(p.substrate)
            .px_4()
            .child(icon("search", 20.0, p.quiet))
            .child(
                div()
                    .flex_1()
                    .min_w_0()
                    .id("search-input-focus")
                    .child(self.input.clone())
                    .on_click(cx.listener(|view, _, window, cx| {
                        let handle = view.input.read(cx).focus_handle(cx);
                        window.focus(&handle);
                    })),
            )
            .when(has_clear, |row| {
                row.child(
                    div()
                        .id(clear_id)
                        .flex()
                        .items_center()
                        .justify_center()
                        .size_8()
                        .rounded_full()
                        .cursor_pointer()
                        .hover(move |btn| btn.bg(p.panel))
                        .child(icon("close", 14.0, p.quiet))
                        .on_click(cx.listener(|view, _, _, cx| {
                            view.clear_active_search_query(cx);
                        })),
                )
            })
    }

    pub(crate) fn render_explore(&self, cx: &mut Context<Self>) -> Div {
        let p = self.palette();
        let locale = self.settings.locale;
        let has_filters = !self.explore_query.is_empty()
            || self.language != LanguageFilter::All
            || self.format != FormatFilter::All
            || self.explore_teacher_id.is_some()
            || self.category != 0
            || self.explore_collection_id.is_some();

        let lang_button = self.dropdown_trigger(
            "language-filter",
            t(locale, self.language.label_key()),
            self.open_dropdown == Some(AppDropdown::ExploreLanguage),
            cx.listener(|view, _, _, cx| view.toggle_dropdown(AppDropdown::ExploreLanguage, cx)),
        );
        let format_button = self.dropdown_trigger(
            "format-filter",
            t(locale, self.format.label_key()),
            self.open_dropdown == Some(AppDropdown::ExploreFormat),
            cx.listener(|view, _, _, cx| view.toggle_dropdown(AppDropdown::ExploreFormat, cx)),
        );

        let mut controls_row = div()
            .relative()
            .flex()
            .flex_wrap()
            .items_center()
            .gap_3()
            .child(self.render_search_input(
                !self.explore_query.is_empty(),
                "clear-explore-query",
                cx,
            ))
            .child(div().relative().child(lang_button).when(
                self.open_dropdown == Some(AppDropdown::ExploreLanguage),
                |wrap| {
                    let mut menu = dropdown_menu(p, px(190.));
                    for opt in [
                        LanguageFilter::All,
                        LanguageFilter::Myanmar,
                        LanguageFilter::English,
                    ] {
                        let selected = self.language == opt;
                        menu = menu.child(
                            dropdown_item(
                                SharedString::from(format!(
                                    "lang-opt-{}",
                                    opt.value().unwrap_or("all")
                                )),
                                t(locale, opt.label_key()),
                                selected,
                                p,
                            )
                            .on_click(cx.listener(
                                move |view, _, _, cx| {
                                    view.language = opt;
                                    view.open_dropdown = None;
                                    view.run_explore_search(cx);
                                },
                            )),
                        );
                    }
                    wrap.child(deferred(menu).with_priority(10))
                },
            ))
            .child(div().relative().child(format_button).when(
                self.open_dropdown == Some(AppDropdown::ExploreFormat),
                |wrap| {
                    let mut menu = dropdown_menu(p, px(190.));
                    for opt in [
                        FormatFilter::All,
                        FormatFilter::Mp3,
                        FormatFilter::Wma,
                        FormatFilter::Mp4,
                        FormatFilter::Wmv,
                    ] {
                        let selected = self.format == opt;
                        menu = menu.child(
                            dropdown_item(
                                SharedString::from(format!(
                                    "fmt-opt-{}",
                                    opt.value().unwrap_or("all")
                                )),
                                t(locale, opt.label_key()),
                                selected,
                                p,
                            )
                            .on_click(cx.listener(
                                move |view, _, _, cx| {
                                    view.format = opt;
                                    view.open_dropdown = None;
                                    view.run_explore_search(cx);
                                },
                            )),
                        );
                    }
                    wrap.child(deferred(menu).with_priority(10))
                },
            ));

        let mut filters = div().flex().flex_wrap().gap_2();
        filters = filters.child(self.category_pill(0, t(locale, "search.category.all"), 0, cx));
        for category in &self.categories {
            filters =
                filters.child(self.category_pill(category.id, &category.name, category.count, cx));
        }
        controls_row = controls_row.child(div().w_full().child(filters));

        let mut page = div().flex().flex_col().gap_5().w_full().child(controls_row);

        if has_filters {
            let mut chips = div().flex().flex_wrap().items_center().gap_2();
            if !self.explore_query.is_empty() {
                chips = chips.child(
                    filter_chip(
                        "chip-query",
                        tf(
                            locale,
                            "search.filters.query",
                            &[("query", self.explore_query.clone())],
                        ),
                        p,
                    )
                    .on_click(cx.listener(|view, _, _, cx| {
                        view.clear_active_search_query(cx);
                    })),
                );
            }
            if let Some(teacher_id) = self.explore_teacher_id {
                let teacher_name = self
                    .all_teachers
                    .iter()
                    .find(|t| t.id == teacher_id)
                    .map(|t| t.name.clone())
                    .unwrap_or_else(|| t(locale, "search.filters.selectedTeacher").to_string());
                chips = chips.child(
                    filter_chip(
                        "chip-teacher",
                        tf(locale, "search.filters.teacher", &[("name", teacher_name)]),
                        p,
                    )
                    .on_click(cx.listener(|view, _, _, cx| {
                        view.explore_teacher_id = None;
                        view.run_explore_search(cx);
                    })),
                );
            }
            if self.category != 0
                && let Some(cat) = self.categories.iter().find(|c| c.id == self.category)
            {
                chips = chips.child(
                    filter_chip(
                        "chip-category",
                        tf(
                            locale,
                            "search.filters.category",
                            &[("name", cat.name.clone())],
                        ),
                        p,
                    )
                    .on_click(cx.listener(|view, _, _, cx| {
                        view.category = 0;
                        view.run_explore_search(cx);
                    })),
                );
            }
            if self.explore_collection_id.is_some() {
                chips = chips.child(
                    filter_chip(
                        "chip-collection",
                        t(locale, "search.filters.collection").to_string(),
                        p,
                    )
                    .on_click(cx.listener(|view, _, _, cx| {
                        view.explore_collection_id = None;
                        view.run_explore_search(cx);
                    })),
                );
            }
            chips = chips.child(
                quiet_button("clear-filters", t(locale, "search.filters.clearAll"), p).on_click(
                    cx.listener(|view, _, _, cx| {
                        view.clear_explore_filters(cx);
                    }),
                ),
            );
            page = page.child(chips);
        }

        if self.results.is_empty() {
            let empty_title = if !self.explore_query.is_empty() {
                tf(
                    locale,
                    "explore.empty.title.query",
                    &[("query", self.explore_query.clone())],
                )
            } else {
                t(locale, "explore.empty.title.filters").to_string()
            };
            let empty_detail = if has_filters {
                t(locale, "explore.empty.detail.filters")
            } else {
                t(locale, "explore.empty.detail.catalogue")
            };
            page = page.child(render_empty_state(
                empty_title,
                empty_detail.to_string(),
                has_filters.then(|| ("explore-empty-clear", t(locale, "search.filters.clearAll"))),
                p,
                cx.listener(|view, _, _, cx| view.clear_explore_filters(cx)),
            ));
        } else {
            page = page.child(self.track_list(&self.results, "explore", cx));
        }

        if self.results_total > 0 {
            page = page.child(self.render_progressive_controls(
                "explore-load-more",
                self.results.len() as i64,
                self.results_total,
                self.results_next_limit,
                "noun.talks",
                cx.listener(|view, _, _, cx| view.load_more_explore(cx)),
            ));
        }
        page
    }

    pub(crate) fn render_collections(&self, card_width: Pixels, cx: &mut Context<Self>) -> Div {
        let p = self.palette();
        let locale = self.settings.locale;
        let has_filters = !self.collection_query.is_empty() || self.collection_teacher_id.is_some();

        let selected_teacher_label = self
            .collection_teacher_id
            .and_then(|id| self.all_teachers.iter().find(|t| t.id == id))
            .map(|t| t.name.clone())
            .unwrap_or_else(|| t(locale, "search.collections.allTeachers").to_string());

        let mut page = div().flex().flex_col().gap_5().w_full().child(
            div()
                .flex()
                .flex_wrap()
                .items_center()
                .gap_3()
                .child(self.render_search_input(
                    !self.collection_query.is_empty(),
                    "clear-collection-query",
                    cx,
                ))
                .child(
                    div()
                        .relative()
                        .child(self.dropdown_trigger(
                            "collection-teachers",
                            &selected_teacher_label,
                            self.open_dropdown == Some(AppDropdown::CollectionTeacher),
                            cx.listener(|view, _, _, cx| {
                                view.toggle_dropdown(AppDropdown::CollectionTeacher, cx);
                            }),
                        ))
                        .when(
                            self.open_dropdown == Some(AppDropdown::CollectionTeacher),
                            |wrap| {
                                let mut menu = dropdown_menu(p, px(300.));
                                menu = menu.child(
                                    dropdown_item(
                                        "coll-teacher-all".into(),
                                        t(locale, "search.collections.allTeachers"),
                                        self.collection_teacher_id.is_none(),
                                        p,
                                    )
                                    .on_click(cx.listener(
                                        |view, _, _, cx| {
                                            view.collection_teacher_id = None;
                                            view.open_dropdown = None;
                                            view.run_collections_search(cx);
                                        },
                                    )),
                                );
                                for teacher in &self.all_teachers {
                                    let tid = teacher.id;
                                    let selected = self.collection_teacher_id == Some(tid);
                                    menu = menu.child(
                                        dropdown_item(
                                            gpui::SharedString::from(format!("coll-teacher-{tid}")),
                                            &teacher.name,
                                            selected,
                                            p,
                                        )
                                        .on_click(
                                            cx.listener(move |view, _, _, cx| {
                                                view.collection_teacher_id = Some(tid);
                                                view.open_dropdown = None;
                                                view.run_collections_search(cx);
                                            }),
                                        ),
                                    );
                                }
                                wrap.child(deferred(menu).with_priority(10))
                            },
                        ),
                ),
        );

        if has_filters {
            page = page.child(
                div().flex().items_center().gap_2().child(
                    quiet_button(
                        "clear-collection-filters",
                        t(locale, "search.collections.clear"),
                        p,
                    )
                    .on_click(cx.listener(|view, _, _, cx| {
                        view.clear_collection_filters(cx);
                    })),
                ),
            );
        }

        if self.collections.is_empty() {
            let title = if !self.collection_query.is_empty() {
                tf(
                    locale,
                    "collections.empty.title.query",
                    &[("query", self.collection_query.clone())],
                )
            } else {
                t(locale, "collections.empty.title").to_string()
            };
            page = page.child(render_empty_state(
                title,
                t(locale, "collections.empty.detail").to_string(),
                has_filters.then(|| {
                    (
                        "collections-empty-clear",
                        t(locale, "search.collections.clear"),
                    )
                }),
                p,
                cx.listener(|view, _, _, cx| view.clear_collection_filters(cx)),
            ));
        } else if self.collection_teacher_id.is_some() {
            let mut grid = div().flex().flex_wrap().gap_4().w_full();
            for collection in &self.collections {
                grid = grid.child(self.collection_card(
                    collection,
                    card_width,
                    Route::Collections,
                    cx,
                ));
            }
            page = page.child(grid);
        } else {
            let mut groups: Vec<(String, Vec<Collection>)> = Vec::new();
            for collection in &self.collections {
                let teacher_label = if collection.teacher_name.is_empty() {
                    t(locale, "collections.unknownTeacher").to_string()
                } else {
                    collection.teacher_name.clone()
                };
                if let Some((_, items)) = groups.iter_mut().find(|(name, _)| name == &teacher_label)
                {
                    items.push(collection.clone());
                } else {
                    groups.push((teacher_label, vec![collection.clone()]));
                }
            }
            for (teacher, collections) in groups {
                let mut grid = div().flex().flex_wrap().gap_4().w_full();
                for collection in collections {
                    grid = grid.child(self.collection_card(
                        &collection,
                        card_width,
                        Route::Collections,
                        cx,
                    ));
                }
                page = page.child(
                    div()
                        .flex()
                        .flex_col()
                        .gap_3()
                        .child(
                            div()
                                .font_family(DISPLAY_FONT)
                                .text_lg()
                                .font_weight(FontWeight::SEMIBOLD)
                                .child(teacher),
                        )
                        .child(grid),
                );
            }
        }

        if self.collections_total > 0 {
            page = page.child(self.render_progressive_controls(
                "collections-load-more",
                self.collections.len() as i64,
                self.collections_total,
                self.collections_next_limit,
                "noun.collections",
                cx.listener(|view, _, _, cx| view.load_more_collections(cx)),
            ));
        }
        page
    }

    pub(crate) fn render_collection_detail(&self, cx: &mut Context<Self>) -> Div {
        let p = self.palette();
        let locale = self.settings.locale;
        let back_text = back_label(locale, self.return_route.map(Route::kind));
        let mut page = div().flex().flex_col().gap_5().w_full().child(
            div().flex().child(
                quiet_button("back-from-collection", back_text, p)
                    .on_click(cx.listener(|view, _, window, cx| view.go_back(window, cx))),
            ),
        );

        let Some(detail) = &self.collection_detail else {
            return page.child(render_empty_state(
                t(locale, "collectionDetail.empty.title").to_string(),
                t(locale, "collectionDetail.empty.detail").to_string(),
                None,
                p,
                |_, _, _| {},
            ));
        };

        let teacher_name = if detail.teacher_name.is_empty() {
            t(locale, "collections.unknownTeacher").to_string()
        } else {
            detail.teacher_name.clone()
        };

        let mut info = div()
            .flex()
            .flex_col()
            .min_w_0()
            .flex_1()
            .child(
                div()
                    .text_sm()
                    .font_weight(FontWeight::SEMIBOLD)
                    .text_color(p.quiet)
                    .child(count_label(locale, CountKind::Talk, detail.audio_count)),
            )
            .child(
                div()
                    .mt_2()
                    .font_family(DISPLAY_FONT)
                    .text_2xl()
                    .font_weight(FontWeight::SEMIBOLD)
                    .child(detail.name.clone()),
            )
            .child(
                div()
                    .mt_2()
                    .text_sm()
                    .text_color(p.quiet)
                    .child(teacher_name),
            );
        if let Some(desc) = &detail.description {
            info = info.child(
                div()
                    .mt_4()
                    .text_sm()
                    .line_height(px(22.))
                    .line_clamp(3)
                    .text_color(p.quiet)
                    .child(desc.clone()),
            );
        }

        page = page.child(
            div()
                .flex()
                .items_start()
                .gap_5()
                .rounded(px(12.))
                .border_1()
                .border_color(p.rule)
                .bg(p.page)
                .p_6()
                .child(
                    div()
                        .flex()
                        .items_center()
                        .justify_center()
                        .size_16()
                        .flex_none()
                        .rounded(px(8.))
                        .bg(p.panel)
                        .child(icon("library", 28.0, p.marker)),
                )
                .child(info),
        );

        if detail.tracks.is_empty() {
            page.child(render_empty_state(
                t(locale, "collectionDetail.empty.title").to_string(),
                t(locale, "collectionDetail.empty.detail").to_string(),
                None,
                p,
                |_, _, _| {},
            ))
        } else {
            page.child(self.track_list(&detail.tracks, "collection-detail", cx))
        }
    }

    pub(crate) fn render_teachers(&self, card_width: Pixels, cx: &mut Context<Self>) -> Div {
        let p = self.palette();
        let locale = self.settings.locale;
        let searching = !self.teacher_query.is_empty();
        let teachers = if !searching {
            let mut ordered = featured_teachers(&self.teacher_results);
            ordered.extend(
                self.teacher_results
                    .iter()
                    .filter(|teacher| !FEATURED_TEACHERS.contains(&teacher.id))
                    .cloned(),
            );
            ordered
        } else {
            self.teacher_results.clone()
        };
        let mut page = div().flex().flex_col().gap_5().w_full().child(
            div()
                .flex()
                .flex_wrap()
                .items_center()
                .w_full()
                .child(self.render_search_input(searching, "clear-teacher-query", cx)),
        );
        if searching && teachers.is_empty() {
            page = page.child(render_empty_state(
                tf(
                    locale,
                    "teachers.empty.title.query",
                    &[("query", self.teacher_query.clone())],
                ),
                t(locale, "teachers.empty.detail.query").to_string(),
                Some(("teachers-empty-clear", t(locale, "teachers.empty.clear"))),
                p,
                cx.listener(|view, _, _, cx| view.clear_active_search_query(cx)),
            ));
        } else if teachers.is_empty() {
            page = page.child(render_empty_state(
                t(locale, "teachers.empty.title").to_string(),
                t(locale, "teachers.empty.detail").to_string(),
                None,
                p,
                |_, _, _| {},
            ));
        } else {
            page = page.child(self.teacher_grid(&teachers, card_width, cx));
        }
        page
    }

    pub(crate) fn render_teacher_detail(&self, card_width: Pixels, cx: &mut Context<Self>) -> Div {
        let p = self.palette();
        let locale = self.settings.locale;
        let back_text = back_label(locale, self.return_route.map(Route::kind));
        let mut page = div().flex().flex_col().gap_6().w_full().child(
            div().flex().child(
                quiet_button("back-from-teacher", back_text, p)
                    .on_click(cx.listener(|view, _, window, cx| view.go_back(window, cx))),
            ),
        );

        let Some(detail) = &self.teacher_detail else {
            return page;
        };

        let avatar = if FEATURED_TEACHERS.contains(&detail.id) {
            img(format!("teachers/{}.png", detail.id))
                .size_20()
                .rounded_full()
                .into_any_element()
        } else {
            div()
                .flex()
                .items_center()
                .justify_center()
                .size_20()
                .child(icon("teachers", 32.0, p.quiet))
                .into_any_element()
        };
        let teacher_id = detail.id;
        page = page.child(
            div()
                .flex()
                .items_start()
                .gap_5()
                .rounded(px(12.))
                .border_1()
                .border_color(p.rule)
                .bg(p.page)
                .p_6()
                .child(
                    div()
                        .flex_none()
                        .size_20()
                        .overflow_hidden()
                        .rounded_full()
                        .bg(p.panel)
                        .child(avatar),
                )
                .child(
                    div()
                        .flex()
                        .flex_col()
                        .min_w_0()
                        .flex_1()
                        .child(
                            div()
                                .text_sm()
                                .font_weight(FontWeight::SEMIBOLD)
                                .text_color(p.quiet)
                                .child(count_label(locale, CountKind::Talk, detail.audio_count)),
                        )
                        .child(
                            div()
                                .mt_2()
                                .font_family(DISPLAY_FONT)
                                .text_2xl()
                                .font_weight(FontWeight::SEMIBOLD)
                                .child(detail.name.clone()),
                        )
                        .child(
                            div().mt_4().flex().child(
                                primary_button(
                                    "teacher-explore-talks",
                                    t(locale, "teacherDetail.explore"),
                                    p,
                                )
                                .on_click(cx.listener(
                                    move |view, _, window, cx| {
                                        view.explore_teacher(teacher_id, window, cx);
                                    },
                                )),
                            ),
                        ),
                ),
        );

        if !detail.collections.is_empty() {
            let mut grid = div().flex().flex_wrap().gap_4().w_full();
            for collection in &detail.collections {
                grid = grid.child(self.collection_card(
                    collection,
                    card_width,
                    Route::TeacherDetail,
                    cx,
                ));
            }
            page = page.child(
                div()
                    .flex()
                    .flex_col()
                    .gap_3()
                    .child(
                        div()
                            .font_family(DISPLAY_FONT)
                            .text_lg()
                            .font_weight(FontWeight::BOLD)
                            .child(t(locale, "teacherDetail.collections")),
                    )
                    .child(grid),
            );
        }

        let mut talks_section = div().flex().flex_col().gap_3().child(
            div()
                .font_family(DISPLAY_FONT)
                .text_lg()
                .font_weight(FontWeight::BOLD)
                .child(t(locale, "teacherDetail.talks")),
        );
        if self.teacher_talks.is_empty() {
            talks_section = talks_section.child(render_empty_state(
                t(locale, "teacherDetail.empty.title").to_string(),
                t(locale, "teacherDetail.empty.detail").to_string(),
                None,
                p,
                |_, _, _| {},
            ));
        } else {
            talks_section = talks_section.child(self.track_list(&self.teacher_talks, "td", cx));
        }
        if self.teacher_talks_total > 0 {
            talks_section = talks_section.child(self.render_progressive_controls(
                "teacher-talks-load-more",
                self.teacher_talks.len() as i64,
                self.teacher_talks_total,
                self.teacher_talks_next_limit,
                "noun.talks",
                cx.listener(|view, _, _, cx| view.load_more_teacher_talks(cx)),
            ));
        }
        page.child(talks_section)
    }

    pub(crate) fn render_library(&self, cx: &mut Context<Self>) -> Div {
        let p = self.palette();
        let locale = self.settings.locale;
        if self.favorite_ids.is_empty()
            && self.downloads_map.is_empty()
            && self.history_entries.is_empty()
        {
            return div()
                .flex()
                .flex_col()
                .items_center()
                .justify_center()
                .gap_4()
                .min_h(px(360.))
                .rounded(px(12.))
                .border_1()
                .border_color(p.rule)
                .bg(p.page)
                .p_8()
                .child(icon("book", 72.0, p.marker))
                .child(
                    div()
                        .font_family(DISPLAY_FONT)
                        .text_xl()
                        .font_weight(FontWeight::SEMIBOLD)
                        .child(t(locale, "library.empty.title")),
                )
                .child(
                    div()
                        .max_w(px(420.))
                        .text_center()
                        .text_sm()
                        .line_height(px(22.))
                        .text_color(p.quiet)
                        .child(t(locale, "library.empty.detail")),
                )
                .child(
                    primary_button("library-explore", t(locale, "library.empty.action"), p)
                        .on_click(cx.listener(|view, _, window, cx| {
                            view.navigate(Route::Explore, window, cx)
                        })),
                );
        }

        let mut tabs = div().flex().flex_wrap().gap_2();
        for (tab, label_key, count) in [
            (
                LibraryTab::Downloads,
                "library.downloads",
                self.downloaded_tracks.len() as i64,
            ),
            (
                LibraryTab::Favorites,
                "library.favorites",
                self.favorite_ids.len() as i64,
            ),
            (
                LibraryTab::History,
                "library.history",
                self.history_tracks.len() as i64,
            ),
        ] {
            let active = self.library_tab == tab;
            tabs = tabs.child(
                div()
                    .id(gpui::SharedString::from(format!("lib-tab-{label_key}")))
                    .flex()
                    .items_center()
                    .gap_2()
                    .min_h_11()
                    .rounded_full()
                    .px_4()
                    .cursor_pointer()
                    .text_sm()
                    .font_weight(FontWeight::BOLD)
                    .text_color(if active { p.on_primary } else { p.quiet })
                    .bg(if active { p.primary } else { p.panel })
                    .child(t(locale, label_key))
                    .when(count > 0, |btn| {
                        btn.child(
                            div()
                                .rounded_full()
                                .px_2()
                                .text_xs()
                                .bg(if active { p.primary_strong } else { p.hover })
                                .text_color(if active { p.on_primary } else { p.primary })
                                .child(format_locale_number(count, locale)),
                        )
                    })
                    .on_click(cx.listener(move |view, _, _, cx| {
                        view.library_tab = tab;
                        cx.notify();
                    })),
            );
        }

        let mut page = div().flex().flex_col().gap_6().w_full().child(tabs);
        match self.library_tab {
            LibraryTab::Downloads => {
                let mut section = div()
                    .flex()
                    .flex_col()
                    .gap_3()
                    .child(
                        div()
                            .font_family(DISPLAY_FONT)
                            .text_xl()
                            .font_weight(FontWeight::SEMIBOLD)
                            .child(t(locale, "library.downloads")),
                    )
                    .child(div().text_sm().text_color(p.quiet).child(count_label(
                        locale,
                        CountKind::DownloadedTalk,
                        self.downloaded_tracks.len() as i64,
                    )));
                if !self.downloaded_tracks.is_empty() && self.favorite_ids.is_empty() {
                    section = section.child(
                        div()
                            .text_xs()
                            .text_color(p.quiet)
                            .child(t(locale, "library.downloads.hint")),
                    );
                }
                if self.downloaded_tracks.is_empty() {
                    section = section.child(render_empty_state(
                        t(locale, "library.downloads.empty.title").to_string(),
                        t(locale, "library.downloads.empty.detail").to_string(),
                        Some(("lib-dl-explore", t(locale, "library.empty.action"))),
                        p,
                        cx.listener(|view, _, window, cx| {
                            view.navigate(Route::Explore, window, cx)
                        }),
                    ));
                } else {
                    section = section.child(self.track_list(&self.downloaded_tracks, "lib-dl", cx));
                }
                page = page.child(section);
            }
            LibraryTab::Favorites => {
                let unresolved =
                    self.favorite_ids
                        .len()
                        .saturating_sub(self.favorite_tracks.len()) as i64;
                let mut section = div()
                    .flex()
                    .flex_col()
                    .gap_3()
                    .child(
                        div()
                            .font_family(DISPLAY_FONT)
                            .text_xl()
                            .font_weight(FontWeight::SEMIBOLD)
                            .child(t(locale, "library.favorites")),
                    )
                    .child(div().text_sm().text_color(p.quiet).child(count_label(
                        locale,
                        CountKind::SavedTalk,
                        self.favorite_tracks.len() as i64,
                    )));
                if unresolved > 0 {
                    section = section.child(div().text_xs().text_color(p.quiet).child(tf(
                        locale,
                        "library.favorites.unresolved",
                        &[(
                            "count",
                            count_label(locale, CountKind::SavedTalkAre, unresolved),
                        )],
                    )));
                }
                if self.favorite_tracks.is_empty() {
                    section = section.child(render_empty_state(
                        t(locale, "library.favorites.empty.title").to_string(),
                        t(locale, "library.favorites.empty.detail").to_string(),
                        Some(("lib-fav-explore", t(locale, "library.empty.action"))),
                        p,
                        cx.listener(|view, _, window, cx| {
                            view.navigate(Route::Explore, window, cx)
                        }),
                    ));
                } else {
                    section = section.child(self.track_list(&self.favorite_tracks, "lib-fav", cx));
                }
                page = page.child(section);
            }
            LibraryTab::History => {
                let count_text = tf(
                    locale,
                    "library.history.count",
                    &[(
                        "count",
                        count_label(locale, CountKind::Talk, self.history_tracks.len() as i64),
                    )],
                );
                let mut section = div()
                    .flex()
                    .flex_col()
                    .gap_3()
                    .child(
                        div()
                            .font_family(DISPLAY_FONT)
                            .text_xl()
                            .font_weight(FontWeight::SEMIBOLD)
                            .child(t(locale, "home.recentlyPlayed")),
                    )
                    .child(div().text_sm().text_color(p.quiet).child(count_text));
                if self.history_tracks.is_empty() {
                    section = section.child(render_empty_state(
                        t(locale, "library.history.empty.title").to_string(),
                        t(locale, "library.history.empty.detail").to_string(),
                        Some((
                            "lib-hist-teachers",
                            t(locale, "library.history.empty.action"),
                        )),
                        p,
                        cx.listener(|view, _, window, cx| {
                            view.navigate(Route::Teachers, window, cx)
                        }),
                    ));
                } else {
                    section = section.child(self.track_list(&self.history_tracks, "lib-hist", cx));
                }
                page = page.child(section);
            }
        }
        page
    }

    pub(crate) fn render_settings(&self, cx: &mut Context<Self>) -> Div {
        let p = self.palette();
        let locale = self.settings.locale;
        let mut page = div().flex().flex_col().gap_4().w_full().max_w(px(768.));

        let mut lang_group = div()
            .flex()
            .gap_1()
            .mt_4()
            .p_1()
            .rounded(px(8.))
            .bg(p.panel);
        for (opt, label) in [(Locale::EnUs, "English"), (Locale::MyMm, "မြန်မာ")] {
            let selected = self.settings.locale == opt;
            lang_group = lang_group.child(
                div()
                    .id(gpui::SharedString::from(format!("lang-{}", opt.as_str())))
                    .flex()
                    .items_center()
                    .justify_center()
                    .min_h_11()
                    .px_5()
                    .rounded(px(8.))
                    .cursor_pointer()
                    .text_sm()
                    .font_weight(FontWeight::BOLD)
                    .text_color(if selected { p.on_primary } else { p.quiet })
                    .when(selected, |choice| choice.bg(p.primary))
                    .child(label)
                    .on_click(cx.listener(move |view, _, _, cx| {
                        view.set_locale(opt, cx);
                    })),
            );
        }
        page = page.child(
            settings_card(p)
                .child(settings_heading(
                    t(locale, "settings.language"),
                    t(locale, "settings.language.detail"),
                    p,
                ))
                .child(div().flex().child(lang_group)),
        );

        let mut choices = div()
            .flex()
            .gap_1()
            .mt_4()
            .p_1()
            .rounded(px(8.))
            .bg(p.panel);
        for (theme, label_key) in [
            (ThemePreference::Light, "settings.theme.light"),
            (ThemePreference::Dark, "settings.theme.dark"),
            (ThemePreference::System, "settings.theme.system"),
        ] {
            let selected = self.settings.theme == theme;
            choices = choices.child(
                div()
                    .id(gpui::SharedString::from(format!("theme-{label_key}")))
                    .flex()
                    .items_center()
                    .justify_center()
                    .min_h_11()
                    .px_5()
                    .rounded(px(8.))
                    .cursor_pointer()
                    .text_sm()
                    .font_weight(FontWeight::BOLD)
                    .text_color(if selected { p.on_primary } else { p.quiet })
                    .when(selected, |choice| choice.bg(p.primary))
                    .child(t(locale, label_key))
                    .on_click(cx.listener(move |view, _, _, cx| view.set_theme(theme, cx))),
            );
        }
        page = page.child(
            settings_card(p)
                .child(settings_heading(
                    t(locale, "settings.appearance"),
                    t(locale, "settings.appearance.detail"),
                    p,
                ))
                .child(div().flex().child(choices)),
        );

        let rate_str = format_rate(self.settings.playback_rate);
        let limit_str = format_locale_number(self.settings.browse_limit, locale);
        let speed_control = div()
            .flex()
            .flex_col()
            .flex_1()
            .min_w_0()
            .relative()
            .child(
                div()
                    .text_sm()
                    .font_weight(FontWeight::BOLD)
                    .child(t(locale, "settings.playback.speed")),
            )
            .child(
                div()
                    .flex()
                    .items_center()
                    .gap_2()
                    .mt_1()
                    .child(div().flex_1().child(self.dropdown_trigger(
                        "settings-speed",
                        &rate_str,
                        self.open_dropdown == Some(AppDropdown::SettingsSpeed),
                        cx.listener(|view, _, _, cx| {
                            view.toggle_dropdown(AppDropdown::SettingsSpeed, cx)
                        }),
                    )))
                    .when((self.settings.playback_rate - 1.0).abs() > 0.01, |row| {
                        row.child(
                            quiet_button(
                                "settings-speed-reset",
                                t(locale, "settings.playback.speed.reset"),
                                p,
                            )
                            .on_click(cx.listener(|view, _, _, cx| view.set_rate(1.0, cx))),
                        )
                    }),
            )
            .when(
                self.open_dropdown == Some(AppDropdown::SettingsSpeed),
                |wrap| {
                    let mut menu = dropdown_menu(p, px(160.));
                    for rate in RATES {
                        let selected = (self.settings.playback_rate - rate).abs() < 0.01;
                        menu = menu.child(
                            dropdown_item(
                                gpui::SharedString::from(format!("set-rate-{rate}")),
                                &format_rate(rate),
                                selected,
                                p,
                            )
                            .on_click(cx.listener(
                                move |view, _, _, cx| {
                                    view.set_rate(rate, cx);
                                    view.open_dropdown = None;
                                },
                            )),
                        );
                    }
                    wrap.child(deferred(menu).with_priority(10))
                },
            );

        let limit_control = div()
            .flex()
            .flex_col()
            .flex_1()
            .min_w_0()
            .relative()
            .child(
                div()
                    .text_sm()
                    .font_weight(FontWeight::BOLD)
                    .child(t(locale, "settings.playback.limit")),
            )
            .child(div().mt_1().child(self.dropdown_trigger(
                "settings-limit",
                &limit_str,
                self.open_dropdown == Some(AppDropdown::SettingsLimit),
                cx.listener(|view, _, _, cx| view.toggle_dropdown(AppDropdown::SettingsLimit, cx)),
            )))
            .when(
                self.open_dropdown == Some(AppDropdown::SettingsLimit),
                |wrap| {
                    let mut menu = dropdown_menu(p, px(160.));
                    for limit in BROWSE_LIMITS {
                        let selected = self.settings.browse_limit == limit;
                        menu = menu.child(
                            dropdown_item(
                                gpui::SharedString::from(format!("set-limit-{limit}")),
                                &format_locale_number(limit, locale),
                                selected,
                                p,
                            )
                            .on_click(cx.listener(
                                move |view, _, _, cx| {
                                    view.set_browse_limit(limit, cx);
                                    view.open_dropdown = None;
                                },
                            )),
                        );
                    }
                    wrap.child(deferred(menu).with_priority(10))
                },
            );

        page = page.child(
            settings_card(p)
                .child(settings_heading(
                    t(locale, "settings.playback"),
                    t(locale, "settings.playback.detail"),
                    p,
                ))
                .child(
                    div()
                        .flex()
                        .gap_4()
                        .mt_4()
                        .child(speed_control)
                        .child(limit_control),
                ),
        );

        page = page.child(
            settings_card(p)
                .child(settings_heading(
                    t(locale, "settings.keyboard"),
                    t(locale, "settings.keyboard.detail"),
                    p,
                ))
                .child(
                    div().mt_4().flex().child(
                        primary_button("view-shortcuts", t(locale, "settings.keyboard.view"), p)
                            .on_click(cx.listener(|view, _, _, cx| {
                                view.help_open = true;
                                cx.notify();
                            })),
                    ),
                ),
        );

        page = page.child(
            settings_card(p)
                .bg(p.panel)
                .child(
                    div()
                        .flex()
                        .items_center()
                        .justify_center()
                        .size_9()
                        .mb_3()
                        .rounded_full()
                        .bg(p.hover)
                        .child(icon("leaf", 20.0, p.primary)),
                )
                .child(
                    div()
                        .text_sm()
                        .font_weight(FontWeight::BOLD)
                        .child(t(locale, "settings.privacy.title")),
                )
                .child(
                    div()
                        .mt_2()
                        .text_sm()
                        .line_height(px(24.))
                        .text_color(p.quiet)
                        .child(t(locale, "privacy.body.settings")),
                ),
        );

        let mut about = settings_card(p).child(
            div()
                .id("about-dhamma-echo")
                .flex()
                .items_center()
                .justify_between()
                .cursor_pointer()
                .child(
                    div()
                        .font_family(DISPLAY_FONT)
                        .text_lg()
                        .font_weight(FontWeight::SEMIBOLD)
                        .child(t(locale, "settings.about")),
                )
                .child(
                    div()
                        .text_xs()
                        .font_weight(FontWeight::BOLD)
                        .text_color(p.quiet)
                        .child(
                            t(
                                locale,
                                if self.about_expanded {
                                    "settings.about.hide"
                                } else {
                                    "settings.about.show"
                                },
                            )
                            .to_uppercase(),
                        ),
                )
                .on_click(cx.listener(|view, _, _, cx| {
                    view.about_expanded = !view.about_expanded;
                    cx.notify();
                })),
        );
        if self.about_expanded {
            about = about.child(
                div()
                    .mt_3()
                    .flex()
                    .flex_col()
                    .gap_2()
                    .text_sm()
                    .line_height(px(24.))
                    .text_color(p.quiet)
                    .child(t(locale, "settings.about.body1"))
                    .child(t(locale, "settings.about.body2")),
            );
        }
        div()
            .flex()
            .justify_center()
            .w_full()
            .child(page.child(about))
    }

    pub(crate) fn teacher_grid(
        &self,
        teachers: &[Teacher],
        card_width: Pixels,
        cx: &mut Context<Self>,
    ) -> Div {
        let mut grid = div().flex().flex_wrap().gap_4().w_full();
        for teacher in teachers {
            grid = grid.child(self.teacher_card(teacher, card_width, cx));
        }
        grid
    }

    fn teacher_card(
        &self,
        teacher: &Teacher,
        card_width: Pixels,
        cx: &mut Context<Self>,
    ) -> Stateful<Div> {
        let p = self.palette();
        let locale = self.settings.locale;
        let teacher = teacher.clone();
        let return_route = self.route;
        let avatar = if FEATURED_TEACHERS.contains(&teacher.id) {
            img(format!("teachers/{}.png", teacher.id))
                .size_12()
                .rounded_full()
                .into_any_element()
        } else {
            div()
                .flex()
                .items_center()
                .justify_center()
                .size_12()
                .child(icon("teachers", 24.0, p.quiet))
                .into_any_element()
        };
        div()
            .id(gpui::SharedString::from(format!("teacher-{}", teacher.id)))
            .flex()
            .items_center()
            .gap_3()
            .w(card_width)
            .min_h(px(112.))
            .overflow_hidden()
            .rounded(px(12.))
            .border_1()
            .border_color(p.rule)
            .bg(p.page)
            .p_4()
            .cursor_pointer()
            .hover(move |card| card.bg(p.panel))
            .child(
                div()
                    .flex_none()
                    .size_12()
                    .overflow_hidden()
                    .rounded_full()
                    .bg(p.panel)
                    .child(avatar),
            )
            .child(
                div()
                    .flex()
                    .flex_col()
                    .flex_1()
                    .min_w_0()
                    .child(
                        div()
                            .font_weight(FontWeight::BOLD)
                            .line_height(if is_myanmar_text(&teacher.name) {
                                px(28.)
                            } else {
                                px(24.)
                            })
                            .line_clamp(2)
                            .child(truncate_teacher_card_name(&teacher.name)),
                    )
                    .child(
                        div()
                            .mt_1()
                            .text_sm()
                            .text_color(p.quiet)
                            .child(count_label(locale, CountKind::Talk, teacher.audio_count)),
                    ),
            )
            .on_click(cx.listener(move |view, _, window, cx| {
                view.open_teacher_by_id(teacher.id, return_route, window, cx)
            }))
    }

    fn collection_card(
        &self,
        collection: &Collection,
        card_width: Pixels,
        return_route: Route,
        cx: &mut Context<Self>,
    ) -> Stateful<Div> {
        let p = self.palette();
        let locale = self.settings.locale;
        let id = collection.id;
        div()
            .id(gpui::SharedString::from(format!("collection-{id}")))
            .flex()
            .flex_col()
            .w(card_width)
            .rounded(px(12.))
            .border_1()
            .border_color(p.rule)
            .bg(p.page)
            .p_4()
            .cursor_pointer()
            .hover(move |card| card.bg(p.panel))
            .child(
                div()
                    .font_weight(FontWeight::BOLD)
                    .line_height(px(28.))
                    .line_clamp(3)
                    .child(collection.name.clone()),
            )
            .child(
                div()
                    .mt_2()
                    .text_xs()
                    .font_weight(FontWeight::BOLD)
                    .text_color(p.quiet)
                    .child(count_label(locale, CountKind::Talk, collection.audio_count)),
            )
            .on_click(cx.listener(move |view, _, window, cx| {
                view.open_collection(id, return_route, window, cx)
            }))
    }

    pub(crate) fn track_list(
        &self,
        talks: &[Talk],
        list_prefix: &'static str,
        cx: &mut Context<Self>,
    ) -> Div {
        let p = self.palette();
        let mut list = div()
            .flex()
            .flex_col()
            .w_full()
            .rounded(px(12.))
            .border_1()
            .border_color(p.rule)
            .bg(p.page);
        for (index, talk) in talks.iter().enumerate() {
            list = list.child(self.render_track_row(
                talk,
                index,
                index + 1 < talks.len(),
                list_prefix,
                cx,
            ));
        }
        list
    }

    fn render_track_row(
        &self,
        talk: &Talk,
        index: usize,
        has_bottom_border: bool,
        list_prefix: &'static str,
        cx: &mut Context<Self>,
    ) -> Div {
        let p = self.palette();
        let locale = self.settings.locale;
        let talk_id = talk.id;
        let playable = talk.playable;
        let is_current = self.talk.as_ref().is_some_and(|t| t.id == talk_id);
        let playing = is_current && self.audio.as_ref().is_some_and(Playback::wants_playback);
        let selected = list_prefix == "explore" && index == self.selection;
        let is_favorite = self.favorite_ids.contains(&talk_id);
        let is_downloaded = self.downloads_map.contains_key(&talk_id);
        let dl_progress = self.download_jobs.get(&talk_id);
        let is_downloading = matches!(dl_progress, Some(DownloadJobState::InProgress { .. }));
        let resume_pos = self.resume_map.get(&talk_id).map(|r| r.0).unwrap_or(0.0);
        let menu_open = self.open_track_menu == Some((list_prefix, talk_id));

        let play_talk = talk.clone();
        let fav_talk_id = talk_id;
        let dl_talk = talk.clone();
        let queue_talk = talk.clone();

        let row_icon = if !playable {
            "close"
        } else if playing {
            "pause"
        } else {
            "play"
        };

        let mut subtitle_row = div()
            .mt_1()
            .flex()
            .items_center()
            .gap_2()
            .text_sm()
            .text_color(p.quiet)
            .child(div().truncate().child(if talk.teacher_name.is_empty() {
                t(locale, "player.unknownTeacher").to_string()
            } else {
                talk.teacher_name.clone()
            }));
        if resume_pos > 0.0 && !is_current {
            subtitle_row =
                subtitle_row.child(badge_str(format_locale_duration(resume_pos, locale), p));
        }
        if is_downloaded {
            subtitle_row = subtitle_row.child(badge_str(
                t(locale, "track.download.offline").to_string(),
                p,
            ));
        }

        let mut right_controls = div().relative().flex().items_center().gap_1();
        if let Some(DownloadJobState::InProgress { downloaded, total }) = dl_progress {
            let pct = total
                .filter(|&t| t > 0)
                .map(|t| (*downloaded as f32 / t as f32).clamp(0.0, 1.0))
                .unwrap_or(0.35);
            right_controls = right_controls.child(
                div()
                    .w_8()
                    .h(px(4.))
                    .rounded_full()
                    .bg(p.rule)
                    .child(div().h_full().w(relative(pct)).rounded_full().bg(p.primary)),
            );
        }
        right_controls = right_controls.child(
            div()
                .id(gpui::SharedString::from(format!(
                    "{list_prefix}-more-{talk_id}"
                )))
                .flex()
                .items_center()
                .justify_center()
                .size_11()
                .rounded_full()
                .cursor_pointer()
                .when(menu_open, |btn| btn.bg(p.panel))
                .hover(move |btn| btn.bg(p.panel))
                .child(icon("more", 20.0, p.quiet))
                .on_mouse_down(MouseButton::Left, |_, _, cx| cx.stop_propagation())
                .on_click(cx.listener(move |view, _, _, cx| {
                    view.toggle_track_menu(list_prefix, talk_id, cx);
                })),
        );

        if menu_open {
            let mut menu = div()
                .id(gpui::SharedString::from(format!(
                    "{list_prefix}-menu-{talk_id}"
                )))
                .occlude()
                .on_mouse_down(MouseButton::Left, |_, _, cx| cx.stop_propagation())
                .absolute()
                .right_0()
                .top_full()
                .mt_1()
                .min_w(px(230.))
                .rounded(px(12.))
                .border_1()
                .border_color(p.rule)
                .bg(p.page)
                .p_1()
                .flex()
                .flex_col()
                .shadow_md()
                .child(
                    menu_item_button(
                        gpui::SharedString::from(format!("{list_prefix}-fav-{talk_id}")),
                        if is_favorite { "heart-filled" } else { "heart" },
                        if is_favorite { p.primary } else { p.quiet },
                        t(
                            locale,
                            if is_favorite {
                                "track.favorite.remove"
                            } else {
                                "track.favorite.add"
                            },
                        ),
                        p,
                    )
                    .on_click(cx.listener(move |view, _, _, cx| {
                        view.open_track_menu = None;
                        view.toggle_favorite(fav_talk_id, cx);
                    })),
                );

            if is_downloaded {
                menu = menu.child(
                    menu_item_button(
                        gpui::SharedString::from(format!("{list_prefix}-rmdl-{talk_id}")),
                        "download",
                        p.primary,
                        t(locale, "track.download.remove"),
                        p,
                    )
                    .on_click(cx.listener(move |view, _, _, cx| {
                        view.open_track_menu = None;
                        view.remove_download(fav_talk_id, cx);
                    })),
                );
            } else if playable && talk.format.eq_ignore_ascii_case("mp3") {
                menu = menu.child(
                    menu_item_button(
                        gpui::SharedString::from(format!("{list_prefix}-dl-{talk_id}")),
                        "download",
                        p.quiet,
                        t(
                            locale,
                            if is_downloading {
                                "track.download.progress"
                            } else {
                                "track.download.add"
                            },
                        ),
                        p,
                    )
                    .on_click(cx.listener(move |view, _, _, cx| {
                        view.open_track_menu = None;
                        if !is_downloading {
                            view.start_download(&dl_talk, cx);
                        }
                    })),
                );
            }

            menu = menu.child(
                menu_item_button(
                    gpui::SharedString::from(format!("{list_prefix}-queue-{talk_id}")),
                    "queue",
                    p.quiet,
                    t(locale, "track.enqueue"),
                    p,
                )
                .on_click(cx.listener(move |view, _, _, cx| {
                    view.open_track_menu = None;
                    view.enqueue_talk(queue_talk.clone(), cx);
                })),
            );
            right_controls = right_controls.child(deferred(menu).with_priority(10));
        }

        div()
            .flex()
            .items_center()
            .gap_3()
            .px_4()
            .py_3()
            .when(has_bottom_border, |row| row.border_b_1())
            .border_color(p.rule)
            .when(is_current || selected, |row| row.bg(p.panel))
            .when(playable, |row| row.hover(move |r| r.bg(p.hover)))
            .child(
                div()
                    .id(gpui::SharedString::from(format!(
                        "{list_prefix}-play-{talk_id}"
                    )))
                    .flex()
                    .items_center()
                    .gap_3()
                    .min_w_0()
                    .flex_1()
                    .when(playable, |row| row.cursor_pointer())
                    .child(
                        div()
                            .flex()
                            .items_center()
                            .justify_center()
                            .size_11()
                            .flex_none()
                            .rounded_full()
                            .bg(if is_current && playable {
                                p.primary
                            } else {
                                p.panel
                            })
                            .child(icon(
                                row_icon,
                                18.0,
                                if is_current && playable {
                                    p.on_primary
                                } else {
                                    p.primary
                                },
                            )),
                    )
                    .child(
                        div()
                            .flex()
                            .flex_col()
                            .min_w_0()
                            .flex_1()
                            .child(
                                div()
                                    .flex()
                                    .items_center()
                                    .gap_2()
                                    .child(
                                        div()
                                            .min_w_0()
                                            .font_weight(FontWeight::BOLD)
                                            .line_height(if is_myanmar_text(&talk.title) {
                                                px(28.)
                                            } else {
                                                px(24.)
                                            })
                                            .when(is_myanmar_text(&talk.title), |d| d.py(px(2.)))
                                            .child(truncate_track_title(&talk.title, 60)),
                                    )
                                    .when(talk.is_video(), |row| {
                                        row.child(badge(
                                            t(locale, "track.badge.video").to_uppercase(),
                                            p,
                                        ))
                                    })
                                    .when(!playable, |row| {
                                        row.child(badge(
                                            t(
                                                locale,
                                                if talk.format.eq_ignore_ascii_case("wma") {
                                                    "track.badge.wma"
                                                } else {
                                                    "track.badge.unavailable"
                                                },
                                            )
                                            .to_uppercase(),
                                            p,
                                        ))
                                    }),
                            )
                            .child(subtitle_row),
                    )
                    .on_click(cx.listener(move |view, _, _, cx| {
                        if !play_talk.playable {
                            return;
                        }
                        if list_prefix == "explore" {
                            view.selection = index;
                        }
                        if view.talk.as_ref().is_some_and(|t| t.id == play_talk.id) {
                            view.toggle(cx);
                        } else {
                            view.play_talk_resumed(play_talk.clone(), cx);
                        }
                    })),
            )
            .child(right_controls)
    }

    pub(crate) fn render_player(
        &self,
        compact: bool,
        width: Pixels,
        cx: &mut Context<Self>,
    ) -> Option<Div> {
        let talk = self.talk.as_ref()?;
        if talk.is_video() {
            return None;
        }
        let p = self.palette();
        let locale = self.settings.locale;
        let playing = self.audio.as_ref().is_some_and(Playback::wants_playback);
        let buffering = self.status.as_ref() == "Buffering…";
        let progress = if self.duration > 0.0 {
            (self.position / self.duration).clamp(0.0, 1.0) as f32
        } else {
            0.0
        };

        let status_line = if let Some(err) = &self.error {
            div()
                .mt_1()
                .flex()
                .items_center()
                .gap_2()
                .text_xs()
                .font_weight(FontWeight::SEMIBOLD)
                .text_color(p.error)
                .child(div().truncate().child(t_error(locale, err)))
                .child(
                    div()
                        .id("player-retry")
                        .px_2()
                        .py_1()
                        .rounded_full()
                        .border_1()
                        .border_color(p.error)
                        .cursor_pointer()
                        .child(t(locale, "player.retry"))
                        .on_click(cx.listener(|view, _, _, cx| view.retry_playback(cx))),
                )
                .child(
                    div()
                        .id("player-dismiss")
                        .px_2()
                        .py_1()
                        .rounded_full()
                        .border_1()
                        .border_color(p.error)
                        .cursor_pointer()
                        .child(t(locale, "player.dismiss"))
                        .on_click(cx.listener(|view, _, _, cx| {
                            view.error = None;
                            cx.notify();
                        })),
                )
        } else if buffering {
            div()
                .mt_1()
                .text_xs()
                .font_weight(FontWeight::SEMIBOLD)
                .text_color(p.primary)
                .child(t(locale, "player.connecting"))
        } else {
            div()
                .mt_1()
                .text_xs()
                .font_weight(FontWeight::SEMIBOLD)
                .text_color(p.quiet)
                .child(if compact {
                    t(locale, "player.hint.compact")
                } else {
                    t(locale, "player.hint")
                })
        };

        let track_info = div()
            .flex()
            .flex_col()
            .min_w_0()
            .when(!compact, |track| track.w((width - px(40.)) * (0.9 / 3.25)))
            .when(compact, |track| track.flex_1())
            .child(
                div()
                    .text_sm()
                    .font_weight(FontWeight::BOLD)
                    .line_clamp(if compact { 1 } else { 2 })
                    .child(truncate_track_title(&talk.title, 60)),
            )
            .when(!compact, |track| {
                track.child(div().text_xs().text_color(p.quiet).text_ellipsis().child(
                    if talk.teacher_name.is_empty() {
                        t(locale, "player.unknownTeacher").to_string()
                    } else {
                        talk.teacher_name.clone()
                    },
                ))
            })
            .child(status_line);

        let transport = div()
            .flex()
            .flex_col()
            .gap_1()
            .when(!compact, |transport| {
                transport.w((width - px(40.)) * (1.45 / 3.25))
            })
            .when(compact, |transport| transport.w_full())
            .child(
                div()
                    .flex()
                    .items_center()
                    .justify_center()
                    .gap_2()
                    .child(player_icon_button("player-back", "backward15", p).on_click(
                        cx.listener(|view, _, _, cx| {
                            view.seek(-15.0, cx);
                        }),
                    ))
                    .child(
                        div()
                            .id("player-toggle")
                            .flex()
                            .items_center()
                            .justify_center()
                            .size_12()
                            .rounded_full()
                            .cursor_pointer()
                            .bg(p.primary)
                            .hover(move |button| button.bg(p.primary_strong))
                            .child(icon(
                                if playing { "pause" } else { "play" },
                                22.0,
                                p.on_primary,
                            ))
                            .on_click(cx.listener(|view, _, _, cx| {
                                view.toggle(cx);
                            })),
                    )
                    .child(
                        player_icon_button("player-forward", "forward15", p).on_click(cx.listener(
                            |view, _, _, cx| {
                                view.seek(15.0, cx);
                            },
                        )),
                    ),
            )
            .child(
                div()
                    .flex()
                    .items_center()
                    .gap_2()
                    .text_xs()
                    .text_color(p.quiet)
                    .child(
                        div()
                            .w(px(56.))
                            .flex_none()
                            .text_right()
                            .child(format_locale_duration(self.position, locale)),
                    )
                    .child(self.render_scrub_bar("audio-scrub", progress, p, cx))
                    .child(
                        div()
                            .w(px(56.))
                            .flex_none()
                            .child(format_locale_duration(self.duration, locale)),
                    ),
            );

        let queue_count = self.queue_tracks.len();
        let rate_str = format_rate(self.settings.playback_rate);
        let actions = div()
            .flex()
            .items_center()
            .justify_end()
            .gap_2()
            .when(!compact, |actions| {
                actions.w((width - px(40.)) * (0.9 / 3.25))
            })
            .child(
                div()
                    .relative()
                    .child(
                        div()
                            .id("player-speed")
                            .flex()
                            .items_center()
                            .justify_center()
                            .gap_1()
                            .h_11()
                            .min_w_16()
                            .rounded(px(8.))
                            .border_1()
                            .border_color(p.rule)
                            .bg(p.substrate)
                            .cursor_pointer()
                            .text_xs()
                            .font_weight(FontWeight::BOLD)
                            .px_2()
                            .child(rate_str)
                            .child(icon("chevron-down", 12.0, p.quiet))
                            .on_mouse_down(MouseButton::Left, |_, _, cx| cx.stop_propagation())
                            .on_click(cx.listener(|view, _, _, cx| {
                                view.toggle_dropdown(AppDropdown::PlayerSpeed, cx);
                            })),
                    )
                    .when(
                        self.open_dropdown == Some(AppDropdown::PlayerSpeed),
                        |wrap| {
                            let mut menu = dropdown_menu_above(p, px(110.));
                            for rate in RATES {
                                let selected = (self.settings.playback_rate - rate).abs() < 0.01;
                                menu = menu.child(
                                    dropdown_item(
                                        gpui::SharedString::from(format!("p-rate-{rate}")),
                                        &format_rate(rate),
                                        selected,
                                        p,
                                    )
                                    .on_click(cx.listener(
                                        move |view, _, _, cx| {
                                            view.set_rate(rate, cx);
                                            view.open_dropdown = None;
                                        },
                                    )),
                                );
                            }
                            wrap.child(deferred(menu).with_priority(10))
                        },
                    ),
            )
            .child(
                div()
                    .relative()
                    .child(
                        player_icon_button("player-queue", "queue", p)
                            .when(self.queue_open, |btn| btn.bg(p.panel))
                            .on_click(cx.listener(|view, _, _, cx| {
                                view.queue_open = !view.queue_open;
                                cx.notify();
                            })),
                    )
                    .when(queue_count > 0, |wrap| {
                        wrap.child(
                            div()
                                .absolute()
                                .top(px(-2.))
                                .right(px(-2.))
                                .flex()
                                .items_center()
                                .justify_center()
                                .size(px(18.))
                                .rounded_full()
                                .bg(p.primary)
                                .text_size(px(10.))
                                .font_weight(FontWeight::BOLD)
                                .text_color(p.on_primary)
                                .child(format_locale_number(queue_count as i64, locale)),
                        )
                    }),
            );

        if compact {
            Some(
                div()
                    .flex()
                    .flex_col()
                    .flex_none()
                    .gap_1()
                    .h(px(132.))
                    .px_4()
                    .py_2()
                    .border_t_1()
                    .border_color(p.rule)
                    .bg(p.page)
                    .child(
                        div()
                            .flex()
                            .items_center()
                            .justify_between()
                            .gap_3()
                            .w_full()
                            .child(track_info)
                            .child(actions),
                    )
                    .child(transport),
            )
        } else {
            Some(
                div()
                    .flex()
                    .items_center()
                    .flex_none()
                    .gap_5()
                    .h(px(92.))
                    .px_5()
                    .py_3()
                    .border_t_1()
                    .border_color(p.rule)
                    .bg(p.page)
                    .child(track_info)
                    .child(transport)
                    .child(actions),
            )
        }
    }

    pub(crate) fn render_video_overlay(
        &self,
        window: &Window,
        sidebar_width: f32,
        cx: &mut Context<Self>,
    ) -> Option<Stateful<Div>> {
        let talk = self.talk.as_ref()?;
        if !talk.is_video() {
            return None;
        }
        let p = self.palette();
        let locale = self.settings.locale;
        let fullscreen = window.is_fullscreen();
        let playing = self.audio.as_ref().is_some_and(Playback::wants_playback);
        let buffering = self.status.as_ref() == "Buffering…";
        let progress = if self.duration > 0.0 {
            (self.position / self.duration).clamp(0.0, 1.0) as f32
        } else {
            0.0
        };
        let frame = self.audio.as_ref().and_then(Playback::current_frame);
        let video_canvas_color = rgb(0x11120e);
        let on_video_canvas = rgb(0xf4efde);

        let mut stage = div()
            .relative()
            .flex()
            .items_center()
            .justify_center()
            .bg(video_canvas_color)
            .when(fullscreen, |s| s.size_full())
            .when(!fullscreen, |s| s.flex_1().h(px(340.)));

        if let Some(video_frame) = frame {
            match video_frame {
                #[cfg(target_os = "macos")]
                VideoFrame::Surface(pixel_buffer) => {
                    stage = stage.child(
                        gpui::surface(pixel_buffer)
                            .object_fit(ObjectFit::Contain)
                            .size_full(),
                    );
                }
                #[cfg(not(target_os = "macos"))]
                VideoFrame::Image(render_image) => {
                    stage =
                        stage.child(img(render_image).object_fit(ObjectFit::Contain).size_full());
                }
            }
        } else if self.error.is_none() {
            stage = stage.child(
                div()
                    .flex()
                    .flex_col()
                    .items_center()
                    .justify_center()
                    .px_6()
                    .child(
                        div()
                            .flex()
                            .items_center()
                            .justify_center()
                            .size_16()
                            .rounded_full()
                            .border_1()
                            .border_color(p.primary)
                            .bg(p.panel)
                            .child(icon("play", 24.0, p.primary)),
                    )
                    .child(
                        div()
                            .mt_4()
                            .text_sm()
                            .font_weight(FontWeight::BOLD)
                            .text_color(on_video_canvas)
                            .child(t(locale, "video.preparing")),
                    )
                    .child(
                        div()
                            .mt_1()
                            .text_xs()
                            .text_color(p.quiet)
                            .child(t(locale, "video.preparing.detail")),
                    ),
            );
        }

        if fullscreen {
            stage = stage
                .child(
                    div()
                        .id("video-exit-fullscreen")
                        .absolute()
                        .top_4()
                        .right_4()
                        .flex()
                        .items_center()
                        .gap_2()
                        .min_h_11()
                        .px_3()
                        .rounded(px(8.))
                        .border_1()
                        .border_color(on_video_canvas)
                        .bg(video_canvas_color)
                        .text_xs()
                        .font_weight(FontWeight::BOLD)
                        .text_color(on_video_canvas)
                        .cursor_pointer()
                        .child(icon("exit-fullscreen", 16.0, on_video_canvas))
                        .child(t(locale, "video.fullscreen.exit.short"))
                        .on_click(cx.listener(|_, _, window, _| {
                            window.toggle_fullscreen();
                        })),
                )
                .child(
                    div()
                        .absolute()
                        .bottom_4()
                        .left_8()
                        .right_8()
                        .flex()
                        .items_center()
                        .gap_3()
                        .rounded(px(12.))
                        .border_1()
                        .border_color(p.rule)
                        .bg(p.page)
                        .px_4()
                        .py_2()
                        .child(
                            player_icon_button("fs-back", "backward15", p)
                                .on_click(cx.listener(|view, _, _, cx| view.seek(-15.0, cx))),
                        )
                        .child(
                            div()
                                .id("fs-toggle")
                                .flex()
                                .items_center()
                                .justify_center()
                                .size_11()
                                .rounded_full()
                                .cursor_pointer()
                                .bg(p.primary)
                                .child(icon(
                                    if playing { "pause" } else { "play" },
                                    20.0,
                                    p.on_primary,
                                ))
                                .on_click(cx.listener(|view, _, _, cx| view.toggle(cx))),
                        )
                        .child(
                            player_icon_button("fs-fwd", "forward15", p)
                                .on_click(cx.listener(|view, _, _, cx| view.seek(15.0, cx))),
                        )
                        .child(
                            div()
                                .w(px(52.))
                                .text_xs()
                                .text_right()
                                .text_color(p.quiet)
                                .child(format_locale_duration(self.position, locale)),
                        )
                        .child(self.render_scrub_bar("fs-video-scrub", progress, p, cx))
                        .child(
                            div()
                                .w(px(52.))
                                .text_xs()
                                .text_color(p.quiet)
                                .child(format_locale_duration(self.duration, locale)),
                        ),
                );
            return Some(
                div()
                    .id("video-fullscreen-root")
                    .occlude()
                    .absolute()
                    .inset_0()
                    .bg(video_canvas_color)
                    .child(stage),
            );
        }

        let teacher_line = format!(
            "{} · {}",
            if talk.teacher_name.is_empty() {
                t(locale, "player.unknownTeacher")
            } else {
                talk.teacher_name.as_str()
            },
            talk.format.to_uppercase()
        );

        let status_el = if let Some(err) = &self.error {
            div()
                .flex()
                .items_center()
                .gap_2()
                .text_xs()
                .font_weight(FontWeight::SEMIBOLD)
                .text_color(p.error)
                .child(div().truncate().child(t_error(locale, err)))
                .child(
                    div()
                        .id("video-retry")
                        .px_2()
                        .py_1()
                        .rounded_full()
                        .border_1()
                        .border_color(p.error)
                        .cursor_pointer()
                        .child(t(locale, "player.retry"))
                        .on_click(cx.listener(|view, _, _, cx| view.retry_playback(cx))),
                )
        } else if buffering {
            div()
                .text_xs()
                .font_weight(FontWeight::SEMIBOLD)
                .text_color(p.primary)
                .child(t(locale, "video.loading"))
        } else {
            div()
                .text_xs()
                .text_color(p.quiet)
                .child(t(locale, "video.hint"))
        };

        let queue_count = self.queue_tracks.len();
        let rate_str = format_rate(self.settings.playback_rate);
        let sidebar_controls = div()
            .flex()
            .flex_col()
            .w(px(360.))
            .flex_none()
            .border_l_1()
            .border_color(p.rule)
            .bg(p.page)
            .child(
                div()
                    .flex()
                    .items_start()
                    .justify_between()
                    .gap_3()
                    .p_5()
                    .pb_3()
                    .child(
                        div()
                            .flex()
                            .flex_col()
                            .min_w_0()
                            .flex_1()
                            .child(
                                div()
                                    .text_xs()
                                    .font_weight(FontWeight::BOLD)
                                    .text_color(p.quiet)
                                    .child(t(locale, "video.nowPlaying").to_uppercase()),
                            )
                            .child(
                                div()
                                    .mt_1()
                                    .font_weight(FontWeight::BOLD)
                                    .line_clamp(2)
                                    .child(truncate_track_title(&talk.title, 60)),
                            )
                            .child(
                                div()
                                    .mt_1()
                                    .text_xs()
                                    .text_color(p.quiet)
                                    .truncate()
                                    .child(teacher_line),
                            ),
                    )
                    .child(
                        div()
                            .id("video-close")
                            .flex()
                            .items_center()
                            .gap_1()
                            .min_h_11()
                            .px_3()
                            .rounded(px(8.))
                            .border_1()
                            .border_color(p.rule)
                            .text_xs()
                            .font_weight(FontWeight::BOLD)
                            .text_color(p.quiet)
                            .cursor_pointer()
                            .hover(move |b| b.bg(p.panel).text_color(p.ink))
                            .child(icon("close", 14.0, p.quiet))
                            .child(t(locale, "video.close"))
                            .on_click(cx.listener(|view, _, window, cx| {
                                view.close_video_player(window, cx);
                            })),
                    ),
            )
            .child(div().px_5().min_h_5().child(status_el))
            .child(
                div()
                    .mt_auto()
                    .border_t_1()
                    .border_color(p.rule)
                    .px_5()
                    .py_4()
                    .flex()
                    .flex_col()
                    .gap_3()
                    .child(
                        div()
                            .flex()
                            .items_center()
                            .justify_center()
                            .gap_2()
                            .child(
                                player_icon_button("video-back", "backward15", p)
                                    .on_click(cx.listener(|view, _, _, cx| view.seek(-15.0, cx))),
                            )
                            .child(
                                div()
                                    .id("video-toggle")
                                    .flex()
                                    .items_center()
                                    .justify_center()
                                    .size_12()
                                    .rounded_full()
                                    .cursor_pointer()
                                    .bg(p.primary)
                                    .hover(move |b| b.bg(p.primary_strong))
                                    .child(icon(
                                        if playing { "pause" } else { "play" },
                                        21.0,
                                        p.on_primary,
                                    ))
                                    .on_click(cx.listener(|view, _, _, cx| view.toggle(cx))),
                            )
                            .child(
                                player_icon_button("video-fwd", "forward15", p)
                                    .on_click(cx.listener(|view, _, _, cx| view.seek(15.0, cx))),
                            ),
                    )
                    .child(
                        div()
                            .flex()
                            .items_center()
                            .gap_2()
                            .text_xs()
                            .text_color(p.quiet)
                            .child(
                                div()
                                    .w(px(48.))
                                    .text_right()
                                    .child(format_locale_duration(self.position, locale)),
                            )
                            .child(self.render_scrub_bar("video-scrub", progress, p, cx))
                            .child(
                                div()
                                    .w(px(48.))
                                    .child(format_locale_duration(self.duration, locale)),
                            ),
                    )
                    .child(
                        div()
                            .flex()
                            .items_center()
                            .justify_between()
                            .border_t_1()
                            .border_color(p.rule)
                            .pt_3()
                            .child(
                                div()
                                    .relative()
                                    .child(
                                        div()
                                            .id("video-speed")
                                            .flex()
                                            .items_center()
                                            .gap_1()
                                            .h_11()
                                            .px_2()
                                            .rounded(px(8.))
                                            .border_1()
                                            .border_color(p.rule)
                                            .bg(p.substrate)
                                            .text_xs()
                                            .font_weight(FontWeight::BOLD)
                                            .cursor_pointer()
                                            .child(rate_str)
                                            .child(icon("chevron-down", 12.0, p.quiet))
                                            .on_mouse_down(MouseButton::Left, |_, _, cx| {
                                                cx.stop_propagation()
                                            })
                                            .on_click(cx.listener(|view, _, _, cx| {
                                                view.toggle_dropdown(AppDropdown::PlayerSpeed, cx);
                                            })),
                                    )
                                    .when(
                                        self.open_dropdown == Some(AppDropdown::PlayerSpeed),
                                        |wrap| {
                                            let mut menu = dropdown_menu_above(p, px(110.));
                                            for rate in RATES {
                                                let selected = (self.settings.playback_rate - rate)
                                                    .abs()
                                                    < 0.01;
                                                menu = menu.child(
                                                    dropdown_item(
                                                        gpui::SharedString::from(format!(
                                                            "v-rate-{rate}"
                                                        )),
                                                        &format_rate(rate),
                                                        selected,
                                                        p,
                                                    )
                                                    .on_click(cx.listener(move |view, _, _, cx| {
                                                        view.set_rate(rate, cx);
                                                        view.open_dropdown = None;
                                                    })),
                                                );
                                            }
                                            wrap.child(deferred(menu).with_priority(10))
                                        },
                                    ),
                            )
                            .child(
                                div()
                                    .flex()
                                    .items_center()
                                    .gap_2()
                                    .child(
                                        div()
                                            .relative()
                                            .child(
                                                player_icon_button("video-queue", "queue", p)
                                                    .on_click(cx.listener(|view, _, _, cx| {
                                                        view.queue_open = !view.queue_open;
                                                        cx.notify();
                                                    })),
                                            )
                                            .when(queue_count > 0, |wrap| {
                                                wrap.child(
                                                    div()
                                                        .absolute()
                                                        .top(px(-2.))
                                                        .right(px(-2.))
                                                        .flex()
                                                        .items_center()
                                                        .justify_center()
                                                        .size(px(18.))
                                                        .rounded_full()
                                                        .bg(p.primary)
                                                        .text_size(px(10.))
                                                        .font_weight(FontWeight::BOLD)
                                                        .text_color(p.on_primary)
                                                        .child(format_locale_number(
                                                            queue_count as i64,
                                                            locale,
                                                        )),
                                                )
                                            }),
                                    )
                                    .child(
                                        div()
                                            .id("video-fullscreen")
                                            .flex()
                                            .items_center()
                                            .gap_2()
                                            .min_h_11()
                                            .px_3()
                                            .rounded(px(8.))
                                            .border_1()
                                            .border_color(p.rule)
                                            .text_xs()
                                            .font_weight(FontWeight::BOLD)
                                            .text_color(p.quiet)
                                            .cursor_pointer()
                                            .hover(move |b| b.bg(p.panel).text_color(p.ink))
                                            .child(icon("fullscreen", 15.0, p.quiet))
                                            .child(t(locale, "video.fullscreen.enter.short"))
                                            .on_click(cx.listener(|_, _, window, _| {
                                                window.toggle_fullscreen();
                                            })),
                                    ),
                            ),
                    ),
            );

        Some(
            div()
                .id("video-dock")
                .occlude()
                .absolute()
                .bottom_0()
                .left(px(sidebar_width + 24.0))
                .right(px(24.0))
                .flex()
                .justify_center()
                .child(
                    div()
                        .flex()
                        .w_full()
                        .max_w(px(1120.))
                        .overflow_hidden()
                        .rounded_t(px(12.))
                        .border_1()
                        .border_b_0()
                        .border_color(p.rule)
                        .bg(p.page)
                        .shadow_lg()
                        .child(stage)
                        .child(sidebar_controls),
                ),
        )
    }

    pub(crate) fn render_queue_panel(&self, cx: &mut Context<Self>) -> Option<Stateful<Div>> {
        if !self.queue_open || self.talk.is_none() {
            return None;
        }
        let p = self.palette();
        let locale = self.settings.locale;
        let is_video = self.talk.as_ref().is_some_and(Talk::is_video);
        let bottom_offset = if is_video { px(352.) } else { px(96.) };

        let mut list = div()
            .id("queue-scroll-list")
            .flex()
            .flex_col()
            .max_h(px(320.))
            .overflow_y_scroll();

        if self.queue_tracks.is_empty() {
            list = list.child(
                div()
                    .p_6()
                    .text_center()
                    .text_sm()
                    .text_color(p.quiet)
                    .child(t(locale, "queue.empty")),
            );
        } else {
            for track in &self.queue_tracks {
                let tid = track.id;
                let play_track = track.clone();
                list = list.child(
                    div()
                        .flex()
                        .items_center()
                        .gap_3()
                        .border_b_1()
                        .border_color(p.rule)
                        .p_3()
                        .child(
                            div()
                                .id(gpui::SharedString::from(format!("q-play-{tid}")))
                                .flex()
                                .flex_col()
                                .min_w_0()
                                .flex_1()
                                .cursor_pointer()
                                .child(
                                    div()
                                        .text_sm()
                                        .font_weight(FontWeight::BOLD)
                                        .line_clamp(2)
                                        .child(truncate_track_title(&track.title, 60)),
                                )
                                .child(
                                    div()
                                        .text_xs()
                                        .text_color(p.quiet)
                                        .truncate()
                                        .child(track.teacher_name.clone()),
                                )
                                .on_click(cx.listener(move |view, _, _, cx| {
                                    view.remove_from_queue(tid, cx);
                                    view.play_talk_resumed(play_track.clone(), cx);
                                })),
                        )
                        .child(
                            div()
                                .id(gpui::SharedString::from(format!("q-rm-{tid}")))
                                .flex()
                                .items_center()
                                .justify_center()
                                .size_11()
                                .rounded_full()
                                .cursor_pointer()
                                .hover(move |b| b.bg(p.panel))
                                .child(icon("close", 16.0, p.quiet))
                                .on_click(cx.listener(move |view, _, _, cx| {
                                    view.remove_from_queue(tid, cx);
                                })),
                        ),
                );
            }
        }

        let mut panel = div()
            .id("queue-panel")
            .occlude()
            .absolute()
            .right_6()
            .bottom(bottom_offset)
            .w(px(384.))
            .overflow_hidden()
            .rounded(px(12.))
            .border_1()
            .border_color(p.rule)
            .bg(p.page)
            .shadow_lg()
            .child(
                div()
                    .flex()
                    .items_center()
                    .justify_between()
                    .border_b_1()
                    .border_color(p.rule)
                    .p_4()
                    .child(
                        div()
                            .flex()
                            .flex_col()
                            .child(
                                div()
                                    .font_weight(FontWeight::BOLD)
                                    .child(t(locale, "queue.title")),
                            )
                            .child(div().text_xs().text_color(p.quiet).child(count_label(
                                locale,
                                CountKind::Talk,
                                self.queue_tracks.len() as i64,
                            ))),
                    )
                    .child(
                        div()
                            .id("queue-clear")
                            .px_3()
                            .py_2()
                            .rounded(px(8.))
                            .text_xs()
                            .font_weight(FontWeight::BOLD)
                            .text_color(if self.queue_tracks.is_empty() {
                                p.quiet
                            } else {
                                p.primary
                            })
                            .when(!self.queue_tracks.is_empty(), |btn| {
                                btn.cursor_pointer().hover(move |b| b.bg(p.panel))
                            })
                            .child(t(locale, "queue.clear"))
                            .on_click(cx.listener(|view, _, _, cx| {
                                view.clear_queue_with_undo(cx);
                            })),
                    ),
            )
            .child(list);

        if let Some((undo_tracks, _)) = &self.queue_undo {
            let cleared_text = tf(
                locale,
                "queue.cleared",
                &[(
                    "count",
                    count_label(locale, CountKind::Talk, undo_tracks.len() as i64),
                )],
            );
            panel = panel.child(
                div()
                    .flex()
                    .items_center()
                    .justify_between()
                    .gap_3()
                    .border_t_1()
                    .border_color(p.rule)
                    .bg(p.panel)
                    .px_4()
                    .py_2()
                    .text_xs()
                    .text_color(p.quiet)
                    .child(cleared_text)
                    .child(
                        div()
                            .flex()
                            .items_center()
                            .gap_1()
                            .child(
                                primary_button("queue-undo", t(locale, "queue.undo"), p).on_click(
                                    cx.listener(|view, _, _, cx| view.restore_queue_undo(cx)),
                                ),
                            )
                            .child(
                                div()
                                    .id("queue-undo-dismiss")
                                    .flex()
                                    .items_center()
                                    .justify_center()
                                    .size_11()
                                    .rounded_full()
                                    .cursor_pointer()
                                    .child(icon("close", 12.0, p.quiet))
                                    .on_click(cx.listener(|view, _, _, cx| {
                                        view.queue_undo = None;
                                        cx.notify();
                                    })),
                            ),
                    ),
            );
        }

        Some(panel)
    }

    pub(crate) fn render_shortcuts_modal(&self, cx: &mut Context<Self>) -> Option<Stateful<Div>> {
        if !self.help_open {
            return None;
        }
        let p = self.palette();
        let locale = self.settings.locale;
        let modifier = primary_modifier_label();
        let shortcuts: [(&[&str], &'static str); 11] = [
            (&["Space"], "shortcuts.playPause"),
            (&["←"], "shortcuts.back15"),
            (&["Shift", "←"], "shortcuts.back60"),
            (&["→"], "shortcuts.forward15"),
            (&["Shift", "→"], "shortcuts.forward60"),
            (&["N"], "shortcuts.next"),
            (&["?"], "shortcuts.toggleHelp"),
            (&["["], "shortcuts.toggleSidebar"),
            (&[modifier, "F"], "shortcuts.focusSearch"),
            (&[modifier, ","], "shortcuts.openSettings"),
            (&["Esc"], "shortcuts.escape"),
        ];

        let mut rows = div().mt_5().flex().flex_col().gap_3();
        for (keys, key_id) in shortcuts {
            let mut key_group = div().flex().items_center().gap_1();
            for k in keys {
                key_group = key_group.child(
                    div()
                        .flex()
                        .items_center()
                        .justify_center()
                        .h_7()
                        .min_w_7()
                        .px_2()
                        .rounded(px(6.))
                        .border_1()
                        .border_color(p.rule)
                        .bg(p.panel)
                        .text_xs()
                        .font_weight(FontWeight::BOLD)
                        .child(*k),
                );
            }
            rows = rows.child(
                div()
                    .flex()
                    .items_center()
                    .justify_between()
                    .gap_3()
                    .child(div().text_sm().child(t(locale, key_id)))
                    .child(key_group),
            );
        }

        Some(
            div()
                .id("shortcuts-backdrop")
                .occlude()
                .absolute()
                .inset_0()
                .flex()
                .items_center()
                .justify_center()
                .bg(gpui::rgba(0x00000070))
                .p_4()
                .on_click(cx.listener(|view, _, _, cx| {
                    view.help_open = false;
                    cx.notify();
                }))
                .child(
                    div()
                        .id("shortcuts-dialog")
                        .occlude()
                        .w_full()
                        .max_w(px(448.))
                        .rounded(px(12.))
                        .border_1()
                        .border_color(p.rule)
                        .bg(p.page)
                        .p_6()
                        .on_click(|_, _, cx| cx.stop_propagation())
                        .child(
                            div()
                                .flex()
                                .items_start()
                                .justify_between()
                                .gap_3()
                                .child(
                                    div()
                                        .flex()
                                        .flex_col()
                                        .child(
                                            div()
                                                .font_family(DISPLAY_FONT)
                                                .text_lg()
                                                .font_weight(FontWeight::SEMIBOLD)
                                                .child(t(locale, "shortcuts.title")),
                                        )
                                        .child(
                                            div()
                                                .mt_1()
                                                .text_sm()
                                                .text_color(p.quiet)
                                                .child(t(locale, "shortcuts.detail")),
                                        ),
                                )
                                .child(
                                    div()
                                        .id("shortcuts-close")
                                        .flex()
                                        .items_center()
                                        .justify_center()
                                        .size_11()
                                        .rounded_full()
                                        .cursor_pointer()
                                        .hover(move |b| b.bg(p.panel))
                                        .child(icon("close", 16.0, p.quiet))
                                        .on_click(cx.listener(|view, _, _, cx| {
                                            view.help_open = false;
                                            cx.notify();
                                        })),
                                ),
                        )
                        .child(rows)
                        .child(
                            div()
                                .mt_5()
                                .pt_4()
                                .border_t_1()
                                .border_color(p.rule)
                                .text_xs()
                                .text_color(p.quiet)
                                .child(t(locale, "shortcuts.searchNote")),
                        ),
                ),
        )
    }

    fn render_scrub_bar(
        &self,
        id: &'static str,
        progress: f32,
        p: Palette,
        cx: &mut Context<Self>,
    ) -> Stateful<Div> {
        let bounds_cell: Rc<Cell<Option<Bounds<Pixels>>>> = Rc::new(Cell::new(None));
        let paint_cell = Rc::clone(&bounds_cell);
        let down_cell = Rc::clone(&bounds_cell);
        let move_cell = Rc::clone(&bounds_cell);
        div()
            .id(id)
            .relative()
            .flex_1()
            .h_6()
            .flex()
            .items_center()
            .cursor_pointer()
            .child(
                div().w_full().h(px(4.)).rounded_full().bg(p.rule).child(
                    div()
                        .h_full()
                        .w(relative(progress))
                        .rounded_full()
                        .bg(p.primary),
                ),
            )
            .child(
                canvas(
                    move |bounds, _, _| {
                        paint_cell.set(Some(bounds));
                    },
                    |_, _, _, _| {},
                )
                .absolute()
                .inset_0(),
            )
            .on_mouse_down(
                MouseButton::Left,
                cx.listener(move |view, event: &gpui::MouseDownEvent, _, cx| {
                    view.scrubbing = true;
                    if let Some(bounds) = down_cell.get()
                        && bounds.size.width > px(0.)
                        && view.duration > 0.0
                    {
                        let frac = ((event.position.x - bounds.left()) / bounds.size.width)
                            .clamp(0.0, 1.0);
                        view.seek_to(view.duration * f64::from(frac), cx);
                    }
                }),
            )
            .on_mouse_move(
                cx.listener(move |view, event: &gpui::MouseMoveEvent, _, cx| {
                    if !view.scrubbing {
                        return;
                    }
                    if let Some(bounds) = move_cell.get()
                        && bounds.size.width > px(0.)
                        && view.duration > 0.0
                    {
                        let frac = ((event.position.x - bounds.left()) / bounds.size.width)
                            .clamp(0.0, 1.0);
                        view.seek_to(view.duration * f64::from(frac), cx);
                    }
                }),
            )
            .on_mouse_up(
                MouseButton::Left,
                cx.listener(|view, _, _, _| {
                    view.scrubbing = false;
                }),
            )
            .on_mouse_up_out(
                MouseButton::Left,
                cx.listener(|view, _, _, _| {
                    view.scrubbing = false;
                }),
            )
    }

    fn render_progressive_controls(
        &self,
        button_id: &'static str,
        shown: i64,
        total: i64,
        next_limit: i64,
        noun_key: &'static str,
        on_load_more: impl Fn(&gpui::ClickEvent, &mut Window, &mut App) + 'static,
    ) -> Div {
        let p = self.palette();
        let locale = self.settings.locale;
        let remaining = (total - shown).max(0);
        let next_count = next_limit.min(remaining);
        let load_more_label = tf(
            locale,
            "progress.loadMore",
            &[("count", format_locale_number(next_count, locale))],
        );
        let showing_label = tf(
            locale,
            "progress.showing",
            &[
                ("shown", format_locale_number(shown, locale)),
                ("total", format_locale_number(total, locale)),
                ("noun", t(locale, noun_key).to_string()),
            ],
        );

        let mut wrap = div()
            .flex()
            .flex_col()
            .items_center()
            .gap_3()
            .w_full()
            .py_2();
        if remaining > 0 {
            wrap = wrap.child(
                div()
                    .id(button_id)
                    .flex()
                    .items_center()
                    .justify_center()
                    .min_h_11()
                    .rounded(px(8.))
                    .bg(p.primary)
                    .px_5()
                    .cursor_pointer()
                    .text_sm()
                    .font_weight(FontWeight::BOLD)
                    .text_color(p.on_primary)
                    .hover(move |b| b.bg(p.primary_strong))
                    .child(load_more_label)
                    .on_click(on_load_more),
            );
        }
        wrap.child(
            div()
                .text_center()
                .text_sm()
                .text_color(p.quiet)
                .child(showing_label),
        )
    }

    fn dropdown_trigger(
        &self,
        id: &'static str,
        label: &str,
        open: bool,
        on_click: impl Fn(&gpui::ClickEvent, &mut Window, &mut App) + 'static,
    ) -> Stateful<Div> {
        let p = self.palette();
        div()
            .id(id)
            .flex()
            .items_center()
            .justify_between()
            .gap_2()
            .h_12()
            .w_full()
            .min_w(px(140.))
            .rounded(px(8.))
            .border_1()
            .border_color(if open { p.primary } else { p.rule })
            .bg(p.substrate)
            .px_4()
            .cursor_pointer()
            .text_sm()
            .child(div().truncate().child(label.to_string()))
            .child(icon("chevron-down", 14.0, p.quiet))
            .on_mouse_down(MouseButton::Left, |_, _, cx| cx.stop_propagation())
            .on_click(on_click)
    }

    fn category_pill(
        &self,
        id: i64,
        name: &str,
        count: i64,
        cx: &mut Context<Self>,
    ) -> Stateful<Div> {
        let p = self.palette();
        let locale = self.settings.locale;
        let selected = self.category == id;
        let label = if id == 0 {
            name.to_owned()
        } else {
            format!("{name} · {}", format_locale_number(count, locale))
        };
        div()
            .id(gpui::SharedString::from(format!("category-{id}")))
            .flex()
            .items_center()
            .justify_center()
            .min_h_11()
            .rounded_full()
            .px_3()
            .cursor_pointer()
            .text_xs()
            .font_weight(FontWeight::BOLD)
            .text_color(if selected { p.on_primary } else { p.quiet })
            .bg(if selected { p.primary } else { p.panel })
            .child(label)
            .on_click(cx.listener(move |view, _, _, cx| {
                view.category = id;
                view.run_explore_search(cx);
            }))
    }
}

pub fn icon(name: &'static str, size: f32, color: Rgba) -> gpui::Svg {
    svg()
        .path(format!("icons/{name}.svg"))
        .size(px(size))
        .text_color(color)
}

pub fn primary_button(id: &'static str, label: &'static str, p: Palette) -> Stateful<Div> {
    div()
        .id(id)
        .flex()
        .items_center()
        .justify_center()
        .min_h_11()
        .rounded(px(8.))
        .bg(p.primary)
        .px_5()
        .cursor_pointer()
        .text_sm()
        .font_weight(FontWeight::BOLD)
        .text_color(p.on_primary)
        .hover(move |button| button.bg(p.primary_strong))
        .child(label)
}

pub fn quiet_button(id: &'static str, label: impl Into<SharedString>, p: Palette) -> Stateful<Div> {
    div()
        .id(id)
        .flex()
        .items_center()
        .justify_center()
        .min_h_11()
        .rounded(px(8.))
        .border_1()
        .border_color(p.rule)
        .px_5()
        .cursor_pointer()
        .text_sm()
        .font_weight(FontWeight::BOLD)
        .text_color(p.ink)
        .hover(move |button| button.bg(p.panel))
        .child(label.into())
}

pub fn player_icon_button(id: &'static str, name: &'static str, p: Palette) -> Stateful<Div> {
    div()
        .id(id)
        .flex()
        .items_center()
        .justify_center()
        .size_11()
        .rounded_full()
        .cursor_pointer()
        .text_color(p.quiet)
        .hover(move |button| button.bg(p.panel).text_color(p.ink))
        .child(icon(name, 20.0, p.quiet))
}

fn badge(label: String, p: Palette) -> Div {
    badge_str(label, p)
}

fn badge_str(label: String, p: Palette) -> Div {
    div()
        .flex_none()
        .rounded_full()
        .bg(p.panel)
        .px_2()
        .py_1()
        .text_size(px(10.))
        .font_weight(FontWeight::BOLD)
        .text_color(p.quiet)
        .child(label)
}

fn filter_chip(id: &'static str, label: String, p: Palette) -> Stateful<Div> {
    div()
        .id(id)
        .flex()
        .items_center()
        .gap_2()
        .min_h_11()
        .rounded_full()
        .border_1()
        .border_color(p.rule)
        .bg(p.panel)
        .px_4()
        .cursor_pointer()
        .text_xs()
        .font_weight(FontWeight::BOLD)
        .text_color(p.quiet)
        .hover(move |b| b.bg(p.hover))
        .child(label)
        .child(icon("close", 12.0, p.quiet))
}

fn dropdown_menu(p: Palette, width: Pixels) -> Stateful<Div> {
    div()
        .id("dropdown-menu")
        .occlude()
        .on_mouse_down(MouseButton::Left, |_, _, cx| cx.stop_propagation())
        .absolute()
        .left_0()
        .top_full()
        .mt_1()
        .w(width)
        .max_h(px(300.))
        .overflow_y_scroll()
        .rounded(px(10.))
        .border_1()
        .border_color(p.rule)
        .bg(p.page)
        .p_1()
        .flex()
        .flex_col()
        .shadow_md()
}

fn dropdown_menu_above(p: Palette, width: Pixels) -> Stateful<Div> {
    div()
        .id("dropdown-menu-above")
        .occlude()
        .on_mouse_down(MouseButton::Left, |_, _, cx| cx.stop_propagation())
        .absolute()
        .right_0()
        .bottom_full()
        .mb_2()
        .w(width)
        .rounded(px(10.))
        .border_1()
        .border_color(p.rule)
        .bg(p.page)
        .p_1()
        .flex()
        .flex_col()
        .shadow_md()
}

fn dropdown_item(id: gpui::SharedString, label: &str, selected: bool, p: Palette) -> Stateful<Div> {
    div()
        .id(id)
        .flex()
        .items_center()
        .min_h_10()
        .px_3()
        .rounded(px(6.))
        .cursor_pointer()
        .text_sm()
        .font_weight(if selected {
            FontWeight::BOLD
        } else {
            FontWeight::NORMAL
        })
        .text_color(if selected { p.on_primary } else { p.ink })
        .when(selected, |item| item.bg(p.primary))
        .when(!selected, |item| item.hover(move |i| i.bg(p.panel)))
        .child(label.to_string())
}

fn menu_item_button(
    id: gpui::SharedString,
    icon_name: &'static str,
    icon_color: Rgba,
    label: &'static str,
    p: Palette,
) -> Stateful<Div> {
    div()
        .id(id)
        .flex()
        .items_center()
        .gap_2()
        .min_h_11()
        .px_3()
        .rounded(px(8.))
        .cursor_pointer()
        .text_sm()
        .font_weight(FontWeight::SEMIBOLD)
        .hover(move |b| b.bg(p.panel))
        .child(icon(icon_name, 18.0, icon_color))
        .child(label)
}

fn render_empty_state(
    title: String,
    detail: String,
    action: Option<(&'static str, &'static str)>,
    p: Palette,
    on_action: impl Fn(&gpui::ClickEvent, &mut Window, &mut App) + 'static,
) -> Div {
    let mut box_div = div()
        .flex()
        .flex_col()
        .items_center()
        .justify_center()
        .gap_2()
        .w_full()
        .rounded(px(12.))
        .border_1()
        .border_color(p.rule)
        .bg(p.page)
        .p_8()
        .child(
            div()
                .font_weight(FontWeight::BOLD)
                .text_center()
                .child(title),
        )
        .child(
            div()
                .max_w(px(440.))
                .text_center()
                .text_sm()
                .text_color(p.quiet)
                .child(detail),
        );
    if let Some((btn_id, btn_label)) = action {
        box_div = box_div.child(
            div()
                .mt_3()
                .child(quiet_button(btn_id, btn_label, p).on_click(on_action)),
        );
    }
    box_div
}

fn settings_card(p: Palette) -> Div {
    div()
        .flex()
        .flex_col()
        .w_full()
        .rounded(px(12.))
        .border_1()
        .border_color(p.rule)
        .bg(p.page)
        .p_6()
}

fn settings_heading(title: &'static str, detail: &'static str, p: Palette) -> Div {
    div()
        .flex()
        .flex_col()
        .child(
            div()
                .font_family(DISPLAY_FONT)
                .text_lg()
                .font_weight(FontWeight::SEMIBOLD)
                .child(title),
        )
        .child(div().mt_1().text_sm().text_color(p.quiet).child(detail))
}

pub fn featured_teachers(teachers: &[Teacher]) -> Vec<Teacher> {
    FEATURED_TEACHERS
        .iter()
        .filter_map(|id| teachers.iter().find(|teacher| teacher.id == *id).cloned())
        .collect()
}

pub fn format_rate(rate: f32) -> String {
    if (rate.fract()).abs() < 0.001 {
        format!("{}×", rate as i32)
    } else {
        format!("{rate}×")
    }
}

pub fn wheel_scroll_step(delta: ScrollDelta, window: &Window) -> Option<Point<Pixels>> {
    let ScrollDelta::Lines(delta) = delta else {
        return None;
    };
    Some(point(
        px(0.),
        window.line_height() * (delta.y * (WHEEL_LINE_MULTIPLIER - 1.0)),
    ))
}

pub fn focus_main_if_needed(handle: &FocusHandle, window: &mut Window) {
    window.focus(handle);
}
