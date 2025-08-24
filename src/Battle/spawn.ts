import * as pty from 'node-pty'

export function spawn(this: any, command: string, args: string[] = []): void {
    this.log('info', `Spawning: ${command} ${args.join(' ')}`)
    
    this.pty = pty.spawn(command, args, {
        name: 'xterm-256color',
        cols: this.options.cols,
        rows: this.options.rows,
        cwd: this.options.cwd,
        env: {
            ...this.options.env,
            TERM: 'xterm-256color',
            FORCE_COLOR: '1'
        }
    })
    
    // Capture all output
    this.pty.onData((data: string) => {
        this.output += data
        
        if (this.options.verbose) {
            process.stdout.write(data)
        }
        
        this.log('output', data)
    })
    
    // Handle exit
    this.pty.onExit((exitData: any) => {
        this.log('info', `Process exited with code: ${exitData.exitCode}`)
    })
}