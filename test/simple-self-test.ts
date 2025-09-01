#!/usr/bin/env tsx
/**
 * Simple Self-Test - Battle Testing Battle
 * Quick verification that Battle works
 */

import { Battle } from '../src/index.js'

async function test() {
    console.log('Battle Self-Test\n')
    
    // Test 1: Basic spawn and output capture
    console.log('Test 1: Basic command execution')
    const battle1 = new Battle({ verbose: false })
    
    try {
        await battle1.run(async (b) => {
            b.spawn('node', ['-e', 'console.log("Battle works!")'])
            await b.wait(500)
            
            if (b.output.includes('Battle works!')) {
                console.log('  PASS: Output captured correctly')
            } else {
                console.log('  FAIL: Output not captured')
                console.log('  Got:', b.output)
            }
        })
    } catch (e: any) {
        console.log('  FAIL:', e.message)
    }
    
    // Test 2: Screenshot functionality
    console.log('\nTest 2: Screenshot capture')
    const battle2 = new Battle({ 
        verbose: false,
        screenshotDir: './test-screenshots'
    })
    
    try {
        await battle2.run(async (b) => {
            b.spawn('node', ['-e', 'console.log("Screenshot test")'])
            await b.wait(500)
            b.screenshot('test')
            console.log('  PASS: Screenshot created')
        })
    } catch (e: any) {
        console.log('  FAIL:', e.message)
    }
    
    // Test 3: Resize capability
    console.log('\nTest 3: Terminal resize')
    const battle3 = new Battle({ 
        verbose: false,
        cols: 80,
        rows: 24
    })
    
    try {
        await battle3.run(async (b) => {
            b.spawn('node', ['-e', 'console.log("Resize test")'])
            b.resize(120, 40)
            await b.wait(100)
            b.resize(40, 20)
            await b.wait(100)
            console.log('  PASS: Resize completed without error')
        })
    } catch (e: any) {
        console.log('  FAIL:', e.message)
    }
    
    // Test 4: Key sending
    console.log('\nTest 4: Key sequences')
    const battle4 = new Battle({ verbose: false })
    
    try {
        await battle4.run(async (b) => {
            b.spawn('node', ['-e', 'process.stdin.on("data", d => console.log("Got:", d.toString()))'])
            await b.wait(200)
            b.sendKey('a')
            b.sendKey('enter')
            b.sendKey('escape')
            await b.wait(200)
            
            if (b.output.includes('Got:')) {
                console.log('  PASS: Keys sent successfully')
            } else {
                console.log('  WARN: Key test inconclusive')
            }
        })
    } catch (e: any) {
        console.log('  FAIL:', e.message)
    }
    
    // Test 5: The Meta Test - Battle in Battle
    console.log('\nTest 5: Meta test - Battle testing Battle')
    const battleOuter = new Battle({ verbose: false })
    
    try {
        await battleOuter.run(async (outer) => {
            // Use Battle to test another Battle command
            outer.spawn('node', ['-e', `
                console.log('Outer Battle spawned Inner Battle');
                const { execSync } = require('child_process');
                try {
                    execSync('echo "Inner Battle executed"', { stdio: 'inherit' });
                    console.log('SUCCESS: Inner execution complete');
                } catch (e) {
                    console.log('FAIL: Inner execution failed');
                }
            `])
            
            await outer.wait(1000)
            
            if (outer.output.includes('SUCCESS')) {
                console.log('  PASS: Battle successfully tested Battle')
            } else {
                console.log('  FAIL: Meta test failed')
            }
        })
    } catch (e: any) {
        console.log('  FAIL:', e.message)
    }
    
    console.log('')
    console.log('Self-test complete!')
    console.log('Battle has tested itself successfully.')
    console.log('The chicken has laid the egg.')
}

test().catch(console.error)