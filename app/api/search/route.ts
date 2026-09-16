import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q")?.trim().toLowerCase() || "";

    if (!query) {
      return NextResponse.json({
        conversations: [],
      });
    }

    /*
      This API expects the conversations API to already provide
      the user's conversations.

      For now, search is performed client-side in page.tsx,
      so this endpoint safely returns an empty result when
      no server-side search is configured.
    */

    return NextResponse.json({
      conversations: [],
      query,
    });
  } catch (error) {
    console.error("Search error:", error);

    return NextResponse.json(
      {
        error: "Failed to search conversations.",
      },
      {
        status: 500,
      }
    );
  }
}