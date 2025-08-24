import fs from 'fs'
import path from 'path'

export function report(this: any): void {
    const reportPath = path.join(this.options.logDir || './logs', 'battle-report.json')
    
    const report = {
        timestamp: new Date().toISOString(),
        suites: this.suites,
        results: this.results,
        summary: {
            total: this.results.length,
            passed: this.results.filter((r: any) => r.success).length,
            failed: this.results.filter((r: any) => !r.success).length
        }
    }
    
    fs.mkdirSync(path.dirname(reportPath), { recursive: true })
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    
    console.log(`Report saved to: ${reportPath}`)
}