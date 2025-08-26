import { Replay } from '../Replay/index.js'
import { SecurityLevel } from '../security/SafeCommandMode.js'
import type { BattleOptions } from '../types/index.js'

export function constructor(this: any, options: BattleOptions = {}) {
    // Store command and args if provided in constructor
    this.command = options.command
    this.args = options.args || []
    
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
    
    // Security settings - can be overridden by user
    this.securityLevel = options.securityLevel || SecurityLevel.BALANCED
    this.safeCommandMode = options.safeCommandMode !== false // Default to true
    
    this.pty = null
    this.output = ''
    this.screenshots = []
    this.logs = []
    this.startTime = Date.now()
    this.replay = new Replay()
    
    // Initialize replay metadata
    this.replay.data.metadata.cols = this.options.cols
    this.replay.data.metadata.rows = this.options.rows
    this.replay.data.metadata.env = { ...this.options.env }
}