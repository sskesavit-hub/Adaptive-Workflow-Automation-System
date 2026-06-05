import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function POST(request) {
  try {
    const { userId } = await auth();
    const formData = await request.formData();
    const file = formData.get('file');
    const userIdFromBody = formData.get('userId') || userId || 'demo';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `${userIdFromBody}/${Date.now()}_${file.name}`;

    // Try to upload to Supabase Storage
    let fileUrl = null;
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(fileName, buffer, { contentType: file.type, upsert: false });

      if (!error) {
        const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);
        fileUrl = urlData.publicUrl;

        // Insert document record into Supabase DB
        await supabase.from('documents').insert({
          user_id: userIdFromBody,
          name: file.name,
          file_url: fileUrl,
          doc_type: file.name.split('.').pop(),
          status: 'processing',
        });
      }
    } catch (supabaseErr) {
      console.warn('Supabase not configured:', supabaseErr.message);
    }

    // Send to Python backend for embedding
    try {
      const backendFormData = new FormData();
      backendFormData.append('file', new Blob([buffer], { type: file.type }), file.name);
      backendFormData.append('user_id', userIdFromBody);
      backendFormData.append('file_url', fileUrl || '');

      await fetch(`${BACKEND_URL}/ingest`, {
        method: 'POST',
        body: backendFormData,
        headers: { 'X-API-Key': process.env.GEMINI_API_KEY || '' },
      });
    } catch {
      console.warn('Backend not available for embedding');
    }

    return NextResponse.json({
      id: Date.now().toString(),
      name: file.name,
      file_url: fileUrl,
      status: 'processing',
      message: 'File uploaded. Processing for AI indexing.',
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
