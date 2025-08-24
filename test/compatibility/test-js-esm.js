// Test standard JavaScript compatibility (ESM)
import { Battle, Runner, Silent } from '../../dist/index.js';

console.log('Testing JS (ESM) compatibility...');

// Test Battle class
const battle = new Battle({ verbose: false });
console.log('✓ Battle class loaded in JS (ESM)');

// Test Runner class
const runner = new Runner({ verbose: false });
console.log('✓ Runner class loaded in JS (ESM)');

// Test Silent class
const silent = new Silent();
console.log('✓ Silent class loaded in JS (ESM)');

// Simple functional test
battle.run(async (b) => {
    b.spawn('echo', ['JS ESM test']);
    await b.expect('JS ESM test');
}).then(result => {
    if (result.success) {
        console.log('✓ Battle works in JS (ESM) format');
    } else {
        console.error('✗ Battle failed in JS (ESM) format');
    }
    process.exit(result.success ? 0 : 1);
}).catch(err => {
    console.error('✗ Error in JS ESM test:', err.message);
    process.exit(1);
});