import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { userId } = await auth();
    const body = await request.json();
    const { message, apiKey, modelName, backendUrl } = body;

    if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

    const resolvedApiKey = apiKey || process.env.GEMINI_API_KEY || '';
    const resolvedBackend = backendUrl || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const resolvedModel = modelName || 'gemini-1.5-flash';

    // Try the Python backend RAG pipeline first
    try {
      const response = await fetch(`${resolvedBackend}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': resolvedApiKey,
          'X-User-ID': userId || 'demo',
          'X-Model-Name': resolvedModel,
        },
        body: JSON.stringify({ question: message, user_id: userId || 'demo' }),
        signal: AbortSignal.timeout(15000),
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({ answer: data.answer, sources: data.sources || [] });
      }
    } catch {
      // Backend unavailable — fall through to direct Gemini call
    }

    // Direct Gemini API call (no RAG — answers from general knowledge)
    if (!resolvedApiKey) {
      return NextResponse.json({
        answer: `⚙️ No Gemini API key found. Please go to **Settings** and add your Gemini API key to enable AI responses.`,
        sources: [],
      });
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${resolvedModel}:generateContent?key=${resolvedApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are NeuralVault, an AI knowledge assistant. The user's local backend is offline, so you cannot search their documents right now. Answer helpfully from general knowledge, and mention that for document-specific answers they should start the Python backend.\n\nUser question: ${message}`
            }]
          }],
          generationConfig: { maxOutputTokens: 1024, temperature: 0.4 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.json();
      return NextResponse.json({ answer: `❌ Gemini API error: ${err.error?.message || 'Invalid API key'}`, sources: [] });
    }

    const geminiData = await geminiRes.json();
    const answer = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';

    return NextResponse.json({
      answer: `💡 *(Backend offline — answering from general knowledge)*\n\n${answer}`,
      sources: [],
    });

  } catch (error) {
    return NextResponse.json({ answer: `Error: ${error.message}`, sources: [] });
  }
}
