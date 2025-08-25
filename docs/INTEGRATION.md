# Battle Framework - Integration Guide

## Overview

This guide covers best practices for integrating Battle with your projects, based on real-world usage in production systems like @akaoio/air.

## Quick Start

### Basic Test Structure

```typescript
import { Battle } from '@akaoio/battle'

const battle = new Battle({
    timeout: 20000,
    verbose: process.env.VERBOSE === 'true'
})

const result = await battle.run(async (b) => {
    b.spawn('your-command', ['args'])
    await b.expect('expected output')
})
```

## Integration Patterns

### 1. CLI Testing Pattern

When testing CLI tools, use this pattern:

```typescript
async function testCLI(b) {
    // Test help command
    b.spawn('mycli', ['--help'])
    await b.expect(/Usage:|Options:/, 5000)
    
    // Test version
    b.spawn('mycli', ['--version'])
    await b.expect(/\d+\.\d+\.\d+/)
}
```

### 2. Build Process Testing

For build tools and compilation:

```typescript
async function testBuild(b) {
    b.spawn('npm', ['run', 'build'], {
        env: { ...process.env, CI: 'true' }
    })
    
    await b.expect('Building...', 10000)
    await b.expect(/Build completed|✓/, 30000)
    
    // Verify no errors
    const output = b.getOutput()
    if (output.includes('error')) {
        throw new Error('Build failed')
    }
}
```

### 3. Module Loading Testing

Test that your modules load correctly:

```typescript
async function testModuleLoading(b) {
    // ES Modules
    b.spawn('node', ['-e', `
        import('./dist/index.js')
            .then(m => console.log('Loaded:', typeof m.default))
    `])
    await b.expect('Loaded: function')
    
    // CommonJS (if supported)
    b.spawn('node', ['-e', `
        const m = require('./dist/index.cjs');
        console.log('Loaded:', typeof m);
    `])
    await b.expect('Loaded: object')
}
```

### 4. Performance Testing

Measure and validate performance:

```typescript
async function testPerformance(b) {
    const startTime = Date.now()
    
    b.spawn('npm', ['run', 'build'])
    await b.expect(/Build completed/)
    
    const buildTime = Date.now() - startTime
    console.log(`Build time: ${buildTime}ms`)
    
    if (buildTime > 10000) {
        throw new Error(`Build too slow: ${buildTime}ms`)
    }
}
```

## Using Runner for Test Suites

The Runner class helps organize multiple tests:

```typescript
import { Runner } from '@akaoio/battle'

const runner = new Runner({
    verbose: true,
    timeout: 30000
})

// Add simple command tests
runner.test('Test Name', {
    command: 'command',
    args: ['arg1', 'arg2'],
    expectations: ['expected output'],
    cwd: '/path/to/dir',
    env: { KEY: 'value' }
})

// Run all tests
const report = await runner.run()
runner.report(report)
```

## Common Issues and Solutions

### Issue: Battle.test is not a function

Battle doesn't have a `test` method. Use `Battle.run()` instead:

```typescript
// ❌ Wrong
battle.test('name', async (b) => { ... })

// ✅ Correct
const result = await battle.run(async (b) => { ... })
```

### Issue: PTY class not exported

Battle doesn't export a PTY class. Use Battle.run() for all PTY operations:

```typescript
// ❌ Wrong
import { PTY } from '@akaoio/battle'
const pty = new PTY()

// ✅ Correct
import { Battle } from '@akaoio/battle'
const battle = new Battle()
await battle.run(async (b) => {
    b.spawn('command')
    // All PTY operations through 'b' parameter
})
```

### Issue: Tests hang indefinitely

Always specify timeouts:

```typescript
// Set global timeout
const battle = new Battle({ timeout: 30000 })

// Or per expectation
await b.expect('pattern', 5000)
```

### Issue: ANSI codes in output

Battle preserves ANSI codes. Clean them if needed:

```typescript
const output = b.getOutput()
const clean = output.replace(/\x1b\[[0-9;]*[mGKJH]/g, '')
```

## Best Practices

1. **Always use timeouts** - Prevent hanging tests
2. **Take screenshots on failure** - Aid debugging
3. **Check error conditions** - Verify both success and failure
4. **Use environment variables** - Make tests configurable
5. **Clean up resources** - Kill spawned processes

## Real-World Example: Air Integration

Here's how @akaoio/air uses Battle:

```typescript
// test/battle/index.ts
import { Runner } from '@akaoio/battle'
import path from 'path'

const runner = new Runner({
    verbose: process.argv.includes('--verbose'),
    timeout: 30000
})

// Test module loading
runner.test('Air Module Loading', {
    command: 'node',
    args: ['-e', 'import("./dist/index.js").then(air => console.log("Loaded:", typeof air.Peer))'],
    cwd: path.resolve(__dirname, '../..'),
    expectations: ['Loaded: function']
})

// Test build system
runner.test('Air Build System', {
    command: 'npm',
    args: ['run', 'build'],
    cwd: path.resolve(__dirname, '../..'),
    expectations: [/Build completed/]
})

// Run tests
async function main() {
    const report = await runner.run()
    runner.report(report)
    process.exit(report.failed > 0 ? 1 : 0)
}

main()
```

## TypeScript Configuration

For TypeScript projects, configure your tests properly:

```json
{
  "compilerOptions": {
    "module": "ES2022",
    "target": "ES2022",
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true
  }
}
```

## Package.json Scripts

Recommended test scripts:

```json
{
  "scripts": {
    "test": "npm run build && tsx test/battle/index.ts",
    "test:cli": "tsx test/battle/cli.battle.ts",
    "test:performance": "tsx test/battle/performance.battle.ts",
    "test:watch": "tsx --watch test/battle/index.ts"
  }
}
```

## Debugging

Enable verbose output for debugging:

```bash
VERBOSE=true npm test
```

Or in code:

```typescript
const battle = new Battle({
    verbose: true
})
```

## Conclusion

Battle provides reliable PTY-based testing for terminal applications. By following these patterns, you can create robust test suites that catch real issues that pipe-based testing misses.