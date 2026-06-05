import { NextResponse } from 'next/server';

export async function POST(request) {
  const body = await request.json();
  const { service } = body;

  if (service === 'gemini') {
    const { apiKey, modelName } = body;
    if (!apiKey) return NextResponse.json({ success: false, error: 'No API key provided' });

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName || 'gemini-1.5-flash'}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Say "connection successful" in 3 words.' }] }],
            generationConfig: { maxOutputTokens: 20 },
          }),
        }
      );
      const data = await res.json();
      if (data.error) return NextResponse.json({ success: false, error: data.error.message });
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Connected';
      return NextResponse.json({ success: true, message: reply });
    } catch (e) {
      return NextResponse.json({ success: false, error: e.message });
    }
  }

  if (service === 'supabase') {
    const { supabaseUrl, supabaseAnonKey } = body;
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ success: false, error: 'URL and key required' });
    }
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
      });
      return NextResponse.json({ success: res.ok || res.status === 200 || res.status === 400, message: 'Supabase reachable' });
    } catch (e) {
      return NextResponse.json({ success: false, error: e.message });
    }
  }

  return NextResponse.json({ success: false, error: 'Unknown service' });
}
