/**
 * Send special key sequences to the terminal
 * Supports arrow keys, function keys, control sequences, etc.
 */

export function sendKey(this: any, key: string): void {
    if (!this.pty) {
        throw new Error('No PTY process to send keys to')
    }
    
    const keyMap: Record<string, string> = {
        // Arrow keys
        'up': '\x1b[A',
        'down': '\x1b[B',
        'right': '\x1b[C',
        'left': '\x1b[D',
        
        // Function keys
        'f1': '\x1bOP',
        'f2': '\x1bOQ',
        'f3': '\x1bOR',
        'f4': '\x1bOS',
        'f5': '\x1b[15~',
        'f6': '\x1b[17~',
        'f7': '\x1b[18~',
        'f8': '\x1b[19~',
        'f9': '\x1b[20~',
        'f10': '\x1b[21~',
        'f11': '\x1b[23~',
        'f12': '\x1b[24~',
        
        // Control keys
        'enter': '\r',
        'return': '\r',
        'tab': '\t',
        'backspace': '\x7f',
        'delete': '\x1b[3~',
        'escape': '\x1b',
        'esc': '\x1b',
        'home': '\x1b[H',
        'end': '\x1b[F',
        'pageup': '\x1b[5~',
        'pagedown': '\x1b[6~',
        
        // Control combinations
        'ctrl+c': '\x03',
        'ctrl+d': '\x04',
        'ctrl+z': '\x1a',
        'ctrl+a': '\x01',
        'ctrl+e': '\x05',
        'ctrl+k': '\x0b',
        'ctrl+l': '\x0c',
        'ctrl+u': '\x15',
        'ctrl+w': '\x17',
        
        // Alt combinations
        'alt+b': '\x1bb',
        'alt+f': '\x1bf',
        'alt+d': '\x1bd',
        
        // Special
        'space': ' ',
        'clear': '\x1b[2J\x1b[H'
    }
    
    const sequence = keyMap[key.toLowerCase()] || key
    
    // Record key event
    this.replay.record({
        type: 'key',
        timestamp: 0,
        data: key
    })
    
    // Record as input too for accurate stdin recording
    this.replay.record({
        type: 'input',
        timestamp: 0,
        data: sequence
    })
    
    this.log('input', `Sending key: ${key} (${sequence.replace(/\x1b/g, '^[').replace(/\r/g, '\\r').replace(/\n/g, '\\n')})`)
    this.pty.write(sequence)
}