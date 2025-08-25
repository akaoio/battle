#!/usr/bin/env node
/**
 * Battle Self-Test - Battle tests itself
 * This is the REAL self-testing implementation
 */

import { Battle } from '../dist/index.js'

console.log('🎮 BATTLE SELF-TEST')
console.log('==================\n')

let passed = 0
let failed = 0

// Test 1: Direct command execution (no shell)
console.log('Test 1: Direct command execution...')
try {
    const battle = new Battle({
        command: process.execPath, // Use node directly
        args: ['-e', 'console.log("BATTLE_WORKS")'],
        timeout: 5000
    })
    
    await battle.spawn()
    await battle.wait(500)
    
    if (battle.output.includes('BATTLE_WORKS')) {
        console.log('✅ Test 1 passed')
        passed++
    } else {
        console.log('❌ Test 1 failed - output:', battle.output)
        failed++
    }
    
    battle.cleanup()
} catch (e) {
    console.log('❌ Test 1 error:', e.message)
    failed++
}

// Test 2: Pattern matching with expect
console.log('\nTest 2: Pattern matching...')
try {
    const battle = new Battle({
        command: process.execPath,
        args: ['-e', 'console.log("Pattern123")'],
        timeout: 5000
    })
    
    await battle.spawn()
    await battle.expect('Pattern123')
    
    console.log('✅ Test 2 passed')
    passed++
    
    battle.cleanup()
} catch (e) {
    console.log('❌ Test 2 failed:', e.message)
    failed++
}

// Test 3: Interactive input with write
console.log('\nTest 3: Interactive input...')
try {
    const battle = new Battle({
        command: process.execPath,
        args: ['-e', 'process.stdin.on("data", d => console.log("Got:", d.toString().trim())); setTimeout(() => process.exit(0), 1000)'],
        timeout: 5000
    })
    
    await battle.spawn()
    await battle.wait(200)
    await battle.write('Hello\n')
    await battle.wait(200)
    
    if (battle.output.includes('Got: Hello')) {
        console.log('✅ Test 3 passed')
        passed++
    } else {
        console.log('❌ Test 3 failed - output:', battle.output)
        failed++
    }
    
    battle.cleanup()
} catch (e) {
    console.log('❌ Test 3 error:', e.message)
    failed++
}

// Test 4: Battle tests Battle (TRUE RECURSION!)
console.log('\nTest 4: Battle tests Battle...')
try {
    const innerTest = `
import { Battle } from '${process.cwd()}/dist/index.js'

const b = new Battle({
    command: '${process.execPath}',
    args: ['-e', 'console.log("NESTED_SUCCESS")'],
    timeout: 3000
})

await b.spawn()
await b.expect('NESTED_SUCCESS')
console.log('INNER_BATTLE_PASSED')
b.cleanup()
`
    
    const battle = new Battle({
        command: process.execPath,
        args: ['--input-type=module', '-e', innerTest],
        timeout: 10000
    })
    
    await battle.spawn()
    await battle.expect('INNER_BATTLE_PASSED')
    
    console.log('✅ Test 4 passed - Battle successfully tested itself!')
    passed++
    
    battle.cleanup()
} catch (e) {
    console.log('❌ Test 4 failed:', e.message)
    failed++
}

// Summary
console.log('\n==================')
console.log(`Results: ${passed} passed, ${failed} failed`)

if (failed === 0) {
    console.log('\n🎉 BATTLE IS SELF-TESTING!')
    console.log('Battle → Battle chain verified!\n')
    process.exit(0)
} else {
    console.log('\n❌ Some tests failed\n')
    process.exit(1)
}