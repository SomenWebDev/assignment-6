import { Server } from "http";
import app from "./app";
import config from "./config";

let server: Server;

async function main() {
  server = app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
  });
}

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection, shutting down:", err);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception, shutting down:", err);
  process.exit(1);
});

main();
