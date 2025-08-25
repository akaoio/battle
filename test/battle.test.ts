#!/usr/bin/env tsx
/**
 * Battle Testing Battle - The Ultimate Self-Test
 * Battle framework testing itself using its own capabilities
 * The chicken laying the egg that lays the chicken
 */

import { Battle, Runner, Silent } from '../src/index.js'
import fs from 'fs'
import path from 'path'

// Test counter
let totalTests = 0
let passedTests = 0
let failedTests = 0

function testPass(name: string) {
    console.log(`  PASS ${name}`)
    passedTests++
    totalTests++
}

function testFail(name: string, reason: string) {
    console.log(`  FAIL ${name}`)
    console.log(`       ${reason}`)
    failedTests++
    totalTests++
}

async function testBattleCore() {
    console.log('\n=== Testing Battle Core with Battle ===\n')
    
    // Test 1: Battle can spawn and test a simple command
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            b.spawn('echo', ['Battle testing Battle'])
            await b.wait(100)
            await b.expect('Battle testing Battle')
        })
        
        if (result.success) {
            testPass('Battle can spawn and expect output')
        } else {
            testFail('Battle can spawn and expect output', result.error || 'Unknown error')
        }
    } catch (e: any) {
        testFail('Battle can spawn and expect output', e.message)
    }
    
    // Test 2: Battle can handle interactive commands
    try {
        const battle = new Battle({ verbose: false, timeout: 3000 })
        const result = await battle.run(async (b) => {
            // Interactive test with prompt to stdout
            b.spawn('bash', ['-c', 'echo -n "Enter text: "; read text; echo "You entered: $text"'])
            
            await b.wait(200) // Wait for prompt
            
            // Just send input without complex interaction
            b.sendKey('B')
            b.sendKey('a')
            b.sendKey('t')
            b.sendKey('t')
            b.sendKey('l')
            b.sendKey('e')
            b.sendKey('enter')
            
            await b.wait(200) // Wait for response
            
            await b.expect('You entered: Battle')
        })
        
        if (result.success) {
            testPass('Battle can handle interactive prompts')
        } else {
            testFail('Battle can handle interactive prompts', result.error || 'Unknown error')
        }
    } catch (e: any) {
        testFail('Battle can handle interactive prompts', e.message)
    }
}

async function testBattleResize() {
    console.log('\n=== Testing Battle Resize with Battle ===\n')
    
    // Test 3: Battle can resize terminal
    try {
        const battle = new Battle({ cols: 80, rows: 24, verbose: false })
        const result = await battle.run(async (b) => {
            // Use Battle to test Battle's resize functionality
            await b.spawn('bash', ['-c', 'echo "Initial size" && sleep 1'])
            
            // Resize and verify it doesn't crash
            b.resize(120, 40)
            await b.wait(100)
            b.resize(40, 20)
            await b.wait(100)
            b.resize(80, 24)
            
            await b.expect('Initial size')
        })
        
        if (result.success) {
            testPass('Battle can resize terminal viewport')
        } else {
            testFail('Battle can resize terminal viewport', result.error || 'Unknown error')
        }
    } catch (e: any) {
        testFail('Battle can resize terminal viewport', e.message)
    }
}

async function testBattleScreenshots() {
    console.log('\n=== Testing Battle Screenshots with Battle ===\n')
    
    // Test 4: Battle can take screenshots
    try {
        const battle = new Battle({ 
            verbose: false,
            screenshotDir: './test-screenshots'
        })
        
        const result = await battle.run(async (b) => {
            b.spawn('echo', ['-e', '\\033[31mRed\\033[0m \\033[32mGreen\\033[0m'])
            await b.wait(100)
            const screenshotPath = b.screenshot('color-test')
            
            // Verify screenshot was created
            if (!fs.existsSync(screenshotPath)) {
                throw new Error('Screenshot file not created')
            }
        })
        
        if (result.success && result.screenshots.length > 0) {
            testPass('Battle can capture screenshots')
            // Clean up
            try {
                fs.rmSync('./test-screenshots', { recursive: true, force: true })
            } catch {}
        } else {
            testFail('Battle can capture screenshots', 'No screenshots captured')
        }
    } catch (e: any) {
        testFail('Battle can capture screenshots', e.message)
    }
}

async function testBattleKeys() {
    console.log('\n=== Testing Battle Key Sequences with Battle ===\n')
    
    // Test 5: Battle can send special keys
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            // Create a simple interactive script
            b.spawn('bash', ['-c', 'while read -n1 key; do echo "Got: $key"; done'])
            
            await b.wait(100)
            
            // Send various keys
            b.sendKey('a')
            b.sendKey('enter')
            b.sendKey('escape')
            b.sendKey('tab')
            
            await b.wait(100)
            
            // Should have received at least 'a'
            await b.expect('Got: a')
        })
        
        if (result.success) {
            testPass('Battle can send key sequences')
        } else {
            testFail('Battle can send key sequences', result.error || 'Unknown error')
        }
    } catch (e: any) {
        testFail('Battle can send key sequences', e.message)
    }
}

async function testBattleLogging() {
    console.log('\n=== Testing Battle Logging with Battle ===\n')
    
    // Test 6: Battle logs all interactions
    try {
        const battle = new Battle({ 
            verbose: false,
            logDir: './test-logs'
        })
        
        const result = await battle.run(async (b) => {
            b.spawn('echo', ['Test logging'])
            b.log('info', 'Custom log entry')
            await b.expect('Test logging')
        })
        
        if (result.success && result.logs.length > 0) {
            testPass('Battle creates comprehensive logs')
            // Clean up
            try {
                fs.rmSync('./test-logs', { recursive: true, force: true })
            } catch {}
        } else {
            testFail('Battle creates comprehensive logs', 'No logs created')
        }
    } catch (e: any) {
        testFail('Battle creates comprehensive logs', e.message)
    }
}

async function testBattleWithBattle() {
    console.log('\n=== Testing Battle CLI with Battle ===\n')
    
    // Test 7: Use Battle to test Battle's own CLI
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            // Battle testing Battle's CLI
            b.spawn('node', ['dist/cli.js', 'run', 'echo "Meta test"'])
            await b.wait(1000)
            await b.expect('Test passed')
        })
        
        if (result.success) {
            testPass('Battle CLI works correctly')
        } else {
            testFail('Battle CLI works correctly', result.error || 'Unknown error')
        }
    } catch (e: any) {
        testFail('Battle CLI works correctly', e.message)
    }
}

async function testBattleErrors() {
    console.log('\n=== Testing Battle Error Handling with Battle ===\n')
    
    // Test 8: Battle handles errors gracefully
    try {
        const battle = new Battle({ verbose: false, timeout: 1000 })
        const result = await battle.run(async (b) => {
            b.spawn('false')  // Command that always fails
            await b.wait(100) // Wait for process to exit
            // The test should complete without throwing
        })
        
        // The test should succeed even with non-zero exit code
        // because we didn't assert anything
        if (result.success) {
            testPass('Battle handles command failures gracefully')
        } else {
            testFail('Battle handles command failures gracefully', 'Should handle exit codes without crashing')
        }
    } catch (e: any) {
        testFail('Battle handles command failures gracefully', e.message)
    }
    
    // Test 9: Battle handles timeout
    try {
        const battle = new Battle({ verbose: false, timeout: 100 })
        const result = await battle.run(async (b) => {
            b.spawn('sleep', ['10'])  // Will timeout
            await b.expect('This will never appear')
        })
        
        if (!result.success) {
            testPass('Battle handles timeouts correctly')
        } else {
            testFail('Battle handles timeouts correctly', 'Should have timed out')
        }
    } catch (e: any) {
        testPass('Battle handles timeouts correctly')
    }
}

async function testBattleRunner() {
    console.log('\n=== Testing Battle Runner with Battle ===\n')
    
    // Test 10: Test the Runner class
    const runner = new Runner({ verbose: false, timeout: 2000 })
    
    runner.test('Echo test via Runner', {
        command: 'echo',
        args: ['Runner test'],
        expectations: ['Runner test']
    })
    
    // Skip complex interactive test in Runner for now
    runner.test('Simple test via Runner', {
        command: 'echo',
        args: ['Simple test'],
        expectations: ['Simple test']
    })
    
    // Capture runner output
    const originalLog = console.log
    let runnerOutput = ''
    console.log = (msg) => { runnerOutput += msg + '\n' }
    
    try {
        await runner.run()
        console.log = originalLog
        
        if (runnerOutput.includes('Passed: 2')) {
            testPass('Battle Runner executes test suites')
        } else {
            testFail('Battle Runner executes test suites', 'Not all tests passed')
        }
    } catch (e: any) {
        console.log = originalLog
        testFail('Battle Runner executes test suites', e.message)
    }
}

async function testSilentMode() {
    console.log('\n=== Testing Silent Mode with Battle ===\n')
    
    // Test 11: Silent mode for system commands
    try {
        const silent = new Silent()
        const result = silent.exec('echo "Silent test"')
        
        if (result.success && result.stdout.includes('Silent test')) {
            testPass('Silent mode executes commands')
        } else {
            testFail('Silent mode executes commands', 'Output not as expected')
        }
    } catch (e: any) {
        testFail('Silent mode executes commands', e.message)
    }
    
    // Test 12: Silent mode file operations
    try {
        const silent = new Silent()
        const exists = silent.fileExists('./package.json')
        
        if (exists) {
            testPass('Silent mode checks file existence')
        } else {
            testFail('Silent mode checks file existence', 'package.json should exist')
        }
    } catch (e: any) {
        testFail('Silent mode checks file existence', e.message)
    }
}

async function testMetaBattle() {
    console.log('\n=== The Ultimate Meta Test: Battle in Battle in Battle ===\n')
    
    // Test 13: Battle testing Battle testing Battle
    try {
        const outerBattle = new Battle({ verbose: false })
        const result = await outerBattle.run(async (outer) => {
            // Spawn a node process that will create another Battle
            outer.spawn('node', ['-e', `
                const { Battle } = require('./dist/index.cjs');
                const battle = new Battle({ verbose: false });
                battle.run(async (b) => {
                    b.spawn('echo', ['Inception']);
                    b.expect('Inception');
                }).then(result => {
                    console.log(result.success ? 'Inner Battle: SUCCESS' : 'Inner Battle: FAIL');
                    process.exit(result.success ? 0 : 1);
                });
            `])
            
            await outer.expect('Inner Battle: SUCCESS')
        })
        
        if (result.success) {
            testPass('Battle can test Battle testing Battle (3 levels deep)')
        } else {
            testFail('Battle can test Battle testing Battle', result.error || 'Unknown error')
        }
    } catch (e: any) {
        testFail('Battle can test Battle testing Battle', e.message)
    }
}

async function testReplaySystem() {
    console.log('\n=== Testing Replay System with Battle ===\n')
    
    // Test 14: Basic replay recording
    try {
        const battle = new Battle({ 
            verbose: false,
            logDir: './test-replays'
        })
        
        const result = await battle.run(async (b) => {
            b.spawn('echo', ['Replay test'])
            await b.wait(100)
            await b.expect('Replay test')
        })
        
        if (result.success && result.replayPath && fs.existsSync(result.replayPath)) {
            testPass('Battle records replay files')
            
            // Clean up
            fs.unlinkSync(result.replayPath)
        } else {
            testFail('Battle records replay files', 'No replay file created')
        }
        
        // Clean up directory
        try {
            fs.rmSync('./test-replays', { recursive: true, force: true })
        } catch {}
    } catch (e: any) {
        testFail('Battle records replay files', e.message)
    }
    
    // Test 15: Replay CLI player
    try {
        // First create a replay
        const setupBattle = new Battle({ 
            verbose: false,
            logDir: './test-replays'
        })
        
        const setupResult = await setupBattle.run(async (b) => {
            b.spawn('echo', ['Test for CLI player'])
            await b.wait(100)
            await b.expect('Test for CLI player')
        })
        
        if (setupResult.success && setupResult.replayPath) {
            // Test the CLI player
            const testBattle = new Battle({ 
                verbose: false,
                timeout: 3000
            })
            
            const result = await testBattle.run(async (b) => {
                b.spawn('timeout', ['1', 'node', 'dist/cli.js', 'replay', 'play', setupResult.replayPath!, '--speed', '10'])
                await b.wait(500)
                await b.expect('Battle Replay Player')
            })
            
            if (result.success) {
                testPass('Battle CLI replay player works')
            } else {
                testFail('Battle CLI replay player works', result.error || 'Player did not launch')
            }
            
            // Clean up
            fs.unlinkSync(setupResult.replayPath)
        } else {
            testFail('Battle CLI replay player works', 'Could not create test replay')
        }
        
        // Clean up directory
        try {
            fs.rmSync('./test-replays', { recursive: true, force: true })
        } catch {}
    } catch (e: any) {
        testFail('Battle CLI replay player works', e.message)
    }
}

// Main test runner
async function runAllTests() {
    console.log('========================================')
    console.log('   Battle Self-Test Suite')
    console.log('   The Framework Testing Itself')
    console.log('========================================')
    
    // Run all test groups
    await testBattleCore()
    await testBattleResize()
    await testBattleScreenshots()
    await testBattleKeys()
    await testBattleLogging()
    await testBattleWithBattle()
    await testBattleErrors()
    await testBattleRunner()
    await testSilentMode()
    await testMetaBattle()
    await testReplaySystem()
    
    // Final summary
    console.log('\n========================================')
    console.log('   Test Summary')
    console.log('========================================')
    console.log(`Total Tests: ${totalTests}`)
    console.log(`Passed: ${passedTests}`)
    console.log(`Failed: ${failedTests}`)
    console.log('========================================')
    
    if (failedTests === 0) {
        console.log('\nAll tests passed! Battle has successfully tested itself.')
        console.log('The chicken has laid the egg that laid the chicken.')
        process.exit(0)
    } else {
        console.log('\nSome tests failed. Battle needs fixing.')
        process.exit(1)
    }
}

// Run the self-test
runAllTests().catch(error => {
    console.error('Fatal error during self-test:', error)
    process.exit(1)
})