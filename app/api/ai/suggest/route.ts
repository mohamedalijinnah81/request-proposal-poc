import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session || session.role !== "expert") {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { requestTitle, requestDescription, requestBudget } = body;

    const prompt = `You are an expert consultant writing a proposal response. 
Based on this client request, generate a professional proposal draft.

Request Title: ${requestTitle}
Description: ${requestDescription}
Budget: ${requestBudget}

Generate a JSON response with these fields:
- subject
- message
- price
- attachmentName

Return ONLY valid JSON.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error("OpenAI API error");
    }

    const data = await response.json();

    const text = data.choices?.[0]?.message?.content || "{}";    

    let suggestion;
    try {
      suggestion = JSON.parse(text);
    } catch {
      suggestion = {
        subject: `Proposal for: ${requestTitle}`,
        message: `Thank you for this request. I can deliver a comprehensive solution within the stated timeframe and budget.`,
        price: requestBudget,
        attachmentName: "proposal_draft.pdf",
      };
    }

    // ✅ Token tracking (REAL)
    const usage = data.usage || {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    };

    // ✅ Approx fallback (optional)
    const approxTokens = Math.ceil((prompt.length + text.length) / 4);

    return NextResponse.json({
      success: true,
      data: suggestion,
      tokenUsage: {
        ...usage,
        approxTokens,
      },
    });
  } catch (error) {
    console.error("AI suggest error:", error);

    return NextResponse.json(
      { success: false, error: "AI suggestion failed" },
      { status: 500 }
    );
  }
}