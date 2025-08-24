# Battle - Universal Terminal Testing Framework

Test any terminal application with real PTY emulation, screenshots, and comprehensive logging.

## Features

- **Real PTY Emulation**: Test interactive terminal applications as they really behave
- **Dynamic Viewport Resizing**: Test how apps handle terminal size changes in real-time
- **Universal**: Test any terminal app in any language
- **Screenshots**: Capture terminal state at any point with ANSI color preservation
- **Key Sequences**: Send special keys (arrows, function keys, ctrl combinations)
- **Cursor Tracking**: Get cursor position for precise testing
- **Exhaustive Logging**: Every interaction, output, and state change is logged
- **Silent Mode**: Test non-interactive system commands
- **Self-Testing**: The framework tests itself (the chicken and the egg)

## Installation

```bash
npm install @akaoio/battle
```

## Quick Start

```typescript
import { Battle } from '@akaoio/battle'

const battle = new Battle()

await battle.run(async (b) => {
    b.spawn('npm', ['--version'])
    b.expect(/\d+\.\d+\.\d+/)
    b.screenshot('npm-version')
})
```

## Testing Interactive Applications

```typescript
import { Battle } from '@akaoio/battle'

const battle = new Battle({ verbose: true })

await battle.run(async (b) => {
    b.spawn('node', ['install.js'])
    
    await b.interact(async (data, output) => {
        if (output.includes('Enter name:')) {
            return 'My App\n'
        }
        if (output.includes('Enter port:')) {
            return '3000\n'
        }
        if (output.includes('Continue?')) {
            return 'y\n'
        }
        return null // End interaction
    })
    
    b.expect('Installation complete')
    b.screenshot('install-success')
})
```

## Testing Viewport Resizing

```typescript
import { Battle } from '@akaoio/battle'

const battle = new Battle({ cols: 80, rows: 24 })

await battle.run(async (b) => {
    // Start a TUI application
    b.spawn('vim', ['file.txt'])
    await b.wait(1000)
    
    // Test different viewport sizes
    b.resize(120, 40)  // Large terminal
    await b.wait(500)
    b.screenshot('vim-large')
    
    b.resize(40, 20)   // Small terminal
    await b.wait(500)
    b.screenshot('vim-small')
    
    // Send key sequences
    b.sendKey('escape')
    b.sendKey(':q!')
    b.sendKey('enter')
})
```

## Testing System Commands (Silent Mode)

```typescript
import { Silent } from '@akaoio/battle'

const silent = new Silent()

// Run command
const result = silent.exec('ls -la')
console.log(result.stdout)

// Check if process is running
const isRunning = silent.isRunning('node')

// Check if port is open
const portOpen = silent.isPortOpen(3000)

// Wait for condition
await silent.waitFor(() => silent.fileExists('./output.txt'), 5000)
```

## Test Runner

Create test suites:

```typescript
import { Runner } from '@akaoio/battle'

const runner = new Runner()

runner.suite('My App Tests', [
    {
        name: 'Show help',
        command: 'myapp',
        args: ['--help'],
        expectations: ['Usage:', '--version']
    },
    {
        name: 'Interactive setup',
        command: 'myapp',
        args: ['setup'],
        interactions: [
            { expect: 'Database?', respond: 'postgres\n' },
            { expect: 'Port?', respond: '5432\n' }
        ],
        expectations: ['Setup complete']
    }
])

await runner.run()
```

## CLI Usage

```bash
# Run test files
battle test ./test

# Test a single command
battle run "echo hello"

# Test with screenshots
battle run "npm start" --screenshot

# Silent mode (non-interactive)
battle silent "ps aux"

# Verbose output
battle test --verbose
```

## Screenshots

Battle captures terminal output in three formats:

1. **Raw**: Original output with ANSI codes
2. **Clean**: Text-only version without formatting
3. **HTML**: Visual representation with colors

Screenshots are saved to `./screenshots` by default.

## Logging

All interactions are logged to `./logs` with timestamps:

```
[2024-01-20T10:30:00.000Z] [INFO] Spawning: npm test
[2024-01-20T10:30:00.100Z] [OUTPUT] > myapp@1.0.0 test
[2024-01-20T10:30:01.000Z] [INPUT] y\n
[2024-01-20T10:30:02.000Z] [INFO] Pattern matched: All tests passed
```

## Self-Testing

Battle tests itself using its own framework:

```bash
npm test  # Runs Battle's self-test suite
```

The test suite (`test/self.test.ts`) uses Battle to test Battle, proving the framework works correctly.

## API Reference

### Battle Class

- `spawn(command, args?)`: Start a process
- `interact(handler)`: Handle interactive prompts
- `expect(pattern)`: Assert output contains pattern
- `screenshot(name?)`: Capture current terminal state
- `resize(cols, rows)`: Dynamically resize terminal viewport
- `sendKey(key)`: Send special key sequences (arrows, F-keys, ctrl, etc.)
- `wait(ms)`: Wait for specified milliseconds
- `getCursor()`: Get current cursor position
- `log(level, message)`: Add to log
- `cleanup()`: Kill process and cleanup

### Silent Class

- `exec(command, options?)`: Run command and capture output
- `isRunning(pattern)`: Check if process is running
- `isPortOpen(port, host?)`: Check if port is open
- `fileExists(path)`: Check if file exists
- `readFile(path)`: Read file content
- `waitFor(condition, timeout?, interval?)`: Wait for condition

### Runner Class

- `suite(name, tests)`: Add test suite
- `test(name, testCase)`: Add single test
- `run()`: Execute all tests
- `report()`: Generate test report

## License

MIT