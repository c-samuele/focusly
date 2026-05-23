const { spawn } = require('node:child_process');

const processes = [];

const startProcess = (name, command, args) => {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: false,
  });

  child.on('exit', (code, signal) => {
    if (signal || code === 0) {
      return;
    }

    console.error(`[${name}] exited with code ${code}`);
    shutdown(code);
  });

  processes.push(child);
  return child;
};

const shutdown = (exitCode = 0) => {
  for (const child of processes) {
    if (!child.killed) {
      child.kill('SIGINT');
    }
  }

  process.exit(exitCode);
};

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

startProcess('backend', 'npm', ['run', 'dev:backend']);
startProcess('frontend', 'npm', ['run', 'dev:frontend']);
