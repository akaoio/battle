/**
 * Advanced PTY Testing Example
 * Based on real-world Air integration
 */

import { Battle } from '../src/index.js'

// Example 1: Testing CLI tools with Battle.run()
async function testCLITool() {
    const battle = new Battle({
        timeout: 20000,
        verbose: true
    })

    const result = await battle.run(async (b) => {
        // Spawn the CLI tool
        b.spawn('npm', ['--version'])
        
        // Wait for expected output
        await b.expect(/\d+\.\d+\.\d+/, 5000)
        
        // Take a screenshot for debugging
        b.screenshot()
    })

    console.log('Test passed:', result.passed)
    return result
}

// Example 2: Interactive testing pattern
async function testInteractiveApp() {
    const battle = new Battle({
        timeout: 30000
    })

    const result = await battle.run(async (b) => {
        // Start interactive app
        b.spawn('node', ['-i'])
        
        // Wait for prompt
        await b.expect('>', 2000)
        
        // Send command
        b.send('console.log("Hello from Battle")\r')
        
        // Check output
        await b.expect('Hello from Battle')
        
        // Exit
        b.send('.exit\r')
    })

    return result
}

// Example 3: Testing build processes
async function testBuildProcess() {
    const battle = new Battle({
        timeout: 60000,
        verbose: process.env.VERBOSE === 'true'
    })

    const result = await battle.run(async (b) => {
        console.log('Testing: Build Process')
        
        // Run build command
        b.spawn('npm', ['run', 'build'], {
            env: { ...process.env, CI: 'true' }
        })
        
        // Monitor build output
        await b.expect('Building...', 10000)
        await b.expect(/Build completed|✓/, 30000)
        
        // Verify build succeeded
        const output = b.getOutput()
        if (output.includes('error') || output.includes('failed')) {
            throw new Error('Build failed')
        }
    })

    return result
}

// Example 4: Performance benchmarking pattern
async function testPerformance() {
    const battle = new Battle({
        timeout: 30000
    })

    const result = await battle.run(async (b) => {
        const startTime = Date.now()
        
        // Run performance-critical operation
        b.spawn('node', ['-e', `
            const start = Date.now();
            // Simulate work
            for(let i = 0; i < 1000000; i++) {}
            console.log('Time:', Date.now() - start, 'ms');
        `])
        
        await b.expect('Time:', 5000)
        
        const output = b.getOutput()
        const match = output.match(/Time: (\d+) ms/)
        if (match) {
            const execTime = parseInt(match[1])
            console.log(`Execution time: ${execTime}ms`)
            
            // Fail if too slow
            if (execTime > 100) {
                throw new Error(`Too slow: ${execTime}ms (max: 100ms)`)
            }
        }
    })

    return result
}

// Example 5: Testing with Runner
import { Runner } from '../src/index.js'

function setupTestRunner() {
    const runner = new Runner({
        verbose: true,
        timeout: 30000
    })

    // Add simple command tests
    runner.test('Node Version', {
        command: 'node',
        args: ['--version'],
        expectations: [/v\d+\.\d+\.\d+/]
    })

    runner.test('NPM Version', {
        command: 'npm',
        args: ['--version'],
        expectations: [/\d+\.\d+\.\d+/]
    })

    runner.test('Echo Test', {
        command: 'echo',
        args: ['Battle Framework'],
        expectations: ['Battle Framework']
    })

    return runner
}

// Export examples for documentation
export {
    testCLITool,
    testInteractiveApp,
    testBuildProcess,
    testPerformance,
    setupTestRunner
}

// Run examples if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('Running Battle Examples...\n')
    
    testCLITool()
        .then(() => testInteractiveApp())
        .then(() => testBuildProcess())
        .then(() => testPerformance())
        .then(() => {
            console.log('\nAll examples completed!')
            process.exit(0)
        })
        .catch(err => {
            console.error('Example failed:', err)
            process.exit(1)
        })
}