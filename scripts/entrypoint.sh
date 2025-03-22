#!/bin/sh

# Start with no extensions
rm -rf /home/coder/.local/share/code-server/extensions/*

# Start code-server with clean workspace
exec /usr/bin/entrypoint.sh --auth password 