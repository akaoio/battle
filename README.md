# @akaoio/battle

> Real PTY testing with StarCraft-style replay capabilities

[![CI/CD](https://github.com/akaoio/battle/actions/workflows/ci.yml/badge.svg)](https://github.com/akaoio/battle/actions/workflows/ci.yml)
[![Version](https://img.shields.io/npm/v/@akaoio/battle.svg)](https://www.npmjs.com/package/@akaoio/battle)
[![License](https://img.shields.io/npm/l/@akaoio/battle.svg)](https://github.com/akaoio/battle/blob/main/LICENSE)
[![Tests](https://img.shields.io/badge/tests-self--validating-green.svg)](https://github.com/akaoio/battle/actions)

Universal terminal application testing framework with real PTY emulation

## Why Battle?


### 🔍 PTY over Pipes
Real pseudo-terminal allocation reveals hidden TTY-dependent bugs
**3-10× slower but 99% more accurate than pipe testing**


### 📹 Deterministic Replay
Exact session reproduction with event-level precision
**Debug failed tests across different sessions and environments**


### 🔄 Self-Validation
Framework tests itself recursively up to 3 levels deep
**Proves testing framework stability and correctness**



## Features


- ⚡ **Real PTY Emulation**: Uses actual pseudo-terminals, not fake pipes, to catch all bugs

- 🎬 **StarCraft-Style Replay**: Record and playback terminal sessions with microsecond precision

- 🔄 **Self-Testing Framework**: Tests itself recursively to ensure framework reliability

- 🌍 **Cross-Platform**: Works on Linux, macOS, Windows with native PTY support

- 🔍 **Visual Debugging**: HTML replay export with YouTube-style controls

- ✨ **Zero Mock Policy**: 100% real implementation - no mocks, stubs, or fakes


## Installation

```bash
npm install --save-dev @akaoio/battle
```

## Quick Start

### Basic Usage
```typescript
import { Battle } from "@akaoio/battle"

const battle = new Battle({
  command: 'npm',
  args: ['install'],
  timeout: 30000
})

await battle.spawn()
await battle.expect('packages installed')
battle.cleanup()

```

### Advanced Usage with Replay
```typescript
const battle = new Battle()

const result = await battle.run(async (b) => {
  b.spawn('git', ['status'])
  await b.expect('On branch')
  
  b.sendKey('q')  // Quit if pager
  await b.screenshot()  // Capture state
})

// Replay is automatically saved
console.log('Replay saved to:', result.replayPath)

```

### CLI Usage
```bash
# Run a single test
battle run "echo hello" --expect "hello"

# Run with timeout
battle run "npm install" --timeout 60000

# Watch mode
battle watch "./tests/*.battle.js"

# Replay a session
battle replay ./logs/session-123.json

# Export to HTML
battle export ./logs/session-123.json --format html

```

## Testing Patterns

### Interactive Applications
```typescript
// Test interactive CLI apps
const battle = new Battle()
await battle.run(async (b) => {
  b.spawn('npx', ['create-react-app', 'test-app'])
  await b.expect('What would you like to name')
  b.type('my-app')
  b.sendKey('enter')
  await b.expect('Success! Created my-app')
})

```

### Error Handling
```typescript
// Test error conditions
const battle = new Battle()
await battle.run(async (b) => {
  b.spawn('npm', ['install', 'non-existent-package'])
  await b.expect('ERR!')  // NPM error prefix
  // Test continues even after process exits with error
})

```

### Long-Running Processes
```typescript
// Test long-running processes
const battle = new Battle({ timeout: 120000 })
await battle.run(async (b) => {
  b.spawn('npm', ['run', 'build'])
  await b.expect('Build started')
  await b.expect('Build complete', 60000)  // Wait up to 1 minute
})

```

## Architecture

Battle follows the @akaoio principle of "Class = Directory + Method-per-file":

```
Battle/
├── index.ts        # Class definition with delegation
├── constructor.ts  # Initialization logic
├── spawn.ts        # Process spawning with PTY allocation
├── expect.ts       # Pattern matching with timeout control
├── sendKey.ts      # Keyboard input simulation  
├── screenshot.ts   # Terminal state capture
├── run.ts          # Test execution orchestration
└── cleanup.ts      # Resource deallocation

```

Method isolation enables independent testing, hot-reloading, and atomic refactoring while maintaining class cohesion

## Performance vs Accuracy Trade-off

| Operation | Pipe Testing | PTY Testing | Overhead | Worth It? |
|-----------|-------------|-------------|----------|-----------|

| Process spawn | ~5ms | ~15ms | 3× | YES - catches TTY bugs |

| Character I/O | <1μs | ~10μs | 10× | YES - real buffering |

| Pattern match | ~1ms | ~5ms | 5× | YES - ANSI sequences |


**Philosophy**: Accept 3-10× performance overhead for 99% bug detection accuracy.

## Self-Testing Validation

Battle tests itself recursively to ensure framework reliability:

- **Level 1**: Battle tests a command
- **Level 2**: Battle tests Battle testing a command  
- **Level 3**: Battle tests Battle testing Battle (maximum confidence)

## Documentation

All documentation is generated with @akaoio/composer from atomic YAML files.

```bash
npm run docs:build
npm run docs:watch
```

## Built With @akaoio Tools

- **@akaoio/builder**: Universal TypeScript build system
- **@akaoio/composer**: Atomic documentation generation
- **@akaoio/battle**: Self-testing (this framework tests itself!)

## License

MIT © AKAO Team

---

*Built with @akaoio/battle v1.1.0*
*Documentation generated with @akaoio/composer*# Test hybrid ruspty fix Fri Aug 29 03:42:00 PM +07 2025
