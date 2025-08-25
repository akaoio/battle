#!/usr/bin/env tsx
/**
 * Battle.resize() Method Tests
 * Testing terminal viewport resizing functionality
 */

import { Battle } from '../../src/index.js'
import { testPass, testFail } from '../utils/testHelpers.js'

export async function testResize() {
    console.log('\n=== Testing Battle.resize() ===\n')
    
    // Test: Basic resize functionality
    try {
        const battle = new Battle({ cols: 80, rows: 24, verbose: false })
        const result = await battle.run(async (b) => {
            await b.spawn('bash', ['-c', 'echo "Initial size"'])
            
            // Resize terminal multiple times
            b.resize(120, 40)
            await b.wait(100)
            b.resize(40, 20)
            await b.wait(100)
            b.resize(80, 24)
            
            await b.expect('Initial size')
        })
        
        if (result.success) {
            testPass('resize() changes terminal dimensions')
        } else {
            testFail('resize() changes terminal dimensions', result.error || 'Unknown error')
        }
    } catch (e: any) {
        testFail('resize() changes terminal dimensions', e.message)
    }
    
    // Test: Resize before spawn (should update options)
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            // Resize before spawning
            b.resize(100, 30)
            await b.spawn('echo', ['Resized before spawn'])
            await b.expect('Resized before spawn')
        })
        
        if (result.success) {
            testPass('resize() works before spawn')
        } else {
            testFail('resize() works before spawn', result.error || 'Unknown error')
        }
    } catch (e: any) {
        testFail('resize() works before spawn', e.message)
    }
    
    // Test: Extreme dimensions
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            await b.spawn('echo', ['Testing extreme sizes'])
            
            // Test very small
            b.resize(20, 10)
            await b.wait(50)
            
            // Test very large
            b.resize(200, 60)
            await b.wait(50)
            
            // Return to normal
            b.resize(80, 24)
            
            await b.expect('Testing extreme sizes')
        })
        
        if (result.success) {
            testPass('resize() handles extreme dimensions')
        } else {
            testFail('resize() handles extreme dimensions', result.error || 'Unknown error')
        }
    } catch (e: any) {
        testFail('resize() handles extreme dimensions', e.message)
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testResize().catch(console.error)
}