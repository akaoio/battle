export function expect(this: any, pattern: string | RegExp): boolean {
    const cleanOutput = this.output.replace(/\x1b\[[0-9;]*[mGKJH]/g, '')
    
    let matches = false
    if (typeof pattern === 'string') {
        matches = cleanOutput.includes(pattern)
    } else {
        matches = pattern.test(cleanOutput)
    }
    
    if (!matches) {
        this.log('error', `Expected pattern not found: ${pattern}`)
        this.screenshot('expect-failure')
        throw new Error(`Expected pattern not found: ${pattern}`)
    }
    
    this.log('info', `Pattern matched: ${pattern}`)
    return true
}