import { Queue } from 'bullmq';
import type { WorksheetSpecification } from '@tpm/schemas';

const url = new URL(process.env.REDIS_URL ?? 'redis://localhost:6379');

/**
 * Connection options (not an ioredis instance) so module import stays
 * side-effect-free — BullMQ opens the socket lazily on the first queue
 * operation, letting `next build` import route modules without a live Redis.
 * `maxRetriesPerRequest: null` is required by BullMQ for blocking commands.
 */
export const connection = {
  host: url.hostname,
  port: url.port ? Number(url.port) : 6379,
  username: url.username || undefined,
  password: url.password || undefined,
  maxRetriesPerRequest: null,
  lazyConnect: true,
};

export interface WorksheetJobData {
  userId: string;
  documentId: string;
  jobId: string;
  spec: WorksheetSpecification;
}

export const WORKSHEET_QUEUE_NAME = 'worksheet';

export const worksheetQueue = new Queue<WorksheetJobData>(WORKSHEET_QUEUE_NAME, {
  connection,
});
