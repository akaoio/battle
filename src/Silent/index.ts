/**
 * Silent - Testing for non-interactive/system apps
 * Tests commands that don't need PTY emulation
 */

import { execSync, spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { CommandSanitizer, SecureErrorHandler, PathSecurity } from '../security/index.js'

export class Silent {
    private logs: string[] = []
    private startTime = Date.now()
    
    /**
     * Run a command and capture output
     * WARNING: This is inherently unsafe - use Battle.spawn() for secure command execution
     */
    exec(command: string, options: any = {}): {
        success: boolean
        stdout: string
        stderr: string
        exitCode: number | null
    } {
        // Security warning
        this.log('warn', 'Silent.exec() bypasses PTY security - use Battle.spawn() for secure execution')
        
        // Basic validation to prevent obvious attacks
        const validation = CommandSanitizer.validate(command)
        if (!validation.valid) {
            this.log('error', `Security validation failed: ${validation.error}`)
            return {
                success: false,
                stdout: '',
                stderr: `Security error: ${validation.error}`,
                exitCode: 1
            }
        }
        
        try {
            const stdout = execSync(command, {
                encoding: 'utf8',
                timeout: 30000, // 30 second timeout
                maxBuffer: 1024 * 1024, // 1MB max buffer
                ...options
            })
            
            this.log('info', `Executed: ${command.slice(0, 100)}${command.length > 100 ? '...' : ''}`)
            this.log('output', stdout.slice(0, 500) + (stdout.length > 500 ? '...' : ''))
            
            return {
                success: true,
                stdout,
                stderr: '',
                exitCode: 0
            }
        } catch (error: any) {
            const sanitizedError = SecureErrorHandler.sanitize(error)
            this.log('error', `Failed: ${command.slice(0, 100)}${command.length > 100 ? '...' : ''}`)
            this.log('error', sanitizedError)
            
            return {
                success: false,
                stdout: error.stdout || '',
                stderr: error.stderr || sanitizedError,
                exitCode: error.status || 1
            }
        }
    }
    
    /**
     * Check if a process is running (DEPRECATED - security risk)
     * @deprecated Use process monitoring libraries instead of shell commands
     */
    isRunning(pattern: string): boolean {
        // Validate pattern to prevent injection
        if (!pattern || pattern.includes('`') || pattern.includes('$') || pattern.includes(';') || pattern.includes('|')) {
            this.log('error', 'Invalid process pattern - potential security risk')
            return false
        }
        
        // Limit pattern length
        const safePattern = pattern.replace(/["'\\]/g, '').slice(0, 50)
        
        try {
            // Use ps with grep to check for running processes
            // The grep -v grep excludes the grep process itself
            const command = process.platform === 'win32'
                ? `tasklist | findstr /i "${safePattern}"`
                : `ps aux | grep -v grep | grep "${safePattern}"`;
            
            const result = execSync(command, {
                encoding: 'utf8',
                stdio: 'pipe',
                timeout: 5000
            })
            
            // Check if we got any real results
            return result.trim().length > 0
        } catch (error) {
            SecureErrorHandler.log(error, 'Process check error')
            return false
        }
    }
    
    /**
     * Check if a port is open
     */
    isPortOpen(port: number, host = 'localhost'): boolean {
        // Validate inputs
        if (!Number.isInteger(port) || port < 1 || port > 65535) {
            this.log('error', 'Invalid port number')
            return false
        }
        
        // Sanitize host to prevent injection
        const safeHost = host.replace(/[^a-zA-Z0-9.-]/g, '').slice(0, 255)
        if (!safeHost || safeHost !== host) {
            this.log('error', 'Invalid host format')
            return false
        }
        
        try {
            // First check if nc is available
            try {
                execSync('which nc', { encoding: 'utf8', stdio: 'pipe', timeout: 1000 })
                // If nc exists, use it with safe parameters
                execSync(`nc -z ${safeHost} ${port}`, {
                    encoding: 'utf8',
                    stdio: 'pipe',
                    timeout: 5000
                })
                return true
            } catch {
                // nc not available or port closed, try alternative
            }
            
            // Fallback: try using safer commands
            const testCmd = process.platform === 'win32' 
                ? `powershell -Command "Test-NetConnection -ComputerName ${safeHost} -Port ${port} -InformationLevel Quiet -WarningAction SilentlyContinue"`
                : `timeout 1 bash -c "exec 3<>/dev/tcp/${safeHost}/${port} && echo 'open' >&3" 2>/dev/null`
            
            execSync(testCmd, { encoding: 'utf8', stdio: 'pipe', timeout: 5000 })
            return true
        } catch (error) {
            SecureErrorHandler.log(error, 'Port check error')
            return false
        }
    }
    
    /**
     * Check if a file exists
     */
    fileExists(filepath: string): boolean {
        return fs.existsSync(filepath)
    }
    
    /**
     * Read file content with security validation
     */
    readFile(filepath: string): string {
        // Validate file path for security
        const pathValidation = PathSecurity.validatePath(filepath, process.cwd())
        if (!pathValidation.valid) {
            throw new Error(`Invalid file path: ${pathValidation.error}`)
        }
        
        try {
            const stats = fs.statSync(pathValidation.normalized!)
            
            // Check file size limit (10MB max)
            if (stats.size > 10 * 1024 * 1024) {
                throw new Error('File too large (max 10MB)')
            }
            
            return fs.readFileSync(pathValidation.normalized!, 'utf8')
        } catch (error: any) {
            const sanitizedError = SecureErrorHandler.sanitize(error)
            throw new Error(`Failed to read file: ${sanitizedError}`)
        }
    }
    
    /**
     * Check system resources (DEPRECATED - security risk)
     * @deprecated Use Node.js process.cpuUsage() and process.memoryUsage() instead
     */
    checkResources(): {
        cpu: number
        memory: number
        disk: number
    } {
        this.log('warn', 'checkResources() is deprecated due to security risks - use Node.js built-in process APIs')
        
        try {
            // Use safer Node.js APIs where possible
            const memUsage = process.memoryUsage()
            const memUsageMB = memUsage.rss / 1024 / 1024
            
            // Only return basic Node.js process info - avoid shell commands
            return {
                cpu: 0, // Cannot safely determine CPU usage without shell commands
                memory: memUsageMB,
                disk: 0  // Cannot safely determine disk usage without shell commands
            }
        } catch (error) {
            SecureErrorHandler.log(error, 'Resource check error')
            return {
                cpu: 0,
                memory: 0,
                disk: 0
            }
        }
    }
    
    /**
     * Wait for condition
     */
    async waitFor(
        condition: () => boolean,
        timeout = 5000,
        interval = 100
    ): Promise<boolean> {
        const start = Date.now()
        
        while (Date.now() - start < timeout) {
            if (condition()) {
                return true
            }
            await new Promise(resolve => setTimeout(resolve, interval))
        }
        
        return false
    }
    
    private log(level: string, message: string): void {
        const timestamp = new Date().toISOString()
        const entry = `[${timestamp}] [${level.toUpperCase()}] ${message}`
        this.logs.push(entry)
    }
    
    getLogs(): string[] {
        return this.logs
    }
}

export default Silent