export interface BattleOptions {
    cols?: number
    rows?: number
    cwd?: string
    env?: NodeJS.ProcessEnv
    timeout?: number
    screenshotDir?: string
    logDir?: string
    verbose?: boolean
}

export interface TestResult {
    success: boolean
    duration: number
    output: string
    screenshots: string[]
    logs: string[]
    error: string | null
    replayPath?: string
}

export type InteractionHandler = (
    data: string,
    fullOutput: string
) => Promise<string | null> | string | null

export interface TestCase {
    name: string
    command: string
    args?: string[]
    interactions?: Array<{
        expect: string | RegExp
        respond: string
    }>
    expectations?: Array<string | RegExp>
    timeout?: number
}

export interface TestSuite {
    name: string
    tests: TestCase[]
    beforeAll?: () => Promise<void> | void
    afterAll?: () => Promise<void> | void
    beforeEach?: () => Promise<void> | void
    afterEach?: () => Promise<void> | void
}

export interface ReplayEvent {
    type: 'spawn' | 'output' | 'input' | 'resize' | 'key' | 'screenshot' | 'expect' | 'exit'
    timestamp: number
    data: any
}

export interface ReplayData {
    version: string
    timestamp: string
    duration: number
    events: ReplayEvent[]
    metadata: {
        cols: number
        rows: number
        command: string
        args: string[]
        env: Record<string, string>
    }
}