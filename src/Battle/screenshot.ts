import fs from 'fs'
import path from 'path'
import { Terminal } from 'terminal-kit'

export function screenshot(this: any, name?: string): string {
    const timestamp = Date.now()
    const filename = name || `screenshot-${timestamp}.txt`
    const filepath = path.join(this.options.screenshotDir, filename)
    
    // Ensure directory exists
    fs.mkdirSync(this.options.screenshotDir, { recursive: true })
    
    // Parse ANSI and create text representation
    const screen = parseTerminalOutput(this.output)
    
    // Save raw output with ANSI codes
    fs.writeFileSync(filepath, this.output)
    
    // Save clean text version
    const cleanPath = filepath.replace('.txt', '-clean.txt')
    fs.writeFileSync(cleanPath, screen.clean)
    
    // Save HTML version for visual inspection
    const htmlPath = filepath.replace('.txt', '.html')
    fs.writeFileSync(htmlPath, screen.html)
    
    this.screenshots.push(filepath)
    this.log('info', `Screenshot saved: ${filepath}`)
    
    return filepath
}

function parseTerminalOutput(output: string): { clean: string; html: string } {
    // Remove ANSI escape codes for clean version
    const clean = output.replace(/\x1b\[[0-9;]*[mGKJH]/g, '')
    
    // Convert ANSI to HTML for visual version
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { 
            background: #000; 
            color: #fff; 
            font-family: 'Courier New', monospace;
            white-space: pre;
            padding: 20px;
        }
        .ansi-black { color: #000; }
        .ansi-red { color: #f00; }
        .ansi-green { color: #0f0; }
        .ansi-yellow { color: #ff0; }
        .ansi-blue { color: #00f; }
        .ansi-magenta { color: #f0f; }
        .ansi-cyan { color: #0ff; }
        .ansi-white { color: #fff; }
    </style>
</head>
<body>${convertAnsiToHtml(output)}</body>
</html>`
    
    return { clean, html }
}

function convertAnsiToHtml(text: string): string {
    // Simple ANSI to HTML converter
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\x1b\[31m/g, '<span class="ansi-red">')
        .replace(/\x1b\[32m/g, '<span class="ansi-green">')
        .replace(/\x1b\[33m/g, '<span class="ansi-yellow">')
        .replace(/\x1b\[34m/g, '<span class="ansi-blue">')
        .replace(/\x1b\[35m/g, '<span class="ansi-magenta">')
        .replace(/\x1b\[36m/g, '<span class="ansi-cyan">')
        .replace(/\x1b\[0m/g, '</span>')
        .replace(/\n/g, '<br>')
}