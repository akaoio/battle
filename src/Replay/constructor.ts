export function constructor(this: any) {
    this.events = []
    this.startTime = Date.now()
    this.data = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        duration: 0,
        events: [],
        metadata: {
            cols: 80,
            rows: 24,
            command: '',
            args: [],
            env: {}
        }
    }
}