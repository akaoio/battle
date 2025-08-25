/**
 * PTY Compatibility Layer
 * Provides real PTY support for both Node.js and Bun
 * 
 * Node.js: Uses node-pty (kernel PTY via native bindings)
 * Bun: Uses @akaoio/ruspty (real PTY via Rust FFI with ARM64 support)
 */

export interface PTYOptions {
    name?: string
    cols?: number
    rows?: number
    cwd?: string
    env?: Record<string, string>
}

export interface IPTY {
    onData: (callback: (data: string) => void) => void
    onExit: (callback: (code: number) => void) => void
    write: (data: string) => void
    resize: (cols: number, rows: number) => void
    kill: (signal?: string) => void
    readonly pid: number | undefined
    readonly killed: boolean
}

/**
 * Detect runtime environment
 */
export function getRuntime(): 'bun' | 'node' | 'unknown' {
    // @ts-ignore - Bun global
    if (typeof Bun !== 'undefined') return 'bun'
    if (typeof process !== 'undefined' && process.versions?.node) return 'node'
    return 'unknown'
}

/**
 * Create PTY instance based on runtime
 */
export async function createPTY(
    command: string,
    args: string[],
    options: PTYOptions
): Promise<IPTY> {
    const runtime = getRuntime()
    
    if (runtime === 'bun') {
        // Use @akaoio/ruspty for real PTY support in Bun
        const { Ruspty } = await import('./Ruspty.js')
        return new Ruspty(command, args, options)
    } else if (runtime === 'node') {
        // Use node-pty for Node.js
        const { NodePTY } = await import('./NodePTY.js')
        return new NodePTY(command, args, options)
    } else {
        throw new Error(`Unsupported runtime: ${runtime}`)
    }
}

export default createPTY