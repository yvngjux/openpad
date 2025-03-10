#!/bin/bash

# Install only the Cursus extension
code-server --install-extension ./cursus-vscode/cursus.vsix

# Configure code-server to start with an empty workspace
echo '{
  "workbench.startupEditor": "none",
  "workbench.welcomePage.walkthroughs.openOnInstall": false
}' > /home/coder/.local/share/code-server/User/settings.json 