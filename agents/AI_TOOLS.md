# AI Tools — Agent Context

> This file lives at `agents/AI_TOOLS.md`.
> Read `agents/AGENTS.md` first for org-wide rules.

---

## How AI tools work in DawnDesk

Each plugin can expose "AI tools" — callable functions the DawnDesk AI can invoke when answering a user request.

**Flow:**
```
User types in AI panel
  → Host sends conversation + all registered tools to LLM
  → LLM decides to call a tool (e.g. "create_note")
  → Host receives tool_use block from LLM
  → Host looks up which plugin owns "create_note" (via registry)
  → Host sends tool call over stdin to that plugin's sidecar
  → Sidecar executes and returns result over stdout
  → Host returns tool_result to LLM
  → LLM generates final response
  → Streamed to user
```

---

## Defining a tool (in plugin.manifest.json)

```json
{
  "aiTools": [
    {
      "name": "search_notes",
      "description": "Search the user's notes by keyword. Returns matching notes with their titles and a snippet. Use when the user asks to find, look up, or recall something from their notes.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "The search keyword or phrase"
          },
          "limit": {
            "type": "integer",
            "description": "Maximum number of results to return. Default 5.",
            "default": 5
          }
        },
        "required": ["query"]
      }
    }
  ]
}
```

### Writing good tool descriptions

The `description` field is sent to the LLM verbatim. Write it like documentation for the AI:

✅ Good:
```
"Adds a new expense transaction. Use when the user mentions spending money, buying something, or wants to log a purchase."
```

❌ Bad:
```
"Add expense"
```

### Tool naming convention

- snake_case
- `{verb}_{noun}` format: `create_note`, `search_notes`, `get_monthly_summary`, `crop_image`
- Must be globally unique across all plugins (prefix with plugin id if collision risk)

---

## Implementing a tool (in the sidecar)

### 1. Add handler in `src-sidecar/handlers/{feature}.rs`

```rust
use serde_json::{json, Value};
use crate::{ToolCall, ToolResult};

pub fn search_notes(call: &ToolCall) -> ToolResult {
    let query = match call.input["query"].as_str() {
        Some(q) => q,
        None => return ToolResult::error(&call.id, "Missing required parameter: query"),
    };
    
    let limit = call.input["limit"].as_i64().unwrap_or(5) as usize;
    
    // Perform the actual search
    let results = perform_search(query, limit);
    
    ToolResult {
        id: call.id.clone(),
        output: json!({
            "results": results,
            "count": results.len()
        }),
        error: None,
    }
}
```

### 2. Register in `src-sidecar/main.rs` dispatch

```rust
fn dispatch(call: &ToolCall) -> ToolResult {
    match call.tool.as_str() {
        "create_note"  => handlers::notes::create_note(call),
        "search_notes" => handlers::notes::search_notes(call),
        "delete_note"  => handlers::notes::delete_note(call),
        _ => ToolResult::error(&call.id, &format!("Unknown tool: {}", call.tool)),
    }
}
```

### ToolResult helper (add to `main.rs`)

```rust
impl ToolResult {
    pub fn error(id: &str, message: &str) -> Self {
        ToolResult {
            id: id.to_string(),
            output: Value::Null,
            error: Some(message.to_string()),
        }
    }
    
    pub fn ok(id: &str, output: Value) -> Self {
        ToolResult {
            id: id.to_string(),
            output,
            error: None,
        }
    }
}
```

---

## Cross-plugin tool calls

The AI can call tools from multiple plugins in a single conversation. Example user request:

> "Take this month's spending from Finance Manager and create a summary note in Notes."

The host will:
1. Call `get_monthly_summary` → routes to finance-manager sidecar
2. Receive the summary data
3. Call `create_note` with the summary → routes to notes sidecar
4. Report back to the user

**Plugins do not know about each other.** The AI + host orchestrate this. Plugins just implement their tools.

---

## Tool output format guidelines

Return structured data the LLM can understand and relay to the user:

```rust
// ✅ Good — structured and descriptive
json!({
    "note": {
        "id": "abc123",
        "title": "Meeting Notes - Q4 Review",
        "created_at": "2025-01-15T10:30:00Z"
    },
    "message": "Note created successfully"
})

// ❌ Bad — raw IDs with no context
json!({ "id": "abc123" })
```

---

## Testing tools

To test a tool without running the full host:

```bash
# In the plugin's src-sidecar directory
echo '{"id":"test-1","tool":"search_notes","input":{"query":"meeting"}}' | cargo run
```

Expected output (one JSON line):
```json
{"id":"test-1","output":{"results":[...],"count":3},"error":null}
```

---

## AI tool checklist (before shipping a plugin)

- [ ] Every tool in `aiTools` array has a matching handler in the sidecar
- [ ] Tool descriptions explain *when* to use the tool, not just what it does
- [ ] All required parameters are listed in `required` array
- [ ] Sidecar handles missing optional parameters gracefully (use defaults)
- [ ] Tool output is structured JSON, not a raw string
- [ ] Tool names are unique — check existing plugins in `dawndesk/registry`
- [ ] Tested tool calls manually via stdin pipe
