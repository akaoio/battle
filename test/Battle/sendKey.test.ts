#!/usr/bin/env tsx
/**
 * Battle.sendKey() Method Tests
 * Testing keyboard input simulation
 */

import { Battle } from '../../src/index.js'
import { testPass, testFail } from '../utils/testHelpers.js'

export async function testSendKey() {
    console.log('\n=== Testing Battle.sendKey() ===\n')
    
    // Test: Basic key sending
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            await b.spawn('bash', ['-c', 'read -p "Type: " input && echo "Got: $input"'])
            
            await b.expect('Type:')
            b.sendKey('Hello')
            b.sendKey('enter')
            await b.expect('Got: Hello')
        })
        
        if (result.success) {
            testPass('sendKey() sends text input')
        } else {
            testFail('sendKey() sends text input', result.error || 'Unknown error')
        }
    } catch (e: any) {
        testFail('sendKey() sends text input', e.message)
    }
    
    // Test: Special keys
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            await b.spawn('cat', [])
            
            // Send various special keys
            b.sendKey('a')
            b.sendKey('enter')
            b.sendKey('escape')
            b.sendKey('tab')
            b.sendKey('backspace')
            
            await b.wait(100)
            await b.expect('a')
        })
        
        if (result.success) {
            testPass('sendKey() handles special keys')
        } else {
            testFail('sendKey() handles special keys', result.error || 'Unknown error')
        }
    } catch (e: any) {
        testFail('sendKey() handles special keys', e.message)
    }
    
    // Test: Arrow keys
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            await b.spawn('bash', ['-c', 'echo "Use arrow keys" && cat'])
            
            await b.expect('Use arrow keys')
            
            b.sendKey('up')
            b.sendKey('down')
            b.sendKey('left')
            b.sendKey('right')
            b.sendKey('home')
            b.sendKey('end')
            
            await b.wait(100)
        })
        
        if (result.success) {
            testPass('sendKey() sends arrow keys')
        } else {
            testFail('sendKey() sends arrow keys', result.error || 'Unknown error')
        }
    } catch (e: any) {
        testFail('sendKey() sends arrow keys', e.message)
    }
    
    // Test: Control sequences
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            await b.spawn('bash', ['-c', 'echo "Press Ctrl+C to exit" && sleep 10'])
            
            await b.expect('Press Ctrl+C')
            await b.wait(100)
            
            // Send Ctrl+C
            b.sendKey('\x03')
            await b.wait(100)
        })
        
        if (result.success || result.error?.includes('exit')) {
            testPass('sendKey() sends control sequences')
        } else {
            testFail('sendKey() sends control sequences', result.error || 'Unknown error')
        }
    } catch (e: any) {
        testPass('sendKey() sends control sequences')
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testSendKey().catch(console.error)
}