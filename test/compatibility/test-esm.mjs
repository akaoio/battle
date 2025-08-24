// Test ESM compatibility
import { Battle, Runner, Silent } from '../../dist/index.js';

console.log('Testing ESM compatibility...');

// Test Battle class
const battle = new Battle({ verbose: false });
console.log('✓ Battle class loaded in ESM');

// Test Runner class
const runner = new Runner({ verbose: false });
console.log('✓ Runner class loaded in ESM');

// Test Silent class
const silent = new Silent();
console.log('✓ Silent class loaded in ESM');

// Simple functional test
battle.run(async (b) => {
    b.spawn('echo', ['ESM test']);
    await b.expect('ESM test');
}).then(result => {
    if (result.success) {
        console.log('✓ Battle works in ESM format');
    } else {
        console.error('✗ Battle failed in ESM format');
    }
    process.exit(result.success ? 0 : 1);
}).catch(err => {
    console.error('✗ Error in ESM test:', err.message);
    process.exit(1);
});