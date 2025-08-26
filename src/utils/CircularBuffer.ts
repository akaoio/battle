/**
 * Circular buffer implementation to prevent unbounded memory growth
 * Maintains a fixed-size buffer that overwrites old data when full
 */
export class CircularBuffer {
    private buffer: string[]
    private maxSize: number
    private totalBytes: number
    private maxBytes: number
    private head: number
    private tail: number
    private count: number
    
    constructor(maxSize: number = 1000, maxBytes: number = 10 * 1024 * 1024) { // 10MB default
        this.maxSize = maxSize
        this.maxBytes = maxBytes
        this.buffer = new Array(maxSize)
        this.totalBytes = 0
        this.head = 0
        this.tail = 0
        this.count = 0
    }
    
    /**
     * Appends data to the buffer
     */
    append(data: string): void {
        if (!data) return
        
        const bytes = Buffer.byteLength(data, 'utf8')
        
        // If single item exceeds max bytes, truncate it
        if (bytes > this.maxBytes) {
            data = data.slice(0, Math.floor(this.maxBytes / 2))
        }
        
        // Remove old items if we exceed byte limit
        while (this.totalBytes + bytes > this.maxBytes && this.count > 0) {
            this.removeOldest()
        }
        
        // Add new item
        this.buffer[this.tail] = data
        this.tail = (this.tail + 1) % this.maxSize
        this.totalBytes += bytes
        
        if (this.count < this.maxSize) {
            this.count++
        } else {
            // Overwriting oldest item
            const oldBytes = Buffer.byteLength(this.buffer[this.head], 'utf8')
            this.totalBytes -= oldBytes
            this.head = (this.head + 1) % this.maxSize
        }
    }
    
    /**
     * Removes the oldest item from the buffer
     */
    private removeOldest(): void {
        if (this.count === 0) return
        
        const oldData = this.buffer[this.head]
        if (oldData) {
            this.totalBytes -= Buffer.byteLength(oldData, 'utf8')
        }
        
        this.buffer[this.head] = undefined as any
        this.head = (this.head + 1) % this.maxSize
        this.count--
    }
    
    /**
     * Gets all data as a single string
     */
    toString(): string {
        if (this.count === 0) return ''
        
        const result: string[] = []
        let index = this.head
        
        for (let i = 0; i < this.count; i++) {
            if (this.buffer[index]) {
                result.push(this.buffer[index])
            }
            index = (index + 1) % this.maxSize
        }
        
        return result.join('')
    }
    
    /**
     * Gets the last N characters
     */
    getLastChars(n: number): string {
        const full = this.toString()
        return full.slice(-n)
    }
    
    /**
     * Searches for a pattern in the buffer
     */
    includes(pattern: string): boolean {
        return this.toString().includes(pattern)
    }
    
    /**
     * Tests a regex pattern against the buffer
     */
    test(pattern: RegExp): boolean {
        return pattern.test(this.toString())
    }
    
    /**
     * Clears the buffer
     */
    clear(): void {
        this.buffer = new Array(this.maxSize)
        this.totalBytes = 0
        this.head = 0
        this.tail = 0
        this.count = 0
    }
    
    /**
     * Gets buffer statistics
     */
    getStats(): {
        count: number
        bytes: number
        maxSize: number
        maxBytes: number
        usage: number
    } {
        return {
            count: this.count,
            bytes: this.totalBytes,
            maxSize: this.maxSize,
            maxBytes: this.maxBytes,
            usage: this.totalBytes / this.maxBytes,
        }
    }
    
    /**
     * Creates a snapshot of the buffer
     */
    snapshot(): string[] {
        const result: string[] = []
        let index = this.head
        
        for (let i = 0; i < this.count; i++) {
            if (this.buffer[index]) {
                result.push(this.buffer[index])
            }
            index = (index + 1) % this.maxSize
        }
        
        return result
    }
}

/**
 * Specialized circular buffer for terminal output
 */
export class TerminalOutputBuffer extends CircularBuffer {
    private ansiRegex = /\x1b\[[0-9;]*[mGKJH]/g
    
    /**
     * Gets clean output without ANSI codes
     */
    getCleanOutput(): string {
        return this.toString().replace(this.ansiRegex, '')
    }
    
    /**
     * Searches for pattern in clean output
     */
    includesClean(pattern: string): boolean {
        return this.getCleanOutput().includes(pattern)
    }
    
    /**
     * Tests regex against clean output
     */
    testClean(pattern: RegExp): boolean {
        return pattern.test(this.getCleanOutput())
    }
    
    /**
     * Gets the last N lines
     */
    getLastLines(n: number): string[] {
        const full = this.toString()
        const lines = full.split('\n')
        return lines.slice(-n)
    }
}

export default CircularBuffer