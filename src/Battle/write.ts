export function write(this: any, data: string): void {
    if (!this.pty) {
        throw new Error('No PTY process running. Call spawn() first.')
    }
    
    if (this.pty.killed) {
        throw new Error('PTY process has already exited')
    }
    
    this.log('input', `Writing: ${JSON.stringify(data)}`)
    
    // Record input event
    this.replay.record({
        type: 'input',
        timestamp: 0,
        data
    })
    
    // Write directly to PTY
    this.pty.write(data)
}