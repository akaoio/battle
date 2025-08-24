export async function expect(this: any, pattern: string | RegExp, timeout: number = 2000): Promise<boolean> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeout) {
        const cleanOutput = this.output.replace(/\x1b\[[0-9;]*[mGKJH]/g, '')
        
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