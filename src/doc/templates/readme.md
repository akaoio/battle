# {{project.name}}

> {{project.tagline}}

[![Version](https://img.shields.io/npm/v/{{project.name}}.svg)](https://www.npmjs.com/package/{{project.name}})
[![License](https://img.shields.io/npm/l/{{project.name}}.svg)](https://github.com/akaoio/battle/blob/main/LICENSE)
[![Tests](https://img.shields.io/badge/tests-self--validating-green.svg)](https://github.com/akaoio/battle/actions)

{{project.description}}

## Why Battle?

{{#each core_principles}}
### {{icon}} {{name}}
{{description}}
**{{benefit}}**

{{/each}}

## Features

{{#each features}}
- {{icon}} **{{name}}**: {{description}}
{{/each}}

## Installation

```bash
{{installation.npm}}
```

## Quick Start

### Basic Usage
```typescript
{{basic_usage}}
```

### Advanced Usage with Replay
```typescript
{{advanced_usage}}
```

### CLI Usage
```bash
{{cli_usage}}
```

## Testing Patterns

### Interactive Applications
```typescript
{{testing_patterns.interactive_apps}}
```

### Error Handling
```typescript
{{testing_patterns.error_handling}}
```

### Long-Running Processes
```typescript
{{testing_patterns.long_running}}
```

## Architecture

Battle follows the @akaoio principle of "Class = Directory + Method-per-file":

```
{{class_structure.layout}}
```

{{class_structure.rationale}}

## Performance vs Accuracy Trade-off

| Operation | Pipe Testing | PTY Testing | Overhead | Worth It? |
|-----------|-------------|-------------|----------|-----------|
{{#each performance.overhead_comparison}}
| {{operation}} | {{pipe_testing}} | {{pty_testing}} | {{overhead}} | {{worth_it}} |
{{/each}}

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

MIT © {{project.author}}

---

*Built with {{project.name}} v{{project.version}}*
*Documentation generated with @akaoio/composer*