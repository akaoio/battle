import type { TestSuite, TestCase } from '../types/index.js'

export function addSuite(this: any, name: string, tests: TestCase[]): void {
    const suite: TestSuite = {
        name,
        tests
    }
    this.suites.push(suite)
}