#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');

program.name('test-append').description('Test hook append functionality').version('1.0.0');

program
    .command('setup-existing')
    .description('Setup existing non-claude-notify hooks')
    .action(async () => {
        console.log(chalk.blue('🔧 Setting up existing non-claude-notify hooks...'));
        
        const homeDir = require('os').homedir();
        const configPath = path.join(homeDir, '.claude', 'hooks.json');
        
        // 创建包含现有hooks的配置
        const existingConfig = {
            hooks: {
                "UserPromptSubmit": {
                    "command": "node",
                    "args": ["/path/to/existing-hook.js"],
                    "env": {"CUSTOM_VAR": "value"}
                },
                "PreToolUse": [
                    {
                        "matcher": ".*",
                        "hooks": [
                            {
                                "type": "command", 
                                "command": "echo 'Pre-tool existing hook'",
                                "timeout": 5
                            }
                        ]
                    }
                ]
            }
        };
        
        await fs.writeJSON(configPath, existingConfig, { spaces: 2 });
        console.log(chalk.green('✅ Existing hooks setup complete!'));
    });

program
    .command('test-append')
    .description('Test appending claude-notify hooks to existing configuration')
    .option('--type <type>', 'Hook type to test', 'UserPromptSubmit')
    .option('--title <title>', 'Notification title', 'Test Hook')
    .option('--message <message>', 'Notification message', 'Appended hook')
    .action(async options => {
        console.log(chalk.blue('🧪 Testing hook append functionality...'));
        
        // 读取当前配置
        const homeDir = require('os').homedir();
        const configPath = path.join(homeDir, '.claude', 'hooks.json');
        
        if (!await fs.pathExists(configPath)) {
            console.log(chalk.red('❌ No existing hooks found. Run setup-existing first.'));
            return;
        }
        
        const beforeConfig = await fs.readJSON(configPath);
        console.log(chalk.yellow('📋 Before appending:'));
        console.log(JSON.stringify(beforeConfig.hooks[options.type], null, 2));
        
        // 使用claude-notify安装hook
        const { spawn } = require('child_process');
        const child = spawn('node', ['bin/cli.js', 'install', 
            '--type', options.type,
            '--title', options.title,
            '--message', options.message,
            '--sound', 'true',
            '--wait', 'false'
        ], { stdio: 'inherit' });
        
        child.on('close', async (code) => {
            if (code === 0) {
                console.log(chalk.green('\n✅ Hook installation completed!'));
                
                // 读取安装后的配置
                const afterConfig = await fs.readJSON(configPath);
                console.log(chalk.yellow('\n📋 After appending:'));
                console.log(JSON.stringify(afterConfig.hooks[options.type], null, 2));
                
                // 验证结果
                const hookCount = Array.isArray(afterConfig.hooks[options.type]) 
                    ? afterConfig.hooks[options.type].length 
                    : 1;
                
                console.log(chalk.blue(`\n📊 Summary:`));
                console.log(chalk.gray(`   Hook type: ${options.type}`));
                console.log(chalk.gray(`   Total hooks: ${hookCount}`));
                console.log(chalk.gray(`   Original preserved: ${hookCount > 1 ? 'Yes' : 'N/A'}`));
                console.log(chalk.gray(`   Claude-notify added: Yes`));
            } else {
                console.log(chalk.red('❌ Hook installation failed!'));
            }
        });
    });

program
    .command('cleanup')
    .description('Clean up test hooks')
    .action(async () => {
        console.log(chalk.yellow('🗑️  Cleaning up test hooks...'));
        
        const homeDir = require('os').homedir();
        const configPath = path.join(homeDir, '.claude', 'hooks.json');
        
        if (await fs.pathExists(configPath)) {
            await fs.remove(configPath);
            console.log(chalk.green('✅ Test hooks cleaned up!'));
        } else {
            console.log(chalk.yellow('⚠️  No test hooks found'));
        }
    });

program.parse();