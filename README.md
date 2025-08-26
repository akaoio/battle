# @akaoio/battle

> Real PTY testing with StarCraft-style replay capabilities

[![Version](https://img.shields.io/npm/v/@akaoio/battle.svg)](https://www.npmjs.com/package/@akaoio/battle)
[![License](https://img.shields.io/npm/l/@akaoio/battle.svg)](https://github.com/akaoio/battle/blob/main/LICENSE)
[![Tests](https://img.shields.io/badge/tests-self--validating-green.svg)](https://github.com/akaoio/battle/actions)

Universal terminal application testing framework with real PTY emulation

## Why Battle?



## Features



## Installation

```bash

```

## Quick Start

### Basic Usage
```typescript

```

### Advanced Usage with Replay
```typescript

```

### CLI Usage
```bash

```

## Testing Patterns

### Interactive Applications
```typescript

```

### Error Handling
```typescript

```

### Long-Running Processes
```typescript

```

## Architecture

Battle follows the @akaoio principle of "Class = Directory + Method-per-file":

```

```



## Performance vs Accuracy Trade-off

| Operation | Pipe Testing | PTY Testing | Overhead | Worth It? |
|-----------|-------------|-------------|----------|-----------|


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
*Documentation generated with @akaoio/composer*