export function cleanup(this: any): void {
    if (this.pty) {
        this.log('info', 'Cleaning up PTY process')
        try {
            this.pty.kill()
        } catch (error) {
            this.log('warn', `Failed to kill PTY: ${error}`)
        }
        this.pty = null
    }
}