/**
 * Battle - Universal Terminal Testing Framework
 * Test any terminal application with real PTY emulation
 */

export { Battle } from './Battle/index.js'
export { Runner } from './Runner/index.js'
export { Silent } from './Silent/index.js'
export { Replay } from './Replay/index.js'
export * from './types/index.js'

// Quick test function
export async function test(
    name: string,
    command: string,
    interactions?: Array<{ expect: string | RegExp; respond: string }>,
    expectations?: Array<string | RegExp>
) {
    const { Battle } = await import('./Battle/index.js')
    const battle = new Battle({ verbose: false })
    
    const result = await battle.run(async (b) => {
        b.spawn(command)
        
        if (interactions) {
            for (const interaction of interactions) {
                await b.interact(async (data, output) => {
                    const clean = output.replace(/\x1b\[[0-9;]*[mGKJH]/g, '')
                    
                    if (typeof interaction.expect === 'string') {
                        if (clean.includes(interaction.expect)) {
                            return interaction.respond
                        }
                    } else if (interaction.expect.test(clean)) {
                        return interaction.respond
                    }
                    
                    return null
                })
            }
        }
        
        if (expectations) {
            for (const expectation of expectations) {
                b.expect(expectation)
            }
        }
    })
    
    return result
}