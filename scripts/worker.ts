import { Worker } from 'bullmq';
import connection from '../lib/redis';
import { decrypt } from '../lib/encryption';
import { generateCertificate } from '../lib/pdf-generator';
import { sendEmail } from '../lib/email-sender';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

console.log('Worker started...');

const worker = new Worker('email-sending-queue', async (job) => {
  console.log(`Processing job ${job.id}`);
  const { recipient, template, subject, body, encryptedTokens } = job.data;

  try {
    // Decrypt tokens
    const tokenData = JSON.parse(decrypt(encryptedTokens));
    
    // Generate Certificate
    // Replace variables in body as well
    let emailBody = body;
    for (const [key, value] of Object.entries(recipient)) {
      emailBody = emailBody.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    const pdfBytes = await generateCertificate(template, recipient);

    // Send Email
    // Assuming recipient has an 'email' field. If not, try to find one.
    const email = recipient.email || recipient.Email || recipient.EMAIL;
    if (!email) {
      throw new Error('No email field found in recipient data');
    }

    await sendEmail(tokenData.provider, tokenData, email, subject, emailBody, pdfBytes);
    
    console.log(`Email sent to ${email}`);
    return { success: true, email };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Job ${job.id} failed:`, errorMessage);
    throw error;
  }
}, {
  connection,
  concurrency: 5, // Process 5 emails at a time
  limiter: {
    max: 10, // Max 10 jobs
    duration: 1000, // per 1 second (adjust based on provider limits)
  },
});

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed!`);
});

worker.on('failed', (job, err) => {
  if (job) {
    console.log(`Job ${job.id} failed with ${err.message}`);
  } else {
    console.log(`Job failed with ${err.message}`);
  }
});
