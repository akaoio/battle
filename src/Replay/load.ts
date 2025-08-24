import fs from 'fs'

export function load(this: any, filePath: string): void {
    const json = fs.readFileSync(filePath, 'utf-8')
    this.data = JSON.parse(json)
    this.events = this.data.events || []
    
    // Validate replay data
    if (!this.data.version || !this.data.events) {
        throw new Error('Invalid replay file format')
    }
}