import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================================
// GET /api/messages?conversationId=xxxxx
// Load messages for a conversation
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const conversationId =
      request.nextUrl.searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json(
        {
          error: "conversationId is required.",
        },
        { status: 400 }
      );
    }

    // ----------------------------------------------------------
    // Verify that this conversation belongs to the logged-in user
    // ----------------------------------------------------------
    const { data: conversation, error: conversationError } =
      await supabase
        .from("conversations")
        .select("id")
        .eq("id", conversationId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (conversationError) {
      console.error(
        "Conversation lookup error:",
        conversationError
      );

      return NextResponse.json(
        {
          error: conversationError.message,
        },
        { status: 500 }
      );
    }

    if (!conversation) {
      return NextResponse.json(
        {
          error: "Conversation not found.",
        },
        { status: 404 }
      );
    }

    // ----------------------------------------------------------
    // Load messages
    // ----------------------------------------------------------
    const { data: messages, error: messagesError } =
      await supabase
        .from("messages")
        .select(
          "id, role, content, model, created_at"
        )
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: true,
        });

    if (messagesError) {
      console.error(
        "Messages lookup error:",
        messagesError
      );

      return NextResponse.json(
        {
          error: "Failed to load messages.",
          details: messagesError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messages: messages || [],
    });
  } catch (error) {
    console.error(
      "GET /api/messages error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load messages.",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// POST /api/messages
// Save a message
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const conversationId =
      typeof body?.conversationId === "string"
        ? body.conversationId.trim()
        : "";

    const role =
      body?.role === "user" ||
      body?.role === "assistant"
        ? body.role
        : "";

    const content =
      typeof body?.content === "string"
        ? body.content.trim()
        : "";

    const model =
      typeof body?.model === "string"
        ? body.model.trim()
        : null;

    // ----------------------------------------------------------
    // Validate input
    // ----------------------------------------------------------
    if (!conversationId || !role || !content) {
      return NextResponse.json(
        {
          error:
            "conversationId, role and content are required.",
        },
        { status: 400 }
      );
    }

    // ----------------------------------------------------------
    // Verify conversation ownership
    // ----------------------------------------------------------
    const { data: conversation, error: conversationError } =
      await supabase
        .from("conversations")
        .select("id")
        .eq("id", conversationId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (conversationError) {
      console.error(
        "Conversation validation error:",
        conversationError
      );

      return NextResponse.json(
        {
          error: conversationError.message,
        },
        { status: 500 }
      );
    }

    if (!conversation) {
      return NextResponse.json(
        {
          error: "Conversation not found.",
        },
        { status: 404 }
      );
    }

    // ----------------------------------------------------------
    // Insert message
    // ----------------------------------------------------------
    const { data: savedMessage, error: saveError } =
      await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          user_id: user.id,
          role,
          content,
          model,
        })
        .select(
          "id, role, content, model, created_at"
        )
        .single();

    if (saveError) {
      console.error(
        "Save message error:",
        saveError
      );

      return NextResponse.json(
        {
          error: saveError.message,
        },
        { status: 500 }
      );
    }

    // ----------------------------------------------------------
    // Update conversation timestamp
    // ----------------------------------------------------------
    const { error: updateError } =
      await supabase
        .from("conversations")
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversationId)
        .eq("user_id", user.id);

    if (updateError) {
      console.error(
        "Conversation timestamp update error:",
        updateError
      );
    }

    // ----------------------------------------------------------
    // Return saved message
    // ----------------------------------------------------------
    return NextResponse.json({
      success: true,
      message: savedMessage,
    });
  } catch (error) {
    console.error(
      "POST /api/messages error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save message.",
      },
      { status: 500 }
    );
  }
}