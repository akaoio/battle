import { color as chalk } from '../utils/colors.js'
import { PlaybackEngine, formatTime, getEventDescription } from './PlaybackEngine.js'

export async function play(this: any, options: any = {}): Promise<void> {
    // Capture replay data and events
    const replayData = this.data
    const events = this.events
    const totalDuration = replayData.duration
    const totalEvents = events.length
    
    // Create unified playback engine
    const engine = new PlaybackEngine(events, totalDuration, {
        speed: options.speed || 1.0,
        verbose: options.verbose,
        onEvent: (event, state) => executeEvent(event, state),
        onStateChange: (state) => updateStatusLine(state),
        onProgress: (progress, state) => updateStatusLine(state)
    })
    
    // Initialize replay output buffer (no PTY needed for replay)
    let replayOutput = ''
    
    // Clear screen and show initial UI
    console.clear()
    showHeader(replayData, totalDuration, totalEvents)
    showControls()
    updateStatusLine(engine.getState())
    
    // Setup terminal for raw input
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(true)
    }
    process.stdin.resume()
    
    // Keyboard input handler
    const handleKeypress = (chunk: Buffer) => {
        const key = chunk.toString()
        
        switch (key) {
            case ' ': // Space - Play/Pause
                if (engine.isPlaying()) {
                    engine.pause()
                } else {
                    engine.play()
                }
                break
                
            case 's': // Stop
                engine.stop()
                clearTerminal()
                break
                
            case 'r': // Restart
                engine.restart()
                clearTerminal()
                break
                
            case 'e': // End
                engine.jumpToEnd()
                break
                
            case '+': // Speed up
            case '=':
                engine.setSpeed(Math.min(50, engine.getSpeed() * 2))
                break
                
            case '-': // Speed down
                engine.setSpeed(Math.max(0.1, engine.getSpeed() / 2))
                break
                
            case '0': // Pause (0x speed)
                engine.setSpeed(0)
                engine.pause()
                break
                
            case '1': // 1x speed
                engine.setSpeed(1)
                break
                
            case '2': // 2x speed
                engine.setSpeed(2)
                break
                
            case '4': // 4x speed
                engine.setSpeed(4)
                break
                
            case '\u001b': // Escape - quit
            case 'q':
                cleanup()
                process.exit(0)
                break
                
            case '\u001b[C': // Right arrow - skip forward
                engine.skipForward(1000)
                break
                
            case '\u001b[D': // Left arrow - skip backward
                engine.skipBackward(1000)
                break
        }
    }
    
    process.stdin.on('data', handleKeypress)
    
    // Event execution handler
    function executeEvent(event: any, state: any) {
        const eventDisplay = getEventDescription(event)
        
        // Show event in status area
        process.stdout.write('\u001b[s') // Save cursor
        process.stdout.write('\u001b[H')  // Go to top
        process.stdout.write('\u001b[12;1H') // Go to event line
        process.stdout.write('\u001b[K')     // Clear line
        process.stdout.write(`📺 Event: ${chalk.cyan(eventDisplay)}`)
        process.stdout.write('\u001b[u')     // Restore cursor
        
        // Execute event logic
        switch (event.type) {
            case 'output':
                // Display the output
                process.stdout.write('\u001b[14;1H') // Go to output area
                process.stdout.write(event.data)
                break
                
            case 'input':
                // Just track input in the output buffer for replay
                replayOutput += event.data
                break
                
            case 'resize':
                // Update terminal size display
                process.stdout.write('\u001b[s')
                process.stdout.write('\u001b[12;1H')
                process.stdout.write('\u001b[K')
                process.stdout.write(`📐 Terminal resized to ${event.data.cols}x${event.data.rows}`)
                process.stdout.write('\u001b[u')
                break
                
            case 'key':
                // Visual indicator for key press
                process.stdout.write('\u001b[s')
                process.stdout.write('\u001b[13;1H')
                process.stdout.write('\u001b[K')
                process.stdout.write(`⌨️  Key pressed: ${chalk.green(event.data)}`)
                process.stdout.write('\u001b[u')
                break
        }
    }
    
    // Update status line
    function updateStatusLine(state: any) {
        const progress = engine.getProgress()
        const progressBar = createProgressBar(progress)
        
        const currentTimeStr = formatTime(engine.getCurrentTime())
        const totalTimeStr = formatTime(totalDuration)
        
        const statusIcon = state.isPlaying ? '▶️' : (state.isPaused ? '⏸️' : '⏹️')
        const speedDisplay = state.speed === 0 ? '⏸️ 0×' : `🚀 ${state.speed}×`
        
        // Save cursor, go to status line, update, restore cursor
        process.stdout.write('\u001b[s')   // Save cursor
        process.stdout.write('\u001b[10;1H') // Go to line 10
        process.stdout.write('\u001b[K')     // Clear line
        
        process.stdout.write(
            `${statusIcon} ${progressBar} ${chalk.yellow(currentTimeStr)}/${chalk.yellow(totalTimeStr)} ${speedDisplay} ` +
            `[${state.currentEventIndex}/${totalEvents}]`
        )
        
        process.stdout.write('\u001b[u')   // Restore cursor
    }
    
    function clearTerminal() {
        console.clear()
        showHeader(replayData, totalDuration, totalEvents)
        showControls()
        updateStatusLine(engine.getState())
    }
    
    function cleanup() {
        engine.destroy()
        // No PTY to kill
        
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(false)
        }
        process.stdin.pause()
        
        console.clear()
        console.log(chalk.green('Battle Replay Player - Goodbye!'))
    }
    
    // Handle process termination
    process.on('SIGINT', cleanup)
    process.on('SIGTERM', cleanup)
    
    // Auto-start playback if not in manual mode
    if (!options.manual) {
        engine.play()
    }
    
    // Keep the process alive
    return new Promise((resolve) => {
        const checkComplete = () => {
            const state = engine.getState()
            if (!state.isPlaying && state.currentEventIndex >= totalEvents) {
                cleanup()
                resolve()
            } else {
                setTimeout(checkComplete, 100)
            }
        }
        
        if (options.manual) {
            // In manual mode, never auto-exit
            // User must press Q or ESC
        } else {
            checkComplete()
        }
    })
}

function showHeader(data: any, duration: number, totalEvents: number) {
    console.log(chalk.blue.bold('🎬 Battle Replay Player - YouTube Style Controls'))
    console.log(chalk.gray(`📼 File: ${data.version} | 📅 ${data.timestamp}`))
    console.log(chalk.gray(`⏱️  Duration: ${formatTime(duration)} | 🎯 Events: ${totalEvents}`))
    console.log('')
}

function showControls() {
    console.log(chalk.cyan.bold('🎮 CONTROLS:'))
    console.log(chalk.white('  SPACE') + chalk.gray(' - Play/Pause  ') + 
              chalk.white('S') + chalk.gray(' - Stop  ') + 
              chalk.white('R') + chalk.gray(' - Restart  ') + 
              chalk.white('E') + chalk.gray(' - End'))
    console.log(chalk.white('  +/-  ') + chalk.gray(' - Speed Up/Down  ') + 
              chalk.white('0-4') + chalk.gray(' - Speed Presets  ') + 
              chalk.white('←→') + chalk.gray(' - Skip'))
    console.log(chalk.white('  Q/ESC') + chalk.gray(' - Quit'))
    console.log('')
}

function createProgressBar(percent: number, width: number = 40): string {
    const filled = Math.min(Math.max(Math.round((percent / 100) * width), 0), width)
    const empty = Math.max(width - filled, 0)
    
    const filledBar = '█'.repeat(filled)
    const emptyBar = '░'.repeat(empty)
    
    return chalk.red(filledBar) + chalk.gray(emptyBar) + ` ${percent.toFixed(1)}%`
}