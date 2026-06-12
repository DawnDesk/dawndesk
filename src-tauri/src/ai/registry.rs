use crate::{plugins::manifest::read_manifest, settings::config::AppConfig};
use serde::Serialize;
use serde_json::Value;
use std::{fs, path::PathBuf};

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolDefinition {
    pub plugin_id: String,
    pub name: String,
    pub description: String,
    pub input_schema: Value,
}

pub fn collect_tools(config: &AppConfig) -> Result<Vec<ToolDefinition>, String> {
    let plugins_dir = PathBuf::from(&config.data_root).join("plugins");

    if !plugins_dir.exists() {
        return Ok(Vec::new());
    }

    let mut tools = Vec::new();
    for entry in fs::read_dir(plugins_dir).map_err(|error| error.to_string())? {
        let entry = entry.map_err(|error| error.to_string())?;
        let manifest_path = entry.path().join("plugin.manifest.json");
        if !manifest_path.exists() {
            continue;
        }

        let manifest = read_manifest(&manifest_path)?;
        for tool in manifest.ai_tools.unwrap_or_default() {
            tools.push(ToolDefinition {
                plugin_id: manifest.id.clone(),
                name: tool.name,
                description: tool.description,
                input_schema: tool.input_schema,
            });
        }
    }

    tools.sort_by(|left, right| left.name.cmp(&right.name));
    Ok(tools)
}
