#[derive(Debug, Default)]
pub struct SidecarManager;

impl SidecarManager {
    pub fn new() -> Self {
        Self
    }

    pub fn start_for_plugin(&self, plugin_id: &str) -> Result<(), String> {
        println!("Sidecar start requested for plugin '{plugin_id}'.");
        Ok(())
    }

    pub fn stop_for_plugin(&self, plugin_id: &str) -> Result<(), String> {
        println!("Sidecar stop requested for plugin '{plugin_id}'.");
        Ok(())
    }
}
