import { Battle } from '../Battle/index.js'
import chalk from 'chalk'

export async function run(this: any): Promise<void> {
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
                battle.spawn(test.command, test.args)
                
                // Handle interactions
                if (test.interactions) {
                    for (const interaction of test.interactions) {
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
                        battle.expect(expectation)
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
    
    if (failedTests > 0) {
        process.exit(1)
    }
}