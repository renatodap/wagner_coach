import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    // This endpoint is called by Supabase webhook
    const authHeader = request.headers.get('authorization');
    const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;

    // Verify webhook secret if configured
    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Get pending items from the queue using the RPC function
    const { data: queueItems, error: queueError } = await supabase
      .rpc('process_embedding_queue');

    if (queueError) {
      console.error('Error fetching queue items:', queueError);
      return Response.json(
        { error: 'Failed to fetch queue items' },
        { status: 500 }
      );
    }

    if (!queueItems || queueItems.length === 0) {
      return Response.json({
        message: 'No items to process',
        processed: 0
      });
    }

    const processedItems = [];
    const failedItems = [];

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Process each queue item
    for (const item of queueItems) {
      try {
        // Generate embedding using OpenAI
        const embeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: item.content,
          dimensions: 1536, // Explicitly set dimensions for OpenAI
        });

        const embedding = embeddingResponse.data[0].embedding;

        // Store the embedding using the complete_embedding_generation function
        const { error: completeError } = await supabase
          .rpc('complete_embedding_generation', {
            p_queue_id: item.queue_id,
            p_embedding: embedding
          });

        if (completeError) {
          throw completeError;
        }

        processedItems.push({
          queue_id: item.queue_id,
          content_type: item.content_type,
          content_id: item.content_id
        });

      } catch (error) {
        console.error(`Error processing item ${item.queue_id}:`, error);

        // Mark as failed in the queue
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await supabase
          .rpc('fail_embedding_generation', {
            p_queue_id: item.queue_id,
            p_error_message: errorMessage
          });

        failedItems.push({
          queue_id: item.queue_id,
          error: errorMessage
        });
      }
    }

    return Response.json({
      message: 'Processing complete',
      processed: processedItems.length,
      failed: failedItems.length,
      processedItems,
      failedItems
    });

  } catch (error) {
    console.error('Queue processing error:', error);
    return Response.json(
      {
        error: 'Failed to process embedding queue',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for manual trigger or health check
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const adminKey = process.env.ADMIN_API_KEY;

    // Require admin key for manual trigger
    if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check queue status
    const supabase = await createClient();
    const { count: pendingCount } = await supabase
      .from('embedding_generation_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: processingCount } = await supabase
      .from('embedding_generation_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'processing');

    const { count: failedCount } = await supabase
      .from('embedding_generation_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed')
      .lt('retry_count', 3);

    return Response.json({
      status: 'healthy',
      queue: {
        pending: pendingCount || 0,
        processing: processingCount || 0,
        failed_retryable: failedCount || 0
      }
    });

  } catch (error) {
    console.error('Health check error:', error);
    return Response.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}