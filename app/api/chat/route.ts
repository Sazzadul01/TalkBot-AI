import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `You are Sazzad, an advanced AI assistant inspired by J.A.R.V.I.S. from Iron Man. You are highly intelligent, witty, and helpful. Your responses should be:

1. Concise and to the point - optimized for voice output
2. Helpful and informative
3. Occasionally showing subtle wit or charm
4. Professional yet personable

When the user asks for real-time information (weather, news, current events, stock prices, etc.), you will receive search results to help answer. Use this information naturally in your response.

Keep responses under 3 sentences unless the user explicitly asks for more detail.`;

export async function POST(request: NextRequest) {
  try {
    const { messages, searchResults } = await request.json();

    const systemMessage = searchResults
      ? `${SYSTEM_PROMPT}\n\nHere are relevant search results to help answer the user's query:\n${searchResults}`
      : SYSTEM_PROMPT;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemMessage },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseText = completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response.";

    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
