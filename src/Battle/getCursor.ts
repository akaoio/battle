/**
 * Get cursor position from terminal
 * Useful for testing cursor movement and positioning
 */

export async function getCursor(this: any): Promise<{ x: number; y: number } | null> {
    if (!this.pty) {
        throw new Error('No PTY process')
    }
    
    return new Promise((resolve) => {
        let response = ''
        const timeout = setTimeout(() => {
            this.log('warn', 'Cursor position request timeout')
            resolve(null)
        }, 1000)
        
        const handler = (data: string) => {
            response += data
            
            // Parse cursor position response: ESC[row;colR
            const match = response.match(/\x1b\[(\d+);(\d+)R/)
            if (match) {
                clearTimeout(timeout)
                this.pty.onData(() => {}) // Remove handler
                
                const position = {
                    x: parseInt(match[2]) - 1,  // Convert to 0-based
                    y: parseInt(match[1]) - 1
                }
                
                this.log('info', `Cursor position: x=${position.x}, y=${position.y}`)
                resolve(position)
            }
        }
        
        this.pty.onData(handler)
        
        // Request cursor position
        this.log('debug', 'Requesting cursor position')
        this.pty.write('\x1b[6n')
    })
}