import type { InteractionHandler } from '../types/index.js'

export async function interact(this: any, handler: InteractionHandler): Promise<void> {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            this.log('error', 'Interaction timeout')
            reject(new Error('Interaction timeout'))
        }, this.options.timeout)
        
        const cleanup = () => {
            clearTimeout(timeout)
            this.pty.onData(() => {}) // Remove listener
        }
        
        this.pty.onData(async (data: string) => {
            try {
                const response = await handler(data, this.output)
                
                if (response === null) {
                    // End interaction
                    cleanup()
                    resolve()
                } else if (response) {
                    // Send input
                    this.log('input', response)
                    this.pty.write(response)
                }
            } catch (error) {
                cleanup()
                reject(error)
            }
        })
    })
}