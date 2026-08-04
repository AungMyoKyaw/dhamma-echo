use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CatalogueSummary {
    pub total_audio: i64,
    pub total_teachers: i64,
    pub myanmar_audio: i64,
    pub english_audio: i64,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct TeacherSummary {
    pub id: i64,
    pub name: String,
    pub audio_count: i64,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct TeacherDetail {
    pub id: i64,
    pub name: String,
    pub name_myanmar: Option<String>,
    pub title: Option<String>,
    pub description: Option<String>,
    pub audio_count: i64,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AudioTrack {
    pub id: i64,
    pub title: String,
    pub format: String,
    pub language: String,
    pub url: String,
    pub date_recorded: Option<String>,
    pub location: Option<String>,
    pub teacher_id: Option<i64>,
    pub teacher_name: String,
    pub playable: bool,
}

#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AudioSearchRequest {
    #[serde(default)]
    pub query: String,
    pub language: Option<String>,
    pub format: Option<String>,
    pub teacher_id: Option<i64>,
    pub limit: i64,
    pub offset: i64,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AudioSearchPage {
    pub items: Vec<AudioTrack>,
    pub total: i64,
    pub limit: i64,
    pub offset: i64,
}
