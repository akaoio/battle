/**
 * Unified Playback Engine for Battle Replay System
 * Provides consistent playback logic for both terminal and HTML players
 */

export interface PlaybackState {
    isPlaying: boolean
    isPaused: boolean
    speed: number
    currentEventIndex: number
    currentTime: number
    startTime: number
    lastPlayTime: number
}

export interface PlaybackOptions {
    speed?: number
    verbose?: boolean
    onEvent?: (event: any, state: PlaybackState) => void
    onStateChange?: (state: PlaybackState) => void
    onProgress?: (progress: number, state: PlaybackState) => void
}

export class PlaybackEngine {
    private events: any[]
    private duration: number
    private state: PlaybackState
    private options: PlaybackOptions
    private animationFrame: any = null
    private lastFrameTime: number = 0

    constructor(events: any[], duration: number, options: PlaybackOptions = {}) {
        this.events = events
        this.duration = duration
        this.options = {
            speed: 1.0,
            verbose: false,
            ...options
        }
        
        this.state = {
            isPlaying: false,
            isPaused: false,
            speed: this.options.speed || 1.0,
            currentEventIndex: 0,
            currentTime: 0,
            startTime: 0,
            lastPlayTime: 0
        }
    }

    // Core playback controls
    play(): void {
        if (this.state.isPlaying) return
        
        this.state.isPlaying = true
        this.state.isPaused = false
        this.state.startTime = Date.now() - this.state.currentTime
        this.state.lastPlayTime = Date.now()
        
        this.notifyStateChange()
        this.scheduleNextFrame()
    }

    pause(): void {
        if (!this.state.isPlaying) return
        
        this.state.isPlaying = false
        this.state.isPaused = true
        
        if (this.animationFrame) {
            if (typeof cancelAnimationFrame !== 'undefined') {
                cancelAnimationFrame(this.animationFrame)
            } else if (this.animationFrame) {
                clearTimeout(this.animationFrame)
            }
            this.animationFrame = null
        }
        
        this.notifyStateChange()
    }

    stop(): void {
        this.pause()
        this.state.currentEventIndex = 0
        this.state.currentTime = 0
        this.state.isPaused = false
        this.notifyStateChange()
        this.notifyProgress()
    }

    restart(): void {
        this.stop()
        this.play()
    }

    // Speed control
    setSpeed(speed: number): void {
        this.state.speed = Math.max(0, Math.min(50, speed))
        this.notifyStateChange()
    }

    getSpeed(): number {
        return this.state.speed
    }

    // Seeking controls
    seek(timeMs: number): void {
        const targetTime = Math.max(0, Math.min(this.duration, timeMs))
        this.state.currentTime = targetTime
        
        // Find the appropriate event index
        this.state.currentEventIndex = 0
        for (let i = 0; i < this.events.length; i++) {
            if (this.events[i].timestamp > targetTime) {
                break
            }
            this.state.currentEventIndex = i
        }
        
        // Process all events up to this point
        for (let i = 0; i < this.state.currentEventIndex; i++) {
            this.notifyEvent(this.events[i])
        }
        
        this.notifyStateChange()
        this.notifyProgress()
    }

    seekToPercent(percent: number): void {
        const targetTime = (percent / 100) * this.duration
        this.seek(targetTime)
    }

    skipForward(ms: number = 1000): void {
        this.seek(this.state.currentTime + ms)
    }

    skipBackward(ms: number = 1000): void {
        this.seek(this.state.currentTime - ms)
    }

    jumpToStart(): void {
        this.seek(0)
    }

    jumpToEnd(): void {
        this.seek(this.duration)
        this.state.currentEventIndex = this.events.length
    }

    // State getters
    getState(): PlaybackState {
        return { ...this.state }
    }

    getCurrentTime(): number {
        return this.state.currentTime
    }

    getDuration(): number {
        return this.duration
    }

    getProgress(): number {
        return this.duration > 0 ? (this.state.currentTime / this.duration) * 100 : 0
    }

    getCurrentEventIndex(): number {
        return this.state.currentEventIndex
    }

    getTotalEvents(): number {
        return this.events.length
    }

    isPlaying(): boolean {
        return this.state.isPlaying
    }

    isPaused(): boolean {
        return this.state.isPaused
    }

    // Private methods for animation and event processing
    private scheduleNextFrame(): void {
        if (!this.state.isPlaying) return
        
        const now = Date.now()
        const deltaTime = now - this.state.lastPlayTime
        this.state.lastPlayTime = now
        
        // Update current time based on speed
        if (this.state.speed > 0) {
            this.state.currentTime += deltaTime * this.state.speed
            
            // Process events up to current time
            while (this.state.currentEventIndex < this.events.length) {
                const event = this.events[this.state.currentEventIndex]
                if (event.timestamp > this.state.currentTime) {
                    break
                }
                
                this.notifyEvent(event)
                this.state.currentEventIndex++
            }
            
            this.notifyProgress()
        }
        
        // Check if playback is complete
        if (this.state.currentTime >= this.duration || 
            this.state.currentEventIndex >= this.events.length) {
            this.state.isPlaying = false
            this.state.currentTime = this.duration
            this.notifyStateChange()
            this.notifyProgress()
            return
        }
        
        // Schedule next frame
        if (typeof requestAnimationFrame !== 'undefined') {
            this.animationFrame = requestAnimationFrame(() => this.scheduleNextFrame())
        } else {
            // Fallback for Node.js environment
            this.animationFrame = setTimeout(() => this.scheduleNextFrame(), 16)
        }
    }

    private notifyEvent(event: any): void {
        if (this.options.onEvent) {
            this.options.onEvent(event, this.getState())
        }
    }

    private notifyStateChange(): void {
        if (this.options.onStateChange) {
            this.options.onStateChange(this.getState())
        }
    }

    private notifyProgress(): void {
        if (this.options.onProgress) {
            this.options.onProgress(this.getProgress(), this.getState())
        }
    }

    // Cleanup
    destroy(): void {
        this.stop()
        this.options = {}
    }
}

// Helper function to format time
export function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// Helper function to get event description
export function getEventDescription(event: any): string {
    switch (event.type) {
        case 'spawn':
            return `SPAWN ${event.data.command} ${event.data.args?.join(' ') || ''}`
        case 'output':
            return `OUTPUT (${event.data.length} bytes)`
        case 'input':
            return `INPUT ${JSON.stringify(event.data)}`
        case 'key':
            return `KEY ${event.data}`
        case 'resize':
            return `RESIZE ${event.data.cols}x${event.data.rows}`
        case 'screenshot':
            return `SCREENSHOT ${event.data.name}`
        case 'expect':
            return `EXPECT ${event.data.pattern || event.data}`
        case 'exit':
            return `EXIT code ${event.data}`
        default:
            return event.type.toUpperCase()
    }
}