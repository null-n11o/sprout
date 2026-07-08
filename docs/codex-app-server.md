# Codex App Server

Codex App Server is a local interface for custom Codex clients. It is useful for
deep development integrations that need Codex threads, turns, approvals, and
streamed agent events. It is not part of the Sprout production app.

## Prerequisites

- Codex CLI is installed and authenticated.
- `codex doctor` passes in the local developer environment.
- This repository is trusted by Codex so `.codex/config.toml` and `AGENTS.md`
  are loaded.

## Commands

Start a foreground stdio app server for custom clients:

```bash
npm run codex:app-server
```

Start a foreground app server on Codex's default Unix socket:

```bash
npm run codex:app-server:unix
```

Start a foreground app server on a localhost WebSocket for local experiments:

```bash
npm run codex:app-server:ws:local
```

Generate TypeScript protocol bindings for the installed Codex CLI version:

```bash
npm run codex:app-server:schema
```

Generated schema files are written to `/tmp/sprout-codex-app-server-schema`.
They are version-specific diagnostics and should not be committed by default.

## Optional Daemon

`codex app-server daemon` requires the standalone Codex install managed by the
Codex installer. A Homebrew-only Codex install can run foreground app-server
commands, but daemon start will fail until the standalone install exists.

After installing the standalone Codex package, daemon commands can be run
directly:

```bash
codex app-server daemon start
codex app-server daemon version
codex app-server proxy
codex app-server daemon stop
```

## Client Flow

Clients connect to the selected transport and then:

1. Send `initialize` with client metadata.
2. Send the `initialized` notification.
3. Start or resume a thread.
4. Start a turn with `cwd` set to this repository when the task should operate
   on Sprout.
5. Read streamed notifications until `turn/completed`.

## Transport Notes

- The default app-server transport is stdio.
- `npm run codex:app-server:unix` exposes Codex's default local Unix socket
  while the foreground process is running.
- WebSocket transport is experimental. Keep it on `127.0.0.1` for local
  experiments, and configure WebSocket authentication before any remote or
  non-loopback exposure.

## Safety

- Do not commit app-server tokens, generated credentials, local sockets, logs,
  or machine-specific daemon state.
- Keep model provider, authentication, and telemetry settings in the developer's
  user-level Codex config unless the team explicitly decides otherwise.
- Use the Codex SDK instead of app-server for CI or batch automation.
