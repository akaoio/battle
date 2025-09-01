#!/usr/bin/env tsx
/**
 * Battle Replay System Test Suite
 * Tests recording, playback, and export functionality
 */

import { Battle, Replay } from '../src/index.js'
import fs from 'fs'
import path from 'path'
import { color as chalk } from '../src/utils/colors.js'

// Test counter
let totalTests = 0
let passedTests = 0
let failedTests = 0

function testPass(name: string) {
    console.log(`  ${chalk.green('PASS')} ${name}`)
    passedTests++
    totalTests++
}

function testFail(name: string, reason: string) {
    console.log(`  ${chalk.red('FAIL')} ${name}`)
    console.log(`       ${chalk.gray(reason)}`)
    failedTests++
    totalTests++
}

async function testReplayRecording() {
    console.log(chalk.blue('\n=== Testing Replay Recording ===\n'))
    
    // Test 1: Verify replay file is created
    try {
        const battle = new Battle({ 
            verbose: false,
            logDir: './test-replays'
        })
        
        const result = await battle.run(async (b) => {
            b.spawn('echo', ['Testing replay recording'])
            await b.wait(100)
            await b.expect('Testing replay recording')
        })
        
        if (result.success && result.replayPath) {
            // Check if replay file exists
            if (fs.existsSync(result.replayPath)) {
                testPass('Replay file is created during Battle run')
                
                // Test 2: Verify replay file structure
                const replayContent = fs.readFileSync(result.replayPath, 'utf-8')
                const replayData = JSON.parse(replayContent)
                
                if (replayData.version && replayData.events && replayData.metadata) {
                    testPass('Replay file has correct JSON structure')
                } else {
                    testFail('Replay file has correct JSON structure', 'Missing required fields')
                }
                
                // Test 3: Verify events are recorded
                const hasSpawnEvent = replayData.events.some((e: any) => e.type === 'spawn')
                const hasOutputEvent = replayData.events.some((e: any) => e.type === 'output')
                const hasExpectEvent = replayData.events.some((e: any) => e.type === 'expect')
                
                if (hasSpawnEvent && hasOutputEvent && hasExpectEvent) {
                    testPass('Replay records all event types')
                } else {
                    testFail('Replay records all event types', 'Missing some event types')
                }
                
                // Clean up
                fs.unlinkSync(result.replayPath)
            } else {
                testFail('Replay file is created during Battle run', 'File does not exist')
            }
        } else {
            testFail('Replay file is created during Battle run', 'No replay path returned')
        }
        
        // Clean up directory
        try {
            fs.rmSync('./test-replays', { recursive: true, force: true })
        } catch {}
    } catch (e: any) {
        testFail('Replay file is created during Battle run', e.message)
    }
}

async function testReplayKeySequences() {
    console.log(chalk.blue('\n=== Testing Replay Key Sequences ===\n'))
    
    // Test 4: Verify interactive key sequences are recorded
    try {
        const battle = new Battle({ 
            verbose: false,
            logDir: './test-replays'
        })
        
        const result = await battle.run(async (b) => {
            b.spawn('bash', ['-c', 'echo -n "Name: "; read name; echo "Hello $name"'])
            await b.wait(200)
            
            // Send key sequence
            b.sendKey('T')
            b.sendKey('e')
            b.sendKey('s')
            b.sendKey('t')
            b.sendKey('enter')
            
            await b.wait(200)
            await b.expect('Hello Test')
        })
        
        if (result.success && result.replayPath) {
            const replayContent = fs.readFileSync(result.replayPath, 'utf-8')
            const replayData = JSON.parse(replayContent)
            
            // Check for key events
            const keyEvents = replayData.events.filter((e: any) => e.type === 'key')
            const inputEvents = replayData.events.filter((e: any) => e.type === 'input')
            
            if (keyEvents.length >= 5 && inputEvents.length >= 5) {
                testPass('Replay records key and input events')
            } else {
                testFail('Replay records key and input events', 
                    `Found ${keyEvents.length} key events and ${inputEvents.length} input events`)
            }
            
            // Clean up
            fs.unlinkSync(result.replayPath)
        } else {
            testFail('Replay records key and input events', 'Test failed or no replay path')
        }
        
        // Clean up directory
        try {
            fs.rmSync('./test-replays', { recursive: true, force: true })
        } catch {}
    } catch (e: any) {
        testFail('Replay records key and input events', e.message)
    }
}

async function testReplayLoad() {
    console.log(chalk.blue('\n=== Testing Replay Load and Validation ===\n'))
    
    // Test 5: Test loading replay files
    try {
        // First create a replay
        const battle = new Battle({ 
            verbose: false,
            logDir: './test-replays'
        })
        
        const result = await battle.run(async (b) => {
            b.spawn('echo', ['Load test'])
            await b.wait(100)
            await b.expect('Load test')
        })
        
        if (result.success && result.replayPath) {
            // Test loading the replay
            const replay = new Replay()
            replay.load(result.replayPath)
            
            if (replay.data && replay.events) {
                testPass('Replay can load saved replay files')
                
                // Verify loaded data
                if (replay.events.length > 0) {
                    testPass('Replay loads events correctly')
                } else {
                    testFail('Replay loads events correctly', 'No events loaded')
                }
            } else {
                testFail('Replay can load saved replay files', 'Data not loaded properly')
            }
            
            // Clean up
            fs.unlinkSync(result.replayPath)
        } else {
            testFail('Replay can load saved replay files', 'Could not create test replay')
        }
        
        // Clean up directory
        try {
            fs.rmSync('./test-replays', { recursive: true, force: true })
        } catch {}
    } catch (e: any) {
        testFail('Replay can load saved replay files', e.message)
    }
}

async function testCLIReplayPlayer() {
    console.log(chalk.blue('\n=== Testing CLI Replay Player ===\n'))
    
    // Test 6: Test CLI replay player command
    try {
        // First create a replay to play
        const setupBattle = new Battle({ 
            verbose: false,
            logDir: './test-replays'
        })
        
        const setupResult = await setupBattle.run(async (b) => {
            b.spawn('echo', ['CLI Player Test'])
            await b.wait(100)
            await b.expect('CLI Player Test')
        })
        
        if (setupResult.success && setupResult.replayPath) {
            // Now test the CLI player
            const testBattle = new Battle({ 
                verbose: false,
                timeout: 5000
            })
            
            const result = await testBattle.run(async (b) => {
                // Run the replay player with a timeout to auto-exit
                b.spawn('timeout', ['2', 'node', 'dist/cli.js', 'replay', 'play', setupResult.replayPath!, '--speed', '10'])
                
                // Wait for player to start
                await b.wait(500)
                
                // Check for player UI elements
                await b.expect('Battle Replay Player')
                await b.expect('CONTROLS')
            })
            
            if (result.success) {
                testPass('CLI replay player launches and shows UI')
            } else {
                testFail('CLI replay player launches and shows UI', result.error || 'Unknown error')
            }
            
            // Clean up
            fs.unlinkSync(setupResult.replayPath)
        } else {
            testFail('CLI replay player launches and shows UI', 'Could not create test replay')
        }
        
        // Clean up directory
        try {
            fs.rmSync('./test-replays', { recursive: true, force: true })
        } catch {}
    } catch (e: any) {
        testFail('CLI replay player launches and shows UI', e.message)
    }
}

async function testHTMLExport() {
    console.log(chalk.blue('\n=== Testing HTML Export ===\n'))
    
    // Test 7: Test HTML export functionality
    try {
        // First create a replay to export
        const setupBattle = new Battle({ 
            verbose: false,
            logDir: './test-replays'
        })
        
        const setupResult = await setupBattle.run(async (b) => {
            b.spawn('echo', ['HTML Export Test'])
            await b.wait(100)
            b.sendKey('a')
            b.sendKey('b')
            b.sendKey('c')
            await b.expect('HTML Export Test')
        })
        
        if (setupResult.success && setupResult.replayPath) {
            // Load and export the replay
            const replay = new Replay()
            replay.load(setupResult.replayPath)
            
            // Test JSON export
            const jsonExport = replay.export('json')
            if (jsonExport) {
                const parsed = JSON.parse(jsonExport)
                if (parsed.version && parsed.events) {
                    testPass('Replay exports to JSON format')
                } else {
                    testFail('Replay exports to JSON format', 'Invalid JSON structure')
                }
            } else {
                testFail('Replay exports to JSON format', 'No JSON output')
            }
            
            // Test HTML export
            const htmlExport = replay.export('html')
            if (htmlExport && htmlExport.includes('<!DOCTYPE html>')) {
                // Check for key HTML player components (using actual IDs from export)
                const hasPlayButton = htmlExport.includes('playBtn')
                const hasStopButton = htmlExport.includes('onclick="stop()"')
                const hasSpeedControl = htmlExport.includes('speedInput') || htmlExport.includes('speed-input')
                const hasProgressBar = htmlExport.includes('progressBar') || htmlExport.includes('progress-bar')
                
                if (hasPlayButton && hasStopButton && hasSpeedControl && hasProgressBar) {
                    testPass('HTML export includes YouTube-style player controls')
                } else {
                    testFail('HTML export includes YouTube-style player controls', 
                        `Missing controls - Play: ${hasPlayButton}, Stop: ${hasStopButton}, Speed: ${hasSpeedControl}, Progress: ${hasProgressBar}`)
                }
            } else {
                testFail('HTML export includes YouTube-style player controls', 'Invalid HTML output')
            }
            
            // Clean up
            fs.unlinkSync(setupResult.replayPath)
        } else {
            testFail('Replay exports correctly', 'Could not create test replay')
        }
        
        // Clean up directory
        try {
            fs.rmSync('./test-replays', { recursive: true, force: true })
        } catch {}
    } catch (e: any) {
        testFail('Replay exports correctly', e.message)
    }
}

async function testCLIHTMLExport() {
    console.log(chalk.blue('\n=== Testing CLI HTML Export Command ===\n'))
    
    // Test 8: Test CLI HTML export command
    try {
        // First create a replay
        const setupBattle = new Battle({ 
            verbose: false,
            logDir: './test-replays'
        })
        
        const setupResult = await setupBattle.run(async (b) => {
            b.spawn('echo', ['CLI Export Test'])
            await b.wait(100)
            await b.expect('CLI Export Test')
        })
        
        if (setupResult.success && setupResult.replayPath) {
            // Test the CLI export command
            const testBattle = new Battle({ 
                verbose: false,
                timeout: 3000
            })
            
            // The CLI exports to the same directory as the replay file
            const expectedOutputPath = setupResult.replayPath!.replace('.json', '.html')
            
            const result = await testBattle.run(async (b) => {
                b.spawn('node', ['dist/cli.js', 'replay', 'export', setupResult.replayPath!, '--format', 'html'])
                await b.wait(1000)
                // The CLI outputs "Exported to:" when done
                await b.expect('Exported to:')
            })
            
            if (result.success) {
                // Check if HTML file was created at the expected location
                if (fs.existsSync(expectedOutputPath)) {
                    testPass('CLI export command creates HTML file')
                    
                    // Verify it's valid HTML
                    const htmlContent = fs.readFileSync(expectedOutputPath, 'utf-8')
                    if (htmlContent.includes('<!DOCTYPE html>') && htmlContent.includes('Battle Replay Player')) {
                        testPass('CLI export creates valid HTML with player')
                    } else {
                        testFail('CLI export creates valid HTML with player', 'Invalid HTML content')
                    }
                    
                    // Clean up
                    fs.unlinkSync(expectedOutputPath)
                } else {
                    testFail('CLI export command creates HTML file', `File not created at ${expectedOutputPath}`)
                }
            } else {
                testFail('CLI export command creates HTML file', result.error || 'Command failed')
            }
            
            // Clean up
            fs.unlinkSync(setupResult.replayPath)
        } else {
            testFail('CLI export command works', 'Could not create test replay')
        }
        
        // Clean up directory
        try {
            fs.rmSync('./test-replays', { recursive: true, force: true })
        } catch {}
    } catch (e: any) {
        testFail('CLI export command works', e.message)
    }
}

async function testCrossSessionReplay() {
    console.log(chalk.blue('\n=== Testing Cross-Session Replay ===\n'))
    
    // Test 9: Record in one session, replay in another
    try {
        // Session 1: Record
        const recordBattle = new Battle({ 
            verbose: false,
            logDir: './test-replays'
        })
        
        const recordResult = await recordBattle.run(async (b) => {
            b.spawn('bash', ['-c', 'echo "Session 1 Recording"'])
            await b.wait(100)
            b.sendKey('x')
            b.sendKey('y')
            b.sendKey('z')
            await b.expect('Session 1 Recording')
        })
        
        if (recordResult.success && recordResult.replayPath) {
            // Session 2: Replay the recording
            const replayBattle = new Battle({ 
                verbose: false,
                timeout: 5000
            })
            
            const replayResult = await replayBattle.run(async (b) => {
                // Use Battle to test replaying the recorded session
                b.spawn('timeout', ['3', 'node', 'dist/cli.js', 'replay', 'play', recordResult.replayPath!, '--speed', '5'])
                
                await b.wait(1000)
                
                // Should see the replay player and events
                await b.expect('Battle Replay Player')
                // Should see events being replayed
                await b.expect('SPAWN')
                await b.expect('KEY')
            })
            
            if (replayResult.success) {
                testPass('Cross-session replay works (record → replay)')
            } else {
                testFail('Cross-session replay works', replayResult.error || 'Replay failed')
            }
            
            // Clean up
            fs.unlinkSync(recordResult.replayPath)
        } else {
            testFail('Cross-session replay works', 'Could not create recording')
        }
        
        // Clean up directory
        try {
            fs.rmSync('./test-replays', { recursive: true, force: true })
        } catch {}
    } catch (e: any) {
        testFail('Cross-session replay works', e.message)
    }
}

async function testReplaySpeed() {
    console.log(chalk.blue('\n=== Testing Replay Speed Control ===\n'))
    
    // Test 10: Verify speed parameter works
    try {
        // Create a test replay
        const setupBattle = new Battle({ 
            verbose: false,
            logDir: './test-replays'
        })
        
        const setupResult = await setupBattle.run(async (b) => {
            b.spawn('echo', ['Speed Test'])
            await b.wait(100)
            await b.expect('Speed Test')
        })
        
        if (setupResult.success && setupResult.replayPath) {
            // Test different speeds
            const speeds = ['0.5', '2', '10']
            
            for (const speed of speeds) {
                const testBattle = new Battle({ 
                    verbose: false,
                    timeout: 3000
                })
                
                const result = await testBattle.run(async (b) => {
                    b.spawn('timeout', ['1', 'node', 'dist/cli.js', 'replay', 'play', setupResult.replayPath!, '--speed', speed])
                    
                    await b.wait(300)
                    
                    // Check that speed is displayed
                    await b.expect(`${speed}×`)
                })
                
                if (result.success) {
                    testPass(`Replay speed control works at ${speed}x`)
                } else {
                    testFail(`Replay speed control works at ${speed}x`, result.error || 'Speed not displayed')
                }
            }
            
            // Clean up
            fs.unlinkSync(setupResult.replayPath)
        } else {
            testFail('Replay speed control works', 'Could not create test replay')
        }
        
        // Clean up directory
        try {
            fs.rmSync('./test-replays', { recursive: true, force: true })
        } catch {}
    } catch (e: any) {
        testFail('Replay speed control works', e.message)
    }
}

async function testReplayMetadata() {
    console.log(chalk.blue('\n=== Testing Replay Metadata ===\n'))
    
    // Test 11: Verify metadata is recorded correctly
    try {
        const battle = new Battle({ 
            verbose: false,
            logDir: './test-replays',
            cols: 100,
            rows: 30
        })
        
        const result = await battle.run(async (b) => {
            // Use a process that stays alive for resize
            b.spawn('bash', ['-c', 'echo "Metadata Test"; sleep 1'])
            await b.wait(100)
            b.resize(120, 40)
            await b.wait(100)
            await b.expect('Metadata Test')
        })
        
        if (result.success && result.replayPath) {
            const replayContent = fs.readFileSync(result.replayPath, 'utf-8')
            const replayData = JSON.parse(replayContent)
            
            // Check metadata
            if (replayData.metadata.cols === 100 && replayData.metadata.rows === 30) {
                testPass('Replay records terminal dimensions')
            } else {
                testFail('Replay records terminal dimensions', 'Incorrect dimensions')
            }
            
            // Check resize event
            const resizeEvent = replayData.events.find((e: any) => e.type === 'resize')
            if (resizeEvent && resizeEvent.data.cols === 120 && resizeEvent.data.rows === 40) {
                testPass('Replay records resize events')
            } else {
                testFail('Replay records resize events', 'Resize event not found or incorrect')
            }
            
            // Check environment is recorded (at least some env vars should be present)
            if (replayData.metadata.env && Object.keys(replayData.metadata.env).length > 0) {
                testPass('Replay records environment variables')
            } else {
                testFail('Replay records environment variables', 'Environment not recorded')
            }
            
            // Clean up
            fs.unlinkSync(result.replayPath)
        } else {
            testFail('Replay metadata recording', 'Test failed')
        }
        
        // Clean up directory
        try {
            fs.rmSync('./test-replays', { recursive: true, force: true })
        } catch {}
    } catch (e: any) {
        testFail('Replay metadata recording', e.message)
    }
}

async function testReplayTimestamps() {
    console.log(chalk.blue('\n=== Testing Replay Timestamps ===\n'))
    
    // Test 12: Verify event timestamps are accurate
    try {
        const battle = new Battle({ 
            verbose: false,
            logDir: './test-replays'
        })
        
        const result = await battle.run(async (b) => {
            b.spawn('echo', ['Timestamp Test'])
            await b.wait(100)  // 100ms delay
            b.sendKey('a')
            await b.wait(200)  // 200ms delay
            b.sendKey('b')
            await b.wait(150)  // 150ms delay
            await b.expect('Timestamp Test')
        })
        
        if (result.success && result.replayPath) {
            const replayContent = fs.readFileSync(result.replayPath, 'utf-8')
            const replayData = JSON.parse(replayContent)
            
            // Find key events
            const keyEvents = replayData.events.filter((e: any) => e.type === 'key')
            
            if (keyEvents.length >= 2) {
                // Check that timestamps are increasing
                let timestampsIncreasing = true
                for (let i = 1; i < keyEvents.length; i++) {
                    if (keyEvents[i].timestamp <= keyEvents[i-1].timestamp) {
                        timestampsIncreasing = false
                        break
                    }
                }
                
                if (timestampsIncreasing) {
                    testPass('Replay events have increasing timestamps')
                } else {
                    testFail('Replay events have increasing timestamps', 'Timestamps not in order')
                }
                
                // Check total duration is reasonable (should be at least 450ms)
                if (replayData.duration >= 450) {
                    testPass('Replay duration matches test timing')
                } else {
                    testFail('Replay duration matches test timing', `Duration was ${replayData.duration}ms, expected >= 450ms`)
                }
            } else {
                testFail('Replay timestamp testing', 'Not enough key events recorded')
            }
            
            // Clean up
            fs.unlinkSync(result.replayPath)
        } else {
            testFail('Replay timestamp testing', 'Test failed')
        }
        
        // Clean up directory
        try {
            fs.rmSync('./test-replays', { recursive: true, force: true })
        } catch {}
    } catch (e: any) {
        testFail('Replay timestamp testing', e.message)
    }
}

// Main test runner
async function runAllTests() {
    console.log(chalk.bold('\nBattle Replay System Test Suite'))
    
    // Run all replay tests
    await testReplayRecording()
    await testReplayKeySequences()
    await testReplayLoad()
    await testCLIReplayPlayer()
    await testHTMLExport()
    await testCLIHTMLExport()
    await testCrossSessionReplay()
    await testReplaySpeed()
    await testReplayMetadata()
    await testReplayTimestamps()
    
    // Final summary
    console.log(chalk.bold('\nReplay Test Summary'))
    console.log(`Total Tests: ${totalTests}`)
    console.log(`${chalk.green('Passed')}: ${passedTests}`)
    console.log(`${chalk.red('Failed')}: ${failedTests}`)
    console.log('')
    
    if (failedTests === 0) {
        console.log(chalk.green('\n✅ All replay tests passed!'))
        console.log(chalk.gray('The StarCraft-style replay system is fully functional.'))
        process.exit(0)
    } else {
        console.log(chalk.red('\n❌ Some replay tests failed.'))
        console.log(chalk.yellow('Please review the failures above.'))
        process.exit(1)
    }
}

// Run the replay test suite
runAllTests().catch(error => {
    console.error(chalk.red('Fatal error during replay tests:'), error)
    process.exit(1)
})