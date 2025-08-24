/**
 * Battle Test Runner
 * Executes test suites and reports results
 */

import { constructor } from './constructor.js'
import { addSuite } from './addSuite.js'
import { addTest } from './addTest.js'
import { run } from './run.js'
import { report } from './report.js'
import type { TestSuite, TestCase } from '../types/index.js'

export class Runner {
    suites!: TestSuite[]
    results!: any[]
    options!: any
    
    constructor(options: any = {}) {
        constructor.call(this, options)
    }
    
    suite(name: string, tests: TestCase[]) {
        return addSuite.call(this, name, tests)
    }
    
    test(name: string, testCase: TestCase) {
        return addTest.call(this, name, testCase)
    }
    
    async run() {
        return run.call(this)
    }
    
    report() {
        return report.call(this)
    }
}

export default Runner