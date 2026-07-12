import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker } from 'bullmq';
import { WORKSHEET_QUEUE_NAME, connection, type WorksheetJobData } from '@tpm/queue';
import { generateWorksheetJob } from './jobs/worksheet';

// Point the prompt loader at the repo-root prompts/ dir regardless of cwd.
const here = path.dirname(fileURLToPath(import.meta.url));
process.env.PROMPTS_DIR ??= path.resolve(here, '../../../prompts');

const worker = new Worker<WorksheetJobData>(WORKSHEET_QUEUE_NAME, generateWorksheetJob, {
  connection,
  concurrency: 2,
});

worker.on('completed', (job) => console.log(`✓ Job ${job.id} done`));
worker.on('failed', (job, err) => console.error(`✗ Job ${job?.id}: ${err.message}`));

console.log(`Worker listening on "${WORKSHEET_QUEUE_NAME}" queue`);

async function shutdown(): Promise<void> {
  await worker.close();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
