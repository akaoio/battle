/**
 * Silent - Testing for non-interactive/system apps
 * Tests commands that don't need PTY emulation
 */

import { execSync, spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

export class Silent {
    private logs: string[] = []
    private startTime = Date.now()
    
    /**
     * Run a command and capture output
     */
    exec(command: string, options: any = {}): {
        success: boolean
        stdout: string
        stderr: string
        exitCode: number | null
    } {
        try {
            const stdout = execSync(command, {
                encoding: 'utf8',
                ...options
            })
            
            this.log('info', `Executed: ${command}`)
            this.log('output', stdout)
            
            return {
                success: true,
                stdout,
                stderr: '',
                exitCode: 0
            }
        } catch (error: any) {
            this.log('error', `Failed: ${command}`)
            this.log('error', error.message)
            
            return {
                success: false,
                stdout: error.stdout || '',
                stderr: error.stderr || error.message,
                exitCode: error.status || 1
            }
        }
    }
    
    /**
     * Check if a process is running
     */
    isRunning(pattern: string): boolean {
        try {
            // Use ps with grep to check for running processes
            // The grep -v grep excludes the grep process itself
            const command = process.platform === 'win32'
                ? `tasklist | findstr /i "${pattern}"`
                : `ps aux | grep -v grep | grep "${pattern}"`;
            
            const result = execSync(command, {
                encoding: 'utf8',
                stdio: 'pipe'
            })
            
            // Check if we got any real results
            return result.trim().length > 0
        } catch {
            return false
        }
    }
    
    /**
     * Check if a port is open
     */
    isPortOpen(port: number, host = 'localhost'): boolean {
        try {
            // First check if nc is available
            try {
                execSync('which nc', { encoding: 'utf8', stdio: 'pipe' })
                // If nc exists, use it
                execSync(`nc -z ${host} ${port} 2>/dev/null`, {
                    encoding: 'utf8',
                    stdio: 'pipe'
                })
                return true
            } catch {
                // nc not available or port closed, try alternative
            }
            
            // Fallback: try using Node.js child_process with timeout
            // This is less reliable but works when nc is not available
            const testCmd = process.platform === 'win32' 
                ? `powershell -Command "Test-NetConnection -ComputerName ${host} -Port ${port} -InformationLevel Quiet"`
                : `timeout 1 bash -c "echo > /dev/tcp/${host}/${port}" 2>/dev/null`
            
            execSync(testCmd, { encoding: 'utf8', stdio: 'pipe' })
            return true
        } catch {
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
     * Read file content
     */
    readFile(filepath: string): string {
        return fs.readFileSync(filepath, 'utf8')
    }
    
    /**
     * Check system resources
     */
    checkResources(): {
        cpu: number
        memory: number
        disk: number
    } {
        // CPU usage
        const cpu = parseFloat(
            execSync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}'", {
                encoding: 'utf8'
            }).trim()
        )
        
        // Memory usage
        const mem = execSync("free -m | awk 'NR==2{printf \"%.1f\", $3*100/$2}'", {
            encoding: 'utf8'
        })
        
        // Disk usage
        const disk = execSync("df -h / | awk 'NR==2{print $5}' | sed 's/%//'", {
            encoding: 'utf8'
        })
        
        return {
            cpu: cpu || 0,
            memory: parseFloat(mem) || 0,
            disk: parseInt(disk) || 0
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