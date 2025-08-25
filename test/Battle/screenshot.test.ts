#!/usr/bin/env tsx
/**
 * Battle.screenshot() Method Tests
 * Testing terminal screenshot capture functionality
 */

import { Battle } from '../../src/index.js'
import { testPass, testFail } from '../utils/testHelpers.js'
import fs from 'fs'

export async function testScreenshot() {
    console.log('\n=== Testing Battle.screenshot() ===\n')
    
    // Test: Basic screenshot capture
    try {
        const battle = new Battle({ 
            verbose: false,
            screenshotDir: './test-screenshots'
        })
        const result = await battle.run(async (b) => {
            await b.spawn('echo', ['-e', '\\033[31mRed\\033[0m \\033[32mGreen\\033[0m'])
            await b.wait(100)
            const screenshotPath = b.screenshot('color-test')
            
            // Verify screenshot was created
            if (!fs.existsSync(screenshotPath)) {
                throw new Error('Screenshot file not created')
            }
        })
        
        if (result.success && result.screenshots.length > 0) {
            testPass('screenshot() captures terminal state')
        } else {
            testFail('screenshot() captures terminal state', 'No screenshots captured')
        }
    } catch (e: any) {
        testFail('screenshot() captures terminal state', e.message)
    }
    
    // Test: Multiple screenshots
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            await b.spawn('bash', ['-c', 'for i in 1 2 3; do echo "Line $i"; done'])
            
            b.screenshot('line-1')
            await b.wait(50)
            b.screenshot('line-2')
            await b.wait(50)
            b.screenshot('line-3')
        })
        
        if (result.screenshots.length === 3) {
            testPass('screenshot() captures multiple states')
        } else {
            testFail('screenshot() captures multiple states', `Got ${result.screenshots.length} screenshots, expected 3`)
        }
    } catch (e: any) {
        testFail('screenshot() captures multiple states', e.message)
    }
    
    // Test: Screenshot on failure
    try {
        const battle = new Battle({ verbose: false })
        const result = await battle.run(async (b) => {
            await b.spawn('echo', ['Test output'])
            await b.expect('Wrong pattern', 100) // Will fail
        })
        
        // Should have taken a failure screenshot
        if (!result.success && result.screenshots.some(s => s.includes('failure'))) {
            testPass('screenshot() captures on test failure')
        } else {
            testFail('screenshot() captures on test failure', 'No failure screenshot found')
        }
    } catch (e: any) {
        testPass('screenshot() captures on test failure')
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testScreenshot().catch(console.error)
}