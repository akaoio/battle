# Battle Framework - Development Guide

## Architecture

Battle follows the **Class = Directory + Method-per-file** pattern strictly:

```
Battle/
  index.ts        # Class definition with imports and delegation
  constructor.ts  # Constructor logic
  spawn.ts        # spawn() method implementation
  interact.ts     # interact() method implementation
  screenshot.ts   # screenshot() method implementation
  expect.ts       # expect() method implementation
  log.ts          # log() method implementation
  cleanup.ts      # cleanup() method implementation
  run.ts          # run() method implementation
```

## Core Principles

1. **Real Terminal Emulation**: Uses node-pty for actual PTY sessions, not fake stdin/stdout
2. **Universal Testing**: Can test ANY terminal application regardless of language
3. **Self-Testing**: The framework tests itself using its own capabilities
4. **Zero Technical Debt**: No TODO/FIXME, everything is fully implemented

## Key Design Decisions

### Why PTY Instead of Stdin/Stdout Pipes?

Regular pipe-based testing misses critical bugs:
- Buffering issues
- ANSI escape sequences
- Terminal-specific behavior
- Timing problems
- TTY detection

PTY testing reveals the truth about how applications actually behave.

### Screenshot System

Three formats for different needs:
- **Raw**: Preserves ANSI codes for exact reproduction
- **Clean**: Plain text for assertions and comparisons
- **HTML**: Visual representation for human inspection

### Silent Mode

Not all applications need PTY emulation:
- System commands (ps, netstat, etc.)
- File operations
- Network checks
- Resource monitoring

Silent mode provides lightweight testing for these cases.

## Testing Philosophy

### The Chicken and Egg

Battle tests itself using its own framework. This proves:
1. The framework actually works
2. We eat our own dog food
3. Any framework bug would break its own tests

### Real vs Fake

**Never trust fake tests**. They create false confidence.

Example from Air project:
- Fake test: "PASS - install script works"
- PTY test: Revealed infinite input loop bug

## Development Workflow

### Adding New Features

1. Create method file in appropriate class directory
2. Add delegation in index.ts
3. Write self-test for the feature
4. Ensure self-test passes

### Testing Changes

```bash
npm test  # Run self-test suite
```

If self-tests fail, the framework is broken.

## Build System

Uses tsup for multi-format builds:
- CommonJS for Node.js require()
- ES Modules for modern import
- TypeScript definitions

```bash
npm run build        # Build all formats
npm run build:watch  # Development mode
```

## Important Implementation Notes

### Process Cleanup

Always kill PTY processes on exit:
```typescript
process.on('exit', () => battle.cleanup())
```

### ANSI Code Handling

Clean ANSI before text comparisons:
```typescript
output.replace(/\x1b\[[0-9;]*[mGKJH]/g, '')
```

### Timeout Management

Every interaction needs timeout protection to prevent hanging tests.

## Common Patterns

### Testing Interactive Prompts

```typescript
await battle.interact(async (data, fullOutput) => {
    const clean = fullOutput.replace(/\x1b\[[0-9;]*[mGKJH]/g, '')
    
    if (clean.includes('Enter name:')) {
        return 'Test Name\n'
    }
    
    if (clean.includes('Complete')) {
        return null  // End interaction
    }
})
```

### Capturing State at Failure

```typescript
try {
    battle.expect('Success')
} catch (error) {
    battle.screenshot('failure-state')
    throw error
}
```

## Debugging

Set verbose mode to see real-time output:
```typescript
new Battle({ verbose: true })
```

Check logs for detailed interaction history:
```
./logs/battle-{timestamp}.log
```

## Known Limitations

1. Windows PTY support varies by terminal
2. Some ANSI sequences not fully captured
3. Performance overhead vs pipe-based testing

## Future Enhancements

- Video recording of terminal sessions
- Replay capability for debugging
- Network traffic capture
- Performance profiling

## Remember

**PTY testing shows the truth**. If a test passes with pipes but fails with PTY, the PTY test is correct. The application has a real bug that users would experience.