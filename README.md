# @akaoio/battle

> Universal terminal application testing framework with real PTY emulation and screenshots

[![Version](https://img.shields.io/npm/v/@akaoio/battle.svg)](https://npmjs.org/package/@akaoio/battle)
[![License](https://img.shields.io/npm/l/@akaoio/battle.svg)](https://github.com/akaoio/battle/blob/main/LICENSE)
[![Node](https://img.shields.io/node/v/@akaoio/battle.svg)](https://nodejs.org)

## 🎮 Features

- 🎯 **Real PTY Testing** - Test actual terminal behavior, not fake I/O
- 🎬 **JSON Replays** - Record terminal sessions as JSON files
- 🖼️ **Screenshots** - Capture terminal state in multiple formats
- ⌨️ **Keyboard Simulation** - Send any key combination
- 📐 **Viewport Control** - Resize terminal dimensions
- 🔍 **Pattern Matching** - Regex and string expectations
- 🏃 **Test Runner** - Built-in test suite execution
- 🔇 **Silent Mode** - For non-interactive commands
- 🌍 **Universal** - Test any terminal app in any language

## 📦 Installation

```bash
# NPM
npm install @akaoio/battle

# Yarn
yarn add @akaoio/battle

# PNPM
pnpm add @akaoio/battle

# Bun
bun add @akaoio/battle
```

## 🚀 Quick Start

### As a Module

```typescript
import { Battle } from '@akaoio/battle'

const battle = new Battle({
    verbose: false,
    timeout: 10000
})

const result = await battle.run(async (b) => {
    // Spawn a terminal application
    b.spawn('echo', ['Hello, Battle!'])
    
    // Wait for output
    await b.expect('Hello, Battle!')
    
    // Send keyboard input
    b.sendKey('enter')
    
    // Take a screenshot
    b.screenshot('test-complete')
})

console.log('Test result:', result.success)
console.log('Replay saved:', result.replayPath)
```

### As a CLI Tool

```bash
# Install globally
npm install -g @akaoio/battle

# Run a simple test
battle run "echo 'Hello, World!'"

# Run with expectations
battle test "ls -la" --expect "package.json"

# Replay a recorded session
battle replay play ./logs/replay-*.json

# Export replay to HTML
battle replay export ./logs/replay-*.json --format html
```

## 🎬 Replay System

Battle features a replay system that records terminal sessions as JSON files:

### Recording

Every Battle test automatically records a replay file containing:
- All terminal input/output events
- Precise timestamps for perfect playback
- Terminal dimensions and environment
- Key presses and control sequences

### Terminal Player

```bash
battle replay play recording.json
```

**YouTube-Style Controls:**
- **Space** - Play/Pause
- **S** - Stop
- **R** - Restart  
- **E** - Jump to End
- **+/-** - Speed Up/Down (0.1× to 50×)
- **0-4** - Speed Presets
- **←→** - Skip Forward/Backward
- **Q/ESC** - Quit

### HTML Export

```bash
battle replay export recording.json --format html
```

Generates an interactive HTML player with:
- Full media controls
- Speed control (0× to unlimited)
- Progress bar with scrubbing
- Event timeline visualization
- Keyboard shortcuts

## 🧪 Testing Philosophy

### Real PTY Testing

Battle uses actual PTY (pseudo-terminal) emulation, not fake stdin/stdout pipes. This reveals real bugs that pipe-based testing misses:

- Buffering issues
- ANSI escape sequences
- Terminal-specific behavior
- TTY detection
- Timing problems

### Self-Testing Framework

Battle tests itself using its own framework - the ultimate validation:

```bash
npm test          # Run self-test suite
npm test:replay   # Test replay system
npm test:all      # Run all tests
```

## 📚 Core Components

### Battle Class

Main testing interface with PTY control:

```typescript
const battle = new Battle({
    cols: 80,           // Terminal width
    rows: 24,           // Terminal height
    cwd: process.cwd(), // Working directory
    env: process.env,   // Environment variables
    timeout: 30000,     // Test timeout
    verbose: false,     // Show output
    logDir: './logs',   // Log directory
    screenshotDir: './screenshots'
})
```

### Methods

- **spawn(command, args)** - Start a terminal application
- **sendKey(key)** - Send keyboard input
- **expect(pattern, timeout)** - Wait for output pattern
- **screenshot(name)** - Capture terminal state
- **resize(cols, rows)** - Resize terminal
- **wait(ms)** - Wait for duration
- **getCursor()** - Get cursor position

### Runner Class

Test suite execution:

```typescript
const runner = new Runner()

runner.test('Echo test', {
    command: 'echo',
    args: ['Hello'],
    expectations: ['Hello']
})

await runner.run()
```

### Silent Class

For non-interactive system commands:

```typescript
const silent = new Silent()

const result = silent.exec('ls -la')
const isRunning = silent.isRunning('node')
const portOpen = silent.isPortOpen(3000)
```

### Replay Class

Session recording and playback:

```typescript
const replay = new Replay()

// Load a recording
replay.load('recording.json')

// Play in terminal
await replay.play({ speed: 2.0 })

// Export to HTML
const html = replay.export('html')
```

## 🏗️ Architecture

Battle follows the **Class = Directory + Method-per-file** pattern:

```
Battle/
├── index.ts        # Class definition
├── constructor.ts  # Constructor logic
├── spawn.ts        # spawn() method
├── expect.ts       # expect() method
├── sendKey.ts      # sendKey() method
├── screenshot.ts   # screenshot() method
├── resize.ts       # resize() method
└── run.ts          # run() method
```

## 🔧 Development

### Building

```bash
npm run build        # Build all formats
npm run build:watch  # Watch mode
npm run typecheck    # Type checking
```

### Testing

```bash
npm test            # Main test suite
npm test:replay     # Replay tests
npm test:all        # All tests
npm test:quick      # Quick tests
```

### Documentation

```bash
npm run doc         # Generate docs
bun doc             # Generate with Bun
```

## 📖 Examples

### Testing Interactive CLI

```typescript
await battle.run(async (b) => {
    b.spawn('npm', ['init'])
    
    await b.expect('package name:')
    b.sendKey('my-package')
    b.sendKey('enter')
    
    await b.expect('version:')
    b.sendKey('enter')  // Accept default
    
    await b.expect('Is this OK?')
    b.sendKey('y')
    b.sendKey('enter')
})
```

### Testing TUI Applications

```typescript
await battle.run(async (b) => {
    b.spawn('vim', ['test.txt'])
    
    await b.wait(500)  // Wait for vim to start
    
    b.sendKey('i')  // Insert mode
    b.sendKey('Hello, Vim!')
    b.sendKey('escape')
    b.sendKey(':wq')
    b.sendKey('enter')
    
    await b.expect('written')
})
```

### Cross-Platform Testing

```typescript
const runner = new Runner()

runner.suite('Cross-platform tests', [
    {
        name: 'List files',
        command: process.platform === 'win32' ? 'dir' : 'ls',
        args: [],
        expectations: [/\.json/]
    },
    {
        name: 'Check Node',
        command: 'node',
        args: ['--version'],
        expectations: [/v\d+\.\d+\.\d+/]
    }
])

await runner.run()
```

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT - See [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- Built with [node-pty](https://github.com/microsoft/node-pty) for real terminal emulation
- JSON-based replay format
- Self-testing philosophy from test-driven development

---

Built with ❤️ by [AKAO.IO](https://akao.io)
