/**
 * Resource management system to prevent leaks and ensure proper cleanup
 */

import { EventEmitter } from 'events'

/**
 * Tracks and manages disposable resources
 */
export class ResourceManager extends EventEmitter {
    private resources: Map<string, IResource> = new Map()
    private cleanupCallbacks: Map<string, () => Promise<void>> = new Map()
    private disposed: boolean = false
    private maxResources: number = 100
    private registrationTimestamps: Map<string, number> = new Map()
    private lastCleanup: number = 0
    private readonly CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 minutes
    private readonly MAX_REGISTRATIONS_PER_MINUTE = 60
    
    /**
     * Registers a resource for tracking with rate limiting
     */
    register(id: string, resource: IResource, cleanup?: () => Promise<void>): void {
        if (this.disposed) {
            throw new Error('ResourceManager has been disposed')
        }
        
        // Rate limiting check
        const now = Date.now()
        this.cleanupOldTimestamps(now)
        
        const recentRegistrations = Array.from(this.registrationTimestamps.values())
            .filter(timestamp => now - timestamp < 60000) // Last minute
        
        if (recentRegistrations.length >= this.MAX_REGISTRATIONS_PER_MINUTE) {
            throw new Error(`Rate limit exceeded: too many resource registrations (max ${this.MAX_REGISTRATIONS_PER_MINUTE}/minute)`)
        }
        
        if (this.resources.size >= this.maxResources) {
            throw new Error(`Resource limit exceeded (max: ${this.maxResources})`)
        }
        
        if (this.resources.has(id)) {
            throw new Error(`Resource with id ${id} already registered`)
        }
        
        this.resources.set(id, resource)
        this.registrationTimestamps.set(id, now)
        
        if (cleanup) {
            this.cleanupCallbacks.set(id, cleanup)
        }
        
        this.emit('resource:registered', id)
    }
    
    /**
     * Unregisters and cleans up a resource
     */
    async unregister(id: string): Promise<void> {
        const resource = this.resources.get(id)
        if (!resource) {
            return
        }
        
        try {
            // Call cleanup callback if exists
            const cleanup = this.cleanupCallbacks.get(id)
            if (cleanup) {
                await cleanup()
            }
            
            // Call resource's dispose method if available
            if ('dispose' in resource && typeof resource.dispose === 'function') {
                await resource.dispose()
            }
            
            this.resources.delete(id)
            this.cleanupCallbacks.delete(id)
            this.registrationTimestamps.delete(id)
            
            this.emit('resource:unregistered', id)
        } catch (error) {
            this.emit('resource:cleanup-error', { id, error })
            throw error
        }
    }
    
    /**
     * Gets a registered resource
     */
    get<T extends IResource>(id: string): T | undefined {
        return this.resources.get(id) as T
    }
    
    /**
     * Checks if a resource is registered
     */
    has(id: string): boolean {
        return this.resources.has(id)
    }
    
    /**
     * Disposes all resources
     */
    async dispose(): Promise<void> {
        if (this.disposed) {
            return
        }
        
        this.disposed = true
        
        const errors: Array<{ id: string; error: any }> = []
        
        // Clean up all resources in reverse order
        const ids = Array.from(this.resources.keys()).reverse()
        
        for (const id of ids) {
            try {
                await this.unregister(id)
            } catch (error) {
                errors.push({ id, error })
            }
        }
        
        this.resources.clear()
        this.cleanupCallbacks.clear()
        this.registrationTimestamps.clear()
        
        if (errors.length > 0) {
            this.emit('dispose:errors', errors)
        }
        
        this.emit('disposed')
        this.removeAllListeners()
    }
    
    /**
     * Cleans up old timestamps for rate limiting
     */
    private cleanupOldTimestamps(now: number): void {
        if (now - this.lastCleanup > this.CLEANUP_INTERVAL) {
            const cutoff = now - 60000 // Remove timestamps older than 1 minute
            for (const [id, timestamp] of this.registrationTimestamps.entries()) {
                if (timestamp < cutoff) {
                    this.registrationTimestamps.delete(id)
                }
            }
            this.lastCleanup = now
        }
    }
    
    /**
     * Gets resource statistics
     */
    getStats(): ResourceStats {
        return {
            count: this.resources.size,
            maxResources: this.maxResources,
            disposed: this.disposed,
            resources: Array.from(this.resources.keys()),
        }
    }
}

/**
 * Manages PTY lifecycle to prevent race conditions
 */
export class PTYLifecycleManager {
    private state: PTYState = 'idle'
    private pty: any = null
    private exitPromise: Promise<void> | null = null
    private exitResolve: (() => void) | null = null
    private killTimeout: NodeJS.Timeout | null = null
    
    /**
     * Spawns a new PTY, ensuring previous one is cleaned up
     */
    async spawn(ptyFactory: () => any): Promise<void> {
        // Ensure previous PTY is fully cleaned up
        await this.kill()
        
        this.state = 'spawning'
        
        try {
            this.pty = await ptyFactory()
            
            // Set up exit promise
            this.exitPromise = new Promise(resolve => {
                this.exitResolve = resolve
            })
            
            // Listen for exit
            if (this.pty && this.pty.onExit) {
                this.pty.onExit(() => {
                    this.handleExit()
                })
            }
            
            this.state = 'running'
        } catch (error) {
            this.state = 'error'
            throw error
        }
    }
    
    /**
     * Kills the PTY with proper cleanup
     */
    async kill(signal: string = 'SIGTERM'): Promise<void> {
        if (this.state === 'idle' || this.state === 'killed') {
            return
        }
        
        this.state = 'killing'
        
        if (this.pty) {
            try {
                // Send kill signal
                if (this.pty.kill) {
                    this.pty.kill(signal)
                }
                
                // Wait for exit with timeout
                await this.waitForExit(5000)
                
            } catch (error) {
                // Force kill if graceful kill failed
                if (this.pty.kill) {
                    this.pty.kill('SIGKILL')
                }
            } finally {
                this.cleanup()
            }
        }
        
        this.state = 'killed'
    }
    
    /**
     * Waits for PTY to exit with timeout
     */
    private async waitForExit(timeout: number): Promise<void> {
        if (!this.exitPromise) {
            return
        }
        
        return Promise.race([
            this.exitPromise,
            new Promise<void>((_, reject) => {
                this.killTimeout = setTimeout(() => {
                    reject(new Error('PTY kill timeout'))
                }, timeout)
            })
        ])
    }
    
    /**
     * Handles PTY exit
     */
    private handleExit(): void {
        if (this.exitResolve) {
            this.exitResolve()
            this.exitResolve = null
        }
        
        this.cleanup()
        this.state = 'exited'
    }
    
    /**
     * Cleans up resources
     */
    private cleanup(): void {
        if (this.killTimeout) {
            clearTimeout(this.killTimeout)
            this.killTimeout = null
        }
        
        this.pty = null
        this.exitPromise = null
        this.exitResolve = null
    }
    
    /**
     * Gets current state
     */
    getState(): PTYState {
        return this.state
    }
    
    /**
     * Gets PTY instance
     */
    getPTY(): any {
        return this.pty
    }
}

/**
 * Tracks event listeners for cleanup
 */
export class EventListenerTracker {
    private listeners: Map<string, ListenerInfo[]> = new Map()
    
    /**
     * Tracks an event listener
     */
    track(target: any, event: string, listener: Function): void {
        const key = this.getKey(target)
        
        if (!this.listeners.has(key)) {
            this.listeners.set(key, [])
        }
        
        this.listeners.get(key)!.push({
            target,
            event,
            listener,
        })
    }
    
    /**
     * Removes all tracked listeners for a target
     */
    removeAll(target: any): void {
        if (!target) {
            return
        }
        
        const key = this.getKey(target)
        const listeners = this.listeners.get(key)
        
        if (!listeners) {
            return
        }
        
        for (const info of listeners) {
            this.removeListener(info)
        }
        
        this.listeners.delete(key)
    }
    
    /**
     * Removes all tracked listeners
     */
    clear(): void {
        for (const [_, listeners] of this.listeners) {
            for (const info of listeners) {
                this.removeListener(info)
            }
        }
        
        this.listeners.clear()
    }
    
    /**
     * Removes a single listener
     */
    private removeListener(info: ListenerInfo): void {
        try {
            if (info.target.removeListener) {
                info.target.removeListener(info.event, info.listener)
            } else if (info.target.off) {
                info.target.off(info.event, info.listener)
            } else if (info.target.removeEventListener) {
                info.target.removeEventListener(info.event, info.listener)
            }
        } catch (error) {
            // Ignore errors during cleanup
        }
    }
    
    /**
     * Gets a unique key for a target
     */
    private getKey(target: any): string {
        if (target && target.id) {
            return String(target.id)
        }
        
        // Generate a unique key
        const id = Math.random().toString(36).substring(2)
        target.__tracker_id = id
        return id
    }
    
    /**
     * Gets statistics
     */
    getStats(): { targets: number; totalListeners: number } {
        let totalListeners = 0
        
        for (const listeners of this.listeners.values()) {
            totalListeners += listeners.length
        }
        
        return {
            targets: this.listeners.size,
            totalListeners,
        }
    }
}

// Interfaces
interface IResource {
    dispose?(): Promise<void> | void
}

interface ResourceStats {
    count: number
    maxResources: number
    disposed: boolean
    resources: string[]
}

type PTYState = 'idle' | 'spawning' | 'running' | 'killing' | 'killed' | 'exited' | 'error'

interface ListenerInfo {
    target: any
    event: string
    listener: Function
}

export default {
    ResourceManager,
    PTYLifecycleManager,
    EventListenerTracker,
}