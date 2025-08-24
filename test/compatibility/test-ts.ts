// Test TypeScript compatibility
import { Battle, Runner, Silent } from '../../src/index';

console.log('Testing TypeScript compatibility...');

// Test Battle class with TypeScript types
const battle: Battle = new Battle({ verbose: false });
console.log('✓ Battle class loaded in TypeScript');

// Test Runner class
const runner: Runner = new Runner({ verbose: false });
console.log('✓ Runner class loaded in TypeScript');

// Test Silent class
const silent: Silent = new Silent();
console.log('✓ Silent class loaded in TypeScript');

// Simple functional test with async/await
(async () => {
    try {
        const result = await battle.run(async (b) => {
            b.spawn('echo', ['TypeScript test']);
            await b.expect('TypeScript test');
        });
        
        if (result.success) {
            console.log('✓ Battle works in TypeScript');
        } else {
            console.error('✗ Battle failed in TypeScript');
        }
        process.exit(result.success ? 0 : 1);
    } catch (err: any) {
        console.error('✗ Error in TypeScript test:', err.message);
        process.exit(1);
    }
})();