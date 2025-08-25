#!/usr/bin/env tsx
/**
 * Battle Framework Complete Test Suite
 * Orchestrates all test modules following Class = Directory pattern
 */

import { runBattleTests } from './Battle/index.test.js'
import { runReplayTests } from './Replay/index.test.js'
import { runRunnerTests } from './Runner/index.test.js'
import { runSilentTests } from './Silent/index.test.js'

async function runAllTests() {
    console.log('╔════════════════════════════════════════╗')
    console.log('║   BATTLE FRAMEWORK TEST SUITE          ║')
    console.log('║   Class = Directory Pattern            ║')
    console.log('╚════════════════════════════════════════╝')
    console.log()
    
    const results = {
        total: 0,
        passed: 0,
        failed: 0
    }
    
    // Run all test suites
    const battleResults = await runBattleTests()
    results.total += battleResults.total
    results.passed += battleResults.passed
    results.failed += battleResults.failed
    
    console.log()
    
    const replayResults = await runReplayTests()
    results.total += replayResults.total
    results.passed += replayResults.passed
    results.failed += replayResults.failed
    
    console.log()
    
    const runnerResults = await runRunnerTests()
    results.total += runnerResults.total
    results.passed += runnerResults.passed
    results.failed += runnerResults.failed
    
    console.log()
    
    const silentResults = await runSilentTests()
    results.total += silentResults.total
    results.passed += silentResults.passed
    results.failed += silentResults.failed
    
    // Print final summary
    console.log()
    console.log('╔════════════════════════════════════════╗')
    console.log('║   FINAL TEST SUMMARY                   ║')
    console.log('╚════════════════════════════════════════╝')
    console.log(`Total Tests: ${results.total}`)
    console.log(`✅ Passed: ${results.passed}`)
    console.log(`❌ Failed: ${results.failed}`)
    console.log('════════════════════════════════════════')
    
    if (results.failed === 0) {
        console.log('\n🎉 All tests passed! Framework follows Class = Directory pattern.')
        console.log('The chicken has laid the egg that laid the chicken.')
    } else {
        console.log('\n❌ Some tests failed. Please review the output above.')
    }
    
    return results
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests()
        .then(results => {
            process.exit(results.failed > 0 ? 1 : 0)
        })
        .catch(error => {
            console.error('Test suite failed:', error)
            process.exit(1)
        })
}