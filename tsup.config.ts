import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['src/index.ts', 'src/cli.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    external: ['node-pty', '@akaoio/ruspty'],  // Mark native modules as external
    noExternal: [/^(?!(node-pty|@akaoio\/ruspty))/]  // Bundle everything else
})