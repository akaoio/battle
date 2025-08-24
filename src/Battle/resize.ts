/**
 * Resize the terminal viewport dynamically
 * Tests how applications handle terminal size changes
 */

export function resize(this: any, cols: number, rows: number): void {
    if (!this.pty) {
        throw new Error('No PTY process to resize')
    }
    
    this.log('info', `Resizing terminal: ${cols}x${rows}`)
    
    // Store previous size for comparison
    const previousCols = this.options.cols
    const previousRows = this.options.rows
    
    // Update options
    this.options.cols = cols
    this.options.rows = rows
    
    // Resize the PTY
    this.pty.resize(cols, rows)
    
    // Take screenshot after resize
    setTimeout(() => {
        this.screenshot(`resize-${cols}x${rows}`)
    }, 100)
    
    this.log('info', `Terminal resized from ${previousCols}x${previousRows} to ${cols}x${rows}`)
}