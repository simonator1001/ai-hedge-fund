import { NextRequest } from 'next/server';
import { spawn } from 'child_process';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const url = new URL(req.url!);
  const tickers = url.searchParams.get('tickers');
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');
  const selectedAnalysts = url.searchParams.get('selectedAnalysts');
  const modelChoice = url.searchParams.get('modelChoice');
  const modelProvider = url.searchParams.get('modelProvider');
  const showReasoning = url.searchParams.get('showReasoning') === 'true';

  // Generate unique Excel output filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputFile = `${timestamp}-simulation.xlsx`;

  const args = [
    '../src/main.py',
    '--tickers', tickers!,
    '--start-date', startDate!,
    '--end-date', endDate!,
    '--excel-output', outputFile,
  ];
  if (selectedAnalysts) args.push('--selected-analysts', selectedAnalysts);
  if (modelChoice) args.push('--model-choice', modelChoice);
  if (modelProvider) args.push('--model-provider', modelProvider);
  if (showReasoning) args.push('--show-reasoning');

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      let sawResult = false;
      const simulation = spawn('poetry', ['run', 'python', ...args], {
        cwd: process.cwd(),
      });
      simulation.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (line.startsWith('PROGRESS:')) {
            const payload = line.replace('PROGRESS:', '');
            if (!closed) controller.enqueue(encoder.encode(`event: progress\ndata: ${payload}\n\n`));
          }
          if (line.startsWith('RESULT:')) {
            sawResult = true;
            const payload = line.replace('RESULT:', '');
            if (!closed) controller.enqueue(encoder.encode(`event: result\ndata: ${payload}\n\n`));
          }
        }
      });
      simulation.on('close', (code) => {
        if (!sawResult && !closed) {
          controller.enqueue(encoder.encode(`event: error\ndata: {"message":"No simulation result. Please check if the ticker is valid and supported."}\n\n`));
        }
        if (!closed) controller.enqueue(encoder.encode(`event: progress\ndata: {"percent":100,"status":"Simulation complete!"}\n\n`));
        if (!closed) controller.close();
        closed = true;
      });
      simulation.stderr.on('data', (data) => {
        if (!closed) controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify(data.toString())}\n\n`));
      });
      simulation.on('error', (err) => {
        if (!closed) controller.enqueue(encoder.encode(`event: error\ndata: {"message":${JSON.stringify(err.message)}}\n\n`));
        if (!closed) controller.close();
        closed = true;
      });
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
} 