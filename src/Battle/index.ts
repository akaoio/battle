/**
 * Battle Test Framework Core
 * Universal terminal testing with real PTY emulation
 */

import { constructor } from './constructor.js'
import { spawn } from './spawn.js'
import { interact } from './interact.js'
import { screenshot } from './screenshot.js'
import { expect } from './expect.js'
import { log } from './log.js'
import { cleanup } from './cleanup.js'
import { run } from './run.js'
import { resize } from './resize.js'
import { sendKey } from './sendKey.js'
import { wait } from './wait.js'
import { getCursor } from './getCursor.js'
import type { BattleOptions, TestResult, InteractionHandler } from '../types/index.js'

export class Battle {
    options!: BattleOptions
    pty: any
    output!: string
    screenshots!: string[]
    logs!: string[]
    startTime!: number
    
    constructor(options: BattleOptions = {}) {
        constructor.call(this, options)
    }
    
    spawn(command: string, args?: string[]) {
        return spawn.call(this, command, args)
    }
    
    interact(handler: InteractionHandler) {
        return interact.call(this, handler)
    }
    
    screenshot(name?: string) {
        return screenshot.call(this, name)
    }
    
    expect(pattern: string | RegExp) {
        return expect.call(this, pattern)
    }
    
    log(level: string, message: string) {
        return log.call(this, level, message)
    }
    
    cleanup() {
        return cleanup.call(this)
    }
    
    async run(testFn: (battle: Battle) => Promise<void>): Promise<TestResult> {
        return run.call(this, testFn)
    }
    
    resize(cols: number, rows: number) {
        return resize.call(this, cols, rows)
    }
    
    sendKey(key: string) {
        return sendKey.call(this, key)
    }
    
    wait(ms: number) {
        return wait.call(this, ms)
    }
    
    async getCursor() {
        return getCursor.call(this)
    }
}

export default Battle