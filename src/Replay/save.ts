import fs from 'fs'
import path from 'path'

export function save(this: any, filePath: string): string {
    // Ensure directory exists
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
    
    // Update data with final events and duration
    this.data.events = this.events
    this.data.duration = Date.now() - this.startTime
    
    // Save as compressed JSON
    const json = JSON.stringify(this.data, null, 2)
    fs.writeFileSync(filePath, json)
    
    return filePath
}