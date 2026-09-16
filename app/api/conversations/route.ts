import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================================
// GET /api/conversations
// Load all conversations for logged-in user
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
          error: "Authentication required. Please login again.",
        },
        { status: 401 }
      );
    }

    const {
      data: conversations,
      error,
    } = await supabase
      .from("conversations")
      .select(
        "id, title, created_at, updated_at"
      )
      .eq("user_id", user.id)
      .order("updated_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Conversations query error:",
        error
      );

      return NextResponse.json(
        {
          error: "Failed to load conversations.",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      conversations: conversations || [],
    });
  } catch (error) {
    console.error(
      "GET /api/conversations error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load conversations.",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// POST /api/conversations
// Create a new conversation
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

    const title =
      typeof body?.title === "string" &&
      body.title.trim()
        ? body.title.trim()
        : "New conversation";

    const {
      data: conversation,
      error,
    } = await supabase
      .from("conversations")
      .insert({
        user_id: user.id,
        title:
          title.length > 100
            ? title.slice(0, 100)
            : title,
      })
      .select(
        "id, title, created_at, updated_at"
      )
      .single();

    if (error) {
      console.error(
        "Create conversation error:",
        error
      );

      return NextResponse.json(
        {
          error: "Could not create conversation.",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error(
      "POST /api/conversations error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not create conversation.",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH /api/conversations
// Rename / pin / update conversation
// ============================================================

export async function PATCH(request: NextRequest) {
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

    if (!conversationId) {
      return NextResponse.json(
        {
          error: "conversationId is required.",
        },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};

    if (typeof body?.title === "string") {
      const title = body.title.trim();

      if (title) {
        updates.title =
          title.length > 100
            ? title.slice(0, 100)
            : title;
      }
    }

    if (typeof body?.pinned === "boolean") {
      updates.pinned = body.pinned;
    }

    if (
      Object.keys(updates).length === 0
    ) {
      return NextResponse.json(
        {
          error: "No updates provided.",
        },
        { status: 400 }
      );
    }

    const {
      data: conversation,
      error,
    } = await supabase
      .from("conversations")
      .update(updates)
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .select(
        "id, title, created_at, updated_at"
      )
      .maybeSingle();

    if (error) {
      console.error(
        "Update conversation error:",
        error
      );

      return NextResponse.json(
        {
          error: error.message,
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

    return NextResponse.json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error(
      "PATCH /api/conversations error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not update conversation.",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE /api/conversations
// Delete one conversation OR all conversations
// ============================================================

export async function DELETE(
  request: NextRequest
) {
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

    const body = await request.json().catch(
      () => ({})
    );

    const conversationId =
      typeof body?.conversationId === "string"
        ? body.conversationId.trim()
        : "";

    // ----------------------------------------------------------
    // Delete all conversations
    // ----------------------------------------------------------

    if (!conversationId) {
      const {
        error,
      } = await supabase
        .from("conversations")
        .delete()
        .eq("user_id", user.id);

      if (error) {
        console.error(
          "Delete all conversations error:",
          error
        );

        return NextResponse.json(
          {
            error: error.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
      });
    }

    // ----------------------------------------------------------
    // Delete one conversation
    // ----------------------------------------------------------

    const {
      data: deletedConversation,
      error,
    } = await supabase
      .from("conversations")
      .delete()
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error(
        "Delete conversation error:",
        error
      );

      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 500 }
      );
    }

    if (!deletedConversation) {
      return NextResponse.json(
        {
          error: "Conversation not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "DELETE /api/conversations error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not delete conversation.",
      },
      { status: 500 }
    );
  }
}