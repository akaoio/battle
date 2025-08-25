#!/usr/bin/env tsx
/**
 * Battle tests Battle - TRUE self-testing
 * This replaces the fake tsx tests with real Battle tests
 */

import { Battle } from '../dist/index.js'
import chalk from 'chalk'

async function battleSelfTest() {
    console.log(chalk.cyan('════════════════════════════════════════'))
    console.log(chalk.cyan('   BATTLE SELF-TEST WITH BATTLE        '))
    console.log(chalk.cyan('════════════════════════════════════════'))
    console.log()
    
    let passed = 0
    let failed = 0
    
    // Test 1: Battle can spawn and capture output
    console.log(chalk.yellow('Test 1: Battle spawns process...'))
    try {
        const battle = new Battle({
            command: '/bin/sh',
            args: ['-c', 'echo "Battle Self Test"'],
            timeout: 5000
        })
        
        await battle.spawn()
        await new Promise(resolve => setTimeout(resolve, 500))
        
        if (battle.output.includes('Battle Self Test')) {
            console.log(chalk.green('✅ Test 1 passed: Output captured'))
            passed++
        } else {
            console.log(chalk.red('❌ Test 1 failed: No output'))
            console.log('Output was:', battle.output)
            failed++
        }
        
        battle.cleanup()
    } catch (e: any) {
        console.log(chalk.red('❌ Test 1 failed:'), e.message)
        failed++
    }
    
    // Test 2: Battle can send input
    console.log(chalk.yellow('\nTest 2: Battle sends keyboard input...'))
    try {
        const battle = new Battle({
            command: 'cat',
            timeout: 5000
        })
        
        await battle.spawn()
        await battle.send('Test Input\n')
        await new Promise(resolve => setTimeout(resolve, 200))
        await battle.send('\x04') // Ctrl+D to end cat
        
        if (battle.output.includes('Test Input')) {
            console.log(chalk.green('✅ Test 2 passed: Input sent and echoed'))
            passed++
        } else {
            console.log(chalk.red('❌ Test 2 failed: Input not echoed'))
            failed++
        }
        
        battle.cleanup()
    } catch (e: any) {
        console.log(chalk.red('❌ Test 2 failed:'), e.message)
        failed++
    }
    
    // Test 3: Battle records replay files
    console.log(chalk.yellow('\nTest 3: Battle creates replay files...'))
    try {
        const battle = new Battle({
            command: 'date',
            timeout: 5000
        })
        
        await battle.spawn()
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // Check if replay was created
        const fs = await import('fs')
        const replayFiles = fs.readdirSync('./logs').filter(f => f.startsWith('replay-'))
        
        if (replayFiles.length > 0) {
            console.log(chalk.green('✅ Test 3 passed: Replay files created'))
            passed++
        } else {
            console.log(chalk.red('❌ Test 3 failed: No replay files'))
            failed++
        }
        
        battle.cleanup()
    } catch (e: any) {
        console.log(chalk.red('❌ Test 3 failed:'), e.message)
        failed++
    }
    
    // Test 4: Battle tests Battle (recursion!)
    console.log(chalk.yellow('\nTest 4: Battle tests Battle testing echo...'))
    try {
        const testCode = `
import { Battle } from '${process.cwd()}/dist/index.js'
async function test() {
    const b = new Battle({ 
        command: '/bin/sh', 
        args: ['-c', 'echo SUCCESS'],
        timeout: 3000
    })
    await b.spawn()
    await new Promise(r => setTimeout(r, 200))
    if (b.output.includes('SUCCESS')) {
        console.log('INNER_TEST_PASSED')
    }
    b.cleanup()
}
test().catch(e => console.error('INNER_ERROR:', e.message))
        `
        
        const battle = new Battle({
            command: 'node',
            args: ['--input-type=module', '-e', testCode],
            timeout: 10000
        })
        
        await battle.spawn()
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        if (battle.output.includes('INNER_TEST_PASSED')) {
            console.log(chalk.green('✅ Test 4 passed: Battle tested Battle!'))
            passed++
        } else {
            console.log(chalk.red('❌ Test 4 failed: Recursive test failed'))
            console.log('Output:', battle.output)
            failed++
        }
        
        battle.cleanup()
    } catch (e: any) {
        console.log(chalk.red('❌ Test 4 failed:'), e.message)
        failed++
    }
    
    // Summary
    console.log()
    console.log(chalk.cyan('════════════════════════════════════════'))
    console.log(chalk.cyan('   TEST RESULTS                         '))
    console.log(chalk.cyan('════════════════════════════════════════'))
    console.log(chalk.green(`   Passed: ${passed}`))
    console.log(chalk.red(`   Failed: ${failed}`))
    console.log(chalk.cyan('════════════════════════════════════════'))
    
    if (failed === 0) {
        console.log(chalk.green('\n🎉 Battle successfully tested itself!'))
        console.log(chalk.green('Battle is now truly self-testing!\n'))
    } else {
        console.log(chalk.red('\n❌ Some tests failed'))
    }
    
    process.exit(failed === 0 ? 0 : 1)
}

battleSelfTest().catch(console.error)