/**
 * @akaoio/battle build configuration
 * Uses @akaoio/builder for all build operations
 */
export default {
  entry: ["src/index.ts", "src/cli.ts"],
  target: "library",
  outDir: "dist",
  formats: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    "node:*",
    "node-pty",
    "terminal-kit",
    "chalk",
    "commander",
    "fs",
    "path",
    "child_process",
    "events",
    "util",
    "stream",
    "os",
    "readline"
  ],
  minify: false,
  bundle: true,
  splitting: false,
  keepNames: true,
  platform: "node",
  define: {
    __VERSION__: JSON.stringify(process.env.npm_package_version || "1.1.0")
  }
}