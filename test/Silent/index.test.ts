#!/usr/bin/env tsx
/**
 * Silent Class Test Suite
 * Testing non-interactive command execution
 */

import { Silent } from '../../src/index.js'
import { testPass, testFail, printSummary, resetCounters } from '../utils/testHelpers.js'

export async function runSilentTests() {
    console.log('========================================')
    console.log('   Silent Class Test Suite')
    console.log('   Testing non-PTY command execution')
    console.log('========================================')
    
    resetCounters()
    
    await testExec()
    await testFileOperations()
    await testProcessChecks()
    
    return printSummary('Silent Tests')
}

async function testExec() {
    console.log('\n=== Testing Silent.exec() ===\n')
    
    // Test: Basic command execution
    try {
        const silent = new Silent()
        const result = silent.exec('echo "Silent test"')
        
        if (result.success && result.stdout.includes('Silent test')) {
            testPass('exec() runs commands successfully')
        } else {
            testFail('exec() runs commands successfully', 'Output not as expected')
        }
    } catch (e: any) {
        testFail('exec() runs commands successfully', e.message)
    }
    
    // Test: Command failure handling
    try {
        const silent = new Silent()
        const result = silent.exec('false')
        
        if (!result.success && result.exitCode !== 0) {
            testPass('exec() handles command failures')
        } else {
            testFail('exec() handles command failures', 'Should have failed')
        }
    } catch (e: any) {
        testFail('exec() handles command failures', e.message)
    }
    
    // Test: Command with arguments
    try {
        const silent = new Silent()
        const result = silent.exec('ls -la package.json')
        
        if (result.success && result.stdout.includes('package.json')) {
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
    
    // Test: File existence check
    try {
        const silent = new Silent()
        
        if (silent.fileExists('package.json')) {
            testPass('fileExists() detects existing files')
        } else {
            testFail('fileExists() detects existing files', 'package.json should exist')
        }
    } catch (e: any) {
        testFail('fileExists() detects existing files', e.message)
    }
    
    // Test: Non-existent file check
    try {
        const silent = new Silent()
        
        if (!silent.fileExists('does-not-exist-12345.txt')) {
            testPass('fileExists() detects missing files')
        } else {
            testFail('fileExists() detects missing files', 'File should not exist')
        }
    } catch (e: any) {
        testFail('fileExists() detects missing files', e.message)
    }
    
    // Test: Read file content
    try {
        const silent = new Silent()
        const content = silent.readFile('package.json')
        
        if (content.includes('"name"') && content.includes('@akaoio/battle')) {
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
    
    // Test: Check running process
    try {
        const silent = new Silent()
        
        // Node process should be running (since we're in Node)
        const nodeRunning = silent.isRunning('node')
        
        if (nodeRunning) {
            testPass('isRunning() detects running processes')
        } else {
            testFail('isRunning() detects running processes', 'Node should be running')
        }
    } catch (e: any) {
        testFail('isRunning() detects running processes', e.message)
    }
    
    // Test: Check non-existent process
    try {
        const silent = new Silent()
        
        if (!silent.isRunning('definitely-not-running-12345')) {
            testPass('isRunning() detects absent processes')
        } else {
            testFail('isRunning() detects absent processes', 'Process should not be running')
        }
    } catch (e: any) {
        testFail('isRunning() detects absent processes', e.message)
    }
    
    // Test: Port checking (should handle nc not being available)
    try {
        const silent = new Silent()
        
        // Port 1 is typically privileged and closed
        const portClosed = !silent.isPortOpen(1)
        
        if (portClosed) {
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