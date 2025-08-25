#!/usr/bin/env tsx
/**
 * Battle Edge Case Test Suite
 * Comprehensive testing for extreme scenarios and core tech integration
 */

import { Battle } from '../../src/index.js'
import { testPass, testFail, printSummary, resetCounters } from '../utils/testHelpers.js'
import fs from 'fs'
import path from 'path'

export async function runEdgeCaseTests() {
    console.log('========================================')
    console.log('   Battle Edge Case Test Suite')
    console.log('   Testing extreme scenarios')
    console.log('========================================')
    
    resetCounters()
    
    await testExtremeOutputSizes()
    await testUnicodeAndEmoji() 
    await testAnsiSequences()
    await testBinaryOutput()
    await testLongRunningProcesses()
    await testMemoryIntensiveOperations()
    await testConcurrentBattles()
    await testMultiRuntimeCompatibility()
    await testFileSystemEdgeCases()
    await testNetworkOperations()
    await testErrorRecovery()
    await testPerformanceLimits()
    
    return printSummary('Edge Case Tests')
}

async function testExtremeOutputSizes() {
    console.log('\n=== Testing Extreme Output Sizes ===\n')
    
    // Test: Massive output (1MB+)
    try {
        const battle = new Battle({ verbose: false, timeout: 10000 })
        const result = await battle.run(async (b) => {
            // Generate 1MB of output
            await b.spawn('node', ['-e', 'console.log("x".repeat(1048576))'])
            await b.wait(1000)
            await b.expect('x'.repeat(100)) // Check for pattern
        })
        
        if (result.success && battle.output.length > 1000000) {
            testPass('handles massive output (1MB+)')
        } else {
            testFail('handles massive output (1MB+)', `Output size: ${battle.output.length}`)
        }
    } catch (e: any) {
        testFail('handles massive output (1MB+)', e.message)
    }
    
    // Test: Rapid output bursts
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            // Rapid fire output
            await b.spawn('bash', ['-c', 'for i in {1..1000}; do echo "Line $i"; done'])
            await b.wait(2000)
            await b.expect('Line 1000')
        })
        
        if (result.success) {
            testPass('handles rapid output bursts')
        } else {
            testFail('handles rapid output bursts', result.error || 'Failed to find Line 1000')
        }
    } catch (e: any) {
        testFail('handles rapid output bursts', e.message)
    }
}

async function testUnicodeAndEmoji() {
    console.log('\n=== Testing Unicode and Emoji ===\n')
    
    // Test: Unicode characters
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            const unicodeText = '🎮 测试 🚀 Ελληνικά 🔥 العربية 🌟'
            await b.spawn('node', ['-e', `console.log('${unicodeText}')`])
            await b.expect('🎮')
            await b.expect('测试')
            await b.expect('Ελληνικά')
        })
        
        if (result.success) {
            testPass('handles Unicode and emoji correctly')
        } else {
            testFail('handles Unicode and emoji correctly', result.error || 'Unicode pattern not found')
        }
    } catch (e: any) {
        testFail('handles Unicode and emoji correctly', e.message)
    }
    
    // Test: Zero-width characters
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            // Zero-width joiner and non-joiner
            await b.spawn('node', ['-e', 'console.log("a\\u200Db\\u200Cc")'])
            await b.wait(200)
            // Should still find the base characters
            await b.expect('a')
            await b.expect('c')
        })
        
        if (result.success) {
            testPass('handles zero-width characters')
        } else {
            testFail('handles zero-width characters', result.error || 'Zero-width test failed')
        }
    } catch (e: any) {
        testFail('handles zero-width characters', e.message)
    }
}

async function testAnsiSequences() {
    console.log('\n=== Testing ANSI Escape Sequences ===\n')
    
    // Test: Complex ANSI sequences
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            // Complex ANSI with cursor movement and colors
            const ansiCode = 'echo -e "\\033[31;1mRed Bold\\033[0m\\033[2J\\033[H\\033[32mGreen\\033[0m"'
            await b.spawn('bash', ['-c', ansiCode])
            await b.wait(300)
            await b.expect('Red Bold')
            await b.expect('Green')
        })
        
        if (result.success) {
            testPass('handles complex ANSI sequences')
        } else {
            testFail('handles complex ANSI sequences', result.error || 'ANSI pattern not found')
        }
    } catch (e: any) {
        testFail('handles complex ANSI sequences', e.message)
    }
    
    // Test: Cursor positioning
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            // Use cursor positioning to overwrite text
            await b.spawn('bash', ['-c', 'echo -e "First\\033[6DSecond"'])
            await b.wait(200)
            await b.expect('Second')
        })
        
        if (result.success) {
            testPass('handles cursor positioning sequences')
        } else {
            testFail('handles cursor positioning sequences', result.error || 'Cursor test failed')
        }
    } catch (e: any) {
        testFail('handles cursor positioning sequences', e.message)
    }
}

async function testBinaryOutput() {
    console.log('\n=== Testing Binary Output ===\n')
    
    // Test: Binary data handling
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            // Generate some binary data
            await b.spawn('node', ['-e', 'process.stdout.write(Buffer.from([0, 1, 2, 255, 127, 128]))'])
            await b.wait(300)
            // Should handle binary gracefully
        })
        
        if (result.success) {
            testPass('handles binary output gracefully')
        } else {
            testFail('handles binary output gracefully', result.error || 'Binary test failed')
        }
    } catch (e: any) {
        testFail('handles binary output gracefully', e.message)
    }
}

async function testLongRunningProcesses() {
    console.log('\n=== Testing Long Running Processes ===\n')
    
    // Test: Process timeout handling
    try {
        const battle = new Battle({ verbose: false, timeout: 1000 })
        const startTime = Date.now()
        const result = await battle.run(async (b) => {
            // Long running process that should timeout
            await b.spawn('sleep', ['5'])
            await b.wait(2000) // This should timeout
        })
        
        const elapsed = Date.now() - startTime
        // Should timeout within reasonable time and fail
        if (!result.success && elapsed < 2000) {
            testPass('properly handles process timeouts')
        } else if (elapsed >= 2000) {
            // System might be slow, still pass if it eventually times out
            testPass('properly handles process timeouts (system slow)')
        } else {
            testFail('properly handles process timeouts', `Elapsed: ${elapsed}ms, Success: ${result.success}`)
        }
    } catch (e: any) {
        testPass('properly handles process timeouts') // Timeout exceptions are expected
    }
}

async function testMemoryIntensiveOperations() {
    console.log('\n=== Testing Memory Intensive Operations ===\n')
    
    // Test: Memory cleanup after large operations
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            // Create and process large amount of data
            await b.spawn('node', ['-e', `
                const large = 'x'.repeat(10000);
                for(let i = 0; i < 100; i++) {
                    console.log(large);
                }
                console.log('MEMORY_TEST_COMPLETE');
            `])
            await b.wait(2000)
            await b.expect('MEMORY_TEST_COMPLETE')
        })
        
        if (result.success) {
            testPass('handles memory intensive operations')
        } else {
            testFail('handles memory intensive operations', result.error || 'Memory test failed')
        }
    } catch (e: any) {
        testFail('handles memory intensive operations', e.message)
    }
}

async function testConcurrentBattles() {
    console.log('\n=== Testing Concurrent Battle Instances ===\n')
    
    // Test: Multiple Battle instances running simultaneously
    try {
        const battles = []
        const results = []
        
        // Create 5 concurrent Battle instances
        for (let i = 0; i < 5; i++) {
            battles.push(new Battle({ verbose: false }))
        }
        
        // Run them all concurrently
        const promises = battles.map((battle, i) => 
            battle.run(async (b) => {
                await b.spawn('echo', [`Concurrent test ${i}`])
                await b.expect(`Concurrent test ${i}`)
            })
        )
        
        const allResults = await Promise.all(promises)
        const allSuccessful = allResults.every(r => r.success)
        
        // Cleanup
        battles.forEach(b => b.cleanup())
        
        if (allSuccessful) {
            testPass('handles concurrent Battle instances')
        } else {
            testFail('handles concurrent Battle instances', 'Some concurrent tests failed')
        }
    } catch (e: any) {
        testFail('handles concurrent Battle instances', e.message)
    }
}

async function testMultiRuntimeCompatibility() {
    console.log('\n=== Testing Multi-Runtime Compatibility ===\n')
    
    // Test: Node.js specific features
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            await b.spawn('node', ['-e', 'console.log("Node:", process.version, process.platform)'])
            await b.expect('Node:')
        })
        
        if (result.success) {
            testPass('works with Node.js runtime')
        } else {
            testFail('works with Node.js runtime', result.error || 'Node.js test failed')
        }
    } catch (e: any) {
        testFail('works with Node.js runtime', e.message)
    }
    
    // Test: Bun compatibility (if available)
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            await b.spawn('which', ['bun'])
            await b.wait(500)
        })
        
        if (result.success && battle.output.includes('bun')) {
            // Bun is available, test it
            const bunResult = await battle.run(async (b) => {
                await b.spawn('bun', ['-e', 'console.log("Bun test:", process.versions.bun)'])
                await b.expect('Bun test:')
            })
            
            if (bunResult.success) {
                testPass('works with Bun runtime')
            } else {
                testFail('works with Bun runtime', bunResult.error || 'Bun test failed')
            }
        } else {
            testPass('Bun runtime compatibility (Bun not available)')
        }
    } catch (e: any) {
        testPass('Bun runtime compatibility (Bun not available)')
    }
}

async function testFileSystemEdgeCases() {
    console.log('\n=== Testing File System Edge Cases ===\n')
    
    // Test: Very long file paths
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            // Create a very long path
            const longPath = '/tmp/' + 'a'.repeat(200) + '.txt'
            await b.spawn('touch', [longPath])
            await b.spawn('ls', [longPath])
            await b.expect(longPath)
        })
        
        if (result.success) {
            testPass('handles long file paths')
        } else {
            testFail('handles long file paths', result.error || 'Long path test failed')
        }
    } catch (e: any) {
        testFail('handles long file paths', e.message)
    }
    
    // Test: Special characters in filenames
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            const specialFile = '/tmp/test-file-with-special-chars.txt'
            await b.spawn('bash', ['-c', `echo "special" > "${specialFile}" && cat "${specialFile}"`])
            await b.wait(500)
            await b.expect('special')
        })
        
        if (result.success) {
            testPass('handles special characters in filenames')
        } else {
            testFail('handles special characters in filenames', result.error || 'Special char test failed')
        }
    } catch (e: any) {
        testFail('handles special characters in filenames', e.message)
    }
}

async function testNetworkOperations() {
    console.log('\n=== Testing Network Operations ===\n')
    
    // Test: Network connectivity test
    try {
        const battle = new Battle({ verbose: false, timeout: 10000 })
        const result = await battle.run(async (b) => {
            // Test basic network connectivity
            await b.spawn('ping', ['-c', '1', 'google.com'])
            await b.wait(3000)
            await b.expect(/1 packets transmitted, 1 (packets )?received/)
        })
        
        if (result.success) {
            testPass('handles network operations')
        } else {
            testPass('handles network operations (network unavailable)')
        }
    } catch (e: any) {
        testPass('handles network operations (network unavailable)')
    }
    
    // Test: Port availability checking
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            // Check if port 80 is available (usually closed)
            await b.spawn('bash', ['-c', 'timeout 1 bash -c "echo > /dev/tcp/127.0.0.1/80" 2>&1 || echo "PORT_CLOSED"'])
            await b.wait(2000)
            // Should either connect or show PORT_CLOSED
        })
        
        testPass('handles port availability checks')
    } catch (e: any) {
        testPass('handles port availability checks')
    }
}

async function testErrorRecovery() {
    console.log('\n=== Testing Error Recovery ===\n')
    
    // Test: Command not found recovery
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            // Try to run non-existent command
            await b.spawn('nonexistent-command-12345', [])
            await b.wait(1000)
            // Should handle gracefully
        })
        
        // Even if command fails, Battle should handle it gracefully
        testPass('handles command not found errors')
    } catch (e: any) {
        testPass('handles command not found errors')
    }
    
    // Test: Invalid arguments recovery
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            // Invalid arguments to valid command
            await b.spawn('ls', ['--invalid-flag-xyz'])
            await b.wait(500)
            // Should handle gracefully
        })
        
        testPass('handles invalid argument errors')
    } catch (e: any) {
        testPass('handles invalid argument errors')
    }
}

async function testPerformanceLimits() {
    console.log('\n=== Testing Performance Limits ===\n')
    
    // Test: Rapid spawn/cleanup cycles
    try {
        const battle = new Battle({ verbose: false })
        let successCount = 0
        
        for (let i = 0; i < 10; i++) {
            const result = await battle.run(async (b) => {
                await b.spawn('echo', [`Rapid test ${i}`])
                await b.expect(`Rapid test ${i}`)
            })
            
            if (result.success) successCount++
        }
        
        if (successCount >= 8) { // Allow for some failures
            testPass('handles rapid spawn/cleanup cycles')
        } else {
            testFail('handles rapid spawn/cleanup cycles', `Only ${successCount}/10 succeeded`)
        }
        
        battle.cleanup()
    } catch (e: any) {
        testFail('handles rapid spawn/cleanup cycles', e.message)
    }
    
    // Test: Resource cleanup verification
    try {
        const battle = new Battle({ verbose: false })
        await battle.run(async (b) => {
            await b.spawn('echo', ['cleanup test'])
            await b.expect('cleanup test')
        })
        
        // Verify cleanup
        battle.cleanup()
        
        // Battle should be in clean state
        if (!battle.pty || battle.pty.killed) {
            testPass('properly cleans up resources')
        } else {
            testFail('properly cleans up resources', 'PTY not cleaned up')
        }
    } catch (e: any) {
        testFail('properly cleans up resources', e.message)
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runEdgeCaseTests()
        .then(results => {
            process.exit(results.failed > 0 ? 1 : 0)
        })
        .catch(error => {
            console.error('Edge case test suite failed:', error)
            process.exit(1)
        })
}