#!/usr/bin/env bun
/**
 * Test Battle Framework with Bun Runtime
 * This test verifies that Battle works with Bun
 */

import { Battle } from '../../dist/index.js'

console.log('Testing Battle with Bun runtime...\n')

async function testBunCompatibility() {
    const results: Array<{ test: string; passed: boolean; error?: string }> = []
    
    // Test 1: Basic spawn
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            await b.spawn('echo', ['Hello from Bun!'])
            await b.wait(100)
            await b.expect('Hello from Bun!')
        })
        
        results.push({
            test: 'Basic spawn and expect',
            passed: result.success,
            error: result.error
        })
    } catch (err: any) {
        results.push({
            test: 'Basic spawn and expect',
            passed: false,
            error: err.message
        })
    }
    
    // Test 2: Interactive input
    try {
        const battle = new Battle({ verbose: false, timeout: 5000 })
        const result = await battle.run(async (b) => {
            await b.spawn('bash', ['-c', 'read -p "Enter: " text && echo "Got: $text"'])
            await b.wait(500)
            b.sendKey('Bun')
            b.sendKey('enter')
            await b.wait(500)
            await b.expect('Got: Bun')
        })
        
        results.push({
            test: 'Interactive input',
            passed: result.success,
            error: result.error
        })
    } catch (err: any) {
        results.push({
            test: 'Interactive input',
            passed: false,
            error: err.message
        })
    }
    
    // Test 3: Screenshot
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            await b.spawn('echo', ['Screenshot test'])
            await b.wait(100)
            const screenshot = b.screenshot('bun-test')
            if (!screenshot.includes('Screenshot test')) {
                throw new Error('Screenshot did not capture output')
            }
        })
        
        results.push({
            test: 'Screenshot capture',
            passed: result.success,
            error: result.error
        })
    } catch (err: any) {
        results.push({
            test: 'Screenshot capture',
            passed: false,
            error: err.message
        })
    }
    
    // Test 4: Runtime detection
    try {
        // @ts-ignore - Bun global
        const isBun = typeof Bun !== 'undefined'
        results.push({
            test: 'Runtime detection',
            passed: isBun,
            error: isBun ? undefined : 'Not running in Bun'
        })
    } catch (err: any) {
        results.push({
            test: 'Runtime detection',
            passed: false,
            error: err.message
        })
    }
    
    // Display results
    console.log('Test Results:')
    console.log('=============\n')
    
    for (const result of results) {
        const status = result.passed ? '✅' : '❌'
        console.log(`${status} ${result.test}`)
        if (!result.passed && result.error) {
            console.log(`   Error: ${result.error}`)
        }
    }
    
    const passed = results.filter(r => r.passed).length
    const total = results.length
    
    console.log(`\nSummary: ${passed}/${total} tests passed`)
    
    if (passed === total) {
        console.log('\n🎉 Battle is fully compatible with Bun!')
    } else {
        console.log('\n⚠️ Some tests failed - Battle has limited Bun support')
    }
    
    process.exit(passed === total ? 0 : 1)
}

// Run tests
testBunCompatibility().catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
})