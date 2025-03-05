FROM codercom/code-server:latest

# Install curl for healthcheck
USER root
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create workspace directory
RUN mkdir -p /home/coder/project && \
    chown -R coder:coder /home/coder/project

# Switch back to coder user
USER coder
WORKDIR /home/coder/project

# Configure environment
ENV SHELL=/bin/bash \
    LANG=en_US.UTF-8 \
    DISABLE_TELEMETRY=true \
    DISABLE_UPDATE_CHECK=true

# Start code-server with a clean workspace and no auth
CMD ["code-server", "--auth", "none", "--host", "0.0.0.0", "--port", "8080", "--disable-telemetry"]
