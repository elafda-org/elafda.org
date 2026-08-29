## ADDED Requirements

### Requirement: Cross-platform npm script execution
The project SHALL allow the documented npm commands to run on Windows without changing the runtime behavior of `WRANGLER_LOG_PATH` or `CLOUDFLARE_ENV`.

#### Scenario: Local development starts on Windows
- **WHEN** a contributor runs `npm run dev` on Windows
- **THEN** the script sets the Wrangler log path and starts the local dev server without failing on the Windows shell

#### Scenario: Production build runs on Windows
- **WHEN** a contributor runs `npm run build` on Windows
- **THEN** the script executes the same production build flow and writes the Wrangler log output to the configured path

#### Scenario: Test command runs on Windows
- **WHEN** a contributor runs `npm test` on Windows
- **THEN** the build and rendered-output tests run through the repository’s existing test flow without command-shell errors

### Requirement: Unix behavior remains unchanged
The project MUST preserve the current environment-variable behavior on Linux, macOS, and CI while switching to cross-platform script execution.

#### Scenario: Production environment is requested
- **WHEN** `npm run build:production` runs in a Unix-like shell or CI environment
- **THEN** `CLOUDFLARE_ENV=production` remains set and the build continues to use the configured Wrangler log path
