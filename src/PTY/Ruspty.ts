/**
 * Rust-based PTY implementation using @akaoio/ruspty
 * Provides real PTY support for Bun runtime with ARM64 support
 * Creates actual pseudo-terminals with full terminal emulation
 */

import type { IPTY, PTYOptions } from './index.js'
import { SecureErrorHandler, ResourceLimiter } from '../security/index.js'

// Dynamic import to avoid loading in Node.js runtime
let Pty: any

export class Ruspty implements IPTY {
    private pty: any
    private fd: number | undefined  // Store file descriptor for Bun
    private _killed: boolean = false
    private _pid: number | undefined
    private dataCallbacks: Array<(data: string) => void> = []
    private exitCallbacks: Array<(code: number) => void> = []
    private isBun: boolean = typeof (globalThis as any).Bun !== 'undefined'
    
    constructor(command: string, args: string[], options: PTYOptions) {
        // Check PTY resource limits
        if (!ResourceLimiter.acquirePTY()) {
            throw new Error('PTY instance limit exceeded - too many active PTYs')
        }
        
        // Lazy load ruspty - intelligent platform selection
        if (!Pty) {
            try {
                // Try @akaoio/ruspty first (has ARM64 support)
                let ruspty
                try {
                    ruspty = this.isBun ? require('@akaoio/ruspty/index.js') : require('@akaoio/ruspty')
                    Pty = ruspty.Pty
                } catch (akaoError) {
                    // Fallback to @replit/ruspty for x64 platforms
                    try {
                        ruspty = this.isBun ? require('@replit/ruspty/index.js') : require('@replit/ruspty')
                        Pty = ruspty.Pty
                    } catch (replitError) {
                        // Both failed - throw comprehensive error
                        throw new Error(
                            'No compatible ruspty package found.\n' +
                            'Install one of:\n' +
                            '- npm install @akaoio/ruspty (ARM64 support)\n' +
                            '- npm install @replit/ruspty (x64 support)\n' +
                            `@akaoio error: ${akaoError.message}\n` +
                            `@replit error: ${replitError.message}`
                        )
                    }
                }
            } catch (err: any) {
                ResourceLimiter.releasePTY()
                const sanitizedError = SecureErrorHandler.sanitize(err)
                throw new Error(
                    'Ruspty is not installed or failed to load.\n' +
                    'Run: npm install @akaoio/ruspty (or @replit/ruspty for x64)\n' +
                    `Error: ${sanitizedError}`
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
                        // Ensure we always have a valid exit code
                        const code = exitCode ?? (err ? 1 : 0)
                        this.exitCallbacks.forEach(cb => {
                            try {
                                cb(code)
                            } catch (callbackError) {
                                SecureErrorHandler.log(callbackError, 'Exit callback error')
                            }
                        })
                        // Release PTY resource
                        ResourceLimiter.releasePTY()
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
                        // Ensure we always have a valid exit code
                        const code = exitCode ?? (err ? 1 : 0)
                        this.exitCallbacks.forEach(cb => {
                            try {
                                cb(code)
                            } catch (callbackError) {
                                SecureErrorHandler.log(callbackError, 'Exit callback error')
                            }
                        })
                        // Release PTY resource
                        ResourceLimiter.releasePTY()
                    }
                })
            }
            
            this._pid = this.pty.pid
            
            // Set up data streaming
            this.setupDataStream()
        } catch (err: any) {
            ResourceLimiter.releasePTY()
            const sanitizedError = SecureErrorHandler.sanitize(err)
            throw new Error(`Failed to create PTY: ${sanitizedError}`)
        }
    }
    
    private setupDataStream() {
        try {
            if (this.isBun) {
                // Bun: Use fs.readSync with raw Pty API (tty.ReadStream doesn't work)
                this.fd = this.pty.takeFd()
                const fs = require('fs')
                
                let pollTimeout: NodeJS.Timeout | null = null
                
                const checkOutput = () => {
                    if (this._killed) {
                        // Clean up on exit
                        if (pollTimeout) {
                            clearTimeout(pollTimeout)
                            pollTimeout = null
                        }
                        // Close file descriptor if still open
                        this.cleanupFileDescriptor()
                        return
                    }
                    
                    try {
                        // Use fs.readSync which works in Bun
                        const buffer = Buffer.alloc(4096)
                        const bytesRead = fs.readSync(this.fd!, buffer, 0, 4096, null)
                        if (bytesRead > 0) {
                            const text = buffer.slice(0, bytesRead).toString()
                            this.dataCallbacks.forEach(cb => {
                                try {
                                    cb(text)
                                } catch (callbackError) {
                                    // Prevent callback errors from killing the polling loop
                                    console.error('Data callback error:', callbackError)
                                }
                            })
                        }
                    } catch (err: any) {
                        // EAGAIN means no data available yet - that's normal
                        if (err.code !== 'EAGAIN' && err.code !== 'EWOULDBLOCK') {
                            // Only log real errors
                            if (err.code === 'EBADF' || err.code === 'EIO') {
                                // PTY closed - cleanup
                                this._killed = true
                                this.cleanupFileDescriptor()
                                return
                            } else {
                                // Unexpected error - log and cleanup to prevent fd leak
                                console.error('Unexpected PTY read error:', err)
                                this._killed = true
                                this.cleanupFileDescriptor()
                                return
                            }
                        }
                    }
                    
                    // Continue polling if not killed - reduced frequency for better performance
                    if (!this._killed) {
                        pollTimeout = setTimeout(checkOutput, 50)  // Reduced from 10ms to 50ms
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
                
                // Clean up file descriptor
                this.cleanupFileDescriptor()
            } catch (err) {
                // Process might already be dead - ensure cleanup still happens
                this._killed = true
                this.cleanupFileDescriptor()
            }
        }
    }
    
    /**
     * Safely cleans up file descriptor to prevent leaks
     */
    private cleanupFileDescriptor(): void {
        if (this.isBun && this.fd !== undefined) {
            try {
                const fs = require('fs')
                fs.closeSync(this.fd)
            } catch (e) {
                // Ignore close errors - fd might already be closed
            } finally {
                this.fd = undefined
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