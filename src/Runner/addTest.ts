import type { TestCase } from '../types/index.js'

export function addTest(this: any, name: string, testCase: TestCase): void {
    // Add to default suite
    if (this.suites.length === 0) {
        this.suites.push({
            name: 'Default',
            tests: []
        })
    }
    
    this.suites[this.suites.length - 1].tests.push({
        ...testCase,
        name
    })
}