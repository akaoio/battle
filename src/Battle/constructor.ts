import type { BattleOptions } from '../types/index.js'

export function constructor(this: any, options: BattleOptions = {}) {
    this.options = {
        cols: 80,
        rows: 24,
        cwd: process.cwd(),
        env: process.env,
        timeout: 10000,
        screenshotDir: './screenshots',
        logDir: './logs',
        verbose: false,
        ...options
    }
    
    this.pty = null
    this.output = ''
    this.screenshots = []
    this.logs = []
    this.startTime = Date.now()
}