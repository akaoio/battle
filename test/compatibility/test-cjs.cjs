// Test CommonJS compatibility
const { Battle, Runner, Silent } = require('../../dist/index.cjs');

console.log('Testing CJS compatibility...');

// Test Battle class
const battle = new Battle({ verbose: false });
console.log('✓ Battle class loaded in CJS');

// Test Runner class
const runner = new Runner({ verbose: false });
console.log('✓ Runner class loaded in CJS');

// Test Silent class
const silent = new Silent();
console.log('✓ Silent class loaded in CJS');

// Simple functional test
battle.run(async (b) => {
    b.spawn('echo', ['CJS test']);
    await b.expect('CJS test');
}).then(result => {
    if (result.success) {
        console.log('✓ Battle works in CJS format');
    } else {
        console.error('✗ Battle failed in CJS format');
    }
    process.exit(result.success ? 0 : 1);
}).catch(err => {
    console.error('✗ Error in CJS test:', err.message);
    process.exit(1);
});