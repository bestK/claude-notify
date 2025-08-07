#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');

program.name('test-hooks').description('Test claude-notify hook functionality').version('1.0.0');

program
    .command('add-stage')
    .description('Add hook to a specific stage')
    .option('--stage <stage>', 'Hook stage (pre|post)', 'pre')
    .option('--type <type>', 'Hook type', 'UserPromptSubmit')
    .option('--title <title>', 'Notification title', 'Test Hook')
    .option('--message <message>', 'Notification message', 'Hook triggered')
    .option('--sound <sound>', 'Sound setting', 'true')
    .option('--wait <wait>', 'Wait setting', 'false')
    .action(async options => {
        console.log(chalk.blue('🧪 Adding hook to stage:'), options.stage);
        
        try {
            const config = {
                type: options.type,
                title: options.title,
                message: options.message,
                sound: options.sound === 'true',
                wait: options.wait === 'true',
                icon: null,
                voicelink: null,
            };
            
            const notifyCommand = buildNotifyCommand(config);
            
            const homeDir = require('os').homedir();
            const configPath = path.join(homeDir, '.claude', 'settings.json');
            
            let settingsConfig = {};
            if (await fs.pathExists(configPath)) {
                settingsConfig = await fs.readJSON(configPath);
            }
            
            // 确保有hooks配置
            if (!settingsConfig.hooks) {
                settingsConfig.hooks = {};
            }
            
            // 为不同阶段创建不同的hook类型
            const stageHookType = options.stage === 'pre' ? 'PreToolUse' : 'PostToolUse';
            
            if (!settingsConfig.hooks[stageHookType]) {
                settingsConfig.hooks[stageHookType] = [];
            }
            
            settingsConfig.hooks[stageHookType].push({
                matcher: '.*',
                hooks: [
                    {
                        type: 'command',
                        command: notifyCommand,
                        timeout: 10,
                    },
                ],
            });
            
            await fs.writeJSON(configPath, settingsConfig, { spaces: 2 });
            
            console.log(chalk.green('✅ Hook added successfully!'));
            console.log(chalk.gray(`   Stage: ${options.stage}`));
            console.log(chalk.gray(`   Type: ${stageHookType}`));
            console.log(chalk.gray(`   Config: ${configPath}`));
            console.log(chalk.gray(`   Command: ${notifyCommand}`));
            
        } catch (error) {
            console.error(chalk.red('❌ Failed to add hook:'), error.message);
        }
    });

program
    .command('list-stages')
    .description('List all configured hook stages')
    .action(async () => {
        console.log(chalk.blue('📋 Configured Hook Stages:'));
        console.log(chalk.gray('========================='));
        
        try {
            const homeDir = require('os').homedir();
            const configPath = path.join(homeDir, '.claude', 'settings.json');
            
            if (!await fs.pathExists(configPath)) {
                console.log(chalk.yellow('⚠️  No settings configuration found'));
                return;
            }
            
            const settingsConfig = await fs.readJSON(configPath);
            
            if (!settingsConfig.hooks) {
                console.log(chalk.yellow('⚠️  No hooks configuration found'));
                return;
            }
            
            Object.keys(settingsConfig.hooks).forEach(hookType => {
                console.log(chalk.cyan(`🔗 ${hookType}`));
                const hooks = settingsConfig.hooks[hookType];
                if (Array.isArray(hooks)) {
                    hooks.forEach((hook, index) => {
                        console.log(chalk.gray(`   ${index + 1}. Matcher: ${hook.matcher}`));
                        hook.hooks.forEach((h, i) => {
                            console.log(chalk.gray(`      Hook ${i + 1}: ${h.command}`));
                        });
                    });
                } else {
                    console.log(chalk.gray(`   Command: ${hooks.command}`));
                }
                console.log();
            });
            
        } catch (error) {
            console.error(chalk.red('❌ Failed to list hooks:'), error.message);
        }
    });

program
    .command('remove-hooks')
    .description('Remove all hooks from settings.json')
    .action(async () => {
        console.log(chalk.yellow('🗑️  Removing hooks from settings.json...'));
        
        try {
            const homeDir = require('os').homedir();
            const settingsPath = path.join(homeDir, '.claude', 'settings.json');
            
            if (await fs.pathExists(settingsPath)) {
                const settingsConfig = await fs.readJSON(settingsPath);
                
                if (settingsConfig.hooks) {
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

program
    .command('migrate-config')
    .description('Migrate hooks from hooks.json to settings.json')
    .action(async () => {
        console.log(chalk.blue('🔄 Migrating hooks from hooks.json to settings.json...'));
        
        try {
            const homeDir = require('os').homedir();
            const hooksPath = path.join(homeDir, '.claude', 'hooks.json');
            const settingsPath = path.join(homeDir, '.claude', 'settings.json');
            
            if (!await fs.pathExists(hooksPath)) {
                console.log(chalk.yellow('⚠️  No hooks.json file found'));
                return;
            }
            
            const hooksConfig = await fs.readJSON(hooksPath);
            
            if (!hooksConfig.hooks) {
                console.log(chalk.yellow('⚠️  No hooks found in hooks.json'));
                return;
            }
            
            let settingsConfig = {};
            if (await fs.pathExists(settingsPath)) {
                settingsConfig = await fs.readJSON(settingsPath);
            }
            
            // 确保有hooks配置
            if (!settingsConfig.hooks) {
                settingsConfig.hooks = {};
            }
            
            // 迁移hooks
            Object.keys(hooksConfig.hooks).forEach(hookType => {
                const hookData = hooksConfig.hooks[hookType];
                
                if (Array.isArray(hookData)) {
                    // 如果已经是数组格式，直接复制
                    settingsConfig.hooks[hookType] = hookData;
                } else if (typeof hookData === 'object' && hookData.command) {
                    // 如果是对象格式（旧格式），转换为数组格式
                    settingsConfig.hooks[hookType] = [hookData];
                } else {
                    // 其他格式，作为数组的一个元素
                    settingsConfig.hooks[hookType] = [hookData];
                }
            });
            
            // 写入settings.json
            await fs.writeJSON(settingsPath, settingsConfig, { spaces: 2 });
            
            // 删除旧的hooks.json
            await fs.remove(hooksPath);
            
            console.log(chalk.green('✅ Migration completed successfully!'));
            console.log(chalk.blue(`   Migrated hooks: ${Object.keys(hooksConfig.hooks).join(', ')}`));
            console.log(chalk.gray(`   New config: ${settingsPath}`));
            console.log(chalk.gray(`   Old config removed: ${hooksPath}`));
            
        } catch (error) {
            console.error(chalk.red('❌ Failed to migrate configuration:'), error.message);
        }
    });

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

program.parse();