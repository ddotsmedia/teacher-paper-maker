import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const resolvePkg = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@tpm/schemas': resolvePkg('./packages/schemas/src/index.ts'),
      '@tpm/config': resolvePkg('./packages/config/src/index.ts'),
      '@tpm/database': resolvePkg('./packages/database/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    // Integration tests share one Postgres database; run files serially so each
    // file's resetDatabase() does not wipe another file's rows mid-test.
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['apps/web/src/lib/**', 'apps/web/src/server/**', 'packages/schemas/src/**'],
    },
    testTimeout: 20000,
  },
});
