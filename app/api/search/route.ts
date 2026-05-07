import { NextRequest, NextResponse } from "next/server";

const SERPER_API_URL = "https://google.serper.dev/search";

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const response = await fetch(SERPER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": process.env.SERPER_API_KEY || "",
      },
      body: JSON.stringify({
        q: query,
        num: 5,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Serper API error:", errorText);
      return NextResponse.json(
        { error: "Failed to search" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Format search results for the LLM
    const formattedResults = [];

    if (data.answerBox) {
      formattedResults.push(`Answer: ${data.answerBox.answer || data.answerBox.snippet || ""}`);
    }

    if (data.knowledgeGraph) {
      formattedResults.push(`${data.knowledgeGraph.title}: ${data.knowledgeGraph.description || ""}`);
    }

    if (data.organic) {
      data.organic.slice(0, 3).forEach((result: { title: string; snippet: string }) => {
        formattedResults.push(`${result.title}: ${result.snippet}`);
      });
    }

    return NextResponse.json({ results: formattedResults.join("\n\n") });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Failed to search" },
      { status: 500 }
    );
  }
}
