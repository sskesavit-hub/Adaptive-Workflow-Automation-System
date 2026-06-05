import { NextResponse } from 'next/server';

export async function POST(request) {
  const { provider } = await request.json();

  if (!provider) return NextResponse.json({ available: false, error: 'No provider' });

  const url = `${provider.baseUrl}${provider.modelsEndpoint}`;

  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) return NextResponse.json({ available: false, models: [] });

    const data = await res.json();

    // Extract model list based on provider type
    let models = [];
    if (provider.modelsPath && data[provider.modelsPath]) {
      models = data[provider.modelsPath].map(m => m[provider.modelNameKey] || m.name || m);
    } else if (Array.isArray(data)) {
      models = data.map(m => m.name || m.id || m);
    }

    return NextResponse.json({ available: true, models, provider: provider.id });
  } catch (e) {
    return NextResponse.json({ available: false, models: [], error: e.message });
  }
}
