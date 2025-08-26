#!/usr/bin/env node

/**
 * Battle CLI
 * Command-line interface for the Battle testing framework
 */

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { Battle, Runner, Silent } from './index.js'
import { Replay } from './Replay/index.js'
import { CommandSanitizer, SecureErrorHandler } from './security/index.js'
import fs from 'fs'
import path from 'path'
import { color as chalk } from './utils/colors.js'

const argv = yargs(hideBin(process.argv))
    .command('test [file]', 'Run tests from a file or directory', (yargs) => {
        return yargs
            .positional('file', {
                describe: 'Test file or directory',
                default: './test'
            })
    })
    .command('run <command>', 'Run a single command test', (yargs) => {
        return yargs
            .positional('command', {
                describe: 'Command to test',
                type: 'string'
            })
    })
    .command('silent <command>', 'Run a silent (non-interactive) test', (yargs) => {
        return yargs
            .positional('command', {
                describe: 'Command to test',
                type: 'string'
            })
    })
    .command('replay <action> [file]', 'Replay operations', (yargs) => {
        return yargs
            .positional('action', {
                describe: 'Action: play, export',
                choices: ['play', 'export'],
                type: 'string'
            })
            .positional('file', {
                describe: 'Replay file path',
                type: 'string'
            })
            .option('speed', {
                type: 'number',
                description: 'Playback speed multiplier',
                default: 1.0
            })
            .option('format', {
                type: 'string',
                description: 'Export format (html, json)',
                choices: ['html', 'json'],
                default: 'html'
            })
    })
    .option('verbose', {
        alias: 'v',
        type: 'boolean',
        description: 'Verbose output'
    })
    .option('screenshot', {
        alias: 's',
        type: 'boolean',
        description: 'Take screenshots'
    })
    .option('timeout', {
        alias: 't',
        type: 'number',
        description: 'Test timeout in ms',
        default: 10000
    })
    .help()
    .alias('help', 'h')
    .parseSync()

async function main() {
    const command = argv._[0] as string
    
    if (command === 'test') {
        // Run test files
        const testPath = (argv.file || './test') as string
        
        if (fs.existsSync(testPath)) {
            const stats = fs.statSync(testPath)
            
            if (stats.isDirectory()) {
                // Run all test files in directory
                const files = fs.readdirSync(testPath)
                    .filter(f => f.endsWith('.test.ts') || f.endsWith('.test.js'))
                
                for (const file of files) {
                    console.log(chalk.blue(`Running ${file}...`))
                    const fullPath = path.join(testPath, file)
                    
                    if (file.endsWith('.ts')) {
                        // For TypeScript files, use tsx if available
                        try {
                            const { spawn } = await import('child_process')
                            const child = spawn('tsx', [fullPath], { stdio: 'inherit' })
                            await new Promise((resolve, reject) => {
                                child.on('close', (code) => {
                                    if (code === 0) resolve(void 0)
                                    else reject(new Error(`tsx exited with code ${code}`))
                                })
                                child.on('error', reject)
                            })
                        } catch {
                            console.error(chalk.red('TypeScript files require tsx to be installed: npm install -g tsx'))
                            process.exit(1)
                        }
                    } else {
                        await import(fullPath)
                    }
                }
            } else {
                // Run single test file
                if (testPath.endsWith('.ts')) {
                    // For TypeScript files, use tsx if available
                    try {
                        const { spawn } = await import('child_process')
                        const child = spawn('tsx', [testPath], { stdio: 'inherit' })
                        await new Promise((resolve, reject) => {
                            child.on('close', (code) => {
                                if (code === 0) resolve(void 0)
                                else reject(new Error(`tsx exited with code ${code}`))
                            })
                            child.on('error', reject)
                        })
                    } catch {
                        console.error(chalk.red('TypeScript files require tsx to be installed: npm install -g tsx'))
                        process.exit(1)
                    }
                } else {
                    await import(path.resolve(testPath))
                }
            }
        } else {
            console.error(chalk.red(`Test file not found: ${testPath}`))
            process.exit(1)
        }
        
    } else if (command === 'run') {
        // Run single command test
        const cmd = argv.command as string
        // Validate command for security
        const validation = CommandSanitizer.validate(cmd)
        if (!validation.valid) {
            console.error(chalk.red('Security Error:'), validation.error)
            process.exit(1)
        }
        
        const battle = new Battle({
            verbose: argv.verbose,
            timeout: argv.timeout
        })
        
        const result = await battle.run(async (b) => {
            // Parse command safely
            const parts = cmd.trim().split(/\s+/)
            const program = parts[0]
            const args = CommandSanitizer.sanitizeArgs(parts.slice(1))
            
            b.spawn(program, args)
            
            if (argv.screenshot) {
                setTimeout(() => b.screenshot('cli-test'), 1000)
            }
        })
        
        if (result.success) {
            console.log(chalk.green('Test passed'))
            if (result.replayPath) {
                console.log(chalk.blue(`Replay saved: ${result.replayPath}`))
                console.log(chalk.gray(`To replay: battle replay play ${result.replayPath}`))
            }
        } else {
            console.log(chalk.red('Test failed:'), result.error)
            if (result.replayPath) {
                console.log(chalk.blue(`Replay saved: ${result.replayPath}`))
                console.log(chalk.gray(`To replay: battle replay play ${result.replayPath}`))
            }
            process.exit(1)
        }
        
    } else if (command === 'silent') {
        // Run silent test
        const cmd = argv.command as string
        const silent = new Silent()
        const result = silent.exec(cmd)
        
        if (result.success) {
            console.log(chalk.green('Command succeeded'))
            console.log(result.stdout)
        } else {
            console.log(chalk.red('Command failed'))
            console.log(result.stderr)
            process.exit(1)
        }
        
    } else if (command === 'replay') {
        // Handle replay commands
        const action = argv.action as string
        const file = argv.file as string
        
        if (action === 'play') {
            if (!file) {
                console.error(chalk.red('Replay file path required'))
                process.exit(1)
            }
            
            if (!fs.existsSync(file)) {
                console.error(chalk.red(`Replay file not found: ${file}`))
                process.exit(1)
            }
            
            const replay = new Replay()
            replay.load(file)
            await replay.play({
                speed: argv.speed,
                verbose: argv.verbose !== false
            })
            
        } else if (action === 'export') {
            if (!file) {
                console.error(chalk.red('Replay file path required'))
                process.exit(1)
            }
            
            if (!fs.existsSync(file)) {
                console.error(chalk.red(`Replay file not found: ${file}`))
                process.exit(1)
            }
            
            const replay = new Replay()
            replay.load(file)
            
            const format = argv.format as 'html' | 'json'
            const output = replay.export(format)
            
            const outputFile = file.replace('.json', `.${format}`)
            fs.writeFileSync(outputFile, output)
            
            console.log(chalk.green(`Exported to: ${outputFile}`))
        }
        
    } else {
        // Show help
        yargs.showHelp()
    }
}

main().catch(error => {
    console.error(chalk.red('Error:'), error)
    process.exit(1)
})