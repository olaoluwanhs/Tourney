#!/usr/bin/env node

import { spawn } from "child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

// Run 'npm run dev-webapp'
const child = spawn(npmCommand, ["run", "dev-webapp"], {
  stdio: "inherit", // This ensures the output (logs) shows in your terminal
  shell: true, // Required for some environments to find the npm binary
});

child.on("exit", (code) => {
  process.exit(code);
});
