import { Queue } from 'bullmq';
import connection from './redis';

export const emailQueue = new Queue('email-sending-queue', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
