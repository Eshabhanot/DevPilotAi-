# DevPilot Developer MCP Server

This service exposes controlled developer tools over Spring AI's Streamable HTTP MCP transport. It is deliberately separate from the AI Orchestrator: the orchestrator coordinates agents, while this server provides the bounded workspace and test-execution capabilities those agents may use.

Set `DEVPILOT_WORKSPACE_ROOT` to the single repository directory the server may access. By default the server listens only on `127.0.0.1:8085`; do not expose it externally without an authentication and authorization boundary.

The six tools are `listWorkspaceFiles`, `readWorkspaceFile`, `searchWorkspace`, `createWorkspaceFile`, `updateWorkspaceFile`, and `runApprovedTests`. Reads are limited to approved text files; edits are limited to `src` and `docs`, reject potential secrets, and retain a backup before replacement. The only test command is the fixed `mvn test` invocation.
