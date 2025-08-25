#!/usr/bin/env tsx
/**
 * Battle.expect() Method Tests
 * Testing pattern matching and output expectations
 */

import { Battle } from '../../src/index.js'
import { testPass, testFail } from '../utils/testHelpers.js'

export async function testExpect() {
    console.log('\n=== Testing Battle.expect() ===\n')
    
    // Test: String pattern matching
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            await b.spawn('echo', ['Hello World'])
            await b.expect('Hello World')
        })
        
        if (result.success) {
            testPass('expect() matches string patterns')
        } else {
            testFail('expect() matches string patterns', result.error || 'Unknown error')
        }
    } catch (e: any) {
        testFail('expect() matches string patterns', e.message)
    }
    
    // Test: Regex pattern matching
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            await b.spawn('echo', ['Version 1.2.3'])
            await b.expect(/Version \d+\.\d+\.\d+/)
        })
        
        if (result.success) {
            testPass('expect() matches regex patterns')
        } else {
            testFail('expect() matches regex patterns', result.error || 'Unknown error')
        }
    } catch (e: any) {
        testFail('expect() matches regex patterns', e.message)
    }
    
    // Test: Timeout handling
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            await b.spawn('sleep', ['2'])
            await b.expect('will not appear', 100) // 100ms timeout
        })
        
        // Should fail due to timeout
        if (!result.success && result.error?.includes('not found')) {
            testPass('expect() handles timeouts correctly')
        } else {
            testFail('expect() handles timeouts correctly', 'Should have timed out')
        }
    } catch (e: any) {
        testPass('expect() handles timeouts correctly')
    }
    
    // Test: Interactive prompts
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            await b.spawn('bash', ['-c', 'read -p "Enter name: " name && echo "Hello $name"'])
            await b.expect('Enter name:')
            b.sendKey('Battle')
            b.sendKey('enter')
            await b.expect('Hello Battle')
        })
        
        if (result.success) {
            testPass('expect() works with interactive prompts')
        } else {
            testFail('expect() works with interactive prompts', result.error || 'Unknown error')
        }
    } catch (e: any) {
        testFail('expect() works with interactive prompts', e.message)
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testExpect().catch(console.error)
}