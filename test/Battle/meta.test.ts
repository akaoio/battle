#!/usr/bin/env tsx
/**
 * Battle Meta Tests
 * The ultimate test: Battle testing Battle testing Battle
 */

import { Battle } from '../../src/index.js'
import { testPass, testFail } from '../utils/testHelpers.js'

export async function testMetaBattle() {
    console.log('\n=== The Ultimate Meta Test: Battle in Battle in Battle ===\n')
    
    // The chicken laying the egg that lays the chicken
    try {
        const battle = new Battle({ verbose: false, timeout: 30000 })
        const result = await battle.run(async (b) => {
            // Battle testing Battle testing echo
            await b.spawn('node', ['dist/cli.js', 'run', 'echo "Inception"'])
            await b.expect('Test passed')
        })
        
        if (result.success) {
            testPass('Battle can test Battle testing Battle (3 levels deep)')
            console.log('       The chicken has laid the egg that laid the chicken!')
        } else {
            testFail('Battle can test Battle testing Battle', result.error || 'Unknown error')
        }
    } catch (e: any) {
        testFail('Battle can test Battle testing Battle', e.message)
    }
    
    // Test: Battle CLI testing itself
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            await b.spawn('node', ['dist/cli.js', 'silent', 'echo "CLI test"'])
            await b.expect('CLI test')
        })
        
        if (result.success) {
            testPass('Battle CLI can test commands')
        } else {
            testFail('Battle CLI can test commands', result.error || 'Unknown error')
        }
    } catch (e: any) {
        testFail('Battle CLI can test commands', e.message)
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testMetaBattle().catch(console.error)
}