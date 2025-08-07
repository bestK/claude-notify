#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');
const notifier = require('node-notifier');
const readline = require('readline');

program.name('claude-notify').description('Claude Code hooks installer with desktop notifications').version('1.0.0');

program
    .command('install')
    .description('Install Claude Code hooks with notification support')
    .option('-t, --type <type>', 'Hook type to install', 'interactive')
    .option('--title <title>', 'Notification title', 'Claude Code')
    .option('--message <message>', 'Notification message', 'Hook triggered')
    .option('--sound <sound>', 'Sound setting (true/false)', 'true')
    .option('--wait <wait>', 'Wait setting (true/false)', 'false')
    .option('--icon <icon>', 'Custom icon path')
    .option('--voicelink <voicelink>', 'Voice notification URL')
    .action(async options => {
        console.log(chalk.blue('🔧 Claude Code Hooks Installer'));
        console.log(chalk.gray('================================'));

        try {
            const config = await getConfig(options);
            await installHooks(config);
            await showNotification('Claude Code Hooks', 'Hooks installed successfully!');
            console.log(chalk.green('✅ Installation completed!'));
        } catch (error) {
            console.error(chalk.red('❌ Installation failed:'), error.message);
            await showNotification('Claude Code Hooks', 'Installation failed!', true);
            process.exit(1);
        }
    });

program
    .command('list')
    .description('List available hook types')
    .action(() => {
        console.log(chalk.blue('📋 Available Hook Types:'));
        console.log(chalk.gray('==========================='));

        const hooks = [
            { key: 'PreToolUse', name: 'Pre Tool Use', desc: 'Before tool execution' },
            { key: 'PostToolUse', name: 'Post Tool Use', desc: 'After tool execution' },
            { key: 'Notification', name: 'Notification', desc: 'System notifications' },
            { key: 'UserPromptSubmit', name: 'User Prompt Submit', desc: 'When user submits a prompt' },
            { key: 'Stop', name: 'Stop', desc: 'When Claude stops execution' },
            { key: 'SubagentStop', name: 'Subagent Stop', desc: 'When subagent stops' },
            { key: 'PreCompact', name: 'Pre Compact', desc: 'Before context compaction' },
            { key: 'SessionStart', name: 'Session Start', desc: 'When a Claude session starts' },
        ];

        hooks.forEach((hook, index) => {
            console.log(chalk.cyan(`${index + 1}. ${hook.name}`));
            console.log(chalk.gray(`   Key: ${hook.key}`));
            console.log(chalk.gray(`   Description: ${hook.desc}`));
            console.log();
        });
    });

program
    .command('notify')
    .description('Show notification (used by hooks)')
    .option('--title <title>', 'Notification title', 'Claude Code')
    .option('--message <message>', 'Notification message', 'Hook triggered')
    .option('--icon <icon>', 'Custom icon path')
    .option('--voicelink <voicelink>', 'Voice notification URL')
    .option('--sound <sound>', 'Sound setting (true/false)', 'true')
    .option('--wait <wait>', 'Wait setting (true/false)', 'false')
    .action(async options => {
        try {
            await showNotificationWithOptions(options);
        } catch (error) {
            console.error('Notification failed:', error.message);
            process.exit(1);
        }
    });

program
    .command('remove')
    .description('Remove installed hooks')
    .action(async () => {
        console.log(chalk.yellow('🗑️  Removing Claude Code hooks...'));

        try {
            const homeDir = require('os').homedir();
            const settingsPath = path.join(homeDir, '.claude', 'settings.json');

            if (await fs.pathExists(settingsPath)) {
                const settingsConfig = await fs.readJSON(settingsPath);

                if (settingsConfig.hooks) {
                    // 记录删除的hooks
                    const removedHooks = Object.keys(settingsConfig.hooks);
                    delete settingsConfig.hooks;

                    // 如果settings.json为空，删除整个文件
                    if (Object.keys(settingsConfig).length === 0) {
                        await fs.remove(settingsPath);
                        console.log(chalk.green('✅ Settings file removed as it became empty!'));
                    } else {
                        await fs.writeJSON(settingsPath, settingsConfig, { spaces: 2 });
                        console.log(chalk.green('✅ Hooks removed successfully!'));
                    }

                    console.log(chalk.blue(`   Removed hooks: ${removedHooks.join(', ')}`));
                } else {
                    console.log(chalk.yellow('⚠️  No hooks found to remove'));
                }
            } else {
                console.log(chalk.yellow('⚠️  No settings file found'));
            }
        } catch (error) {
            console.error(chalk.red('❌ Failed to remove hooks:'), error.message);
        }
    });

async function getConfig(options) {
    const config = {
        type: options.type,
        title: options.title,
        message: options.message,
        sound: options.sound === 'true',
        wait: options.wait === 'true',
        icon: options.icon,
        voicelink: options.voicelink,
    };

    if (options.type === 'interactive') {
        config.type = await selectHookType();
        config.title = (await askQuestion('Enter notification title (default: Claude Code): ')) || 'Claude Code';
        config.message =
            (await askQuestion('Enter notification message (default: Hook triggered): ')) || 'Hook triggered';
        config.icon = await askQuestion('Enter custom icon path (optional): ');
        config.voicelink = await askQuestion('Enter voice notification URL (optional): ');
        config.sound = await askYesNo('Enable sound? (Y/n): ', true);
        config.wait = await askYesNo('Wait for user interaction? (y/N): ', false);
    }

    return config;
}

async function selectHookType() {
    console.log(chalk.blue('🎯 Select hook type to install:'));
    console.log(chalk.gray('==========================='));

    const hooks = [
        { key: 'PreToolUse', name: 'Pre Tool Use', desc: 'Before tool execution' },
        { key: 'PostToolUse', name: 'Post Tool Use', desc: 'After tool execution' },
        { key: 'Notification', name: 'Notification', desc: 'System notifications' },
        { key: 'UserPromptSubmit', name: 'User Prompt Submit', desc: 'When user submits a prompt' },
        { key: 'Stop', name: 'Stop', desc: 'When Claude stops execution' },
        { key: 'SubagentStop', name: 'Subagent Stop', desc: 'When subagent stops' },
        { key: 'PreCompact', name: 'Pre Compact', desc: 'Before context compaction' },
        { key: 'SessionStart', name: 'Session Start', desc: 'When a Claude session starts' },
    ];

    hooks.forEach((hook, index) => {
        console.log(chalk.cyan(`${index + 1}. ${hook.name}`));
        console.log(chalk.gray(`   ${hook.desc}`));
        console.log();
    });

    const choice = await askQuestion('Enter your choice (1-8): ');
    const index = parseInt(choice) - 1;

    if (index >= 0 && index < hooks.length) {
        return hooks[index].key;
    } else {
        console.log(chalk.red('❌ Invalid choice. Please try again.'));
        return await selectHookType();
    }
}

async function askYesNo(question, defaultValue) {
    const answer = await askQuestion(question);
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        return true;
    } else if (answer.toLowerCase() === 'n' || answer.toLowerCase() === 'no') {
        return false;
    } else {
        return defaultValue;
    }
}

function askQuestion(question) {
    return new Promise(resolve => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        rl.question(question, answer => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

async function installHooks(config) {
    const homeDir = require('os').homedir();
    const claudeDir = path.join(homeDir, '.claude');

    // 确保目录存在
    await fs.ensureDir(claudeDir);

    // 读取现有settings.json配置
    const settingsPath = path.join(claudeDir, 'settings.json');
    let settingsConfig = {};

    if (await fs.pathExists(settingsPath)) {
        settingsConfig = await fs.readJSON(settingsPath);
    }

    // 确保有hooks配置
    if (!settingsConfig.hooks) {
        settingsConfig.hooks = {};
    }

    if (config.message === 'Hook triggered') {
        config.message = `${config.type} Hook triggered`;
    }
    // 构建 claude-notify 命令
    const notifyCommand = buildNotifyCommand(config);

    // 检查并处理现有的 claude-notify hooks
    const existingHook = settingsConfig.hooks[config.type];
    const claudeNotifyHooks = await findClaudeNotifyHooks(existingHook);

    if (claudeNotifyHooks.length > 0) {
        console.log(chalk.yellow('🔍 Found existing claude-notify hooks:'));
        console.log(chalk.gray('===================================='));

        claudeNotifyHooks.forEach((hook, index) => {
            console.log(chalk.cyan(`${index + 1}. ${hook.command}`));
            console.log(chalk.gray(`   Timeout: ${hook.timeout}s`));
        });

        console.log();
        const action = await askQuestion('Choose action: [D]elete all, [K]eep all, [S]elective delete, [A]bort: ');

        if (action.toLowerCase() === 'd' || action.toLowerCase() === 'delete') {
            // 删除所有 claude-notify hooks
            await removeClaudeNotifyHooks(settingsConfig, config.type);
            console.log(chalk.green('✅ All existing claude-notify hooks removed'));
        } else if (action.toLowerCase() === 'a' || action.toLowerCase() === 'abort') {
            console.log(chalk.yellow('⚠️  Installation aborted'));
            return;
        } else if (action.toLowerCase() === 's' || action.toLowerCase() === 'selective') {
            // 选择性删除
            await selectiveDeleteClaudeNotifyHooks(settingsConfig, config.type, claudeNotifyHooks);
        }
        // 如果选择 'k' 或 'keep'，直接继续添加新的hook
    }

    // 添加新的hook配置
    await addNewHook(settingsConfig, config, notifyCommand);

    // 写入配置文件
    await fs.writeJSON(settingsPath, settingsConfig, { spaces: 2 });

    console.log(chalk.green(`✅ Hook '${config.type}' installed successfully!`));
    console.log(chalk.gray(`   Config file: ${settingsPath}`));
    console.log(chalk.gray(`   Title: ${config.title}`));
    console.log(chalk.gray(`   Message: ${config.message}`));
    console.log(chalk.gray(`   Sound: ${config.sound ? 'Enabled' : 'Disabled'}`));
    if (config.icon) {
        console.log(chalk.gray(`   Icon: ${config.icon}`));
    }
    if (config.voicelink) {
        console.log(chalk.gray(`   Voice: ${config.voicelink}`));
    }
    console.log(chalk.gray(`   Command: ${notifyCommand}`));

    // 显示现有hook数量信息
    const finalHookCount = Array.isArray(settingsConfig.hooks[config.type])
        ? settingsConfig.hooks[config.type].length
        : 1;
    console.log(chalk.blue(`   Total hooks for '${config.type}': ${finalHookCount}`));
}

async function findClaudeNotifyHooks(hookConfig) {
    const claudeNotifyHooks = [];

    if (!hookConfig) {
        return claudeNotifyHooks;
    }

    if (Array.isArray(hookConfig)) {
        hookConfig.forEach(hookGroup => {
            if (hookGroup.hooks && Array.isArray(hookGroup.hooks)) {
                hookGroup.hooks.forEach(hook => {
                    if (hook.type === 'command' && hook.command && hook.command.includes('claude-notify')) {
                        claudeNotifyHooks.push({
                            command: hook.command,
                            timeout: hook.timeout || 10,
                            matcher: hookGroup.matcher,
                        });
                    }
                });
            }
        });
    } else if (typeof hookConfig === 'object' && hookConfig.command && hookConfig.command.includes('claude-notify')) {
        claudeNotifyHooks.push({
            command: hookConfig.command,
            timeout: hookConfig.timeout || 10,
            matcher: hookConfig.matcher || '.*',
        });
    }

    return claudeNotifyHooks;
}

async function removeClaudeNotifyHooks(settingsConfig, hookType) {
    const existingHook = settingsConfig.hooks[hookType];

    if (!existingHook) {
        return;
    }

    if (Array.isArray(existingHook)) {
        // 过滤掉所有 claude-notify hooks
        settingsConfig.hooks[hookType] = existingHook.filter(hookGroup => {
            if (hookGroup.hooks && Array.isArray(hookGroup.hooks)) {
                hookGroup.hooks = hookGroup.hooks.filter(
                    hook => !(hook.type === 'command' && hook.command && hook.command.includes('claude-notify')),
                );
                return hookGroup.hooks.length > 0;
            }
            return true;
        });

        // 如果数组为空，删除整个hook类型
        if (settingsConfig.hooks[hookType].length === 0) {
            delete settingsConfig.hooks[hookType];
        }
    } else if (
        typeof existingHook === 'object' &&
        existingHook.command &&
        existingHook.command.includes('claude-notify')
    ) {
        delete settingsConfig.hooks[hookType];
    }
}

async function selectiveDeleteClaudeNotifyHooks(settingsConfig, hookType, claudeNotifyHooks) {
    console.log(chalk.blue('🎯 Select hooks to delete (comma-separated numbers, or "all"):'));

    const choice = await askQuestion('Enter selection: ');

    if (choice.toLowerCase() === 'all') {
        await removeClaudeNotifyHooks(settingsConfig, hookType);
        console.log(chalk.green('✅ All selected hooks removed'));
        return;
    }

    const indices = choice
        .split(',')
        .map(s => parseInt(s.trim()) - 1)
        .filter(i => !isNaN(i) && i >= 0 && i < claudeNotifyHooks.length);

    if (indices.length === 0) {
        console.log(chalk.yellow('⚠️  No valid selection, keeping all hooks'));
        return;
    }

    // 删除选中的hooks
    const existingHook = settingsConfig.hooks[hookType];
    if (Array.isArray(existingHook)) {
        const commandsToDelete = indices.map(i => claudeNotifyHooks[i].command);

        settingsConfig.hooks[hookType] = existingHook.filter(hookGroup => {
            if (hookGroup.hooks && Array.isArray(hookGroup.hooks)) {
                hookGroup.hooks = hookGroup.hooks.filter(
                    hook => !(hook.type === 'command' && hook.command && commandsToDelete.includes(hook.command)),
                );
                return hookGroup.hooks.length > 0;
            }
            return true;
        });

        if (settingsConfig.hooks[hookType].length === 0) {
            delete settingsConfig.hooks[hookType];
        }
    }

    console.log(chalk.green(`✅ Removed ${indices.length} selected hooks`));
}

async function addNewHook(settingsConfig, config, notifyCommand) {
    const existingHook = settingsConfig.hooks[config.type];

    if (existingHook === undefined) {
        // 如果没有现有配置，创建新的数组格式
        settingsConfig.hooks[config.type] = [
            {
                matcher: '.*',
                hooks: [
                    {
                        type: 'command',
                        command: notifyCommand,
                        timeout: 10,
                    },
                ],
            },
        ];
    } else if (Array.isArray(existingHook)) {
        // 如果是数组格式，追加新的hook配置
        existingHook.push({
            matcher: '.*',
            hooks: [
                {
                    type: 'command',
                    command: notifyCommand,
                    timeout: 10,
                },
            ],
        });
    } else if (typeof existingHook === 'object' && existingHook.command) {
        // 如果是对象格式（旧格式），转换为数组格式并保留原有配置
        const originalHook = existingHook;
        settingsConfig.hooks[config.type] = [
            originalHook, // 保留原有的hook配置
            {
                matcher: '.*',
                hooks: [
                    {
                        type: 'command',
                        command: notifyCommand,
                        timeout: 10,
                    },
                ],
            },
        ];
    } else {
        // 其他未知格式，创建新的数组格式
        settingsConfig.hooks[config.type] = [
            {
                matcher: '.*',
                hooks: [
                    {
                        type: 'command',
                        command: notifyCommand,
                        timeout: 10,
                    },
                ],
            },
        ];
    }
}

function buildNotifyCommand(config) {
    const commandParts = ['npx', 'claude-notify', 'notify'];

    if (config.title) {
        commandParts.push(`--title "${config.title}"`);
    }

    if (config.message) {
        commandParts.push(`--message "${config.message}"`);
    }

    if (config.icon) {
        commandParts.push(`--icon "${config.icon}"`);
    }

    if (config.voicelink) {
        commandParts.push(`--voicelink "${config.voicelink}"`);
    }

    if (config.sound !== undefined) {
        commandParts.push(`--sound ${config.sound}`);
    }

    if (config.wait !== undefined) {
        commandParts.push(`--wait ${config.wait}`);
    }

    return commandParts.join(' ');
}

async function showNotificationWithOptions(options) {
    return new Promise(resolve => {
        const notification = {
            title: options.title,
            message: options.message,
            sound: options.sound === 'true',
            wait: options.wait === 'true',
            appID: 'claude-notify',
        };

        // 添加自定义图标
        if (options.icon) {
            notification.icon = options.icon;
        } else {
            // 默认图标
            const defaultIcon = path.join(__dirname, '..', 'assets', 'icon.png');
            if (fs.existsSync(defaultIcon)) {
                notification.icon = defaultIcon;
            }
        }

        notifier.notify(notification, (err, response) => {
            if (err) {
                console.warn('Notification failed:', err);
            }

            // 如果有语音链接，播放语音
            if (options.voicelink) {
                playVoiceNotification(options.voicelink);
            }

            resolve();
        });
    });
}

async function showNotification(title, message, isError = false) {
    return new Promise(resolve => {
        notifier.notify(
            {
                title: title,
                message: message,
                sound: true,
                wait: false,
                icon: isError ? undefined : path.join(__dirname, '..', 'assets', 'icon.png'),
                appID: 'claude-notify',
            },
            (err, response) => {
                if (err) {
                    console.warn('Notification failed:', err);
                }
                resolve();
            },
        );
    });
}

function playVoiceNotification(voicelink) {
    try {
        // 简单的语音播放实现
        if (voicelink.startsWith('http')) {
            // 如果是URL，使用系统默认播放器
            const { spawn } = require('child_process');
            const command =
                process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
            spawn(command, [voicelink], { detached: true, stdio: 'ignore' });
        } else if (fs.existsSync(voicelink)) {
            // 如果是本地文件，使用系统默认播放器
            const { spawn } = require('child_process');
            const command =
                process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
            spawn(command, [voicelink], { detached: true, stdio: 'ignore' });
        }
    } catch (error) {
        console.warn('Voice notification failed:', error.message);
    }
}

program.parse();
