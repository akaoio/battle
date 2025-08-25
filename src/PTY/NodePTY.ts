/**
 * Node.js PTY implementation using node-pty
 */

import { createRequire } from 'module'
import type { IPTY, PTYOptions } from './index.js'

export class NodePTY implements IPTY {
    private pty: any
    private _killed: boolean = false
    
    constructor(command: string, args: string[], options: PTYOptions) {
        // Load node-pty dynamically
        let nodePty: any
        
        // Try different loading methods for compatibility
        if (typeof require !== 'undefined') {
            // CommonJS environment
            try {
                nodePty = require('node-pty')
            } catch (err) {
                throw new Error('node-pty is not installed. Run: npm install node-pty')
            }
        } else if (typeof import.meta !== 'undefined' && import.meta.url) {
            // ESM environment
            const requireFunc = createRequire(import.meta.url)
            try {
                nodePty = requireFunc('node-pty')
            } catch (err) {
                throw new Error('node-pty is not installed. Run: npm install node-pty')
            }
        } else {
            throw new Error('Unable to load node-pty in this environment')
        }
        
        this.pty = nodePty.spawn(command, args, {
            name: options.name || 'xterm-256color',
            cols: options.cols || 80,
            rows: options.rows || 24,
            cwd: options.cwd || process.cwd(),
            env: { ...process.env, ...options.env, TERM: 'xterm-256color' }
        })
    }
    
    onData(callback: (data: string) => void): void {
        this.pty.onData(callback)
    }
    
    onExit(callback: (code: number) => void): void {
        this.pty.onExit(({ exitCode }: any) => {
            this._killed = true
            callback(exitCode)
        })
    }
    
    write(data: string): void {
        if (!this._killed) {
            this.pty.write(data)
        }
    }
    
    resize(cols: number, rows: number): void {
        if (!this._killed) {
            this.pty.resize(cols, rows)
        }
    }
    
    kill(signal?: string): void {
        if (!this._killed) {
            this.pty.kill(signal)
            this._killed = true
        }
    }
    
    get pid(): number | undefined {
        return this.pty.pid
    }
    
    get killed(): boolean {
        return this._killed
    }
}

export default NodePTY