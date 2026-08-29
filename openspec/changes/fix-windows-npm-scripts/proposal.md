## Why

The web app’s npm scripts use POSIX-style inline environment-variable assignments such as `WRANGLER_LOG_PATH=.wrangler/wrangler.log vinext dev`. Those forms work on Unix-like shells but fail on Windows because `cmd.exe` does not accept the same syntax; npm then exits with a command-not-recognized error before the application starts.

This issue blocks the documented root-level commands (`npm run dev`, `npm run build`, `npm test`) on Windows even though the intended behavior is cross-platform and the repository already targets Cloudflare Workers and a local dev runtime.

## What Changes

- Replace inline environment-variable assignments in `apps/web/package.json` with a cross-platform mechanism that preserves the same runtime variables on Linux, macOS, CI and Windows.
- Keep the existing `WRANGLER_LOG_PATH` and `CLOUDFLARE_ENV` semantics intact.
- Leave the application behavior and product output unchanged beyond the fix for command execution on Windows.
- Update package metadata so the scripts work consistently in the repository’s documented workflow.

## Capabilities

### Modified Capabilities

- `web-local-dev`: Local web development commands remain available across supported platforms without changing the app’s runtime behavior.
- `web-build-and-test`: Build and test commands remain available across supported platforms while preserving the existing Wrangler logging and production environment behavior.

### New Capabilities

- `windows-npm-scripts`: npm scripts that execute across platforms including Windows without shell-level failures from environment-variable syntax.

## Impact

- Fixes the Windows-specific execution failure for the project’s standard npm commands.
- Keeps the repository's current development, build, preview and deployment workflow stable on Unix-like environments and CI.
- Avoids unrelated application or product changes by limiting the fix to package script execution semantics.
