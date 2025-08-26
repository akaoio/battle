/**
 * Safe Command Mode - Flexible security for Battle Framework
 * Allows legitimate complex commands while blocking malicious ones
 */

import { CommandSanitizer } from './index.js'

export enum SecurityLevel {
    STRICT = 'strict',        // Block all shell metacharacters
    BALANCED = 'balanced',    // Allow safe patterns, block dangerous ones
    PERMISSIVE = 'permissive' // Allow most things, block only obvious attacks
}

export class SafeCommandMode {
    
    /**
     * Validates commands based on security level and use case
     */
    static validateCommand(
        command: string, 
        level: SecurityLevel = SecurityLevel.BALANCED,
        context?: string
    ): { valid: boolean; sanitized?: string; error?: string } {
        
        // Always block obvious attacks
        const dangerousPatterns = [
            /rm\s+-rf\s+[\/~]/,           // Dangerous file deletion
            /:\(\)\{.*\}:/,               // Fork bomb
            /curl.*\|\s*sh/,              // Remote code execution
            /wget.*\|\s*sh/,              // Remote code execution
            /eval\s*\(/,                  // Code evaluation
            /exec\s*\(/,                  // Code execution
            /system\s*\(/,                // System calls
        ]
        
        for (const pattern of dangerousPatterns) {
            if (pattern.test(command)) {
                return { 
                    valid: false, 
                    error: `Blocked dangerous pattern: ${pattern}` 
                }
            }
        }
        
        switch (level) {
            case SecurityLevel.STRICT:
                return this.validateStrict(command)
                
            case SecurityLevel.BALANCED:
                return this.validateBalanced(command)
                
            case SecurityLevel.PERMISSIVE:
                return this.validatePermissive(command)
        }
    }
    
    /**
     * STRICT mode - Block all shell metacharacters
     * Good for: Public APIs, untrusted input
     */
    private static validateStrict(command: string): { valid: boolean; error?: string } {
        return CommandSanitizer.validate(command)
    }
    
    /**
     * BALANCED mode - Allow legitimate use cases
     * Good for: Testing interactive applications, scripting
     */
    private static validateBalanced(command: string): { valid: boolean; sanitized?: string; error?: string } {
        // Allow legitimate patterns
        const safePatterns = [
            // Interactive applications
            /^[a-zA-Z0-9_\-\.\/]+\s+--interactive/,
            /^[a-zA-Z0-9_\-\.\/]+\s+-i/,
            
            // Common testing patterns
            /^echo\s+[\w\s\-\.\=]+$/,
            /^cat\s+[a-zA-Z0-9_\-\.\/]+$/,
            /^ls\s+[a-zA-Z0-9_\-\.\/\s]*$/,
            /^pwd$/,
            /^whoami$/,
            /^date$/,
            
            // Development tools
            /^npm\s+(install|test|run|start|build)(\s+[a-zA-Z0-9_\-]+)?$/,
            /^git\s+(status|log|diff|add|commit)(\s+[a-zA-Z0-9_\-\.\/\s]*)?$/,
            /^node\s+[a-zA-Z0-9_\-\.\/]+$/,
            /^python3?\s+[a-zA-Z0-9_\-\.\/]+$/,
            
            // Interactive programs with input
            /^[a-zA-Z0-9_\-\.\/]+(\s+[a-zA-Z0-9_\-\.=:\/\s]+)*$/
        ]
        
        // Check if command matches safe patterns
        for (const pattern of safePatterns) {
            if (pattern.test(command)) {
                return { valid: true, sanitized: command }
            }
        }
        
        // Check for dangerous combinations
        const moderatelyDangerous = [
            /;.*rm/,                      // Command chaining with rm
            /\|\s*rm/,                    // Piping to rm
            /&&.*rm/,                     // AND chaining with rm
            // Allow stderr redirections (2>/dev/null) which are common for suppressing errors
        ]
        
        for (const pattern of moderatelyDangerous) {
            if (pattern.test(command)) {
                return { 
                    valid: false, 
                    error: `Potentially dangerous pattern: ${pattern}` 
                }
            }
        }
        
        // Allow if not explicitly dangerous
        return { valid: true, sanitized: command }
    }
    
    /**
     * PERMISSIVE mode - Allow most legitimate uses
     * Good for: Internal tools, development, advanced users
     */
    private static validatePermissive(command: string): { valid: boolean; sanitized?: string; error?: string } {
        // Only block the most obvious attacks
        const criticalPatterns = [
            /:\(\)\{.*\}:/,               // Fork bomb
            /rm\s+-rf\s+\/[^a-zA-Z]/,     // Root filesystem deletion
            /chmod\s+777\s+\/etc/,        // Critical permission changes
            /\/etc\/passwd/,              // System file access
            /\/etc\/shadow/,              // Password file access
        ]
        
        for (const pattern of criticalPatterns) {
            if (pattern.test(command)) {
                return { 
                    valid: false, 
                    error: `Critical security violation: ${pattern}` 
                }
            }
        }
        
        return { valid: true, sanitized: command }
    }
    
    /**
     * Creates a safe command execution context
     */
    static createSafeContext(level: SecurityLevel): SafeCommandContext {
        return new SafeCommandContext(level)
    }
}

/**
 * Safe command execution context
 */
export class SafeCommandContext {
    private level: SecurityLevel
    private executedCommands: string[] = []
    
    constructor(level: SecurityLevel) {
        this.level = level
    }
    
    /**
     * Validates and executes a command safely
     */
    validateAndExecute(command: string, args?: string[]): { valid: boolean; fullCommand?: string; error?: string } {
        const fullCommand = args ? `${command} ${args.join(' ')}` : command
        
        const validation = SafeCommandMode.validateCommand(fullCommand, this.level)
        
        if (validation.valid) {
            this.executedCommands.push(fullCommand)
        }
        
        return {
            valid: validation.valid,
            fullCommand: validation.sanitized || fullCommand,
            error: validation.error
        }
    }
    
    /**
     * Gets execution history
     */
    getHistory(): string[] {
        return [...this.executedCommands]
    }
    
    /**
     * Clears execution history
     */
    clearHistory(): void {
        this.executedCommands = []
    }
}

export default SafeCommandMode