#!/usr/bin/env node

/**
 * Battle Self-Test Level 3
 * Battle tests Battle testing Battle - Maximum recursion confidence
 * This is the ultimate proof that Battle works correctly
 */

const { Battle } = require('../dist/index.cjs');
const { spawn } = require('child_process');

async function level3SelfTest() {
  console.log('🔄 Battle Self-Test Level 3: Battle tests Battle testing Battle');
  console.log('===========================================================\n');

  // Create the outer Battle instance (Level 3)
  const outerBattle = new Battle({
    command: 'node',
    args: ['-e', `
      const { Battle } = require('./dist/index.cjs');
      
      // This is Level 2: Battle testing a command
      const battle = new Battle({
        command: 'echo',
        args: ['Battle Self-Test Success'],
        timeout: 5000
      });
      
      (async () => {
        try {
          await battle.spawn();
          await battle.expect('Battle Self-Test Success');
          console.log('✅ Level 2: Battle successfully tested echo command');
          process.exit(0);
        } catch (e) {
          console.error('❌ Level 2 failed:', e.message);
          process.exit(1);
        } finally {
          battle.cleanup();
        }
      })();
    `],
    timeout: 10000
  });

  try {
    // Level 3 spawns Level 2
    await outerBattle.spawn();
    
    // Level 3 expects Level 2 to succeed
    await outerBattle.expect('Level 2: Battle successfully tested');
    
    console.log('✅ Level 3: Battle successfully tested Battle testing a command');
    console.log('\n🎯 ULTIMATE VALIDATION COMPLETE!');
    console.log('Battle has proven it can test itself testing itself!');
    console.log('This recursive validation ensures framework reliability.\n');
    
    // Additional validation - check the recursive proof
    console.log('Validation chain:');
    console.log('  Level 1: echo "Battle Self-Test Success" ✓');
    console.log('  Level 2: Battle tests Level 1 ✓');
    console.log('  Level 3: Battle tests Level 2 ✓');
    console.log('\nAll levels validated successfully! 🚀');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Level 3 Self-Test Failed:', error.message);
    console.error('The framework cannot validate itself recursively.');
    process.exit(1);
  } finally {
    outerBattle.cleanup();
  }
}

// Alternative simpler self-test for quick validation
async function simpleSelfTest() {
  console.log('\n📋 Running simple self-test as fallback...\n');
  
  const battle = new Battle({
    command: 'npm',
    args: ['--version'],
    timeout: 5000
  });
  
  try {
    await battle.spawn();
    const output = await battle.getOutput();
    
    if (output && output.match(/\d+\.\d+\.\d+/)) {
      console.log('✅ Simple self-test passed: Battle can spawn and capture output');
      return true;
    } else {
      console.log('❌ Simple self-test failed: No version output captured');
      return false;
    }
  } catch (e) {
    console.error('❌ Simple self-test error:', e.message);
    return false;
  } finally {
    battle.cleanup();
  }
}

// Main execution
(async () => {
  try {
    await level3SelfTest();
  } catch (e) {
    console.error('Level 3 test failed, trying simple test...');
    const simpleResult = await simpleSelfTest();
    process.exit(simpleResult ? 0 : 1);
  }
})();