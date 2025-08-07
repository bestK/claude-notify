# Claude Notify

[English Version](README_en.md) - English documentation

Claude Code 钩子安装工具，支持桌面通知功能。

## 功能特性

- 🔧 自动安装 Claude Code 钩子
- 📱 桌面通知支持
- 📝 钩子执行日志记录
- 🎯 简单易用的 CLI 界面
- 🎨 支持多种钩子类型
- 🔊 自定义通知声音和消息
- 📋 交互式配置界面
- 🖼️ 自定义图标支持
- 🔊 语音通知支持
- 📊 hooks.json 格式兼容

## 安装使用

### 1. 安装依赖
```bash
npm install
```

### 2. 查看可用钩子类型
```bash
npx claude-notify list
```

### 3. 交互式安装
```bash
npx claude-notify install
```

### 4. 命令行参数安装
```bash
npx claude-notify install --type UserPromptSubmit --title "My Claude" --message "Prompt sent!" --sound true --wait false --icon /path/to/icon.png --voicelink https://example.com/sound.mp3
```

### 5. 移除钩子
```bash
npx claude-notify remove
```

### 6. 测试钩子
```bash
npx claude-notify notify --title "Test" --message "Test notification" --icon /path/to/icon.png --voicelink https://example.com/sound.mp3
```

## 支持的钩子类型

1. **PreToolUse** - 工具执行前触发
2. **PostToolUse** - 工具执行后触发
3. **Notification** - 系统通知时触发
4. **UserPromptSubmit** - 用户提交提示时触发
5. **Stop** - Claude 停止执行时触发
6. **SubagentStop** - 子代理停止时触发
7. **PreCompact** - 上下文压缩前触发
8. **SessionStart** - Claude 会话开始时触发

## 命令行参数

- `--type <type>` - 钩子类型
- `--title <title>` - 通知标题
- `--message <message>` - 通知消息
- `--icon <path>` - 自定义图标路径
- `--voicelink <url>` - 语音通知URL
- `--sound <true/false>` - 是否播放声音
- `--wait <true/false>` - 是否等待用户交互

## 配置文件

钩子配置文件位于 `~/.claude/hooks.json`，使用Claude Code官方格式：

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "npx claude-notify notify --title \"Claude Code\" --message \"Prompt submitted!\"",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

## 钩子功能

- 在每次提交提示时显示桌面通知
- 记录提示长度和文件信息
- 输出彩色控制台日志
- 可扩展的钩子架构
- 支持自定义通知设置
- 支持自定义图标和语音通知
- 兼容Claude Code官方hooks.json格式

## 依赖

- `node-notifier`: 桌面通知
- `commander`: CLI 命令解析
- `chalk`: 彩色控制台输出
- `fs-extra`: 文件系统操作

## 许可证

MIT