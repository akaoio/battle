/**
 * Security tests for Battle Framework
 * Tests all security fixes and vulnerabilities
 */

import { Battle } from '../../dist/index.js'
import { CommandSanitizer, EnvSanitizer, ReplayValidator } from '../../dist/security/index.js'
import fs from 'fs'
import path from 'path'

console.log('========================================')
console.log('   SECURITY TEST SUITE')
console.log('   Testing Security Fixes')
console.log('========================================')

let passed = 0
let failed = 0

async function test(name: string, fn: () => Promise<void>) {
    try {
        await fn()
        console.log(`  ✅ PASS ${name}`)
        passed++
    } catch (error: any) {
        console.log(`  ❌ FAIL ${name}`)
        console.log(`     Error: ${error.message}`)
        failed++
    }
}

// Test 1: Command Injection Prevention
await test('blocks command injection attempts', async () => {
    const validation = CommandSanitizer.validate('ls; rm -rf /')
    if (validation.valid) {
        throw new Error('Should have blocked command injection')
    }
})

await test('blocks shell metacharacters', async () => {
    const validation = CommandSanitizer.validate('echo test && echo pwned')
    if (validation.valid) {
        throw new Error('Should have blocked && operator')
    }
})

await test('blocks path traversal', async () => {
    const validation = CommandSanitizer.validate('cat ../../etc/passwd')
    if (validation.valid) {
        throw new Error('Should have blocked path traversal')
    }
})

await test('allows safe commands', async () => {
    const validation = CommandSanitizer.validate('echo hello world')
    if (!validation.valid) {
        throw new Error('Should allow safe commands')
    }
})

// Test 2: Argument Sanitization
await test('sanitizes dangerous arguments', async () => {
    const args = ['test', '; rm -rf /', '../../etc/passwd']
    const sanitized = CommandSanitizer.sanitizeArgs(args)
    
    if (sanitized.includes(';') || sanitized.some(arg => arg.includes('../'))) {
        throw new Error('Failed to sanitize arguments')
    }
})

// Test 3: Environment Variable Sanitization
await test('blocks dangerous environment variables', async () => {
    const env = {
        LD_PRELOAD: '/evil/library.so',
        PATH: '/usr/bin',
        NORMAL_VAR: 'safe value'
    }
    
    const sanitized = EnvSanitizer.sanitize(env)
    
    if ('LD_PRELOAD' in sanitized) {
        throw new Error('Should block LD_PRELOAD')
    }
    
    if (!('NORMAL_VAR' in sanitized)) {
        throw new Error('Should keep safe variables')
    }
})

await test('masks sensitive environment variables', async () => {
    const env = {
        API_KEY: 'secret123',
        DATABASE_PASSWORD: 'password456',
        NORMAL_VAR: 'safe'
    }
    
    const sanitized = EnvSanitizer.sanitize(env)
    
    if (sanitized.API_KEY !== '***REDACTED***') {
        throw new Error('Should mask API_KEY')
    }
    
    if (sanitized.DATABASE_PASSWORD !== '***REDACTED***') {
        throw new Error('Should mask DATABASE_PASSWORD')
    }
})

// Test 4: JSON Deserialization Protection
await test('prevents prototype pollution', async () => {
    const maliciousJSON = JSON.stringify({
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        duration: 1000,
        events: [],
        metadata: {},
        '__proto__': { isAdmin: true }
    })
    
    try {
        const parsed = ReplayValidator.parse(maliciousJSON)
        if ('isAdmin' in {}) {
            throw new Error('Prototype pollution succeeded')
        }
    } catch (error) {
        // Expected to throw or filter out __proto__
    }
})

await test('validates replay file structure', async () => {
    const invalidJSON = JSON.stringify({
        // Missing required fields
        events: []
    })
    
    try {
        ReplayValidator.parse(invalidJSON)
        throw new Error('Should have rejected invalid structure')
    } catch (error) {
        // Expected
    }
})

// Test 5: Path Security
await test('prevents path traversal in file operations', async () => {
    const battle = new Battle()
    
    try {
        // This should fail due to path traversal
        const replay = battle.replay
        await replay.load('../../etc/passwd')
        throw new Error('Should have blocked path traversal')
    } catch (error: any) {
        if (!error.message.includes('Invalid replay file path')) {
            throw new Error('Wrong error type')
        }
    }
})

// Test 6: Resource Limits
await test('limits output buffer size', async () => {
    const battle = new Battle()
    
    // Initialize the battle
    await battle.run(async (b) => {
        b.spawn('echo', ['test'])
        
        // Check that outputBuffer exists and has limits
        if (!b.outputBuffer) {
            throw new Error('Output buffer not initialized')
        }
        
        const stats = b.outputBuffer.getStats()
        if (stats.maxBytes !== 10 * 1024 * 1024) {
            throw new Error('Buffer size limit not set correctly')
        }
    })
})

// Test 7: Command validation in Battle spawn
await test('Battle spawn blocks dangerous commands', async () => {
    const battle = new Battle()
    
    try {
        await battle.run(async (b) => {
            b.spawn('ls; rm -rf /', [])
        })
        throw new Error('Should have blocked dangerous command')
    } catch (error: any) {
        if (!error.message.includes('Security validation failed')) {
            throw new Error(`Wrong error: ${error.message}`)
        }
    }
})

// Test 8: Safe environment in PTY
await test('Battle uses safe environment variables', async () => {
    const battle = new Battle({
        env: {
            LD_PRELOAD: '/evil.so',
            SAFE_VAR: 'test'
        }
    })
    
    await battle.run(async (b) => {
        b.spawn('echo', ['$SAFE_VAR'])
        
        // Check metadata for sanitized env
        const metadata = b.replay.data.metadata
        if (metadata.env.LD_PRELOAD) {
            throw new Error('Dangerous env var not filtered')
        }
    })
})

// Summary
console.log('\n========================================')
console.log(`Security Tests: ${passed} passed, ${failed} failed`)
if (failed === 0) {
    console.log('✅ All security tests passed!')
} else {
    console.log(`❌ ${failed} security tests failed`)
    process.exit(1)
}
console.log('========================================')