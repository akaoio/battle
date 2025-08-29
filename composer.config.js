// @akaoio/composer configuration for Battle cortex
module.exports = {
  sources: {
    docs: {
      pattern: 'src/doc/**/*.yaml',
      parser: 'yaml'
    }
  },
  build: {
    tasks: []
  },
  outputs: [
    {
      target: 'README.md',
      template: 'src/doc/templates/readme.md',
      data: 'docs'
    },
    {
      target: 'CLAUDE.md',
      template: 'src/doc/templates/claude.md',
      data: 'docs'
    }
  ],
  options: {
    baseDir: process.cwd()
  }
}
