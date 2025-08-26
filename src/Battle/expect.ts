export async function expect(this: any, pattern: string | RegExp, timeout: number = 2000): Promise<boolean> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeout) {
        // Use outputBuffer if available, otherwise fall back to output
        const output = this.outputBuffer ? this.outputBuffer.toString() : this.output
        const cleanOutput = output.replace(/\x1b\[[0-9;]*[mGKJH]/g, '')
        
        let matches = false
        if (typeof pattern === 'string') {
            matches = cleanOutput.includes(pattern)
        } else {
            matches = pattern.test(cleanOutput)
        }
        
        if (matches) {
            // Record expect event
            this.replay.record({
                type: 'expect',
                timestamp: 0,
                data: { pattern: pattern.toString(), matched: true }
            })
            
            this.log('info', `Pattern matched: ${pattern}`)
            return true
        }
        
        // Wait a bit before checking again
        await new Promise(resolve => setTimeout(resolve, 50))
    }
    
    // Pattern not found after timeout
    this.log('error', `Expected pattern not found after ${timeout}ms: ${pattern}`)
    this.screenshot('expect-failure')
    throw new Error(`Expected pattern not found: ${pattern}`)
}

/**
 * Detect any visual change in the output - Enhanced for TUI testing
 * @param timeout - How long to wait for any change
 * @returns true if visual change detected, false if timeout
 */
export async function expectVisualChange(this: any, timeout: number = 1000): Promise<boolean> {
    const initialOutput = this.output
    const initialLength = initialOutput.length
    const startTime = Date.now()
    
    // More aggressive polling for visual changes
    while (Date.now() - startTime < timeout) {
        // Check for any new output
        if (this.output.length !== initialLength) {
            this.log('info', 'Visual change detected: output length changed')
            return true
        }
        
        // Check for cursor position changes (common in TUI)
        if (this.output !== initialOutput) {
            this.log('info', 'Visual change detected: output content changed')
            return true
        }
        
        // Very fast polling for immediate changes
        await new Promise(resolve => setTimeout(resolve, 10))
    }
    
    this.log('warn', `No visual change detected within ${timeout}ms`)
    return false
}

/**
 * Send key and detect immediate response - Optimized for TUI navigation
 * @param key - Key to send
 * @param timeout - How long to wait for response
 * @returns true if response detected, false if no response
 */
export async function sendKeyAndDetectResponse(this: any, key: string, timeout: number = 500): Promise<boolean> {
    const initialOutput = this.output
    const initialLength = initialOutput.length
    
    // Send the key
    await this.sendKey(key)
    
    const startTime = Date.now()
    
    // Wait for any response with very short polling
    while (Date.now() - startTime < timeout) {
        if (this.output.length !== initialLength || this.output !== initialOutput) {
            this.log('info', `Key response detected for: ${key}`)
            return true
        }
        
        // Extremely fast polling for immediate TUI updates
        await new Promise(resolve => setTimeout(resolve, 5))
    }
    
    this.log('warn', `No response detected for key: ${key}`)
    return false
}