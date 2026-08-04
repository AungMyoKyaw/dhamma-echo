use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Unable to open the bundled Dhamma catalogue: {0}")]
    DatabaseOpen(String),
    #[error("The Dhamma catalogue query failed: {0}")]
    DatabaseQuery(String),
    #[error("Invalid catalogue request: {0}")]
    InvalidInput(String),
    #[error("The requested catalogue record was not found.")]
    NotFound,
    #[error("Unable to resolve the bundled catalogue path: {0}")]
    ResourcePath(String),
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct CommandError {
    pub code: &'static str,
    pub message: String,
}

impl From<AppError> for CommandError {
    fn from(value: AppError) -> Self {
        let code = match value {
            AppError::DatabaseOpen(_) => "database_open",
            AppError::DatabaseQuery(_) => "database_query",
            AppError::InvalidInput(_) => "invalid_input",
            AppError::NotFound => "not_found",
            AppError::ResourcePath(_) => "resource_path",
        };
        Self {
            code,
            message: value.to_string(),
        }
    }
}

impl From<rusqlite::Error> for AppError {
    fn from(value: rusqlite::Error) -> Self {
        Self::DatabaseQuery(value.to_string())
    }
}
