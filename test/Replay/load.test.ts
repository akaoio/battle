#!/usr/bin/env tsx
/**
 * Replay.load() Method Tests
 * Testing replay file loading functionality
 */

import { Battle } from '../../src/index.js'
import { Replay } from '../../src/Replay/index.js'
import { testPass, testFail } from '../utils/testHelpers.js'
import fs from 'fs'

export async function testLoad() {
    console.log('\n=== Testing Replay.load() ===\n')
    
    // Test: Load valid replay file
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            await b.spawn('echo', ['Load test'])
            await b.expect('Load test')
        })
        
        if (result.replayPath) {
            const replay = new Replay()
            replay.load(result.replayPath)
            
            if (replay.data && replay.events && replay.events.length > 0) {
                testPass('load() reads replay files')
            } else {
                testFail('load() reads replay files', 'Data not loaded properly')
            }
        } else {
            testFail('load() reads replay files', 'Could not create test replay')
        }
    } catch (e: any) {
        testFail('load() reads replay files', e.message)
    }
    
    // Test: Load preserves event timestamps
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            await b.spawn('bash', ['-c', 'echo "Start"; sleep 0.1; echo "End"'])
            await b.expect('Start')
            await b.expect('End')
        })
        
        if (result.replayPath) {
            const originalContent = JSON.parse(fs.readFileSync(result.replayPath, 'utf8'))
            
            const replay = new Replay()
            replay.load(result.replayPath)
            
            // Check timestamps are preserved
            let timestampsMatch = true
            for (let i = 0; i < originalContent.events.length; i++) {
                if (replay.events[i].timestamp !== originalContent.events[i].timestamp) {
                    timestampsMatch = false
                    break
                }
            }
            
            if (timestampsMatch) {
                testPass('load() preserves timestamps')
            } else {
                testFail('load() preserves timestamps', 'Timestamps modified during load')
            }
        } else {
            testFail('load() preserves timestamps', 'Could not create test replay')
        }
    } catch (e: any) {
        testFail('load() preserves timestamps', e.message)
    }
    
    // Test: Load preserves metadata
    try {
        const battle = new Battle({ 
            verbose: false,
            cols: 90,
            rows: 35,
            env: { TEST_ENV: 'load_test' }
        })
        const result = await battle.run(async (b) => {
            await b.spawn('echo', ['Metadata load test'])
            await b.expect('Metadata load test')
        })
        
        if (result.replayPath) {
            const replay = new Replay()
            replay.load(result.replayPath)
            
            if (replay.data.metadata &&
                replay.data.metadata.cols === 90 &&
                replay.data.metadata.rows === 35) {
                testPass('load() preserves metadata')
            } else {
                testFail('load() preserves metadata', 'Metadata not preserved')
            }
        } else {
            testFail('load() preserves metadata', 'Could not create test replay')
        }
    } catch (e: any) {
        testFail('load() preserves metadata', e.message)
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testLoad().catch(console.error)
}