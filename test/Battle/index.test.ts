#!/usr/bin/env tsx
/**
 * Battle Class Test Suite
 * Orchestrates all Battle method tests
 */

import { testSpawn } from './spawn.test.js'
import { testExpect } from './expect.test.js'
import { testResize } from './resize.test.js'
import { testScreenshot } from './screenshot.test.js'
import { testSendKey } from './sendKey.test.js'
import { testMetaBattle } from './meta.test.js'
import { printSummary, resetCounters } from '../utils/testHelpers.js'

export async function runBattleTests() {
    console.log('========================================')
    console.log('   Battle Class Test Suite')
    console.log('   Testing all Battle methods')
    console.log('========================================')
    
    resetCounters()
    
    // Run all method tests
    await testSpawn()
    await testExpect()
    await testResize()
    await testScreenshot()
    await testSendKey()
    await testMetaBattle()
    
    return printSummary('Battle Tests')
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runBattleTests()
        .then(results => {
            process.exit(results.failed > 0 ? 1 : 0)
        })
        .catch(error => {
            console.error('Test suite failed:', error)
            process.exit(1)
        })
}