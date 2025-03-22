import { NextResponse } from 'next/server';

const JUDGE0_API_URL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY;

export async function POST(request: Request) {
  if (!JUDGE0_API_KEY) {
    return NextResponse.json(
      { error: 'Judge0 API key not configured' },
      { status: 500 }
    );
  }

  try {
    const { language_id, source_code } = await request.json();

    // Create submission
    const submissionResponse = await fetch(`${JUDGE0_API_URL}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': JUDGE0_API_KEY,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
      },
      body: JSON.stringify({
        language_id,
        source_code,
        stdin: '',
      }),
    });

    const submission = await submissionResponse.json();

    // Get submission result
    const resultResponse = await fetch(
      `${JUDGE0_API_URL}/submissions/${submission.token}?base64_encoded=false&fields=stdout,stderr,status_id,compile_output`,
      {
        headers: {
          'X-RapidAPI-Key': JUDGE0_API_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        },
      }
    );

    const result = await resultResponse.json();

    return NextResponse.json({
      output: result.stdout || result.compile_output || result.stderr || 'No output',
      status: result.status_id,
    });
  } catch (error) {
    console.error('Error executing code:', error);
    return NextResponse.json(
      { error: 'Failed to execute code' },
      { status: 500 }
    );
  }
} 