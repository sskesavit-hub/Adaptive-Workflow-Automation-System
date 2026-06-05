import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { userId } = await auth();
    const body = await request.json();
    const {
      message,
      apiKey,
      modelName,
      backendUrl,
      localLlmEnabled,
      localLlmProvider,
      localLlmModel,
      localLlmUrl,
      localLlmType,
    } = body;

    if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

    const resolvedBackend = backendUrl || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

    // ── 1. Try Python RAG backend first ──────────────────────
    try {
      const response = await fetch(`${resolvedBackend}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey || process.env.GEMINI_API_KEY || '',
          'X-User-ID': userId || 'demo',
          'X-Model-Name': modelName || 'gemini-1.5-flash',
          'X-Local-LLM': localLlmEnabled ? 'true' : 'false',
          'X-Local-LLM-Provider': localLlmProvider || '',
          'X-Local-LLM-Model': localLlmModel || '',
          'X-Local-LLM-URL': localLlmUrl || '',
        },
        body: JSON.stringify({ question: message, user_id: userId || 'demo' }),
        signal: AbortSignal.timeout(15000),
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({ answer: data.answer, sources: data.sources || [] });
      }
    } catch {
      // Backend not running — fall through
    }

    // ── 2. Local LLM fallback (direct call) ──────────────────
    if (localLlmEnabled && localLlmModel && localLlmUrl) {
      const type = localLlmType || 'openai';
      const answer = await callLocalLlm({ message, model: localLlmModel, baseUrl: localLlmUrl, type });
      return NextResponse.json({
        answer: `🖥️ *(Local LLM — ${localLlmModel})*\n\n${answer}`,
        sources: [],
      });
    }

    // ── 3. Gemini API fallback ────────────────────────────────
    const resolvedApiKey = apiKey || process.env.GEMINI_API_KEY || '';
    if (resolvedApiKey) {
      const resolvedModel = modelName || 'gemini-1.5-flash';
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${resolvedModel}:generateContent?key=${resolvedApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `You are NeuralVault, a helpful AI knowledge assistant. The user's backend is offline so you cannot search their documents. Answer from general knowledge and note that document-specific answers need the backend running.\n\nUser: ${message}` }] }],
            generationConfig: { maxOutputTokens: 1024, temperature: 0.4 },
          }),
        }
      );

      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        const answer = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.';
        return NextResponse.json({
          answer: `💡 *(Gemini ${resolvedModel} — backend offline)*\n\n${answer}`,
          sources: [],
        });
      }
    }

    // ── 4. No AI available ────────────────────────────────────
    return NextResponse.json({
      answer: `⚙️ No AI available. Please either:\n\n1. **Add a Gemini API key** in Settings → Google Gemini AI\n2. **Install Ollama** locally → [ollama.ai](https://ollama.ai) → then run: \`ollama run llama3\`\n3. **Start the Python backend**: \`cd backend && python main.py\``,
      sources: [],
    });

  } catch (error) {
    return NextResponse.json({ answer: `Error: ${error.message}`, sources: [] });
  }
}

// ── Local LLM caller ─────────────────────────────────────────
async function callLocalLlm({ message, model, baseUrl, type }) {
  const SYSTEM = 'You are NeuralVault, a helpful AI knowledge assistant. Be concise and helpful.';

  if (type === 'ollama') {
    // Ollama native API
    const res = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt: `${SYSTEM}\n\nUser: ${message}\nAssistant:`, stream: false }),
      signal: AbortSignal.timeout(30000),
    });
    const data = await res.json();
    return data.response || 'No response from Ollama.';
  }

  // OpenAI-compatible API (LM Studio, Jan, GPT4All, LocalAI)
  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer local' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: message },
      ],
      max_tokens: 1024,
      temperature: 0.4,
      stream: false,
    }),
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'No response from local LLM.';
}
