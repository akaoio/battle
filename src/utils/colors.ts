/**
 * Color utilities that work with both ESM and CJS builds
 * This avoids the chalk v5 ESM-only issue
 */

// Simple ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
}

// Helper to create chainable color functions
const createColorFunction = (colorCode: string) => {
  const fn = (text: string) => `${colorCode}${text}${colors.reset}`
  // Add chainable properties
  fn.bold = (text: string) => `${colorCode}${colors.bold}${text}${colors.reset}`
  fn.dim = (text: string) => `${colorCode}${colors.dim}${text}${colors.reset}`
  return fn
}

// Color functions that match chalk's API with chaining support
export const color = {
  red: createColorFunction(colors.red),
  green: createColorFunction(colors.green),
  yellow: createColorFunction(colors.yellow),
  blue: createColorFunction(colors.blue),
  magenta: createColorFunction(colors.magenta),
  cyan: createColorFunction(colors.cyan),
  gray: createColorFunction(colors.gray),
  bold: (text: string) => `${colors.bold}${text}${colors.reset}`,
  dim: (text: string) => `${colors.dim}${text}${colors.reset}`,
  bgRed: (text: string) => `${colors.bgRed}${text}${colors.reset}`,
  bgGreen: (text: string) => `${colors.bgGreen}${text}${colors.reset}`,
  bgYellow: (text: string) => `${colors.bgYellow}${text}${colors.reset}`,
  bgBlue: (text: string) => `${colors.bgBlue}${text}${colors.reset}`,
  white: (text: string) => text, // White is default
}

// Try to use chalk if available, otherwise use our simple implementation
let chalk: typeof color = color

try {
  // Try dynamic import for ESM
  const loadChalk = async () => {
    try {
      const chalkModule = await import('chalk')
      chalk = chalkModule.default || chalkModule
    } catch {
      // Fall back to our simple implementation
      chalk = color
    }
  }
  
  // Don't block on loading chalk
  loadChalk().catch(() => {
    // Ignore errors, use fallback
  })
} catch {
  // Use our simple implementation
  chalk = color
}

// Export both for compatibility
export default chalk
export { chalk }