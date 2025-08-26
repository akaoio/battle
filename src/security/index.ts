/**
 * Security utilities for Battle Framework
 * Provides comprehensive input validation, sanitization, and security measures
 */

import * as path from 'path'
import * as crypto from 'crypto'

/**
 * Validates and sanitizes command input to prevent injection attacks
 */
export class CommandSanitizer {
    private static readonly ALLOWED_CHARS = /^[a-zA-Z0-9\s\-_.\/\[\]{}()=,:"']+$/
    private static readonly DANGEROUS_PATTERNS = [
        /[;&|`$<>]/,  // Shell metacharacters
        /\.\.\//,      // Path traversal
        /\$\(/,        // Command substitution
        /\|\|/,        // OR operator
        /&&/,          // AND operator
    ]
    
    /**
     * Validates if a command is safe to execute
     */
    static validate(command: string): { valid: boolean; error?: string } {
        if (!command || typeof command !== 'string') {
            return { valid: false, error: 'Command must be a non-empty string' }
        }
        
        // Check length limits
        if (command.length > 1000) {
            return { valid: false, error: 'Command exceeds maximum length' }
        }
        
        // Check for dangerous patterns
        for (const pattern of this.DANGEROUS_PATTERNS) {
            if (pattern.test(command)) {
                return { valid: false, error: `Dangerous pattern detected: ${pattern}` }
            }
        }
        
        return { valid: true }
    }
    
    /**
     * Sanitizes command arguments
     */
    static sanitizeArgs(args: string[]): string[] {
        return args.map(arg => {
            // Remove any shell metacharacters
            return arg.replace(/[;&|`$<>\\]/g, '')
                     .replace(/\.\.\//g, '')
                     .slice(0, 500) // Limit arg length
        })
    }
    
    /**
     * Escapes shell arguments properly
     */
    static escapeShellArg(arg: string): string {
        return `'${arg.replace(/'/g, "'\\''")}'`
    }
}

/**
 * Environment variable sanitizer
 */
export class EnvSanitizer {
    private static readonly BLOCKED_VARS = [
        'LD_PRELOAD',
        'LD_LIBRARY_PATH',
        'DYLD_INSERT_LIBRARIES',
        'DYLD_LIBRARY_PATH',
        'NODE_OPTIONS',
        'NODE_EXTRA_CA_CERTS',
    ]
    
    private static readonly SENSITIVE_PATTERNS = [
        /^(PASSWORD|TOKEN|KEY|SECRET|API|PRIVATE|CREDENTIAL)/i,
        /_KEY$/i,
        /_TOKEN$/i,
        /_SECRET$/i,
    ]
    
    /**
     * Sanitizes environment variables
     */
    static sanitize(env: Record<string, any>): Record<string, string> {
        const sanitized: Record<string, string> = {}
        
        for (const [key, value] of Object.entries(env)) {
            // Skip blocked variables
            if (this.BLOCKED_VARS.includes(key)) {
                continue
            }
            
            // Mask sensitive variables
            if (this.SENSITIVE_PATTERNS.some(pattern => pattern.test(key))) {
                sanitized[key] = '***REDACTED***'
                continue
            }
            
            // Ensure value is a string and limit length
            sanitized[key] = String(value).slice(0, 10000)
        }
        
        return sanitized
    }
    
    /**
     * Creates safe environment for PTY
     */
    static createSafeEnv(userEnv: Record<string, any> = {}): Record<string, string> {
        const baseEnv = {
            TERM: 'xterm-256color',
            LANG: 'en_US.UTF-8',
            LC_ALL: 'en_US.UTF-8',
            PATH: process.env.PATH || '/usr/bin:/bin',
        }
        
        const sanitizedUserEnv = this.sanitize(userEnv)
        return { ...baseEnv, ...sanitizedUserEnv }
    }
}

/**
 * JSON Schema validator for replay files
 */
export class ReplayValidator {
    private static readonly SCHEMA = {
        version: 'string',
        timestamp: 'string',
        duration: 'number',
        events: 'array',
        metadata: 'object',
    }
    
    /**
     * Validates replay data structure
     */
    static validate(data: any): { valid: boolean; error?: string } {
        if (!data || typeof data !== 'object') {
            return { valid: false, error: 'Invalid replay data structure' }
        }
        
        // Check required fields
        for (const [field, type] of Object.entries(this.SCHEMA)) {
            if (!(field in data)) {
                return { valid: false, error: `Missing required field: ${field}` }
            }
            
            const actualType = Array.isArray(data[field]) ? 'array' : typeof data[field]
            if (actualType !== type) {
                return { valid: false, error: `Invalid type for ${field}: expected ${type}, got ${actualType}` }
            }
        }
        
        // Validate events
        if (!Array.isArray(data.events)) {
            return { valid: false, error: 'Events must be an array' }
        }
        
        for (const event of data.events) {
            if (!event.type || typeof event.timestamp !== 'number') {
                return { valid: false, error: 'Invalid event structure' }
            }
            // Some event types like 'exit' may not have data field
        }
        
        return { valid: true }
    }
    
    /**
     * Safely parse JSON with validation
     */
    static parse(json: string): any {
        try {
            const data = JSON.parse(json, (key, value) => {
                // Prevent prototype pollution
                if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
                    return undefined
                }
                return value
            })
            
            const validation = this.validate(data)
            if (!validation.valid) {
                throw new Error(validation.error)
            }
            
            return data
        } catch (error: any) {
            if (error.message && error.message.includes('Invalid replay file:')) {
                throw error; // Don't double-wrap already wrapped errors
            }
            throw new Error(`Invalid replay file: ${error}`)
        }
    }
}

/**
 * Path security utilities
 */
export class PathSecurity {
    /**
     * Validates and normalizes file paths
     */
    static validatePath(filePath: string, basePath: string): { valid: boolean; normalized?: string; error?: string } {
        try {
            const normalized = path.normalize(filePath)
            const resolved = path.resolve(basePath, normalized)
            
            // Check for path traversal
            if (!resolved.startsWith(path.resolve(basePath))) {
                return { valid: false, error: 'Path traversal detected' }
            }
            
            // Check for null bytes
            if (filePath.includes('\0')) {
                return { valid: false, error: 'Null byte detected in path' }
            }
            
            return { valid: true, normalized: resolved }
        } catch (error) {
            return { valid: false, error: `Invalid path: ${error}` }
        }
    }
    
    /**
     * Creates safe temporary directory
     */
    static createSafeTempDir(): string {
        const tempDir = path.join(process.cwd(), 'tmp', crypto.randomBytes(16).toString('hex'))
        return tempDir
    }
}

/**
 * Resource limiter to prevent DoS
 */
export class ResourceLimiter {
    private static readonly MAX_OUTPUT_SIZE = 10 * 1024 * 1024 // 10MB
    private static readonly MAX_EVENTS = 100000
    private static readonly MAX_PTY_INSTANCES = 10
    
    private static ptyInstances = 0
    
    /**
     * Checks if resource limit is exceeded
     */
    static checkOutputSize(size: number): boolean {
        return size < this.MAX_OUTPUT_SIZE
    }
    
    /**
     * Checks if event count limit is exceeded
     */
    static checkEventCount(count: number): boolean {
        return count < this.MAX_EVENTS
    }
    
    /**
     * Tracks PTY instance creation
     */
    static acquirePTY(): boolean {
        if (this.ptyInstances >= this.MAX_PTY_INSTANCES) {
            return false
        }
        this.ptyInstances++
        return true
    }
    
    /**
     * Releases PTY instance
     */
    static releasePTY(): void {
        if (this.ptyInstances > 0) {
            this.ptyInstances--
        }
    }
}

/**
 * Secure error handler that prevents information disclosure
 */
export class SecureErrorHandler {
    private static readonly ERROR_MAP = new Map([
        ['ENOENT', 'Resource not found'],
        ['EACCES', 'Permission denied'],
        ['EAGAIN', 'Resource temporarily unavailable'],
        ['EBADF', 'Invalid resource reference'],
        ['EIO', 'I/O error occurred'],
    ])
    
    /**
     * Sanitizes error messages to prevent information disclosure
     */
    static sanitize(error: any): string {
        if (!error) return 'Unknown error'
        
        const code = error.code || error.errno
        if (code && this.ERROR_MAP.has(code)) {
            return this.ERROR_MAP.get(code)!
        }
        
        // Remove sensitive information from error messages
        let message = String(error.message || error)
        
        // Remove file paths
        message = message.replace(/\/[^\s]+/g, '<path>')
        
        // Remove IP addresses
        message = message.replace(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g, '<ip>')
        
        // Remove ports
        message = message.replace(/:\d{2,5}/g, ':<port>')
        
        // Limit message length
        return message.slice(0, 200)
    }
    
    /**
     * Logs error securely
     */
    static log(error: any, context?: string): void {
        const sanitized = this.sanitize(error)
        const timestamp = new Date().toISOString()
        
        console.error(`[${timestamp}] ${context || 'Error'}: ${sanitized}`)
        
        // In production, would send to secure logging service
    }
}

export { SafeCommandMode, SecurityLevel, SafeCommandContext } from './SafeCommandMode.js'

export default {
    CommandSanitizer,
    EnvSanitizer,
    ReplayValidator,
    PathSecurity,
    ResourceLimiter,
    SecureErrorHandler,
}