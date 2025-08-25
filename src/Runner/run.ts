import { Battle } from '../Battle/index.js'
import { color as chalk } from '../utils/colors.js'

export async function run(this: any): Promise<{ total: number; passed: number; failed: number }> {
    console.log(chalk.blue('\nBattle Test Runner\n'))
    
    let totalTests = 0
    let passedTests = 0
    let failedTests = 0
    
    for (const suite of this.suites) {
        console.log(chalk.yellow(`\nSuite: ${suite.name}`))
        
        if (suite.beforeAll) await suite.beforeAll()
        
        for (const test of suite.tests) {
            totalTests++
            
            if (suite.beforeEach) await suite.beforeEach()
            
            const battle = new Battle({
                ...this.options,
                timeout: test.timeout || 10000
            })
            
            try {
                // Spawn the process
                await battle.spawn(test.command, test.args)
                
                // Wait for process to start
                await battle.wait(200)
                
                // Handle interactions
                if (test.interactions) {
                    for (const interaction of test.interactions) {
                        // Give time for prompt to appear
                        await battle.wait(100)
                        
                        await battle.interact(async (data, output) => {
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
                
                // Check expectations
                if (test.expectations) {
                    for (const expectation of test.expectations) {
                        await battle.expect(expectation)
                    }
                }
                
                console.log(chalk.green(`  PASS ${test.name}`))
                passedTests++
                
            } catch (error: any) {
                console.log(chalk.red(`  FAIL ${test.name}`))
                console.log(chalk.gray(`    ${error.message}`))
                failedTests++
                
                if (this.options.bail) {
                    break
                }
            } finally {
                battle.cleanup()
            }
            
            if (suite.afterEach) await suite.afterEach()
        }
        
        if (suite.afterAll) await suite.afterAll()
    }
    
    // Summary
    console.log(chalk.blue('\nResults:'))
    console.log(`  Total: ${totalTests}`)
    console.log(chalk.green(`  Passed: ${passedTests}`))
    if (failedTests > 0) {
        console.log(chalk.red(`  Failed: ${failedTests}`))
    }
    
    return {
        total: totalTests,
        passed: passedTests,
        failed: failedTests
    }
}