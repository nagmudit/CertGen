import { NextRequest, NextResponse } from 'next/server';
import { emailQueue } from '@/lib/queue';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { template, recipients, subject, body: emailBody } = body;

    const authCookie = request.cookies.get('auth_session');
    if (!authCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const encryptedTokens = authCookie.value;
    const batchId = uuidv4();

    // Add jobs to queue
    const jobs = recipients.map((recipient: any) => ({
      name: 'send-email',
      data: {
        batchId,
        recipient,
        template,
        subject,
        body: emailBody,
        encryptedTokens, // Pass tokens to worker (worker will decrypt)
      },
      opts: {
        attempts: 3,
      },
    }));

    const jobNodes = await emailQueue.addBulk(jobs);
    
    // Store job IDs for this batch in Redis
    // We need to import the redis connection directly
    const redis = (await import('@/lib/redis')).default;
    const jobIds = jobNodes.map(j => j.id);
    if (jobIds.length > 0) {
      await redis.sadd(`batch:${batchId}`, ...jobIds);
      // Expire after 24 hours
      await redis.expire(`batch:${batchId}`, 60 * 60 * 24);
    }

    return NextResponse.json({ success: true, jobId: batchId, count: jobs.length });
  } catch (error: any) {
    console.error('Queue error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
