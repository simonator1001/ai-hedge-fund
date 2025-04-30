import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { tool, args } = await req.json();
    console.log('MCP tool call:', { tool, args });

    // Call the MCP tool
    const response = await fetch('http://localhost:3000/api/tools/call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: tool,
        parameters: args
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('MCP tool error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Failed to call MCP tool: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error calling MCP tool:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to call MCP tool' },
      { status: 500 }
    );
  }
} 