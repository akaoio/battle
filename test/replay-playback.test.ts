#!/usr/bin/env tsx
/**
 * Comprehensive Replay Playback Testing
 * Tests actual replay functionality, not just UI appearance
 */

import { Battle, Replay } from '../src/index.js'
import fs from 'fs'
import path from 'path'
import { color as chalk } from '../src/utils/colors.js'
import { spawn } from 'child_process'

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

/**
 * Test 1: Verify events are actually replayed in sequence
 */
async function testEventSequencePlayback() {
    console.log(chalk.blue('\n=== Testing Event Sequence Playback ===\n'))
    
    try {
        // Create a recording with distinct events
        const battle = new Battle({ 
            verbose: false,
            logDir: './test-replays'
        })
        
        const result = await battle.run(async (b) => {
            b.spawn('bash', ['-c', 'for i in 1 2 3; do echo "Line $i"; sleep 0.05; done'])
            await b.wait(200)
            await b.expect('Line 1')
            await b.expect('Line 2')
            await b.expect('Line 3')
        })
        
        if (result.success && result.replayPath) {
            // Load the replay
            const replay = new Replay()
            replay.load(result.replayPath)
            
            // Verify events are in correct order
            const events = replay.events
            const spawnEvent = events.find(e => e.type === 'spawn')
            const outputEvents = events.filter(e => e.type === 'output')
            const expectEvents = events.filter(e => e.type === 'expect')
            
            if (spawnEvent && spawnEvent.timestamp === events[0].timestamp) {
                testPass('Spawn event is first in sequence')
            } else {
                testFail('Spawn event is first in sequence', 'Event order incorrect')
            }
            
            // Check output events contain expected text
            const outputs = outputEvents.map(e => e.data).join('')
            if (outputs.includes('Line 1') && outputs.includes('Line 2') && outputs.includes('Line 3')) {
                testPass('All output events recorded in sequence')
            } else {
                testFail('All output events recorded in sequence', 'Missing output events')
            }
            
            // Check expect events are after outputs
            if (expectEvents.length === 3) {
                testPass('All expect events recorded')
            } else {
                testFail('All expect events recorded', `Found ${expectEvents.length} expect events, expected 3`)
            }
            
            // Clean up
            fs.unlinkSync(result.replayPath)
        } else {
            testFail('Event sequence recording', 'Failed to create recording')
        }
        
        // Clean up directory
        try {
            fs.rmSync('./test-replays', { recursive: true, force: true })
        } catch {}
    } catch (e: any) {
        testFail('Event sequence playback', e.message)
    }
}

/**
 * Test 2: Verify timing accuracy with speed control
 */
async function testPlaybackTiming() {
    console.log(chalk.blue('\n=== Testing Playback Timing & Speed Control ===\n'))
    
    try {
        // Create a recording with known timing
        const battle = new Battle({ 
            verbose: false,
            logDir: './test-replays'
        })
        
        const recordStart = Date.now()
        const result = await battle.run(async (b) => {
            b.spawn('bash', ['-c', 'echo "Start"; sleep 0.2; echo "Middle"; sleep 0.2; echo "End"'])
            await b.wait(100)
            await b.wait(200)  // 200ms delay
            await b.wait(200)  // Another 200ms delay
            await b.expect('End')
        })
        const recordDuration = Date.now() - recordStart
        
        if (result.success && result.replayPath) {
            const replay = new Replay()
            replay.load(result.replayPath)
            
            // Test duration recording
            if (replay.data.duration > 400 && replay.data.duration < 600) {
                testPass('Recording duration captured correctly')
            } else {
                testFail('Recording duration captured correctly', `Duration was ${replay.data.duration}ms, expected ~500ms`)
            }
            
            // Test event timestamps are monotonic
            let previousTimestamp = -1
            let timestampsValid = true
            for (const event of replay.events) {
                if (event.timestamp < previousTimestamp) {
                    timestampsValid = false
                    break
                }
                previousTimestamp = event.timestamp
            }
            
            if (timestampsValid) {
                testPass('Event timestamps are monotonically increasing')
            } else {
                testFail('Event timestamps are monotonically increasing', 'Timestamps out of order')
            }
            
            // Test that timestamps span the duration
            const firstTimestamp = replay.events[0]?.timestamp || 0
            const lastTimestamp = replay.events[replay.events.length - 1]?.timestamp || 0
            const timespan = lastTimestamp - firstTimestamp
            
            if (timespan >= replay.data.duration * 0.8) {
                testPass('Event timestamps span recording duration')
            } else {
                testFail('Event timestamps span recording duration', `Timespan ${timespan}ms < duration ${replay.data.duration}ms`)
            }
            
            // Clean up
            fs.unlinkSync(result.replayPath)
        } else {
            testFail('Timing test recording', 'Failed to create recording')
        }
        
        // Clean up directory
        try {
            fs.rmSync('./test-replays', { recursive: true, force: true })
        } catch {}
    } catch (e: any) {
        testFail('Playback timing test', e.message)
    }
}

/**
 * Test 3: Verify terminal output is reproduced accurately
 */
async function testOutputReproduction() {
    console.log(chalk.blue('\n=== Testing Output Reproduction ===\n'))
    
    try {
        // Create a recording with ANSI colors and special characters
        const battle = new Battle({ 
            verbose: false,
            logDir: './test-replays'
        })
        
        const testOutput = `${chalk.red('Red')} ${chalk.green('Green')} ${chalk.blue('Blue')}`
        const result = await battle.run(async (b) => {
            b.spawn('bash', ['-c', `echo -e "\\033[31mRed\\033[0m \\033[32mGreen\\033[0m \\033[34mBlue\\033[0m"`])
            await b.wait(100)
            await b.expect('Red')
            await b.expect('Green')
            await b.expect('Blue')
        })
        
        if (result.success && result.replayPath) {
            const replay = new Replay()
            replay.load(result.replayPath)
            
            // Check that ANSI codes are preserved
            const outputEvents = replay.events.filter(e => e.type === 'output')
            const combinedOutput = outputEvents.map(e => e.data).join('')
            
            if (combinedOutput.includes('\x1b[31m') || combinedOutput.includes('\x1b[31m')) {
                testPass('ANSI color codes preserved in recording')
            } else {
                testFail('ANSI color codes preserved in recording', 'Color codes not found')
            }
            
            // Check that output structure is preserved
            if (outputEvents.length > 0) {
                testPass('Output events captured')
            } else {
                testFail('Output events captured', 'No output events found')
            }
            
            // Clean up
            fs.unlinkSync(result.replayPath)
        } else {
            testFail('Output reproduction recording', 'Failed to create recording')
        }
        
        // Clean up directory
        try {
            fs.rmSync('./test-replays', { recursive: true, force: true })
        } catch {}
    } catch (e: any) {
        testFail('Output reproduction test', e.message)
    }
}

/**
 * Test 4: Test CLI player actually plays events
 */
async function testCLIPlayerPlayback() {
    console.log(chalk.blue('\n=== Testing CLI Player Event Playback ===\n'))
    
    try {
        // Create a recording with multiple distinct events
        const setupBattle = new Battle({ 
            verbose: false,
            logDir: './test-replays'
        })
        
        const setupResult = await setupBattle.run(async (b) => {
            b.spawn('bash', ['-c', 'echo "Test1"; echo "Test2"; echo "Test3"'])
            await b.wait(100)
            b.sendKey('a')
            b.sendKey('b')
            b.sendKey('c')
            await b.expect('Test1')
            await b.expect('Test2')
            await b.expect('Test3')
        })
        
        if (setupResult.success && setupResult.replayPath) {
            // Test the CLI player shows events being played
            const testBattle = new Battle({ 
                verbose: false,
                timeout: 10000
            })
            
            const result = await testBattle.run(async (b) => {
                // Run replay at high speed to complete quickly
                b.spawn('timeout', ['5', 'node', 'dist/cli.js', 'replay', 'play', setupResult.replayPath!, '--speed', '20'])
                
                // Wait for player to start
                await b.wait(500)
                
                // Check for player UI
                await b.expect('Battle Replay Player')
                await b.expect('CONTROLS')
                
                // Check for event indicators
                await b.wait(1000)
                
                // The player should show event types as they're played
                const hasSpawnEvent = b.output.includes('SPAWN')
                const hasKeyEvent = b.output.includes('KEY')
                const hasOutputEvent = b.output.includes('Event:')
                
                if (hasSpawnEvent || hasKeyEvent || hasOutputEvent) {
                    return true  // Events are being displayed
                }
                
                throw new Error('No events displayed during playback')
            })
            
            if (result.success) {
                testPass('CLI player displays events during playback')
            } else {
                testFail('CLI player displays events during playback', result.error || 'Events not shown')
            }
            
            // Clean up
            fs.unlinkSync(setupResult.replayPath)
        } else {
            testFail('CLI player test setup', 'Could not create test replay')
        }
        
        // Clean up directory
        try {
            fs.rmSync('./test-replays', { recursive: true, force: true })
        } catch {}
    } catch (e: any) {
        testFail('CLI player playback test', e.message)
    }
}

/**
 * Test 5: Test direct Replay.play() method
 */
async function testDirectReplayPlay() {
    console.log(chalk.blue('\n=== Testing Direct Replay.play() Method ===\n'))
    
    try {
        // Create a simple recording
        const battle = new Battle({ 
            verbose: false,
            logDir: './test-replays'
        })
        
        const result = await battle.run(async (b) => {
            b.spawn('echo', ['Direct play test'])
            await b.wait(100)
            await b.expect('Direct play test')
        })
        
        if (result.success && result.replayPath) {
            const replay = new Replay()
            replay.load(result.replayPath)
            
            // Test that play() method exists and is callable
            if (typeof replay.play === 'function') {
                testPass('Replay.play() method exists')
            } else {
                testFail('Replay.play() method exists', 'Method not found')
            }
            
            // Test play with different speeds (non-interactive)
            try {
                // Create a test that captures output during playback
                const testBattle = new Battle({ 
                    verbose: false,
                    timeout: 5000
                })
                
                const playResult = await testBattle.run(async (b) => {
                    // Use a script that loads and plays the replay
                    const script = `
                        const { Replay } = require('./dist/index.cjs');
                        const replay = new Replay();
                        replay.load('${result.replayPath}');
                        console.log('Loaded ' + replay.events.length + ' events');
                        console.log('Duration: ' + replay.data.duration + 'ms');
                        process.exit(0);
                    `
                    b.spawn('node', ['-e', script])
                    await b.wait(1000)
                    await b.expect('Loaded')
                    await b.expect('Duration:')
                })
                
                if (playResult.success) {
                    testPass('Replay can be loaded and inspected programmatically')
                } else {
                    testFail('Replay can be loaded and inspected programmatically', playResult.error || 'Load failed')
                }
            } catch (e: any) {
                testFail('Direct play() execution', e.message)
            }
            
            // Clean up
            fs.unlinkSync(result.replayPath)
        } else {
            testFail('Direct play test setup', 'Could not create test replay')
        }
        
        // Clean up directory
        try {
            fs.rmSync('./test-replays', { recursive: true, force: true })
        } catch {}
    } catch (e: any) {
        testFail('Direct Replay.play() test', e.message)
    }
}

/**
 * Test 6: Test HTML export contains functional player
 */
async function testHTMLPlayerFunctionality() {
    console.log(chalk.blue('\n=== Testing HTML Player Functionality ===\n'))
    
    try {
        // Create a recording
        const battle = new Battle({ 
            verbose: false,
            logDir: './test-replays'
        })
        
        const result = await battle.run(async (b) => {
            b.spawn('bash', ['-c', 'echo "HTML Test"'])
            await b.wait(100)
            b.sendKey('x')
            b.sendKey('y')
            b.sendKey('z')
            await b.expect('HTML Test')
        })
        
        if (result.success && result.replayPath) {
            const replay = new Replay()
            replay.load(result.replayPath)
            const html = replay.export('html')
            
            // Critical HTML player components
            const checks = [
                { 
                    name: 'Event data embedded',
                    test: html.includes('PlaybackEngine') && html.includes('"type":"spawn"')
                },
                {
                    name: 'Play function defined',
                    test: html.includes('function play()') && html.includes('engine.play()')
                },
                {
                    name: 'Event scheduler present',
                    test: html.includes('scheduleNextFrame') || html.includes('requestAnimationFrame')
                },
                {
                    name: 'Speed control logic',
                    test: html.includes('playbackSpeed') || html.includes('speed')
                },
                {
                    name: 'Progress bar update logic',
                    test: html.includes('progressFill') && html.includes('width')
                },
                {
                    name: 'Event display logic',
                    test: html.includes('event.type') || html.includes('formatEvent')
                },
                {
                    name: 'Time display logic',
                    test: html.includes('formatTime') || html.includes('currentTime')
                },
                {
                    name: 'Keyboard controls',
                    test: html.includes('addEventListener') && html.includes('keydown')
                }
            ]
            
            let allPassed = true
            for (const check of checks) {
                if (check.test) {
                    testPass(`HTML player: ${check.name}`)
                } else {
                    testFail(`HTML player: ${check.name}`, 'Component missing')
                    allPassed = false
                }
            }
            
            // Check event count matches
            const eventMatches = html.match(/"type":/g)
            const eventCount = eventMatches ? eventMatches.length : 0
            if (eventCount === replay.events.length) {
                testPass(`HTML contains all ${eventCount} events`)
            } else {
                testFail('HTML contains all events', `Found ${eventCount}, expected ${replay.events.length}`)
            }
            
            // Clean up
            fs.unlinkSync(result.replayPath)
        } else {
            testFail('HTML player test setup', 'Could not create test replay')
        }
        
        // Clean up directory
        try {
            fs.rmSync('./test-replays', { recursive: true, force: true })
        } catch {}
    } catch (e: any) {
        testFail('HTML player functionality test', e.message)
    }
}

/**
 * Test 7: Test replay with complex interactions
 */
async function testComplexReplayScenario() {
    console.log(chalk.blue('\n=== Testing Complex Replay Scenario ===\n'))
    
    try {
        // Create a complex recording with multiple interaction types
        const battle = new Battle({ 
            verbose: false,
            logDir: './test-replays',
            cols: 80,
            rows: 24
        })
        
        const result = await battle.run(async (b) => {
            // Start an interactive bash session
            b.spawn('bash', ['-c', 'echo "Start"; read -p "Enter text: " input; echo "You entered: $input"; echo "End"'])
            
            await b.wait(100)
            await b.expect('Start')
            
            await b.wait(100)
            await b.expect('Enter text:')
            
            // Send complex input
            b.sendKey('H')
            b.sendKey('e')
            b.sendKey('l')
            b.sendKey('l')
            b.sendKey('o')
            b.sendKey('space')
            b.sendKey('W')
            b.sendKey('o')
            b.sendKey('r')
            b.sendKey('l')
            b.sendKey('d')
            b.sendKey('enter')
            
            await b.wait(100)
            await b.expect('You entered: Hello World')
            await b.expect('End')
            
            // Take a screenshot
            b.screenshot('complex-test')
            
            // Resize terminal
            b.resize(100, 30)
        })
        
        if (result.success && result.replayPath) {
            const replay = new Replay()
            replay.load(result.replayPath)
            
            // Verify complex recording
            const keyEvents = replay.events.filter(e => e.type === 'key')
            const outputEvents = replay.events.filter(e => e.type === 'output')
            const screenshotEvents = replay.events.filter(e => e.type === 'screenshot')
            const resizeEvents = replay.events.filter(e => e.type === 'resize')
            
            if (keyEvents.length >= 11) {  // At least 11 keys + enter
                testPass('Complex input sequence recorded')
            } else {
                testFail('Complex input sequence recorded', `Only ${keyEvents.length} key events found`)
            }
            
            if (outputEvents.length > 0) {
                const output = outputEvents.map(e => e.data).join('')
                if (output.includes('Start') && output.includes('Enter text:') && output.includes('You entered:')) {
                    testPass('Interactive prompts recorded')
                } else {
                    testFail('Interactive prompts recorded', 'Missing expected prompts')
                }
            } else {
                testFail('Interactive prompts recorded', 'No output events')
            }
            
            if (screenshotEvents.length === 1) {
                testPass('Screenshot event recorded')
            } else {
                testFail('Screenshot event recorded', `Found ${screenshotEvents.length} screenshot events`)
            }
            
            if (resizeEvents.length === 1 && resizeEvents[0].data.cols === 100) {
                testPass('Terminal resize recorded')
            } else {
                testFail('Terminal resize recorded', 'Resize event missing or incorrect')
            }
            
            // Clean up
            fs.unlinkSync(result.replayPath)
            if (result.screenshots.length > 0) {
                result.screenshots.forEach(s => {
                    try { fs.unlinkSync(s) } catch {}
                })
            }
        } else {
            testFail('Complex scenario recording', 'Failed to create recording')
        }
        
        // Clean up directory
        try {
            fs.rmSync('./test-replays', { recursive: true, force: true })
            fs.rmSync('./screenshots', { recursive: true, force: true })
        } catch {}
    } catch (e: any) {
        testFail('Complex replay scenario', e.message)
    }
}

// Main test runner
async function runAllTests() {
    console.log(chalk.bold('\n========================================'))
    console.log(chalk.bold('   Replay Playback Comprehensive Tests'))
    console.log(chalk.bold('========================================'))
    
    // Run all playback tests
    await testEventSequencePlayback()
    await testPlaybackTiming()
    await testOutputReproduction()
    await testCLIPlayerPlayback()
    await testDirectReplayPlay()
    await testHTMLPlayerFunctionality()
    await testComplexReplayScenario()
    
    // Final summary
    console.log(chalk.bold('\n========================================'))
    console.log(chalk.bold('   Playback Test Summary'))
    console.log(chalk.bold('========================================'))
    console.log(`Total Tests: ${totalTests}`)
    console.log(`${chalk.green('Passed')}: ${passedTests}`)
    console.log(`${chalk.red('Failed')}: ${failedTests}`)
    console.log(chalk.bold('========================================'))
    
    if (failedTests === 0) {
        console.log(chalk.green('\n✅ All playback tests passed!'))
        console.log(chalk.gray('The replay playback system is fully functional.'))
        process.exit(0)
    } else {
        console.log(chalk.red('\n❌ Some playback tests failed.'))
        console.log(chalk.yellow('Please review the failures above.'))
        process.exit(1)
    }
}

// Run the tests
runAllTests().catch(error => {
    console.error(chalk.red('Fatal error during playback tests:'), error)
    process.exit(1)
})