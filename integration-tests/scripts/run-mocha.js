const { spawnSync } = require('child_process');

const rawArgs = process.argv.slice(2);
const mochaArgs = ['specs/**/*.test.js', '--timeout', '60000', '--exit'];
const passthroughArgs = [];

for (let index = 0; index < rawArgs.length; index += 1) {
  const arg = rawArgs[index];

  if (arg === '--ui') {
    process.env.TEST_HEADLESS = 'false';
    continue;
  }

  if (arg === '--grep') {
    mochaArgs.push('--grep', rawArgs[index + 1]);
    index += 1;
    continue;
  }

  passthroughArgs.push(arg);
}

const result = spawnSync('mocha', [...mochaArgs, ...passthroughArgs], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
