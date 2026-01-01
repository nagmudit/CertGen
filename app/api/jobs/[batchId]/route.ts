import { NextRequest, NextResponse } from 'next/server';
import { emailQueue } from '@/lib/queue';
import connection from '@/lib/redis';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const { batchId } = await params;

  try {
    const jobIds = await connection.smembers(`batch:${batchId}`);
    
    if (!jobIds || jobIds.length === 0) {
      return NextResponse.json({ jobs: [] });
    }

    const jobs = await Promise.all(
      jobIds.map(async (id) => {
        const job = await emailQueue.getJob(id);
        if (!job) return null;
        
        const state = await job.getState();
        const { recipient } = job.data;
        const email = recipient.email || recipient.Email || recipient.EMAIL || 'Unknown';
        
        return {
          id: job.id,
          email,
          status: state,
          failedReason: job.failedReason,
          finishedOn: job.finishedOn,
        };
      })
    );

    return NextResponse.json({ jobs: jobs.filter(Boolean) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
