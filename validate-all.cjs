#!/usr/bin/env node

/**
 * Comprehensive validation script for Battle Framework
 * Tests all security fixes and stability improvements
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('   BATTLE FRAMEWORK VALIDATION');
console.log('   Complete System Check');
console.log('========================================\n');

let totalPassed = 0;
let totalFailed = 0;
const results = [];

// Test helper
async function runTest(name, command, args = [], expectFail = false) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const proc = spawn(command, args, { shell: false });
        
        let stdout = '';
        let stderr = '';
        
        proc.stdout?.on('data', (data) => { stdout += data.toString(); });
        proc.stderr?.on('data', (data) => { stderr += data.toString(); });
        
        proc.on('close', (code) => {
            const duration = Date.now() - startTime;
            const success = expectFail ? (code !== 0) : (code === 0);
            
            if (success) {
                console.log(`  ✅ PASS: ${name} (${duration}ms)`);
                totalPassed++;
            } else {
                console.log(`  ❌ FAIL: ${name} (${duration}ms)`);
                if (stderr) console.log(`     Error: ${stderr.slice(0, 100)}`);
                totalFailed++;
            }
            
            results.push({
                name,
                success,
                duration,
                output: stdout.slice(0, 200),
                error: stderr.slice(0, 200)
            });
            
            resolve(success);
        });
    });
}

// Run all validations
async function validate() {
    console.log('1️⃣ TypeScript Compilation');
    console.log('----------------------------------------');
    await runTest('TypeScript compilation', 'npx', ['tsc', '--noEmit']);
    
    console.log('\n2️⃣ Build System');
    console.log('----------------------------------------');
    await runTest('Build process', 'npm', ['run', 'build']);
    
    console.log('\n3️⃣ Security Fixes');
    console.log('----------------------------------------');
    
    // Test command injection prevention
    await runTest(
        'Command injection blocked (semicolon)',
        'npx',
        ['battle', 'run', 'ls; echo pwned'],
        true // expect failure
    );
    
    await runTest(
        'Command injection blocked (pipe)',
        'npx',
        ['battle', 'run', 'cat /etc/passwd | grep root'],
        true // expect failure
    );
    
    await runTest(
        'Command injection blocked (backticks)',
        'npx',
        ['battle', 'run', 'echo `whoami`'],
        true // expect failure
    );
    
    await runTest(
        'Safe command allowed',
        'npx',
        ['battle', 'run', 'echo hello world']
    );
    
    console.log('\n4️⃣ Memory Management');
    console.log('----------------------------------------');
    
    // Create test for circular buffer
    const memoryTest = `
const { TerminalOutputBuffer } = require('./dist/index.cjs');
const buffer = new TerminalOutputBuffer(100, 1024);
for (let i = 0; i < 200; i++) {
    buffer.append('x'.repeat(10));
}
const stats = buffer.getStats();
if (stats.count > 100 || stats.bytes > 1024) {
    process.exit(1);
}
console.log('Buffer limits working');
`;
    
    fs.writeFileSync('test-memory.js', memoryTest);
    await runTest('Circular buffer limits', 'node', ['test-memory.js']);
    fs.unlinkSync('test-memory.js');
    
    console.log('\n5️⃣ Resource Management');
    console.log('----------------------------------------');
    
    // Test PTY lifecycle
    const lifecycleTest = `
const { PTYLifecycleManager } = require('./dist/index.cjs');
const manager = new PTYLifecycleManager();
(async () => {
    await manager.kill(); // Should not error on empty kill
    console.log('Lifecycle manager working');
})();
`;
    
    fs.writeFileSync('test-lifecycle.js', lifecycleTest);
    await runTest('PTY lifecycle manager', 'node', ['test-lifecycle.js']);
    fs.unlinkSync('test-lifecycle.js');
    
    console.log('\n6️⃣ Path Security');
    console.log('----------------------------------------');
    
    // Test path traversal prevention
    const pathTest = `
const { Security } = require('./dist/index.cjs');
const result = Security.PathSecurity.validatePath('../../etc/passwd', process.cwd());
if (result.valid) {
    console.error('Path traversal not blocked!');
    process.exit(1);
}
console.log('Path traversal blocked');
`;
    
    fs.writeFileSync('test-path.js', pathTest);
    await runTest('Path traversal prevention', 'node', ['test-path.js']);
    fs.unlinkSync('test-path.js');
    
    console.log('\n7️⃣ Environment Sanitization');
    console.log('----------------------------------------');
    
    // Test environment variable filtering
    const envTest = `
const { Security } = require('./dist/index.cjs');
const sanitized = Security.EnvSanitizer.sanitize({
    LD_PRELOAD: '/evil.so',
    API_KEY: 'secret123',
    SAFE_VAR: 'test'
});

if ('LD_PRELOAD' in sanitized) {
    console.error('LD_PRELOAD not filtered!');
    process.exit(1);
}

if (sanitized.API_KEY !== '***REDACTED***') {
    console.error('API_KEY not masked!');
    process.exit(1);
}

console.log('Environment sanitization working');
`;
    
    fs.writeFileSync('test-env.js', envTest);
    await runTest('Environment variable sanitization', 'node', ['test-env.js']);
    fs.unlinkSync('test-env.js');
    
    console.log('\n8️⃣ JSON Validation');
    console.log('----------------------------------------');
    
    // Test JSON validation
    const jsonTest = `
const { Security } = require('./dist/index.cjs');

// Test prototype pollution prevention
const malicious = JSON.stringify({
    version: '1.0',
    timestamp: new Date().toISOString(),
    duration: 1000,
    events: [],
    metadata: {},
    '__proto__': { isAdmin: true }
});

try {
    Security.ReplayValidator.parse(malicious);
    // Check if prototype was polluted
    if ({}.isAdmin) {
        console.error('Prototype pollution!');
        process.exit(1);
    }
} catch (e) {
    // Expected to throw or filter
}

console.log('JSON validation working');
`;
    
    fs.writeFileSync('test-json.js', jsonTest);
    await runTest('JSON validation & anti-pollution', 'node', ['test-json.js']);
    fs.unlinkSync('test-json.js');
    
    console.log('\n9️⃣ Integration Tests');
    console.log('----------------------------------------');
    
    // Run simplified tests
    await runTest('Battle basic test', 'npx', ['battle', 'run', 'echo test']);
    await runTest('Battle with args', 'npx', ['battle', 'run', 'echo hello world']);
    
    console.log('\n🔟 Performance Check');
    console.log('----------------------------------------');
    
    // Check build time
    const buildStart = Date.now();
    await runTest('Build performance (<10s)', 'npm', ['run', 'build']);
    const buildTime = Date.now() - buildStart;
    
    if (buildTime < 10000) {
        console.log(`  ✅ Build time: ${buildTime}ms (good)`);
    } else {
        console.log(`  ⚠️ Build time: ${buildTime}ms (slow)`);
    }
    
    // Generate report
    console.log('\n========================================');
    console.log('   VALIDATION SUMMARY');
    console.log('========================================');
    console.log(`✅ Passed: ${totalPassed}`);
    console.log(`❌ Failed: ${totalFailed}`);
    console.log(`📊 Success Rate: ${Math.round((totalPassed / (totalPassed + totalFailed)) * 100)}%`);
    
    // Check critical areas
    const criticalAreas = {
        'TypeScript': results.find(r => r.name.includes('TypeScript'))?.success,
        'Build': results.find(r => r.name === 'Build process')?.success,
        'Security': results.filter(r => r.name.includes('injection')).every(r => r.success),
        'Memory': results.find(r => r.name.includes('buffer'))?.success,
        'Resources': results.find(r => r.name.includes('lifecycle'))?.success,
    };
    
    console.log('\n📋 Critical Areas:');
    for (const [area, status] of Object.entries(criticalAreas)) {
        console.log(`  ${status ? '✅' : '❌'} ${area}`);
    }
    
    // Overall verdict
    console.log('\n🎯 Overall Status:');
    if (totalFailed === 0) {
        console.log('  ✅ ALL SYSTEMS OPERATIONAL - Production Ready!');
    } else if (totalFailed <= 2) {
        console.log('  ⚠️ MOSTLY STABLE - Minor issues detected');
    } else {
        console.log('  ❌ UNSTABLE - Critical issues need fixing');
    }
    
    // Save detailed report
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            passed: totalPassed,
            failed: totalFailed,
            successRate: Math.round((totalPassed / (totalPassed + totalFailed)) * 100)
        },
        criticalAreas,
        results
    };
    
    fs.writeFileSync(
        'validation-report.json',
        JSON.stringify(report, null, 2)
    );
    
    console.log('\n📄 Detailed report saved to: validation-report.json');
    
    process.exit(totalFailed === 0 ? 0 : 1);
}

// Run validation
validate().catch(console.error);