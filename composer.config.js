/**
 * Composer configuration for @akaoio/battle
 * Universal terminal testing framework with real PTY support
 * This config generates CLAUDE.md and README.md from atomic documentation
 */
module.exports = {
  // Advanced multi-source data processing
  sources: {
    // Core documentation atoms
    docs: {
      pattern: "src/doc/atoms/**/*.yaml",
      parser: "yaml",
      transform: {
        // Inject build metadata into docs
        addBuildInfo: true,
        // Process template variables in YAML
        processTemplates: true
      }
    },
    
    // Package metadata with enrichment
    package: {
      pattern: "package.json", 
      parser: "json",
      alias: "pkg",
      transform: {
        addDependencyInfo: true,
        calculateSizes: true
      }
    },
    
    // API documentation from source
    api: {
      pattern: "src/**/*.ts",
      parser: "typescript",
      exclude: ["**/*.test.ts", "**/*.spec.ts"],
      transform: {
        extractJSDoc: true,
        extractTypes: true,
        generateExamples: true
      }
    },
    
    // Test coverage and metrics
    tests: {
      pattern: "test/**/*.test.ts",
      parser: "typescript",
      transform: {
        extractTestCases: true,
        calculateCoverage: true,
        generateTestMatrix: true
      }
    },
    
    // Performance benchmarks
    benchmarks: {
      pattern: "benchmarks/**/*.json",
      parser: "json",
      optional: true,
      transform: {
        calculateMetrics: true,
        generateCharts: true
      }
    },
    
    // Build artifacts analysis
    buildInfo: {
      pattern: "dist/**/*.js",
      parser: "bundle-analyzer",
      optional: true,
      transform: {
        analyzeBundles: true,
        calculateSizes: true
      }
    },
    
    // Git history and contributors
    git: {
      parser: "git-log",
      options: {
        since: "1 year ago",
        format: "json"
      },
      transform: {
        extractContributors: true,
        generateTimeline: true
      }
    }
  },
  
  // Advanced build pipeline
  build: {
    tasks: [
      // Pre-build data processing
      {
        name: "validate-sources",
        command: "echo 'Validating documentation sources...'",
        when: "before"
      },
      {
        name: "generate-api-docs", 
        command: "typedoc --json docs/api.json src/index.ts",
        when: "before",
        optional: true
      },
      {
        name: "run-benchmarks",
        command: "npm run benchmark 2>/dev/null || true",
        when: "before",
        optional: true
      }
    ],
    parallel: true,
    onError: "continue"
  },
  
  // Comprehensive multi-format outputs
  outputs: [
    // Main README with rich content
    {
      target: "README.md",
      format: "markdown",
      processor: "template",
      template: "src/doc/templates/readme.hbs",
      data: ["docs", "pkg", "api", "tests", "git"],
      options: {
        generateTOC: true,
        injectBadges: true,
        processCodeBlocks: true
      }
    },
    
    // Comprehensive architecture documentation
    {
      target: "docs/ARCHITECTURE.md", 
      format: "markdown",
      processor: "template",
      template: "src/doc/templates/architecture.hbs",
      data: ["docs", "api", "tests"],
      options: {
        generateDiagrams: true,
        includeCodeExamples: true
      }
    },
    
    // Advanced API documentation
    {
      target: "docs/API.md",
      format: "markdown", 
      processor: "template",
      template: "src/doc/templates/api.hbs",
      data: ["api", "tests"],
      options: {
        generateExamples: true,
        includeTypeDefinitions: true,
        crossReference: true
      }
    },
    
    // Interactive HTML documentation
    {
      target: "docs/index.html",
      format: "html",
      processor: "template",
      template: "src/doc/templates/interactive.hbs",
      data: ["docs", "pkg", "api", "tests", "benchmarks"],
      options: {
        includeSearch: true,
        generateNavigation: true,
        embedAssets: true
      }
    },
    
    // JSON API for external tools
    {
      target: "docs/api.json",
      format: "json",
      processor: "structured",
      data: ["api", "tests", "pkg"],
      options: {
        schema: "openapi-3.0",
        validate: true,
        minify: false
      }
    },
    
    // YAML configuration reference
    {
      target: "docs/config-reference.yaml",
      format: "yaml",
      processor: "structured",
      data: ["docs.config"],
      options: {
        includeComments: true,
        sort: true
      }
    },
    
    // CSV data export for analysis
    {
      target: "docs/metrics.csv",
      format: "csv",
      processor: "structured", 
      data: ["tests", "benchmarks", "buildInfo"],
      options: {
        headers: true,
        delimiter: ","
      }
    },
    
    // XML sitemap for documentation
    {
      target: "docs/sitemap.xml",
      format: "xml",
      processor: "template",
      template: "src/doc/templates/sitemap.hbs",
      data: ["docs"],
      options: {
        xmlDeclaration: true,
        prettyPrint: true
      }
    }
  ],
  
  // Advanced watch configuration with hooks
  watch: {
    patterns: [
      "src/doc/**/*",
      "src/**/*.ts",
      "test/**/*.ts", 
      "package.json",
      "benchmarks/**/*"
    ],
    ignore: [
      "node_modules/**",
      "dist/**", 
      "docs/**/*.html",
      "**/*.tmp"
    ],
    debounce: 500,
    hooks: {
      beforeRebuild: [
        "echo '📚 Documentation change detected...'",
        "npm run typecheck 2>/dev/null || true"
      ],
      afterRebuild: [
        "echo '✅ Documentation updated!'",
        "ls -la docs/"
      ]
    }
  },
  
  // Rich configuration options
  options: {
    baseDir: ".",
    verbose: process.env.VERBOSE === "true",
    
    // Template processing options
    templates: {
      engine: "handlebars",
      helpers: {
        // Custom template helpers
        formatDate: true,
        generateBadge: true,
        renderCodeBlock: true,
        createAnchor: true
      },
      partials: "src/doc/partials",
      cache: process.env.NODE_ENV === "production"
    },
    
    // Output optimization
    optimization: {
      minifyHTML: process.env.NODE_ENV === "production",
      optimizeImages: true,
      inlineCSS: true,
      generateSourceMaps: false
    },
    
    // Plugin system
    plugins: [
      {
        name: "syntax-highlighter",
        enabled: true,
        options: { theme: "github" }
      },
      {
        name: "link-checker", 
        enabled: process.env.NODE_ENV === "production",
        options: { external: false }
      },
      {
        name: "performance-analyzer",
        enabled: true,
        options: { threshold: 100 }
      }
    ]
  }
}