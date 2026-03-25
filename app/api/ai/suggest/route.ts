import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "expert") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { requestTitle, requestDescription, requestBudget } = body;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        messages: [
          {
            role: "user",
            content: `You are an expert consultant writing a proposal response. 
Based on this client request, generate a professional proposal draft.

Request Title: ${requestTitle}
Description: ${requestDescription}
Budget: ${requestBudget}

Generate a JSON response with these fields:
- subject: a clear proposal subject line
- message: a professional 2-3 paragraph proposal message
- price: a suggested price within the stated budget range
- attachmentName: a suggested filename for the proposal document

Return ONLY valid JSON, no markdown, no explanation.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("AI API error");
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "{}";
    
    let suggestion;
    try {
      suggestion = JSON.parse(text);
    } catch {
      suggestion = {
        subject: `Proposal for: ${requestTitle}`,
        message: `Thank you for this request. I can deliver a comprehensive solution within the stated timeframe and budget. My approach will focus on quality deliverables tailored to your specific needs.\n\nI have extensive experience in this area and can start immediately upon acceptance of this proposal.`,
        price: requestBudget,
        attachmentName: "proposal_draft.pdf",
      };
    }

    return NextResponse.json({ success: true, data: suggestion });
  } catch (error) {
    console.error("AI suggest error:", error);
    return NextResponse.json({ success: false, error: "AI suggestion failed" }, { status: 500 });
  }
}