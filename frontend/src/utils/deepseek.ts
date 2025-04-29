interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export async function callDeepSeek(messages: DeepSeekMessage[]): Promise<string> {
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get response from DeepSeek');
    }

    const data: DeepSeekResponse = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling DeepSeek:', error);
    throw error;
  }
} 