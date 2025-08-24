// Test standard JavaScript compatibility (CommonJS)
const { Battle, Runner, Silent } = require('../../dist/index.cjs');

console.log('Testing JS (CommonJS) compatibility...');

// Test Battle class
const battle = new Battle({ verbose: false });
console.log('✓ Battle class loaded in JS (CommonJS)');

// Test Runner class
const runner = new Runner({ verbose: false });
console.log('✓ Runner class loaded in JS (CommonJS)');

// Test Silent class
const silent = new Silent();
console.log('✓ Silent class loaded in JS (CommonJS)');

// Simple functional test
battle.run(async (b) => {
    b.spawn('echo', ['JS test']);
    await b.expect('JS test');
}).then(result => {
    if (result.success) {
        console.log('✓ Battle works in JS (CommonJS) format');
    } else {
        console.error('✗ Battle failed in JS (CommonJS) format');
    }
    process.exit(result.success ? 0 : 1);
}).catch(err => {
    console.error('✗ Error in JS test:', err.message);
    process.exit(1);
});