/**
 * Viewport Testing - Real-time terminal resize tests
 * Tests how applications handle dynamic terminal size changes
 */

import { Battle } from '../src/index.js'

async function testViewportResize() {
    console.log('Viewport Resize Tests')
    console.log('=====================\n')
    
    const battle = new Battle({
        verbose: true,
        cols: 80,
        rows: 24
    })
    
    await battle.run(async (b) => {
        // Test 1: Start a TUI application
        console.log('Test 1: Launch vim and resize')
        b.spawn('vim', ['-c', 'set number'])
        
        await b.wait(1000)
        b.screenshot('vim-initial-80x24')
        
        // Test 2: Resize to smaller viewport
        console.log('Test 2: Resize to 40x12 (small)')
        b.resize(40, 12)
        await b.wait(500)
        b.screenshot('vim-small-40x12')
        
        // Test 3: Resize to larger viewport
        console.log('Test 3: Resize to 120x40 (large)')
        b.resize(120, 40)
        await b.wait(500)
        b.screenshot('vim-large-120x40')
        
        // Test 4: Navigate with arrow keys
        console.log('Test 4: Navigate in resized terminal')
        b.sendKey('escape')  // Ensure we're in normal mode
        await b.wait(100)
        b.sendKey('down')
        b.sendKey('down')
        b.sendKey('right')
        b.sendKey('right')
        
        // Test 5: Get cursor position
        const cursor = await b.getCursor()
        if (cursor) {
            console.log(`Cursor position: x=${cursor.x}, y=${cursor.y}`)
        }
        
        // Test 6: Exit vim
        b.sendKey('escape')
        b.sendKey(':')
        b.sendKey('q')
        b.sendKey('!')
        b.sendKey('enter')
    })
}

async function testTUIApplication() {
    console.log('\nTUI Application Resize Test')
    console.log('===========================\n')
    
    const battle = new Battle({
        verbose: false,
        cols: 80,
        rows: 24
    })
    
    await battle.run(async (b) => {
        // Test with top command (updates in real-time)
        console.log('Testing top command with resize')
        b.spawn('top')
        
        await b.wait(2000)
        console.log('Initial size: 80x24')
        b.screenshot('top-80x24')
        
        // Resize multiple times
        const sizes = [
            { cols: 60, rows: 20, name: 'small' },
            { cols: 100, rows: 30, name: 'medium' },
            { cols: 140, rows: 50, name: 'large' },
            { cols: 80, rows: 24, name: 'original' }
        ]
        
        for (const size of sizes) {
            console.log(`Resizing to ${size.cols}x${size.rows} (${size.name})`)
            b.resize(size.cols, size.rows)
            await b.wait(1000)
            b.screenshot(`top-${size.name}`)
        }
        
        // Exit top
        b.sendKey('q')
    })
}

async function testSplitPaneResize() {
    console.log('\nSplit Pane Resize Test')
    console.log('======================\n')
    
    const battle = new Battle({
        verbose: false,
        cols: 120,
        rows: 40
    })
    
    await battle.run(async (b) => {
        // Test with tmux (if available)
        console.log('Testing tmux split panes with resize')
        b.spawn('tmux', ['new-session', '-d'])
        
        await b.wait(500)
        
        // Create vertical split
        b.sendKey('ctrl+b')
        b.sendKey('%')
        await b.wait(500)
        b.screenshot('tmux-vsplit-120x40')
        
        // Resize terminal
        console.log('Resizing terminal with splits')
        b.resize(80, 24)
        await b.wait(500)
        b.screenshot('tmux-vsplit-80x24')
        
        // Create horizontal split
        b.sendKey('ctrl+b')
        b.sendKey('"')
        await b.wait(500)
        b.screenshot('tmux-hsplit-80x24')
        
        // Resize again
        b.resize(160, 50)
        await b.wait(500)
        b.screenshot('tmux-hsplit-160x50')
        
        // Exit tmux
        b.sendKey('ctrl+b')
        b.sendKey('&')
        b.sendKey('y')
    })
}

async function testResponsiveApp() {
    console.log('\nResponsive Application Test')
    console.log('===========================\n')
    
    const battle = new Battle({
        verbose: false,
        cols: 80,
        rows: 24
    })
    
    await battle.run(async (b) => {
        // Test with htop (responsive UI)
        console.log('Testing htop responsiveness')
        b.spawn('htop')
        
        await b.wait(1000)
        
        // Test extreme sizes
        const extremeSizes = [
            { cols: 20, rows: 10, name: 'tiny' },
            { cols: 200, rows: 60, name: 'huge' },
            { cols: 80, rows: 5, name: 'wide-short' },
            { cols: 30, rows: 50, name: 'narrow-tall' }
        ]
        
        for (const size of extremeSizes) {
            console.log(`Testing extreme: ${size.name} (${size.cols}x${size.rows})`)
            b.resize(size.cols, size.rows)
            await b.wait(1000)
            b.screenshot(`htop-${size.name}`)
            
            // Check if UI adapts
            if (size.cols < 40) {
                console.log('  - Testing if UI handles narrow width')
            }
            if (size.rows < 15) {
                console.log('  - Testing if UI handles short height')
            }
        }
        
        // Exit htop
        b.sendKey('f10')
    })
}

// Run all viewport tests
async function runAll() {
    try {
        await testViewportResize()
        await testTUIApplication()
        await testSplitPaneResize()
        await testResponsiveApp()
        
        console.log('\nAll viewport tests completed!')
    } catch (error) {
        console.error('Test failed:', error)
        process.exit(1)
    }
}

runAll()