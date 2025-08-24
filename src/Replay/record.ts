import type { ReplayEvent } from '../types/index.js'

export function record(this: any, event: ReplayEvent): void {
    // Add timestamp relative to start
    const timestampedEvent = {
        ...event,
        timestamp: Date.now() - this.startTime
    }
    
    this.events.push(timestampedEvent)
}