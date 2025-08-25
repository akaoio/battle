#!/usr/bin/env tsx
/**
 * Replay.export() Method Tests
 * Testing replay export functionality (HTML, JSON)
 */

import { Battle } from '../../src/index.js'
import { Replay } from '../../src/Replay/index.js'
import { testPass, testFail } from '../utils/testHelpers.js'

export async function testExport() {
    console.log('\n=== Testing Replay.export() ===\n')
    
    // Test: JSON export
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            await b.spawn('echo', ['Export test'])
            await b.expect('Export test')
        })
        
        if (result.replayPath) {
            const replay = new Replay()
            replay.load(result.replayPath)
            const jsonExport = replay.export('json')
            
            if (jsonExport) {
                const parsed = JSON.parse(jsonExport)
                if (parsed.events && parsed.metadata) {
                    testPass('export() generates valid JSON')
                } else {
                    testFail('export() generates valid JSON', 'Invalid JSON structure')
                }
            } else {
                testFail('export() generates valid JSON', 'No JSON output')
            }
        } else {
            testFail('export() generates valid JSON', 'Could not create test replay')
        }
    } catch (e: any) {
        testFail('export() generates valid JSON', e.message)
    }
    
    // Test: HTML export
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            await b.spawn('echo', ['HTML export test'])
            b.screenshot('html-test')
            b.resize(100, 30)
            await b.expect('HTML export test')
        })
        
        if (result.replayPath) {
            const replay = new Replay()
            replay.load(result.replayPath)
            const htmlExport = replay.export('html')
            
            if (htmlExport && htmlExport.includes('<!DOCTYPE html>')) {
                // Check for required HTML player components
                const checks = [
                    { name: 'Terminal display', pattern: 'terminal' },
                    { name: 'Play button', pattern: 'play' },
                    { name: 'Speed control', pattern: 'speed' },
                    { name: 'Progress bar', pattern: 'progress' },
                    { name: 'Event data', pattern: 'replaydata' }  // lowercase for comparison
                ]
                
                let allPresent = true
                for (const check of checks) {
                    if (!htmlExport.toLowerCase().includes(check.pattern)) {
                        allPresent = false
                        break
                    }
                }
                
                if (allPresent) {
                    testPass('export() generates complete HTML player')
                } else {
                    testFail('export() generates complete HTML player', 'Missing player components')
                }
            } else {
                testFail('export() generates complete HTML player', 'Invalid HTML output')
            }
        } else {
            testFail('export() generates complete HTML player', 'Could not create test replay')
        }
    } catch (e: any) {
        testFail('export() generates complete HTML player', e.message)
    }
    
    // Test: Export preserves all events
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            await b.spawn('bash', ['-c', 'echo "Line 1"; echo "Line 2"; echo "Line 3"'])
            b.sendKey('test')
            b.screenshot('export-test')
            b.resize(90, 25)
            await b.expect('Line 3')
        })
        
        if (result.replayPath) {
            const replay = new Replay()
            replay.load(result.replayPath)
            
            const originalEventCount = replay.events.length
            const htmlExport = replay.export('html')
            
            // Count events in HTML export
            const eventMatches = htmlExport.match(/"type":/g)
            const exportedEventCount = eventMatches ? eventMatches.length : 0
            
            if (exportedEventCount === originalEventCount) {
                testPass('export() preserves all events')
            } else {
                testFail('export() preserves all events', `${exportedEventCount} events in export, expected ${originalEventCount}`)
            }
        } else {
            testFail('export() preserves all events', 'Could not create test replay')
        }
    } catch (e: any) {
        testFail('export() preserves all events', e.message)
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testExport().catch(console.error)
}