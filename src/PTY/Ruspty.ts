/**
 * Rust-based PTY implementation using @akaoio/ruspty
 * Provides real PTY support for Bun runtime with ARM64 support
 * Creates actual pseudo-terminals with full terminal emulation
 */

import type { IPTY, PTYOptions } from './index.js'

// Dynamic import to avoid loading in Node.js runtime
let Pty: any

export class Ruspty implements IPTY {
    private pty: any
    private fd: number | undefined  // Store file descriptor for Bun
    private _killed: boolean = false
    private _pid: number | undefined
    private dataCallbacks: Array<(data: string) => void> = []
    private exitCallbacks: Array<(code: number) => void> = []
    private isBun: boolean = typeof Bun !== 'undefined'
    
    constructor(command: string, args: string[], options: PTYOptions) {
        // Lazy load ruspty - different approach for Bun vs Node
        if (!Pty) {
            try {
                if (this.isBun) {
                    // Bun: Use raw Pty from index.js (wrapper's ReadStream doesn't work)
                    // @ts-ignore - Dynamic require
                    const ruspty = require('@akaoio/ruspty/index.js')
                    Pty = ruspty.Pty
                } else {
                    // Node: Use wrapped version
                    // @ts-ignore - Dynamic require
                    const ruspty = require('@akaoio/ruspty')
                    Pty = ruspty.Pty
                }
            } catch (err) {
                throw new Error(
                    '@akaoio/ruspty is not installed or failed to load.\n' +
                    'Run: npm install @akaoio/ruspty\n' +
                    'Note: ARM64 support is included'
                )
            }
        }
        
        // Create real PTY with ruspty
        try {
            if (this.isBun) {
                // Bun: Use raw Pty API with 'envs' instead of 'env'
                this.pty = new Pty({
                    command,
                    args: args || [],
                    envs: {  // Note: raw API uses 'envs'
                        ...process.env,
                        ...options.env,
                        TERM: options.name || 'xterm-256color',
                        FORCE_COLOR: '1',
                        COLORTERM: 'truecolor'
                    },
                    size: {
                        rows: options.rows || 24,
                        cols: options.cols || 80
                    },
                    onExit: (err: any, exitCode: number) => {
                        this._killed = true
                        this.exitCallbacks.forEach(cb => cb(exitCode || 0))
                    }
                })
            } else {
                // Node: Use wrapper API
                this.pty = new Pty({
                    command,
                    args: args || [],
                    env: {  // Note: wrapper API uses 'env'
                        ...process.env,
                        ...options.env,
                        TERM: options.name || 'xterm-256color',
                        FORCE_COLOR: '1',
                        COLORTERM: 'truecolor'
                    },
                    size: {
                        rows: options.rows || 24,
                        cols: options.cols || 80
                    },
                    onExit: (err: any, exitCode: number) => {
                        this._killed = true
                        this.exitCallbacks.forEach(cb => cb(exitCode || 0))
                    }
                })
            }
            
            this._pid = this.pty.pid
            
            // Set up data streaming
            this.setupDataStream()
        } catch (err: any) {
            throw new Error(`Failed to create PTY: ${err.message}`)
        }
    }
    
    private setupDataStream() {
        try {
            if (this.isBun) {
                // Bun: Use fs.readSync with raw Pty API (tty.ReadStream doesn't work)
                this.fd = this.pty.takeFd()
                const fs = require('fs')
                
                const checkOutput = () => {
                    if (this._killed) return
                    
                    try {
                        // Use fs.readSync which works in Bun
                        const buffer = Buffer.alloc(4096)
                        const bytesRead = fs.readSync(this.fd!, buffer, 0, 4096, null)
                        if (bytesRead > 0) {
                            const text = buffer.slice(0, bytesRead).toString()
                            this.dataCallbacks.forEach(cb => cb(text))
                        }
                    } catch (err: any) {
                        // EAGAIN means no data available yet - that's normal
                        if (err.code !== 'EAGAIN' && err.code !== 'EWOULDBLOCK') {
                            // Only log real errors
                            if (err.code === 'EBADF' || err.code === 'EIO') {
                                // PTY closed
                                this._killed = true
                                return
                            }
                        }
                    }
                    
                    // Continue polling if not killed
                    if (!this._killed) {
                        setTimeout(checkOutput, 10)
                    }
                }
                
                // Start polling immediately
                setTimeout(checkOutput, 0)
            } else {
                // Node: Use the wrapper's stream interface
                const stream = this.pty.read
                
                if (stream && typeof stream.on === 'function') {
                    stream.on('data', (data: Buffer) => {
                        const text = data.toString()
                        this.dataCallbacks.forEach(cb => cb(text))
                    })
                    
                    stream.on('error', (err: any) => {
                        if (err.code === 'EIO') {
                            // EIO means the PTY has closed
                            stream.emit('end')
                        } else {
                            console.error('PTY stream error:', err)
                        }
                    })
                    
                    stream.on('end', () => {
                        this._killed = true
                    })
                } else {
                    throw new Error('Stream interface not available')
                }
            }
        } catch (err) {
            console.error('Failed to setup data stream:', err)
            if (!this._killed) {
                this._killed = true
                this.exitCallbacks.forEach(cb => cb(1))
            }
        }
    }
    
    onData(callback: (data: string) => void): void {
        this.dataCallbacks.push(callback)
    }
    
    onExit(callback: (code: number) => void): void {
        this.exitCallbacks.push(callback)
        
        // If already exited, call immediately
        if (this._killed) {
            callback(0)
        }
    }
    
    write(data: string): void {
        if (!this._killed) {
            try {
                if (this.isBun && this.fd !== undefined) {
                    // Bun: Write directly to file descriptor
                    const fs = require('fs')
                    fs.writeSync(this.fd, data)
                } else if (this.pty) {
                    // Node: Use wrapper's write stream
                    this.pty.write.write(data)
                }
            } catch (err) {
                // PTY might have closed
                console.error('Write error:', err)
            }
        }
    }
    
    resize(cols: number, rows: number): void {
        if (!this._killed && this.pty && this.pty.resize) {
            try {
                this.pty.resize({ cols, rows })
            } catch (err) {
                // Resize might not be supported or PTY closed
            }
        }
    }
    
    kill(signal?: string): void {
        if (!this._killed && this.pty) {
            try {
                // ruspty uses kill() method
                if (this.pty.kill) {
                    this.pty.kill()
                }
                this._killed = true
            } catch (err) {
                // Process might already be dead
            }
        }
    }
    
    get pid(): number | undefined {
        return this._pid
    }
    
    get killed(): boolean {
        return this._killed
    }
}

export default Ruspty