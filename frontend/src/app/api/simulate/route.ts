import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { tickers, startDate, endDate, showReasoning } = await req.json();

    // Validate input
    if (!tickers || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Format tickers for command line
    const tickerString = Array.isArray(tickers) ? tickers.join(',') : tickers;

    // Create unique filename for this simulation
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = `${timestamp}-simulation.xlsx`;

    // Construct command and arguments
    const pythonScript = path.join(process.cwd(), '../../src/main.py');
    const args = [
      pythonScript,
      '--tickers', tickerString,
      '--start-date', startDate,
      '--end-date', endDate,
      '--excel-output', outputFile,
    ];

    if (showReasoning) {
      args.push('--show-reasoning');
    }

    // Run the simulation
    const simulation = spawn('poetry', ['run', 'python', ...args], {
      cwd: path.join(process.cwd(), '../..'),
    });

    return new Promise<NextResponse>((resolve) => {
      let stderr = '';

      simulation.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      simulation.on('close', (code) => {
        if (code !== 0) {
          console.error('Simulation failed:', stderr);
          resolve(
            NextResponse.json(
              { error: 'Simulation failed', details: stderr },
              { status: 500 }
            )
          );
        } else {
          resolve(
            NextResponse.json({
              outputFile,
              message: 'Simulation completed successfully',
            })
          );
        }
      });

      simulation.on('error', (error) => {
        console.error('Failed to start simulation:', error);
        resolve(
          NextResponse.json(
            { error: 'Failed to start simulation' },
            { status: 500 }
          )
        );
      });
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 