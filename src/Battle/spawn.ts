import { createPTY } from '../PTY/index.js'

export async function spawn(this: any, command: string, args: string[] = []): Promise<void> {
    this.log('info', `Spawning: ${command} ${args.join(' ')}`)
    
    // Kill previous PTY if exists
    if (this.pty && !this.pty.killed) {
        this.pty.kill()
        await new Promise(resolve => setTimeout(resolve, 100)) // Wait for cleanup
    }
    
    // Clear output buffer for new spawn
    this.output = ''
    
    // Record spawn event
    this.replay.record({
        type: 'spawn',
        timestamp: 0, // Will be set by record method
        data: { command, args }
    })
    
    // Update replay metadata
    this.replay.data.metadata.command = command
    this.replay.data.metadata.args = args
    
    // Use compatibility layer to create PTY
    this.pty = await createPTY(command, args, {
        name: 'xterm-256color',
        cols: this.options.cols,
        rows: this.options.rows,
        cwd: this.options.cwd,
        env: {
            ...this.options.env,
            TERM: 'xterm-256color',
            FORCE_COLOR: '1'
        }
    })
    
    // Capture all output and record it
    this.pty.onData((data: string) => {
        this.output += data
        
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
    })
    
    // Handle exit
    this.pty.onExit((exitData: any) => {
        this.log('info', `Process exited with code: ${exitData.exitCode}`)
        this.exitCode = exitData.exitCode
        
        // Record exit event
        this.replay.record({
            type: 'exit',
            timestamp: 0,
            data: exitData.exitCode
        })
    })
}