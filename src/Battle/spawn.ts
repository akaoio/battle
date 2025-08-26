import { createPTY } from '../PTY/index.js'
import { PTYLifecycleManager, EventListenerTracker } from '../utils/ResourceManager.js'
import { TerminalOutputBuffer } from '../utils/CircularBuffer.js'
import { CommandSanitizer, EnvSanitizer } from '../security/index.js'
import { SafeCommandMode } from '../security/SafeCommandMode.js'

export async function spawn(this: any, command?: string, args?: string[]): Promise<void> {
    // Use constructor values if not provided
    const cmd = command || this.command
    const cmdArgs = args || this.args || []
    
    if (!cmd) {
        throw new Error('No command specified. Provide command in constructor or spawn() call.')
    }
    
    // Use flexible security based on user preference
    let validation
    let sanitizedArgs = cmdArgs
    
    if (this.safeCommandMode) {
        // Use safe command mode with configurable security level
        const fullCommand = cmdArgs.length > 0 ? `${cmd} ${cmdArgs.join(' ')}` : cmd
        validation = SafeCommandMode.validateCommand(fullCommand, this.securityLevel)
        
        if (!validation.valid) {
            throw new Error(`Security validation failed: ${validation.error}`)
        }
        
        // Only sanitize args in strict mode
        if (this.securityLevel === 'strict') {
            sanitizedArgs = CommandSanitizer.sanitizeArgs(cmdArgs)
        }
    } else {
        // Legacy mode - basic validation only
        this.log('warn', 'Running in unsafe mode - security features disabled')
        validation = { valid: true }
    }
    
    this.log('info', `Spawning: ${cmd} ${sanitizedArgs.join(' ')}`)
    
    // Initialize lifecycle manager if not exists
    if (!this.ptyLifecycle) {
        this.ptyLifecycle = new PTYLifecycleManager()
    }
    
    // Kill previous PTY with proper lifecycle management
    await this.ptyLifecycle.kill()
    
    // Initialize circular buffer for output
    if (!this.outputBuffer) {
        this.outputBuffer = new TerminalOutputBuffer(1000, 10 * 1024 * 1024) // 10MB max
    }
    this.outputBuffer.clear()
    this.output = '' // Keep for backward compatibility
    
    // Record spawn event
    this.replay.record({
        type: 'spawn',
        timestamp: 0, // Will be set by record method
        data: { command: cmd, args: sanitizedArgs }
    })
    
    // Update replay metadata with sanitized env
    this.replay.data.metadata.command = cmd
    this.replay.data.metadata.args = sanitizedArgs
    this.replay.data.metadata.cols = this.options.cols
    this.replay.data.metadata.rows = this.options.rows
    this.replay.data.metadata.cwd = this.options.cwd || process.cwd()
    this.replay.data.metadata.env = EnvSanitizer.sanitize(this.options.env || {})
    
    // Create safe environment
    const safeEnv = EnvSanitizer.createSafeEnv(this.options.env)
    
    const ptyOptions = {
        name: 'xterm-256color',
        cols: this.options.cols || 80,
        rows: this.options.rows || 24,
        cwd: this.options.cwd || process.cwd(),
        env: safeEnv
    }
    
    // Create PTY with lifecycle management
    await this.ptyLifecycle.spawn(async () => {
        return await createPTY(cmd, sanitizedArgs, ptyOptions)
    })
    
    this.pty = this.ptyLifecycle.getPTY()
    
    // Initialize event tracker
    if (!this.eventTracker) {
        this.eventTracker = new EventListenerTracker()
    }
    
    // Capture all output with circular buffer
    const dataHandler = (data: string) => {
        this.outputBuffer.append(data)
        this.output = this.outputBuffer.toString() // Backward compatibility
        
        // Record output event
        this.replay.record({
            type: 'output',
            timestamp: 0,
            data
        })
        
        if (this.options.verbose) {
            process.stdout.write(data)
        }
        
        this.log('output', data)
    }
    
    this.pty.onData(dataHandler)
    this.eventTracker.track(this.pty, 'data', dataHandler)
    
    // Handle exit with cleanup
    const exitHandler = (exitData: any) => {
        const code = typeof exitData === 'number' ? exitData : (exitData?.exitCode ?? 0)
        this.log('info', `Process exited with code: ${code}`)
        this.exitCode = code
        
        // Record exit event
        this.replay.record({
            type: 'exit',
            timestamp: 0,
            data: code
        })
        
        // Clean up event listeners
        if (this.eventTracker) {
            this.eventTracker.removeAll(this.pty)
        }
    }
    
    this.pty.onExit(exitHandler)
    this.eventTracker.track(this.pty, 'exit', exitHandler)
}