import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { tool, input } = await req.json();

    if (!tool) {
      return NextResponse.json({ error: 'Tool name is required' }, { status: 400 });
    }

    if (!process.env.APIFY_API_KEY) {
      console.error('APIFY_API_KEY is not set');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    console.log('Calling Apify with tool:', tool);

    // Call the RAG Web Browser Actor
    const response = await fetch(`https://api.apify.com/v2/acts/${tool}/runs?token=${process.env.APIFY_API_KEY}`, {
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
      const errorText = await response.text();
      console.error('Apify API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Failed to call Apify API: ${response.statusText}`);
    }

    const runData = await response.json();
    console.log('Apify run started:', runData);
    
    if (!runData.data || !runData.data.defaultDatasetId) {
      throw new Error('Invalid response from Apify API');
    }
    
    // Wait for and fetch the results
    const datasetId = runData.data.defaultDatasetId;
    const maxAttempts = 30;
    let attempt = 0;
    
    while (attempt < maxAttempts) {
      console.log(`Fetching results attempt ${attempt + 1}/${maxAttempts}`);
      
      const itemsResponse = await fetch(
        `https://api.apify.com/v2/datasets/${datasetId}/items?token=${process.env.APIFY_API_KEY}`
      );
      
      if (!itemsResponse.ok) {
        console.error('Dataset fetch error:', await itemsResponse.text());
        throw new Error('Failed to fetch results from dataset');
      }
      
      const items = await itemsResponse.json();
      
      if (items.length > 0) {
        console.log(`Found ${items.length} results`);
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
      { error: error instanceof Error ? error.message : 'Failed to process request' },
      { status: 500 }
    );
  }
} 