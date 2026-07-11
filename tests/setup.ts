// Ensure a valid test environment before any module reads process.env.
process.env.NODE_ENV = 'test';
process.env.AUTH_SECRET ??= 'test-secret-value-at-least-16-chars-long';
process.env.AUTH_URL ??= 'http://localhost:3000';
process.env.APP_URL ??= 'http://localhost:3000';
process.env.NEXT_PUBLIC_APP_URL ??= 'http://localhost:3000';
process.env.SMTP_HOST ??= 'localhost';
process.env.SMTP_PORT ??= '1025';
process.env.SMTP_FROM ??= 'noreply@teacherpaper.local';
process.env.DATABASE_URL ??= 'postgresql://tpm:tpm@localhost:5432/tpm_test?schema=public';
