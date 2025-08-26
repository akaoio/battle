import fs from 'fs'
import { ReplayValidator, PathSecurity } from '../security/index.js'

export function load(this: any, filePath: string): void {
    // Validate file path for security
    const pathValidation = PathSecurity.validatePath(filePath, process.cwd())
    if (!pathValidation.valid) {
        throw new Error(`Invalid replay file path: ${pathValidation.error}`)
    }
    
    // Read file safely
    let json: string
    try {
        json = fs.readFileSync(pathValidation.normalized!, 'utf-8')
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            throw new Error(`Replay file not found: ${filePath}`)
        }
        throw new Error(`Failed to read replay file: ${error.message}`)
    }
    
    // Parse and validate JSON with security checks (prevents prototype pollution)
    try {
        this.data = ReplayValidator.parse(json)
        this.events = this.data.events || []
        
        // Additional validation
        if (!this.data.version || !this.data.events) {
            throw new Error('Invalid replay file format')
        }
        
        // Limit event count to prevent DoS
        if (this.data.events.length > 100000) {
            throw new Error('Replay file contains too many events (max 100000)')
        }
    } catch (error: any) {
        throw new Error(`Invalid replay file: ${error.message}`)
    }
}