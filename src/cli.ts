#!/usr/bin/env node

/**
 * Battle CLI
 * Command-line interface for the Battle testing framework
 */

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { Battle, Runner, Silent } from './index.js'
import fs from 'fs'
import path from 'path'
import chalk from 'chalk'

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
        const testPath = argv.file as string
        
        if (fs.existsSync(testPath)) {
            const stats = fs.statSync(testPath)
            
            if (stats.isDirectory()) {
                // Run all test files in directory
                const files = fs.readdirSync(testPath)
                    .filter(f => f.endsWith('.test.ts') || f.endsWith('.test.js'))
                
                for (const file of files) {
                    console.log(chalk.blue(`Running ${file}...`))
                    const fullPath = path.join(testPath, file)
                    await import(fullPath)
                }
            } else {
                // Run single test file
                await import(path.resolve(testPath))
            }
        } else {
            console.error(chalk.red(`Test file not found: ${testPath}`))
            process.exit(1)
        }
        
    } else if (command === 'run') {
        // Run single command test
        const cmd = argv.command as string
        const battle = new Battle({
            verbose: argv.verbose,
            timeout: argv.timeout
        })
        
        const result = await battle.run(async (b) => {
            const [program, ...args] = cmd.split(' ')
            b.spawn(program, args)
            
            if (argv.screenshot) {
                setTimeout(() => b.screenshot('cli-test'), 1000)
            }
        })
        
        if (result.success) {
            console.log(chalk.green('Test passed'))
        } else {
            console.log(chalk.red('Test failed:'), result.error)
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
        
    } else {
        // Show help
        yargs.showHelp()
    }
}

main().catch(error => {
    console.error(chalk.red('Error:'), error)
    process.exit(1)
})