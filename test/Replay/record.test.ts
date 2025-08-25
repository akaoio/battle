#!/usr/bin/env tsx
/**
 * Replay.record() Method Tests
 * Testing replay recording functionality
 */

import { Battle } from '../../src/index.js'
import { Replay } from '../../src/Replay/index.js'
import { testPass, testFail } from '../utils/testHelpers.js'
import fs from 'fs'

export async function testRecord() {
    console.log('\n=== Testing Replay.record() ===\n')
    
    // Test: Basic recording
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            await b.spawn('echo', ['Recording test'])
            await b.expect('Recording test')
        })
        
        if (result.success && result.replayPath) {
            // Verify replay file exists and has content
            if (fs.existsSync(result.replayPath)) {
                const content = JSON.parse(fs.readFileSync(result.replayPath, 'utf8'))
                
                if (content.events && content.events.length > 0) {
                    testPass('record() creates replay files')
                } else {
                    testFail('record() creates replay files', 'No events recorded')
                }
            } else {
                testFail('record() creates replay files', 'File does not exist')
            }
        } else {
            testFail('record() creates replay files', 'No replay path returned')
        }
    } catch (e: any) {
        testFail('record() creates replay files', e.message)
    }
    
    // Test: Recording event sequence
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            await b.spawn('bash', ['-c', 'for i in 1 2 3; do echo "Line $i"; sleep 0.05; done'])
            await b.expect('Line 1')
            await b.expect('Line 2')
            await b.expect('Line 3')
        })
        
        if (result.replayPath) {
            const replay = new Replay()
            replay.load(result.replayPath)
            
            const spawnEvents = replay.events.filter(e => e.type === 'spawn')
            const outputEvents = replay.events.filter(e => e.type === 'output')
            const expectEvents = replay.events.filter(e => e.type === 'expect')
            
            if (spawnEvents.length === 1 && outputEvents.length > 0 && expectEvents.length === 3) {
                testPass('record() captures all event types')
            } else {
                testFail('record() captures all event types', 'Missing some event types')
            }
        } else {
            testFail('record() captures all event types', 'No replay created')
        }
    } catch (e: any) {
        testFail('record() captures all event types', e.message)
    }
    
    // Test: Recording with metadata
    try {
        const battle = new Battle({ 
            verbose: false,
            cols: 100,
            rows: 30,
            env: { CUSTOM_VAR: 'test' }
        })
        const result = await battle.run(async (b) => {
            await b.spawn('echo', ['Metadata test'])
            b.resize(120, 40)
            b.screenshot('metadata-test')
        })
        
        if (result.replayPath) {
            const content = JSON.parse(fs.readFileSync(result.replayPath, 'utf8'))
            
            if (content.metadata && 
                content.metadata.cols === 100 && 
                content.metadata.rows === 30) {
                testPass('record() captures metadata')
            } else {
                testFail('record() captures metadata', 'Metadata incomplete')
            }
        } else {
            testFail('record() captures metadata', 'No replay created')
        }
    } catch (e: any) {
        testFail('record() captures metadata', e.message)
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testRecord().catch(console.error)
}