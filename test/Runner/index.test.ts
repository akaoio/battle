#!/usr/bin/env tsx
/**
 * Runner Class Test Suite
 * Testing test suite execution functionality
 */

import { Runner } from '../../src/index.js'
import { testPass, testFail, printSummary, resetCounters } from '../utils/testHelpers.js'

export async function runRunnerTests() {
    console.log('========================================')
    console.log('   Runner Class Test Suite')
    console.log('   Testing test suite execution')
    console.log('========================================')
    
    resetCounters()
    
    await testAddTest()
    await testAddSuite()
    await testRunExecution()
    
    return printSummary('Runner Tests')
}

async function testAddTest() {
    console.log('\n=== Testing Runner.test() ===\n')
    
    // Test: Add single test
    try {
        const runner = new Runner()
        
        runner.test('Echo test', {
            command: 'echo',
            args: ['Runner test'],
            expectations: ['Runner test']
        })
        
        const result = await runner.run()
        
        if (result.passed === 1 && result.failed === 0) {
            testPass('test() adds and executes single tests')
        } else {
            testFail('test() adds and executes single tests', 'Test did not pass')
        }
    } catch (e: any) {
        testFail('test() adds and executes single tests', e.message)
    }
    
    // Test: Multiple tests
    try {
        const runner = new Runner()
        
        runner.test('Test 1', {
            command: 'echo',
            args: ['First'],
            expectations: ['First']
        })
        
        runner.test('Test 2', {
            command: 'echo',
            args: ['Second'],
            expectations: ['Second']
        })
        
        const result = await runner.run()
        
        if (result.total === 2 && result.passed === 2) {
            testPass('test() handles multiple tests')
        } else {
            testFail('test() handles multiple tests', `Expected 2 passed, got ${result.passed}`)
        }
    } catch (e: any) {
        testFail('test() handles multiple tests', e.message)
    }
}

async function testAddSuite() {
    console.log('\n=== Testing Runner.suite() ===\n')
    
    // Test: Add test suite
    try {
        const runner = new Runner()
        
        runner.suite('Echo Suite', [
            {
                name: 'Echo 1',
                command: 'echo',
                args: ['Suite test 1'],
                expectations: ['Suite test 1']
            },
            {
                name: 'Echo 2',
                command: 'echo',
                args: ['Suite test 2'],
                expectations: ['Suite test 2']
            }
        ])
        
        const result = await runner.run()
        
        if (result.total === 2 && result.passed === 2) {
            testPass('suite() adds test suites')
        } else {
            testFail('suite() adds test suites', 'Not all suite tests passed')
        }
    } catch (e: any) {
        testFail('suite() adds test suites', e.message)
    }
    
    // Test: Multiple suites
    try {
        const runner = new Runner()
        
        runner.suite('Suite A', [
            {
                name: 'A-1',
                command: 'echo',
                args: ['A1'],
                expectations: ['A1']
            }
        ])
        
        runner.suite('Suite B', [
            {
                name: 'B-1',
                command: 'echo',
                args: ['B1'],
                expectations: ['B1']
            }
        ])
        
        const result = await runner.run()
        
        if (result.total === 2 && result.passed === 2) {
            testPass('suite() handles multiple suites')
        } else {
            testFail('suite() handles multiple suites', 'Not all tests passed')
        }
    } catch (e: any) {
        testFail('suite() handles multiple suites', e.message)
    }
}

async function testRunExecution() {
    console.log('\n=== Testing Runner.run() ===\n')
    
    // Test: Handle test failures
    try {
        const runner = new Runner()
        
        runner.test('Pass test', {
            command: 'echo',
            args: ['pass'],
            expectations: ['pass']
        })
        
        runner.test('Fail test', {
            command: 'echo',
            args: ['fail'],
            expectations: ['will not match']
        })
        
        const result = await runner.run()
        
        if (result.total === 2 && result.passed === 1 && result.failed === 1) {
            testPass('run() tracks pass/fail correctly')
        } else {
            testFail('run() tracks pass/fail correctly', `Got ${result.passed} passed, ${result.failed} failed`)
        }
    } catch (e: any) {
        testFail('run() tracks pass/fail correctly', e.message)
    }
    
    // Test: Timeout handling
    try {
        const runner = new Runner()
        
        runner.test('Timeout test', {
            command: 'sleep',
            args: ['10'],
            expectations: ['will timeout'],
            timeout: 100
        })
        
        const result = await runner.run()
        
        if (result.failed === 1) {
            testPass('run() handles timeouts')
        } else {
            testFail('run() handles timeouts', 'Test should have timed out')
        }
    } catch (e: any) {
        testPass('run() handles timeouts')
    }
    
    // Test: Regex expectations
    try {
        const runner = new Runner()
        
        runner.test('Regex test', {
            command: 'echo',
            args: ['Version 1.2.3'],
            expectations: [/Version \d+\.\d+\.\d+/]
        })
        
        const result = await runner.run()
        
        if (result.passed === 1) {
            testPass('run() supports regex patterns')
        } else {
            testFail('run() supports regex patterns', 'Regex match failed')
        }
    } catch (e: any) {
        testFail('run() supports regex patterns', e.message)
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runRunnerTests()
        .then(results => {
            process.exit(results.failed > 0 ? 1 : 0)
        })
        .catch(error => {
            console.error('Test suite failed:', error)
            process.exit(1)
        })
}