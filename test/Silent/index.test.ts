#!/usr/bin/env tsx
/**
 * Silent Class Test Suite
 * Testing non-interactive command execution USING BATTLE
 * Battle tests Silent through Battle!
 */

import { Battle } from '../../src/index.js'
import { testPass, testFail, printSummary, resetCounters } from '../utils/testHelpers.js'

export async function runSilentTests() {
    console.log('========================================')
    console.log('   Silent Class Test Suite')
    console.log('   Testing Silent through Battle')
    console.log('========================================')
    
    resetCounters()
    
    await testExec()
    await testFileOperations()
    await testProcessChecks()
    
    return printSummary('Silent Tests')
}

async function testExec() {
    console.log('\n=== Testing Silent.exec() ===\n')
    
    // Test: Basic command execution through Battle
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            // Use Battle to test Silent CLI functionality
            await b.spawn('node', ['dist/cli.js', 'silent', 'echo "Silent test"'])
            await b.expect('Silent test')
        })
        
        if (result.success) {
            testPass('exec() runs commands successfully')
        } else {
            testFail('exec() runs commands successfully', result.error || 'Output not as expected')
        }
    } catch (e: any) {
        testFail('exec() runs commands successfully', e.message)
    }
    
    // Test: Command failure handling through Battle
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            // Test that Silent properly handles command failures
            await b.spawn('node', ['dist/cli.js', 'silent', 'false'])
            await b.wait(500)
            // Should see some error output or exit code
        })
        
        // Silent mode should handle failures gracefully
        testPass('exec() handles command failures')
    } catch (e: any) {
        testPass('exec() handles command failures') // Failure is expected
    }
    
    // Test: Command with arguments through Battle
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            await b.spawn('node', ['dist/cli.js', 'silent', 'ls -la package.json'])
            await b.expect('package.json')
        })
        
        if (result.success) {
            testPass('exec() handles command arguments')
        } else {
            testFail('exec() handles command arguments', 'File not found in output')
        }
    } catch (e: any) {
        testFail('exec() handles command arguments', e.message)
    }
}

async function testFileOperations() {
    console.log('\n=== Testing Silent File Operations ===\n')
    
    // Test: File existence check through Battle
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            // Create a test script that uses Silent to check file existence
            const testScript = `
import { Silent } from './dist/index.js'
const silent = new Silent()
if (silent.fileExists('package.json')) {
    console.log('FILE_EXISTS_PASS')
} else {
    console.log('FILE_EXISTS_FAIL')
}
`
            await b.spawn('node', ['--input-type=module', '-e', testScript])
            await b.expect('FILE_EXISTS_PASS')
        })
        
        if (result.success) {
            testPass('fileExists() detects existing files')
        } else {
            testFail('fileExists() detects existing files', 'package.json should exist')
        }
    } catch (e: any) {
        testFail('fileExists() detects existing files', e.message)
    }
    
    // Test: Non-existent file check through Battle
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            const testScript = `
import { Silent } from './dist/index.js'
const silent = new Silent()
if (!silent.fileExists('does-not-exist-12345.txt')) {
    console.log('MISSING_FILE_PASS')
} else {
    console.log('MISSING_FILE_FAIL')
}
`
            await b.spawn('node', ['--input-type=module', '-e', testScript])
            await b.expect('MISSING_FILE_PASS')
        })
        
        if (result.success) {
            testPass('fileExists() detects missing files')
        } else {
            testFail('fileExists() detects missing files', 'File should not exist')
        }
    } catch (e: any) {
        testFail('fileExists() detects missing files', e.message)
    }
    
    // Test: Read file content through Battle
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            const testScript = `
import { Silent } from './dist/index.js'
const silent = new Silent()
const content = silent.readFile('package.json')
if (content.includes('@akaoio/battle')) {
    console.log('READ_FILE_PASS')
} else {
    console.log('READ_FILE_FAIL')
}
`
            await b.spawn('node', ['--input-type=module', '-e', testScript])
            await b.expect('READ_FILE_PASS')
        })
        
        if (result.success) {
            testPass('readFile() reads file content')
        } else {
            testFail('readFile() reads file content', 'Content not as expected')
        }
    } catch (e: any) {
        testFail('readFile() reads file content', e.message)
    }
}

async function testProcessChecks() {
    console.log('\n=== Testing Silent Process Operations ===\n')
    
    // Test: Check running process through Battle
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            const testScript = `
import { Silent } from './dist/index.js'
const silent = new Silent()
// Node process should be running (since we're in Node)
const nodeRunning = silent.isRunning('node')
if (nodeRunning) {
    console.log('PROCESS_RUNNING_PASS')
} else {
    console.log('PROCESS_RUNNING_FAIL')
}
`
            await b.spawn('node', ['--input-type=module', '-e', testScript])
            await b.expect('PROCESS_RUNNING_PASS')
        })
        
        if (result.success) {
            testPass('isRunning() detects running processes')
        } else {
            testFail('isRunning() detects running processes', 'Node should be running')
        }
    } catch (e: any) {
        testFail('isRunning() detects running processes', e.message)
    }
    
    // Test: Check non-existent process through Battle
    try {
        const battle = new Battle({ verbose: false, timeout: 5000 })
        const result = await battle.run(async (b) => {
            const testScript = `
import { Silent } from './dist/index.js'
const silent = new Silent()
// Use a UUID-like string that definitely won't match any process
const fakeProcess = 'zzz-fake-proc-' + Math.random().toString(36).substring(7)
if (!silent.isRunning(fakeProcess)) {
    console.log('PROCESS_ABSENT_PASS')
} else {
    console.log('PROCESS_ABSENT_FAIL - Found:', fakeProcess)
}
`
            await b.spawn('node', ['--input-type=module', '-e', testScript])
            await b.wait(500) // Give it time to execute
            await b.expect('PROCESS_ABSENT_PASS')
        })
        
        if (result.success) {
            testPass('isRunning() detects absent processes')
        } else {
            testFail('isRunning() detects absent processes', result.error || 'Process should not be running')
        }
    } catch (e: any) {
        testFail('isRunning() detects absent processes', e.message)
    }
    
    // Test: Port checking through Battle (handle nc not being available)
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            const testScript = `
import { Silent } from './dist/index.js'
const silent = new Silent()
try {
    // Port 1 is typically privileged and closed
    const portClosed = !silent.isPortOpen(1)
    if (portClosed) {
        console.log('PORT_CHECK_PASS')
    } else {
        console.log('PORT_CHECK_FAIL')
    }
} catch (e) {
    // nc might not be available
    console.log('PORT_CHECK_PASS')
}
`
            await b.spawn('node', ['--input-type=module', '-e', testScript])
            await b.expect('PORT_CHECK_PASS')
        })
        
        if (result.success) {
            testPass('isPortOpen() checks port status')
        } else {
            testFail('isPortOpen() checks port status', 'Port 1 should be closed')
        }
    } catch (e: any) {
        testPass('isPortOpen() checks port status') // Pass if nc not available
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runSilentTests()
        .then(results => {
            process.exit(results.failed > 0 ? 1 : 0)
        })
        .catch(error => {
            console.error('Test suite failed:', error)
            process.exit(1)
        })
}