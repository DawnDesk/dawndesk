use serde::Deserialize;
use serde_json::Value;
use std::{fs, path::Path};

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PluginManifest {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: String,
    pub category: Option<String>,
    pub icon: Option<String>,
    pub ai_tools: Option<Vec<ManifestTool>>,
    pub sidecar: Option<ManifestSidecar>,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ManifestTool {
    pub name: String,
    pub description: String,
    pub input_schema: Value,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ManifestSidecar {
    pub binary: String,
}

pub fn read_manifest(path: &Path) -> Result<PluginManifest, String> {
    let content = fs::read_to_string(path).map_err(|error| error.to_string())?;
    let manifest: PluginManifest = serde_json::from_str(&content)
        .map_err(|error| format!("Invalid manifest '{}': {error}", path.display()))?;
    validate_manifest(&manifest)?;
    Ok(manifest)
}

fn validate_manifest(manifest: &PluginManifest) -> Result<(), String> {
    if manifest.id.trim().is_empty() {
        return Err("Plugin manifest id is required.".to_string());
    }

    if manifest.name.trim().is_empty() {
        return Err(format!("Plugin '{}' is missing a name.", manifest.id));
    }

    if manifest.version.trim().is_empty() {
        return Err(format!("Plugin '{}' is missing a version.", manifest.id));
    }

    Ok(())
}
