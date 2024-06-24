import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Basit bir in-memory veritabanı simülasyonu (gerçek bir veritabanı kullanmanız önerilir)
let tasks: Record<string, { status: string; result: any }> = {};

interface FetchOptions extends RequestInit {
    timeout?: number;
}

async function fetchWithTimeout(resource: string, options: FetchOptions = {}): Promise<Response> {
    const { timeout = 60000 } = options; // 60 saniyelik bir timeout belirledik
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(resource, {
        ...options,
        signal: controller.signal
    });
    clearTimeout(id);
    return response;
}

export async function POST(req: NextRequest) {
    try {
        const { imagePrompt } = await req.json();

        if (!imagePrompt) {
            return new NextResponse(JSON.stringify({ error: "Missing required fields" }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const taskId = uuidv4();
        tasks[taskId] = { status: 'pending', result: null };

        // Görevi kuyruk sistemine ekle (in-memory veritabanında sakla)
        setImmediate(async () => {
            try {
                const prompt = `${imagePrompt}`;
                const response = await fetchWithTimeout(`https://api.openai.com/v1/images/generate`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: "dall-e-3",
                        prompt: prompt,
                        n: 1,
                        size: "1024x1024"
                    }),
                    timeout: 60000 // 60 saniye timeout
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error?.message || 'Failed to generate image');
                }

                tasks[taskId] = { status: 'completed', result: data };
            } catch (error) {
                tasks[taskId] = { status: 'failed', result: error.message };
            }
        });

        return new NextResponse(JSON.stringify({ taskId }), {
            status: 202,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error("Error:", error);
        return new NextResponse(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');

    if (!taskId || !tasks[taskId]) {
        return new NextResponse(JSON.stringify({ error: "Task not found" }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    return new NextResponse(JSON.stringify(tasks[taskId]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}
