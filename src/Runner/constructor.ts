export function constructor(this: any, options: any = {}) {
    this.suites = []
    this.results = []
    this.options = {
        parallel: false,
        verbose: false,
        bail: false,
        ...options
    }
}