const express = require("express");
const next = require("next");
const net = require("net");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  const httpServer = require("http").createServer(server);

  server.all("*", (req, res) => {
    return handle(req, res);
  });

  // Force IPv4
  httpServer.listen(3000, "0.0.0.0", () => {
    console.log("> Ready on http://0.0.0.0:3000");
    // Log bound addresses
    const addr = httpServer.address();
    console.log(`Server listening on ${addr.address}:${addr.port}`);
  });

  // Disable IPv6 explicitly
  httpServer.on("error", (e) => {
    if (e.code === "EADDRINUSE") {
      console.error("Address already in use");
      process.exit(1);
    }
  });
});
