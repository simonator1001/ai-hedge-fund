import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { tool, input } = await req.json();

    if (!tool) {
      return NextResponse.json({ error: 'Tool name is required' }, { status: 400 });
    }

    // Call the RAG Web Browser Actor
    const response = await fetch('https://api.apify.com/v2/acts/apify~rag-web-browser/runs?token=' + process.env.APIFY_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...input,
        proxyConfiguration: { useApifyProxy: true }
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to call Apify API: ${response.statusText}`);
    }

    const runData = await response.json();
    
    // Wait for and fetch the results
    const datasetId = runData.data.defaultDatasetId;
    const maxAttempts = 30;
    let attempt = 0;
    
    while (attempt < maxAttempts) {
      const itemsResponse = await fetch(
        `https://api.apify.com/v2/datasets/${datasetId}/items?token=${process.env.APIFY_API_KEY}`
      );
      
      if (!itemsResponse.ok) {
        throw new Error('Failed to fetch results from dataset');
      }
      
      const items = await itemsResponse.json();
      
      if (items.length > 0) {
        return NextResponse.json(items);
      }
      
      // Wait 2 seconds before next attempt
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempt++;
    }
    
    throw new Error('Timeout waiting for results');

  } catch (error) {
    console.error('Error in MCP route:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 