// Returns the PlaybackEngine source code for embedding in HTML
export function getPlaybackEngineSource(): string {
    return `
// Unified PlaybackEngine for consistent replay behavior
class PlaybackEngine {
    constructor(events, duration, options = {}) {
        this.events = events;
        this.duration = duration;
        this.options = {
            speed: 1.0,
            verbose: false,
            ...options
        };
        
        this.state = {
            isPlaying: false,
            isPaused: false,
            speed: this.options.speed || 1.0,
            currentEventIndex: 0,
            currentTime: 0,
            startTime: 0,
            lastPlayTime: 0
        };
        
        this.animationFrame = null;
        this.lastFrameTime = 0;
    }

    // Core playback controls
    play() {
        if (this.state.isPlaying) return;
        
        this.state.isPlaying = true;
        this.state.isPaused = false;
        this.state.startTime = Date.now() - this.state.currentTime;
        this.state.lastPlayTime = Date.now();
        
        this.notifyStateChange();
        this.scheduleNextFrame();
    }

    pause() {
        if (!this.state.isPlaying) return;
        
        this.state.isPlaying = false;
        this.state.isPaused = true;
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        this.notifyStateChange();
    }

    stop() {
        this.pause();
        this.state.currentEventIndex = 0;
        this.state.currentTime = 0;
        this.state.isPaused = false;
        this.notifyStateChange();
        this.notifyProgress();
    }

    restart() {
        this.stop();
        this.play();
    }

    // Speed control
    setSpeed(speed) {
        this.state.speed = Math.max(0, Math.min(50, speed));
        this.notifyStateChange();
    }

    getSpeed() {
        return this.state.speed;
    }

    // Seeking controls
    seek(timeMs) {
        const targetTime = Math.max(0, Math.min(this.duration, timeMs));
        this.state.currentTime = targetTime;
        
        // Find the appropriate event index
        this.state.currentEventIndex = 0;
        for (let i = 0; i < this.events.length; i++) {
            if (this.events[i].timestamp > targetTime) {
                break;
            }
            this.state.currentEventIndex = i;
        }
        
        // Process all events up to this point
        for (let i = 0; i < this.state.currentEventIndex; i++) {
            this.notifyEvent(this.events[i]);
        }
        
        this.notifyStateChange();
        this.notifyProgress();
    }

    seekToPercent(percent) {
        const targetTime = (percent / 100) * this.duration;
        this.seek(targetTime);
    }

    skipForward(ms = 1000) {
        this.seek(this.state.currentTime + ms);
    }

    skipBackward(ms = 1000) {
        this.seek(this.state.currentTime - ms);
    }

    jumpToStart() {
        this.seek(0);
    }

    jumpToEnd() {
        this.seek(this.duration);
        this.state.currentEventIndex = this.events.length;
    }

    // State getters
    getState() {
        return { ...this.state };
    }

    getCurrentTime() {
        return this.state.currentTime;
    }

    getDuration() {
        return this.duration;
    }

    getProgress() {
        return this.duration > 0 ? (this.state.currentTime / this.duration) * 100 : 0;
    }

    getCurrentEventIndex() {
        return this.state.currentEventIndex;
    }

    getTotalEvents() {
        return this.events.length;
    }

    isPlaying() {
        return this.state.isPlaying;
    }

    isPaused() {
        return this.state.isPaused;
    }

    // Private methods for animation and event processing
    scheduleNextFrame() {
        if (!this.state.isPlaying) return;
        
        const now = Date.now();
        const deltaTime = now - this.state.lastPlayTime;
        this.state.lastPlayTime = now;
        
        // Update current time based on speed
        if (this.state.speed > 0) {
            this.state.currentTime += deltaTime * this.state.speed;
            
            // Process events up to current time
            while (this.state.currentEventIndex < this.events.length) {
                const event = this.events[this.state.currentEventIndex];
                if (event.timestamp > this.state.currentTime) {
                    break;
                }
                
                this.notifyEvent(event);
                this.state.currentEventIndex++;
            }
            
            this.notifyProgress();
        }
        
        // Check if playback is complete
        if (this.state.currentTime >= this.duration || 
            this.state.currentEventIndex >= this.events.length) {
            this.state.isPlaying = false;
            this.state.currentTime = this.duration;
            this.notifyStateChange();
            this.notifyProgress();
            return;
        }
        
        // Schedule next frame
        this.animationFrame = requestAnimationFrame(() => this.scheduleNextFrame());
    }

    notifyEvent(event) {
        if (this.options.onEvent) {
            this.options.onEvent(event, this.getState());
        }
    }

    notifyStateChange() {
        if (this.options.onStateChange) {
            this.options.onStateChange(this.getState());
        }
    }

    notifyProgress() {
        if (this.options.onProgress) {
            this.options.onProgress(this.getProgress(), this.getState());
        }
    }

    // Cleanup
    destroy() {
        this.stop();
        this.options = {};
    }
}
`;
}