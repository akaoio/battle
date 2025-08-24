/**
 * Wait for a specific amount of time
 * Useful for timing-sensitive terminal operations
 */

export function wait(this: any, ms: number): Promise<void> {
    this.log('info', `Waiting ${ms}ms`)
    return new Promise(resolve => setTimeout(resolve, ms))
}