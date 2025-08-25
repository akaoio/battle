#!/usr/bin/env tsx
/**
 * Battle.spawn() Method Tests
 * Testing process spawning with PTY emulation
 */

import { Battle } from '../../src/index.js'
import { testPass, testFail } from '../utils/testHelpers.js'

export async function testSpawn() {
    console.log('\n=== Testing Battle.spawn() ===\n')
    
    // Test: Basic spawn functionality
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            await b.spawn('echo', ['Battle spawn test'])
            await b.wait(100)
            await b.expect('Battle spawn test')
        })
        
        if (result.success) {
            testPass('spawn() can launch processes')
        } else {
            testFail('spawn() can launch processes', result.error || 'Unknown error')
        }
    } catch (e: any) {
        testFail('spawn() can launch processes', e.message)
    }
    
    // Test: Spawn with environment variables
    try {
        const battle = new Battle({ 
            verbose: false,
            env: { TEST_VAR: 'test_value' }
        })
        const result = await battle.run(async (b) => {
            await b.spawn('bash', ['-c', 'echo $TEST_VAR'])
            await b.expect('test_value')
        })
        
        if (result.success) {
            testPass('spawn() passes environment variables')
        } else {
            testFail('spawn() passes environment variables', result.error || 'Unknown error')
        }
    } catch (e: any) {
        testFail('spawn() passes environment variables', e.message)
    }
    
    // Test: Spawn with custom working directory
    try {
        const battle = new Battle({ 
            verbose: false,
            cwd: '/tmp'
        })
        const result = await battle.run(async (b) => {
            await b.spawn('pwd', [])
            await b.expect('/tmp')
        })
        
        if (result.success) {
            testPass('spawn() respects working directory')
        } else {
            testFail('spawn() respects working directory', result.error || 'Unknown error')
        }
    } catch (e: any) {
        testFail('spawn() respects working directory', e.message)
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testSpawn().catch(console.error)
}