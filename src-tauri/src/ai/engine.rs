use serde::Deserialize;

#[derive(Clone, Debug, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

pub fn chat(messages: &[ChatMessage], stream: bool) -> Result<String, String> {
    let last_user_message = messages
        .iter()
        .rev()
        .find(|message| message.role == "user")
        .map(|message| message.content.as_str())
        .unwrap_or("");

    let mode = if stream { "streaming" } else { "non-streaming" };
    Ok(format!(
        "AI provider dispatch is wired for {mode} calls. Configure a provider adapter to answer: {last_user_message}"
    ))
}
