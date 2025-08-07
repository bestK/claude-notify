# Claude Notify

Claude Code hooks installer with desktop notification support.

[中文版本](README.md) - Chinese documentation

## Features

-   🔧 Automatic Claude Code hooks installation
-   📱 Desktop notification support
-   📝 Hook execution logging
-   🎯 Simple and easy-to-use CLI interface
-   🎨 Support for multiple hook types
-   🔊 Custom notification sounds and messages
-   📋 Interactive configuration interface
-   🖼️ Custom icon support
-   🔊 Voice notification support
-   📊 hooks.json format compatibility

## Installation & Usage

### 1. Install dependencies

```bash
npm install
```

### 2. View available hook types

```bash
npx claude-notify-kit-kit list
```

### 3. Interactive installation

```bash
npx claude-notify-kit-kit install
```

### 4. Command-line parameter installation

```bash
npx claude-notify-kit-kit install --type UserPromptSubmit --title "My Claude" --message "Prompt sent!" --sound true --wait false --icon /path/to/icon.png --voicelink https://example.com/sound.mp3
```

### 5. Remove hooks

```bash
npx claude-notify-kit-kit remove
```

### 6. Test hooks

```bash
npx claude-notify-kit-kit notify --title "Test" --message "Test notification" --icon /path/to/icon.png --voicelink https://example.com/sound.mp3
```

## Supported Hook Types

1. **PreToolUse** - Triggered before tool execution
2. **PostToolUse** - Triggered after tool execution
3. **Notification** - Triggered on system notifications
4. **UserPromptSubmit** - Triggered when user submits a prompt
5. **Stop** - Triggered when Claude stops execution
6. **SubagentStop** - Triggered when subagent stops
7. **PreCompact** - Triggered before context compaction
8. **SessionStart** - Triggered when a Claude session starts

## Command Line Parameters

-   `--type <type>` - Hook type
-   `--title <title>` - Notification title
-   `--message <message>` - Notification message
-   `--icon <path>` - Custom icon path
-   `--voicelink <url>` - Voice notification URL
-   `--sound <true/false>` - Whether to play sound
-   `--wait <true/false>` - Whether to wait for user interaction

## Configuration File

The hook configuration is now integrated into Claude Code's settings.json file located at `~/.claude/settings.json`:

```json
{
    "hooks": {
        "UserPromptSubmit": [
            {
                "matcher": ".*",
                "hooks": [
                    {
                        "type": "command",
                        "command": "npx claude-notify-kit-kit notify --title \"Claude Code\" --message \"Prompt submitted!\"",
                        "timeout": 10
                    }
                ]
            }
        ]
    }
}
```

**Migration from hooks.json**: The old `~/.claude/hooks.json` format is still supported for backward compatibility. Use the test tool to migrate existing configurations:

```bash
node test-hooks.js migrate-config
```

This will automatically migrate your existing hooks from `hooks.json` to `settings.json` and remove the old file.

## Hook Features

-   Display desktop notifications on every prompt submission
-   Log prompt length and file information
-   Output colored console logs
-   Extensible hook architecture
-   Support for custom notification settings
-   Support for custom icons and voice notifications
-   Compatible with Claude Code official hooks.json format

## Dependencies

-   `node-notifier`: Desktop notifications
-   `commander`: CLI command parsing
-   `chalk`: Colored console output
-   `fs-extra`: File system operations

## License

MIT
