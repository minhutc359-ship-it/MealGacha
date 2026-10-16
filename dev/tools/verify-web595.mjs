// Retain the documented entrypoint; new cohorts share the same browser contract.
process.argv.push('--cohort=595')
await import('./verify-visual-roster.mjs')
