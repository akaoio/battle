/**
 * Test Helper Utilities
 * Shared functions for test reporting
 */

// Test counters - shared across all tests
export let totalTests = 0
export let passedTests = 0
export let failedTests = 0

export function testPass(name: string) {
    console.log(`  ✅ PASS ${name}`)
    passedTests++
    totalTests++
}

export function testFail(name: string, reason: string) {
    console.log(`  ❌ FAIL ${name}`)
    console.log(`       ${reason}`)
    failedTests++
    totalTests++
}

export function resetCounters() {
    totalTests = 0
    passedTests = 0
    failedTests = 0
}

export function printSummary(suiteName: string) {
    console.log('\n' + '='.repeat(40))
    console.log(`   ${suiteName} Summary`)
    console.log('='.repeat(40))
    console.log(`Total Tests: ${totalTests}`)
    console.log(`Passed: ${passedTests}`)
    console.log(`Failed: ${failedTests}`)
    console.log('='.repeat(40))
    
    if (failedTests === 0) {
        console.log('\n✅ All tests passed!')
    } else {
        console.log('\n❌ Some tests failed.')
    }
    
    return {
        total: totalTests,
        passed: passedTests,
        failed: failedTests
    }
}