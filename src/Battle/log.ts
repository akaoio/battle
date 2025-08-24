import fs from 'fs'
import path from 'path'

export function log(this: any, level: string, message: string): void {
    const timestamp = new Date().toISOString()
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`
    
    // Ensure log directory exists
    if (!fs.existsSync(this.options.logDir)) {
        fs.mkdirSync(this.options.logDir, { recursive: true })
    }
    
    // Write to log file
    const logFile = path.join(this.options.logDir, `battle-${this.startTime}.log`)
    fs.appendFileSync(logFile, logEntry)
    
    // Store in memory
    this.logs.push(logEntry)
    
    // Console output if verbose
    if (this.options.verbose && level !== 'output') {
        console.log(logEntry.trim())
    }
}