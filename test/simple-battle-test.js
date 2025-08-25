#!/usr/bin/env node
/**
 * Simple test to verify Battle actually works
 */

import { Battle } from '../dist/index.js'

async function testBattle() {
    console.log('Testing Battle with a simple echo command...')
    
    try {
        // Test 1: Basic spawn and expect
        const battle = new Battle({
            command: 'echo',
            args: ['Hello Battle'],
            timeout: 5000
        })
        
        await battle.spawn()
        await battle.expect('Hello Battle')
        const screenshot = await battle.screenshot()
        
        console.log('✅ Test 1 passed: Basic spawn and expect')
        console.log('   Output captured:', screenshot.trim())
        
        battle.cleanup()
        
        // Test 2: Test with node -e
        const battle2 = new Battle({
            command: 'node',
            args: ['-e', 'console.log("PTY test")'],
            timeout: 5000
        })
        
        await battle2.spawn()
        await battle2.expect('PTY test')
        
        console.log('✅ Test 2 passed: Node.js PTY test')
        
        battle2.cleanup()
        
        // Test 3: Test keyboard input
        const battle3 = new Battle({
            command: 'cat',
            timeout: 5000
        })
        
        await battle3.spawn()
        await battle3.send('Hello from keyboard\n')
        await battle3.expect('Hello from keyboard')
        
        console.log('✅ Test 3 passed: Keyboard input test')
        
        battle3.cleanup()
        
        console.log('\n🎉 All tests passed! Battle is working correctly.')
        return true
        
    } catch (error) {
        console.error('❌ Test failed:', error.message)
        return false
    }
}

// Run the test
testBattle().then(success => {
    process.exit(success ? 0 : 1)
})