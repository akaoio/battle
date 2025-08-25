#!/usr/bin/env tsx
/**
 * Replay Class Test Suite
 * Orchestrates all Replay method tests
 */

import { testRecord } from './record.test.js'
import { testPlay } from './play.test.js'
import { testExport } from './export.test.js'
import { testLoad } from './load.test.js'
import { printSummary, resetCounters } from '../utils/testHelpers.js'

export async function runReplayTests() {
    console.log('========================================')
    console.log('   Replay Class Test Suite')
    console.log('   Testing all Replay methods')
    console.log('========================================')
    
    resetCounters()
    
    // Run all method tests
    await testRecord()
    await testPlay()
    await testExport()
    await testLoad()
    
    return printSummary('Replay Tests')
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runReplayTests()
        .then(results => {
            process.exit(results.failed > 0 ? 1 : 0)
        })
        .catch(error => {
            console.error('Test suite failed:', error)
            process.exit(1)
        })
}