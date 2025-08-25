#!/usr/bin/env node
/**
 * REAL test - no fake code, actual functionality test
 */

import { Battle } from '../dist/index.js';

async function realTest() {
    console.log('REAL Battle Test - No fake code\n');
    
    const battle = new Battle({ verbose: true, timeout: 5000 });
    
    try {
        const result = await battle.run(async (b) => {
            // This should actually spawn echo and capture output
            await b.spawn('echo', ['REAL OUTPUT TEST']);
            await b.wait(100);
            await b.expect('REAL OUTPUT TEST');
        });
        
        console.log('\nTest result:', result.success ? 'PASSED' : 'FAILED');
        console.log('Output captured:', result.output.trim());
        
        if (!result.success) {
            console.log('Error:', result.error);
        }
        
        return result.success;
    } catch (err) {
        console.error('ACTUAL ERROR:', err);
        return false;
    }
}

realTest().then(success => {
    process.exit(success ? 0 : 1);
});