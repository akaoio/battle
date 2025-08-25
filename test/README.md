# Battle Framework Test Architecture

## Structure Following Class = Directory Pattern

The test suite has been refactored to mirror the source code structure, following the "Class = Directory + Method-per-file" pattern from CLAUDE.md.

```
test/
├── Battle/                 # Tests for Battle class methods
│   ├── index.test.ts       # Orchestrates all Battle tests
│   ├── spawn.test.ts       # Tests spawn() method
│   ├── expect.test.ts      # Tests expect() method
│   ├── resize.test.ts      # Tests resize() method
│   ├── screenshot.test.ts  # Tests screenshot() method
│   ├── sendKey.test.ts     # Tests sendKey() method
│   └── meta.test.ts        # Meta tests (Battle testing Battle)
│
├── Replay/                 # Tests for Replay class methods
│   ├── index.test.ts       # Orchestrates all Replay tests
│   ├── record.test.ts      # Tests recording functionality
│   ├── play.test.ts        # Tests playback functionality
│   ├── export.test.ts      # Tests export (HTML/JSON)
│   └── load.test.ts        # Tests file loading
│
├── Runner/                 # Tests for Runner class
│   └── index.test.ts       # All Runner tests
│
├── Silent/                 # Tests for Silent class
│   └── index.test.ts       # All Silent tests
│
├── utils/                  # Shared test utilities
│   └── testHelpers.ts      # Test counters and reporting
│
├── compatibility/          # Cross-platform compatibility tests
│   ├── test-bun.ts
│   ├── test-js.js
│   └── ...
│
└── index.test.ts          # Main test orchestrator
```

## Running Tests

```bash
# Run all tests (new structure)
npm test

# Run specific class tests
npm run test:battle    # Battle class tests only
npm run test:replay    # Replay class tests only
npm run test:runner    # Runner class tests only
npm run test:silent    # Silent class tests only

# Run legacy tests (original structure)
npm run test:legacy

# Quick validation
npm run test:quick
```

## Test Count

- **Battle Tests**: 19 tests across 6 method files
- **Replay Tests**: 12 tests across 4 method files  
- **Runner Tests**: 8 tests
- **Silent Tests**: 9 tests
- **Total**: 48+ tests

## Architecture Benefits

1. **Mirrors Source Structure** - Tests are organized exactly like source code
2. **Method Isolation** - Each method has its own test file
3. **Easy Navigation** - Find tests by looking at source structure
4. **Scalable** - Easy to add new method tests
5. **Maintainable** - Changes to a method = changes to one test file
6. **Zero Technical Debt** - Follows CLAUDE.md principles

## Migration from Legacy

The original monolithic test files (`battle.test.ts`, `replay.test.ts`) are preserved for reference but should be considered legacy. All new tests should follow the Class = Directory pattern.