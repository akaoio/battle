import type { TestResult } from '../types/index.js'

export async function run(this: any, testFn: (battle: any) => Promise<void>): Promise<TestResult> {
    const startTime = Date.now()
    let success = false
    let error: Error | null = null
    
    try {
        this.log('info', 'Starting test')
        await testFn(this)
        success = true
        this.log('info', 'Test completed successfully')
    } catch (err) {
        error = err as Error
        this.log('error', `Test failed: ${error.message}`)
        this.screenshot('test-failure')
    } finally {
        this.cleanup()
    }
    
    const duration = Date.now() - startTime
    
    const result: TestResult = {
        success,
        duration,
        output: this.output,
        screenshots: this.screenshots,
        logs: this.logs,
        error: error?.message || null
    }
    
    return result
}