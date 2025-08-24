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
            const result = execSync(`pgrep -f "${pattern}"`, {
                encoding: 'utf8'
            })
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
            const result = execSync(`nc -z ${host} ${port}`, {
                encoding: 'utf8'
            })
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