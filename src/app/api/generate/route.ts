import { NextRequest } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const { imagePrompt } = await req.json();

        if (!imagePrompt) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        }

        const prompt = `${imagePrompt}`;

        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024"
        });

        if (!response.data) {
            throw new Error("Failed to generate image");
        }

        return new Response(JSON.stringify({ data: response.data }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        });

    } catch (error) {
        console.error("Errorr generating image:", error);
        return new Response(JSON.stringify({ error: "Failed to generate image due to internal server error" }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
}
