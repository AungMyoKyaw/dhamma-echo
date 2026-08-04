# Security policy

## Supported version

Security fixes are provided for the latest release line.

## Reporting

Do not open a public issue for a suspected vulnerability. Use GitHub's private vulnerability reporting feature when enabled, or contact the repository owner privately.

Include the affected version, platform, reproduction steps, impact, and any proposed mitigation. Do not include secrets or personal data.

## Security boundaries

- The bundled catalogue is read-only.
- Tauri capabilities expose only core IPC and named application commands.
- Media playback accepts only HTTPS URLs on `dhammadownload.com`.
- The application does not execute shell commands or accept arbitrary filesystem paths.
- Personal listening state is stored locally and is not synchronized.

## Dependency response

High-severity advisories affecting reachable application code block a release. Platform advisories inherited from WebKitGTK/Tauri are evaluated against upstream guidance and documented when no immediate replacement exists.
