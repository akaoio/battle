# CLAUDE.md - @akaoio/battle

This file provides guidance to Claude Code (claude.ai/code) when working with the @akaoio/battle codebase.

## Project Overview

**@akaoio/battle** - Universal terminal application testing framework with real PTY emulation

**Version**: 1.2.1  
**License**: MIT  
**Author**: AKAO Team  
**Repository**: https://github.com/akaoio/battle  
**Philosophy**: "Real PTY testing over fake pipes - accuracy over speed"

## 🚨 CRITICAL: Build Architecture Rules

### Universal Development Law
**NEVER edit built artifacts** - Only edit source files (.ts, .tsx)

- **Built artifacts** (NEVER EDIT): `dist/**/*.js`, `dist/**/*.cjs`, `dist/**/*.mjs`
- **Source files** (ALWAYS EDIT): `src/**/*.ts`, `src/**/*.tsx`

### Development Workflow
1. **Edit source files** in `src/` directory
2. **Build immediately**: `npm run build`
3. **Test built artifacts**: `npm test`

## Architecture Overview

### Class = Directory + Method-per-file Pattern

Battle/
├── index.ts        # Class definition with delegation
├── constructor.ts  # Initialization logic
├── spawn.ts        # Process spawning with PTY allocation
├── expect.ts       # Pattern matching with timeout control
├── sendKey.ts      # Keyboard input simulation  
├── screenshot.ts   # Terminal state capture
├── run.ts          # Test execution orchestration
└── cleanup.ts      # Resource deallocation


Method isolation enables independent testing, hot-reloading, and atomic refactoring while maintaining class cohesion

### Core Components

- **Battle/**: Main testing orchestrator with PTY allocation
- **Replay/**: StarCraft-style session recording and playback
- **Runner/**: Test execution engine with timeout management
- **Silent/**: Legacy pipe-based testing (for compatibility)
- **PTY/**: Low-level pseudo-terminal interface (@akaoio/ruspty wrapper)
- **security/**: Input validation, sanitization, and resource management

## Core Features


### Real PTY Emulation
Uses actual pseudo-terminals, not fake pipes, to catch all bugs


### StarCraft-Style Replay
Record and playback terminal sessions with microsecond precision


### Self-Testing Framework
Tests itself recursively to ensure framework reliability


### Cross-Platform
Works on Linux, macOS, Windows with native PTY support


### Visual Debugging
HTML replay export with YouTube-style controls


### Zero Mock Policy
100% real implementation - no mocks, stubs, or fakes



## Testing Philosophy

### PTY over Pipes Trade-off


- **Process spawn**: ~15ms vs ~5ms (3×) → YES - catches TTY bugs

- **Character I/O**: ~10μs vs <1μs (10×) → YES - real buffering

- **Pattern match**: ~5ms vs ~1ms (5×) → YES - ANSI sequences


**Core Principle**: Accept 3-10× performance overhead for 99% bug detection accuracy.

### Self-Testing Validation

Battle tests itself recursively:

1. **Level 1**: Battle tests a terminal command
2. **Level 2**: Battle tests Battle testing a command
3. **Level 3**: Battle tests Battle testing Battle (maximum confidence)

## Development Guidelines

### Working with PTY Code

**Critical**: PTY operations are platform-specific and require careful resource management.

```typescript
// ✅ CORRECT: Proper PTY lifecycle
const battle = new Battle({ timeout: 30000 })
try {
  await battle.spawn('command')
  await battle.expect('expected output')
} finally {
  battle.cleanup()  // ALWAYS cleanup PTY resources
}
```

```typescript
// ❌ WRONG: Missing cleanup leads to PTY leaks
const battle = new Battle()
await battle.spawn('command')
// Missing cleanup - PTY file descriptors leak
```

### Security Considerations

Battle includes comprehensive security measures:

- **Command injection prevention**: All commands validated through `SafeCommandMode`
- **Path traversal protection**: File operations use `PathSecurity.validatePath()`
- **Resource limiting**: PTY allocation limited via `ResourceManager`
- **Input sanitization**: All user inputs processed through security filters

When modifying security code:
1. **Never bypass security checks** - they prevent critical vulnerabilities
2. **Test with malicious inputs** - ensure proper validation
3. **Check resource cleanup** - prevent file descriptor leaks

### Testing Patterns


#### interactive_apps
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


#### error_handling
```typescript
// Test error conditions
const battle = new Battle()
await battle.run(async (b) => {
  b.spawn('npm', ['install', 'non-existent-package'])
  await b.expect('ERR!')  // NPM error prefix
  // Test continues even after process exits with error
})

```


#### long_running
```typescript
// Test long-running processes
const battle = new Battle({ timeout: 120000 })
await battle.run(async (b) => {
  b.spawn('npm', ['run', 'build'])
  await b.expect('Build started')
  await b.expect('Build complete', 60000)  // Wait up to 1 minute
})

```



## Available Scripts

### Build and Development
```bash
npm run build          # Build TypeScript source to JavaScript
npm run build:dev      # Development build with source maps
npm run build:watch    # Watch mode for development
npm run typecheck      # TypeScript type checking
```

### Testing
```bash
npm test              # Run all tests
npm run test:self     # Self-testing (Battle tests itself)
npm run test:battle   # Core Battle framework tests
npm run test:replay   # Replay system tests
npm run test:silent   # Silent mode compatibility tests
```

### Documentation
```bash
npm run docs:build    # Generate documentation from YAML atoms
npm run docs:watch    # Watch and rebuild documentation
```

## Common Patterns

### Basic Battle Test
```typescript
import { Battle } from "@akaoio/battle"

const battle = new Battle({
  command: 'git',
  args: ['status'],
  timeout: 10000
})

await battle.spawn()
await battle.expect('On branch')
battle.cleanup()
```

### Advanced Testing with Replay
```typescript
const result = await battle.run(async (b) => {
  b.spawn('npm', ['install'])
  await b.expect('packages installed')
  b.sendKey('enter')  // Handle prompts
  await b.screenshot()  // Capture state
})

// Replay automatically saved
console.log('Replay:', result.replayPath)
```

### CLI Integration
```bash
battle run "echo hello" --expect "hello"
battle replay ./logs/session-123.json
battle export ./logs/session-123.json --format html
```

## Troubleshooting Guide

### Common Issues

**TypeScript Compilation Errors**
```bash
npm run typecheck  # Check for type errors
npm install        # Ensure all dependencies installed
```

**PTY Allocation Failures**
- Check OS-level PTY limits: `ulimit -n`
- Ensure proper cleanup in failed tests
- Verify @akaoio/ruspty compatibility

**Test Timeouts**
- Increase timeout for slow commands
- Check for deadlocks in expect patterns
- Verify command actually produces expected output

**Replay Playback Issues**
- Ensure replay file integrity
- Check timestamp alignment
- Verify environment compatibility

## Notes for AI Assistants

### Critical Guidelines
- **ALWAYS edit TypeScript source files** (.ts) never JavaScript built files (.js)
- **BUILD immediately after editing** source files: `npm run build`
- **TEST with built artifacts** not source files
- **RESPECT PTY resource limits** - always cleanup
- **MAINTAIN security boundaries** - never bypass validation

### Development Best Practices
- **Start with basic Battle patterns** before advanced features
- **Test both success and failure cases** thoroughly
- **Use proper timeout values** for different command types
- **Follow the class-per-directory pattern** for new features
- **Add proper error handling** for PTY operations

### Common Mistakes to Avoid
- Editing JavaScript files in dist/ directory (built artifacts)
- Forgetting to call battle.cleanup() (PTY leaks)
- Using setTimeout instead of Battle's expect() with timeout
- Testing with fake/mock processes instead of real PTY
- Bypassing security validation in Silent mode

### Framework Extensions
When adding new features:
1. **Follow the method-per-file pattern**
2. **Add comprehensive tests** including self-tests
3. **Update security analysis** if handling user input
4. **Generate documentation** from YAML atoms
5. **Test across multiple platforms** (Linux, macOS, Windows)

## Security Framework

Battle includes a comprehensive security framework:

- **SafeCommandMode**: Configurable command validation levels
- **PathSecurity**: Directory traversal and null-byte protection
- **ResourceManager**: PTY and file descriptor limiting
- **ReplayValidator**: Safe JSON parsing with prototype pollution prevention
- **CommandSanitizer**: Input validation and dangerous pattern detection

When working with security code:
- **Never disable security checks** without explicit user consent
- **Always validate user inputs** at entry points
- **Test with malicious payloads** to verify protection
- **Document security implications** of any changes

---

**Battle Philosophy**: "If it works in a pipe but fails in a PTY, it's not ready for production."

*Built with real PTY emulation for real-world accuracy*
*Version: 1.2.1 | License: MIT | Author: AKAO Team*