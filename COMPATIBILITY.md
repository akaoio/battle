# Battle Framework - Module Format Compatibility

## ✅ Full Compatibility Matrix

Battle v1.0.0 has been tested and confirmed to work with all JavaScript/TypeScript module formats:

| Format | Extension | Import Method | Status | Test File |
|--------|-----------|---------------|--------|-----------|
| CommonJS | `.cjs` | `require()` | ✅ Passed | `test/compatibility/test-cjs.cjs` |
| ES Modules | `.mjs` | `import` | ✅ Passed | `test/compatibility/test-esm.mjs` |
| ES Modules | `.js` | `import` | ✅ Passed | `test/compatibility/test-js-esm.js` |
| TypeScript | `.ts` | `import` | ✅ Passed | `test/compatibility/test-ts.ts` |

## Package Configuration

Battle is configured as a dual-package supporting both CommonJS and ES Modules:

```json
{
  "type": "module",
  "main": "dist/index.cjs",
  "module": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

## Usage Examples

### CommonJS (.cjs or .js with CommonJS)
```javascript
const { Battle, Runner, Silent } = require('@akaoio/battle');

const battle = new Battle({ verbose: false });
await battle.run(async (b) => {
    b.spawn('echo', ['test']);
    await b.expect('test');
});
```

### ES Modules (.mjs or .js with "type": "module")
```javascript
import { Battle, Runner, Silent } from '@akaoio/battle';

const battle = new Battle({ verbose: false });
await battle.run(async (b) => {
    b.spawn('echo', ['test']);
    await b.expect('test');
});
```

### TypeScript (.ts)
```typescript
import { Battle, Runner, Silent, BattleOptions } from '@akaoio/battle';

const options: BattleOptions = {
    verbose: false,
    cols: 80,
    rows: 24
};

const battle = new Battle(options);
await battle.run(async (b) => {
    b.spawn('echo', ['test']);
    await b.expect('test');
});
```

## Build Output

The TypeScript source is compiled to multiple formats using tsup:

- `dist/index.js` - ES Module format
- `dist/index.cjs` - CommonJS format  
- `dist/index.d.ts` - TypeScript declarations

## Testing All Formats

Run the compatibility test suite:

```bash
node test/compatibility/test-all.js
```

This will test all module formats and report the results:

```
🚀 Battle Framework Module Compatibility Test Suite

Testing Battle with all JavaScript/TypeScript module formats...

✅ CommonJS (.cjs) - PASSED
✅ ESM (.mjs) - PASSED
✅ JavaScript ESM (.js) - PASSED
✅ TypeScript (.ts) - PASSED

📊 Test Results:
✅ Passed: 4/4
❌ Failed: 0/4

🎉 Battle is ready for all module formats!
```

## TypeScript Support

Battle includes comprehensive TypeScript definitions:

- Full type definitions for all classes and methods
- Strict typing for options and results
- IntelliSense support in IDEs
- Compatible with strict TypeScript configurations

## Node.js Version Support

- **Minimum**: Node.js 18.0.0 (for native ES Module support)
- **Recommended**: Node.js 20.0.0 or later
- **TypeScript**: Works with tsx, ts-node, and compiled output

## Runtime Compatibility

Battle works with various JavaScript runtimes:

- ✅ **Node.js** - Full support with all module formats
- ✅ **tsx** - Direct TypeScript execution
- ✅ **ts-node** - TypeScript execution with CommonJS
- ⚠️ **Bun** - Partial support (PTY implementation differences)
- ⚠️ **Deno** - Not tested (different module system)

## Bundler Compatibility

Battle can be bundled with common tools:

- ✅ **tsup** - Used for building Battle itself
- ✅ **esbuild** - Works with both CJS and ESM targets
- ✅ **webpack** - Compatible with appropriate configuration
- ✅ **rollup** - Works with @rollup/plugin-node-resolve
- ✅ **vite** - Works for Node.js targets

## Migration Guide

### From CommonJS to ES Modules

If your project uses CommonJS:
```javascript
// Old (CommonJS)
const { Battle } = require('@akaoio/battle');

// New (ES Modules) 
import { Battle } from '@akaoio/battle';
```

### From JavaScript to TypeScript

Add type annotations for better IDE support:
```typescript
// JavaScript
const battle = new Battle({ verbose: false });

// TypeScript with types
import { Battle, BattleOptions } from '@akaoio/battle';

const options: BattleOptions = { verbose: false };
const battle: Battle = new Battle(options);
```

## Troubleshooting

### "Cannot use import statement outside a module"

Add `"type": "module"` to your package.json or rename files to `.mjs`

### "require() of ES Module not supported"

Use the `.cjs` extension or import syntax instead of require

### TypeScript compilation errors

Ensure your tsconfig.json has:
```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

## Summary

✅ **Battle is fully ready for all JavaScript and TypeScript module formats**

The framework provides:
- Dual-package support (CommonJS + ES Modules)
- Full TypeScript definitions
- Compatibility with all major bundlers
- Support for Node.js 18+
- Comprehensive test coverage for all formats

No matter your project's module system, Battle will work seamlessly!