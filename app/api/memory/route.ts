import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

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

    const { data, error } = await supabase
      .from("memories")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          error: "Failed to load memories.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      memories: data || [],
    });
  } catch (error) {
    console.error("Memory GET error:", error);

    return NextResponse.json(
      {
        error: "Failed to load memories.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    const supabase = await createClient();

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

    const body = await request
      .json()
      .catch(() => null);

    const memory = body?.memory?.trim();

    if (!memory) {
      return NextResponse.json(
        {
          error: "Memory cannot be empty.",
        },
        { status: 400 }
      );
    }

    if (memory.length > 1000) {
      return NextResponse.json(
        {
          error:
            "Memory cannot exceed 1000 characters.",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("memories")
      .insert({
        user_id: user.id,
        memory,
      })
      .select()
      .single();

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          error: "Failed to save memory.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      memory: data,
    });
  } catch (error) {
    console.error("Memory POST error:", error);

    return NextResponse.json(
      {
        error: "Failed to save memory.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request
) {
  try {
    const supabase = await createClient();

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

    const body = await request
      .json()
      .catch(() => null);

    const memoryId = body?.id;

    if (!memoryId) {
      return NextResponse.json(
        {
          error: "Memory ID is required.",
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("memories")
      .delete()
      .eq("id", memoryId)
      .eq("user_id", user.id);

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          error: "Failed to delete memory.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Memory DELETE error:", error);

    return NextResponse.json(
      {
        error: "Failed to delete memory.",
      },
      { status: 500 }
    );
  }
}