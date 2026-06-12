use serde::{Deserialize, Serialize};
use std::{env, fs, path::PathBuf};

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub data_root: String,
    pub ai_provider: AiProvider,
    pub api_key_configured: bool,
    pub theme: Theme,
    pub registry_url: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum AiProvider {
    Anthropic,
    Openai,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Theme {
    Light,
    Dark,
    System,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            data_root: default_data_root().to_string_lossy().to_string(),
            ai_provider: AiProvider::Openai,
            api_key_configured: false,
            theme: Theme::System,
            registry_url: "https://github.com/dawndesk/registry".to_string(),
        }
    }
}

pub fn read_config() -> Result<AppConfig, String> {
    let default = AppConfig::default();
    let path = config_path(&default);
    if !path.exists() {
        return Ok(default);
    }

    let content = fs::read_to_string(path).map_err(|error| error.to_string())?;
    serde_json::from_str(&content).map_err(|error| error.to_string())
}

pub fn write_config(config: &AppConfig) -> Result<(), String> {
    let path = config_path(config);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    let content = serde_json::to_string_pretty(config).map_err(|error| error.to_string())?;
    fs::write(path, content).map_err(|error| error.to_string())
}

pub fn ensure_data_dirs(config: &AppConfig) -> Result<(), String> {
    let root = PathBuf::from(&config.data_root);
    fs::create_dir_all(root.join("plugins")).map_err(|error| error.to_string())?;
    Ok(())
}

fn default_data_root() -> PathBuf {
    let base = env::var_os("LOCALAPPDATA")
        .or_else(|| env::var_os("APPDATA"))
        .or_else(|| env::var_os("HOME"))
        .map(PathBuf::from)
        .unwrap_or_else(|| env::current_dir().unwrap_or_else(|_| PathBuf::from(".")));

    base.join("DawnDesk")
}

fn config_path(config: &AppConfig) -> PathBuf {
    PathBuf::from(&config.data_root).join("config.json")
}
