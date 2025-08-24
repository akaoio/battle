// Test TypeScript type definitions
import { Battle, Runner, Silent, BattleOptions, RunnerOptions, TestResult } from '../../src/index';

// Test type inference
const battleOptions: BattleOptions = {
    verbose: true,
    cols: 120,
    rows: 40,
    cwd: '/tmp',
    env: { NODE_ENV: 'test' },
    timeout: 10000
};

const runnerOptions: RunnerOptions = {
    verbose: false,
    exitOnFailure: true
};

// Test Battle class types
const battle = new Battle(battleOptions);

// Test method signatures
async function testBattleTypes() {
    // spawn method
    battle.spawn('ls', ['-la']);
    
    // expect method - string pattern
    await battle.expect('file.txt', 5000);
    
    // expect method - regex pattern
    await battle.expect(/pattern.*test/, 3000);
    
    // sendKeys method
    battle.sendKeys('hello world');
    
    // sendKey method
    battle.sendKey('enter');
    battle.sendKey('escape');
    
    // wait method
    await battle.wait(1000);
    
    // screenshot method
    const screenshot: string = await battle.screenshot();
    
    // resize method
    battle.resize(80, 24);
    
    // cleanup method
    battle.cleanup();
    
    // run method with async callback
    const result: TestResult = await battle.run(async (b: Battle) => {
        b.spawn('echo', ['test']);
        await b.expect('test');
    });
    
    // TestResult properties
    console.log('Success:', result.success);
    console.log('Error:', result.error);
    console.log('Output:', result.output);
    console.log('Duration:', result.duration);
    console.log('Replay path:', result.replayPath);
}

// Test Runner class types
const runner = new Runner(runnerOptions);

// Test Runner methods
runner.test('Test name', {
    command: 'echo',
    args: ['hello'],
    expectations: ['hello'],
    timeout: 5000,
    setup: async () => console.log('Setup'),
    teardown: async () => console.log('Teardown'),
    skip: false
});

runner.run().then(results => {
    console.log('Total tests:', results.total);
    console.log('Passed:', results.passed);
    console.log('Failed:', results.failed);
    console.log('Skipped:', results.skipped);
});

// Test Silent class
const silent = new Silent();
// Test Silent methods
const execResult = silent.exec('echo test');
const isRunning = silent.isRunning('node');
const portOpen = silent.isPortOpen(3000);
const fileExists = silent.fileExists('/tmp/test.txt');
const logs = silent.getLogs();

// Test type exports
type BattleType = Battle;
type RunnerType = Runner;
type SilentType = Silent;
type OptionsType = BattleOptions;
type ResultType = TestResult;

console.log('✅ All TypeScript types are working correctly!');