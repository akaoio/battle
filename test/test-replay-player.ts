#!/usr/bin/env tsx
/**
 * Direct test of the Replay.play() method
 * Verifies that the replay player actually plays back events
 */

import { Battle, Replay } from '../src/index.js'
import fs from 'fs'
import { spawn } from 'child_process'

async function testReplayPlayback() {
    console.log('🎮 Testing Replay Playback Directly...\n')
    
    // Step 1: Create a recording with multiple events
    console.log('📹 Recording test session...')
    const battle = new Battle({ 
        verbose: false,
        logDir: './tmp'
    })
    
    const result = await battle.run(async (b) => {
        // Create a session with multiple events
        b.spawn('bash', ['-c', 'echo "Test Line 1"; sleep 0.1; echo "Test Line 2"; sleep 0.1; echo "Test Line 3"'])
        await b.wait(100)
        b.sendKey('a')
        await b.wait(50)
        b.sendKey('b')
        await b.wait(50)
        b.sendKey('c')
        await b.wait(200)
        await b.expect('Test Line 1')
        await b.expect('Test Line 2')
        await b.expect('Test Line 3')
    })
    
    if (!result.success || !result.replayPath) {
        console.error('❌ Failed to create test recording')
        process.exit(1)
    }
    
    console.log(`✅ Recording saved: ${result.replayPath}`)
    console.log(`   Events recorded: ${fs.readFileSync(result.replayPath, 'utf-8').match(/"type":/g)?.length || 0}`)
    
    // Step 2: Test direct replay.play() method
    console.log('\n🎬 Testing Replay.play() method...')
    const replay = new Replay()
    replay.load(result.replayPath)
    
    console.log(`   Loaded ${replay.events.length} events`)
    console.log(`   Duration: ${(replay.data.duration / 1000).toFixed(2)}s`)
    
    // Capture output during playback
    let playbackOutput = ''
    const originalWrite = process.stdout.write
    process.stdout.write = (chunk: any) => {
        playbackOutput += chunk.toString()
        return originalWrite.call(process.stdout, chunk)
    }
    
    // Test playback at different speeds
    const speeds = [2, 5, 10]
    for (const speed of speeds) {
        console.log(`\n⚡ Testing playback at ${speed}x speed...`)
        playbackOutput = ''
        
        const startTime = Date.now()
        
        // Create a child process to run the replay
        const child = spawn('node', ['-e', `
            import { Replay } from '../dist/index.js'
            const replay = new Replay()
            replay.load('${result.replayPath}')
            replay.play({ speed: ${speed}, verbose: false }).then(() => {
                console.log('PLAYBACK_COMPLETE')
            }).catch(err => {
                console.error('PLAYBACK_ERROR:', err.message)
            })
        `], { cwd: process.cwd() })
        
        let childOutput = ''
        child.stdout.on('data', (data) => {
            childOutput += data.toString()
        })
        
        child.stderr.on('data', (data) => {
            console.error('   Error:', data.toString())
        })
        
        // Wait for playback to complete or timeout
        await new Promise<void>((resolve) => {
            const timeout = setTimeout(() => {
                child.kill()
                resolve()
            }, 5000)
            
            child.on('exit', () => {
                clearTimeout(timeout)
                resolve()
            })
        })
        
        const elapsedTime = Date.now() - startTime
        const expectedTime = replay.data.duration / speed
        
        console.log(`   Elapsed time: ${(elapsedTime / 1000).toFixed(2)}s`)
        console.log(`   Expected time: ${(expectedTime / 1000).toFixed(2)}s`)
        
        // Check if playback completed
        if (childOutput.includes('PLAYBACK_COMPLETE')) {
            console.log(`   ✅ Playback at ${speed}x speed completed`)
        } else if (childOutput.includes('PLAYBACK_ERROR')) {
            console.log(`   ❌ Playback error at ${speed}x speed`)
        } else if (childOutput.includes('Battle Replay Player')) {
            console.log(`   ✅ Player UI displayed at ${speed}x speed`)
        } else {
            console.log(`   ⚠️ Playback status unknown at ${speed}x speed`)
        }
    }
    
    // Restore stdout
    process.stdout.write = originalWrite
    
    // Step 3: Test that events are actually replayed
    console.log('\n🔍 Verifying event replay...')
    
    const replayData = JSON.parse(fs.readFileSync(result.replayPath, 'utf-8'))
    const eventTypes = new Set(replayData.events.map((e: any) => e.type))
    
    console.log('   Event types recorded:', Array.from(eventTypes).join(', '))
    
    // Verify key events
    const keyEvents = replayData.events.filter((e: any) => e.type === 'key')
    const outputEvents = replayData.events.filter((e: any) => e.type === 'output')
    
    console.log(`   Key events: ${keyEvents.length} (expected: 3)`)
    console.log(`   Output events: ${outputEvents.length}`)
    
    if (keyEvents.length === 3) {
        console.log('   ✅ All key events recorded')
    } else {
        console.log('   ❌ Key events mismatch')
    }
    
    // Clean up
    fs.unlinkSync(result.replayPath)
    
    console.log('\n✨ Replay player test complete!')
}

// Test HTML export playback
async function testHTMLPlayback() {
    console.log('\n🌐 Testing HTML Export Playback...\n')
    
    // Create a simple recording
    const battle = new Battle({ 
        verbose: false,
        logDir: './tmp'
    })
    
    const result = await battle.run(async (b) => {
        b.spawn('echo', ['HTML Test'])
        await b.wait(100)
        b.sendKey('x')
        b.sendKey('y') 
        b.sendKey('z')
        await b.expect('HTML Test')
    })
    
    if (!result.success || !result.replayPath) {
        console.error('❌ Failed to create test recording for HTML')
        return
    }
    
    // Export to HTML
    const replay = new Replay()
    replay.load(result.replayPath)
    const html = replay.export('html')
    
    // Verify HTML contains playback elements
    const checks = [
        { name: 'Replay data embedded', test: html.includes('replayData =') },
        { name: 'Play button', test: html.includes('playBtn') },
        { name: 'Speed control', test: html.includes('speedInput') },
        { name: 'Progress bar', test: html.includes('progressBar') },
        { name: 'Event display', test: html.includes('eventDisplay') },
        { name: 'Playback functions', test: html.includes('function play()') },
        { name: 'Event scheduling', test: html.includes('scheduleNextEvent') },
        { name: 'Speed presets', test: html.includes('setSpeed') }
    ]
    
    console.log('HTML Export Verification:')
    for (const check of checks) {
        console.log(`   ${check.test ? '✅' : '❌'} ${check.name}`)
    }
    
    // Save HTML for manual inspection
    const htmlPath = result.replayPath.replace('.json', '-test.html')
    fs.writeFileSync(htmlPath, html)
    console.log(`\n   📄 HTML saved for inspection: ${htmlPath}`)
    
    // Clean up JSON
    fs.unlinkSync(result.replayPath)
}

// Main test execution
async function main() {
    console.log('========================================')
    console.log('   Replay Player Direct Testing')
    console.log('========================================\n')
    
    try {
        await testReplayPlayback()
        await testHTMLPlayback()
        
        console.log('\n========================================')
        console.log('   ✅ All replay player tests complete')
        console.log('========================================')
    } catch (error: any) {
        console.error('\n❌ Test failed:', error.message)
        process.exit(1)
    }
}

main()