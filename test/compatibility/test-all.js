#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const tests = [
    { name: 'CommonJS (.cjs)', file: 'test-cjs.cjs', command: 'node' },
    { name: 'ESM (.mjs)', file: 'test-esm.mjs', command: 'node' },
    { name: 'JavaScript ESM (.js)', file: 'test-js-esm.js', command: 'node' },
    { name: 'TypeScript (.ts)', file: 'test-ts.ts', command: 'npx', args: ['tsx'] },
];

console.log('🚀 Battle Framework Module Compatibility Test Suite\n');
console.log('Testing Battle with all JavaScript/TypeScript module formats...\n');

let passed = 0;
let failed = 0;

async function runTest(test) {
    return new Promise((resolve) => {
        const args = test.args || [];
        args.push(join(__dirname, test.file));
        
        console.log(`Testing ${test.name}...`);
        
        const child = spawn(test.command, args, {
            stdio: 'pipe',
            cwd: join(__dirname, '../..')
        });
        
        let output = '';
        child.stdout.on('data', (data) => output += data.toString());
        child.stderr.on('data', (data) => output += data.toString());
        
        child.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ ${test.name} - PASSED`);
                passed++;
            } else {
                console.log(`❌ ${test.name} - FAILED`);
                console.log(output);
                failed++;
            }
            console.log();
            resolve();
        });
    });
}

async function runAllTests() {
    for (const test of tests) {
        await runTest(test);
    }
    
    console.log('═'.repeat(50));
    console.log('\n📊 Test Results:');
    console.log(`✅ Passed: ${passed}/${tests.length}`);
    console.log(`❌ Failed: ${failed}/${tests.length}`);
    
    if (failed === 0) {
        console.log('\n🎉 Battle is ready for all module formats!');
        console.log('Supported formats: .cjs, .mjs, .js (ESM), .ts');
    } else {
        console.log('\n⚠️  Some module formats have issues.');
    }
    
    process.exit(failed > 0 ? 1 : 0);
}

runAllTests();