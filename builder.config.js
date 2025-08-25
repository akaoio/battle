/**
 * @akaoio/battle ADVANCED build configuration
 * Deep integration with @akaoio/builder showcasing ALL advanced features
 */
export default {
  // Multi-entry configuration
  entry: ["src/index.ts", "src/cli.ts"],
  
  // Advanced target configuration
  target: "library",
  outDir: "dist",
  
  // Multi-format with optimization
  formats: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  
  // Sophisticated externals with patterns
  external: [
    /^node:/,
    "node-pty",
    "@akaoio/ruspty", 
    "terminal-kit",
    "chalk",
    "yargs",
    /^@types\//,
    // Dynamic externals for workspace deps
    /@akaoio\/.*$/
  ],
  
  // Advanced build settings (within current builder capabilities)
  minify: false,
  treeshake: false,
  
  // Advanced bundling options
  bundle: true,
  splitting: true,
  keepNames: true,
  platform: "node",
  
  // Rich build-time definitions
  define: {
    __VERSION__: JSON.stringify(process.env.npm_package_version || "1.1.3"),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __PACKAGE_NAME__: JSON.stringify("@akaoio/battle"),
    __NODE_ENV__: JSON.stringify(process.env.NODE_ENV || "production")
  },
  
  
  // Banner injection for all builds
  banner: `/**
 * @akaoio/battle v${process.env.npm_package_version || "1.1.3"}
 * Universal terminal testing framework with real PTY emulation
 * Built with @akaoio/builder - ${new Date().toISOString()}
 */`
}