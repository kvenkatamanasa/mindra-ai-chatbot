import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================================
// Configuration
// ============================================================

const OLLAMA_URL =
  process.env.OLLAMA_BASE_URL ||
  "http://127.0.0.1:11434";

const DEFAULT_MODEL =
  process.env.OLLAMA_MODEL ||
  "llama3.2";

// ============================================================
// POST /api/chat
// ============================================================

export async function POST(
  request: NextRequest
) {
  try {
    // ----------------------------------------------------------
    // Supabase
    // ----------------------------------------------------------

    const supabase =
      await createSupabaseServerClient();

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

    // ----------------------------------------------------------
    // Parse body
    // ----------------------------------------------------------

    let body: any;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Invalid JSON body.",
        },
        { status: 400 }
      );
    }

    const message =
      typeof body?.message === "string"
        ? body.message.trim()
        : "";

    const requestedConversationId =
      typeof body?.conversationId === "string" &&
      body.conversationId.trim()
        ? body.conversationId.trim()
        : null;

    const requestedModel =
      typeof body?.model === "string" &&
      body.model.trim()
        ? body.model.trim()
        : DEFAULT_MODEL;

    const regenerate =
      body?.regenerate === true;

    const memoryEnabled =
      body?.memoryEnabled !== false;

    const incomingMessages =
      Array.isArray(body?.messages)
        ? body.messages
        : [];

    // ----------------------------------------------------------
    // Validate message
    // ----------------------------------------------------------

    if (!message) {
      return NextResponse.json(
        {
          error: "Message is required.",
        },
        { status: 400 }
      );
    }

    // ----------------------------------------------------------
    // Find or create conversation
    // ----------------------------------------------------------

    let conversationId =
      requestedConversationId;

    if (conversationId) {
      const {
        data: conversation,
        error: conversationError,
      } = await supabase
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
            error:
              conversationError.message,
          },
          { status: 500 }
        );
      }

      if (!conversation) {
        return NextResponse.json(
          {
            error:
              "Conversation not found.",
          },
          { status: 404 }
        );
      }
    }

    // ----------------------------------------------------------
    // Create a new conversation
    // ----------------------------------------------------------

    if (!conversationId) {
      const title =
        message.length > 60
          ? `${message.substring(0, 60)}...`
          : message;

      const {
        data: newConversation,
        error: createConversationError,
      } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          title,
        })
        .select("id")
        .single();

      if (createConversationError) {
        console.error(
          "Create conversation error:",
          createConversationError
        );

        return NextResponse.json(
          {
            error:
              createConversationError.message,
            details:
              createConversationError,
          },
          { status: 500 }
        );
      }

      conversationId =
        newConversation.id;
    }

    // ----------------------------------------------------------
    // Save USER message
    //
    // Do not save again during regeneration because the
    // original user message already exists.
    // ----------------------------------------------------------

    if (!regenerate) {
      const {
        error: saveUserError,
      } = await supabase
        .from("messages")
        .insert({
          conversation_id:
            conversationId,
          user_id: user.id,
          role: "user",
          content: message,
          model: requestedModel,
        });

      if (saveUserError) {
        console.error(
          "Save user message error:",
          saveUserError
        );

        return NextResponse.json(
          {
            error:
              saveUserError.message,
          },
          { status: 500 }
        );
      }
    }

    // ----------------------------------------------------------
    // Update conversation timestamp
    // ----------------------------------------------------------

    await supabase
      .from("conversations")
      .update({
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", conversationId)
      .eq("user_id", user.id);

    // ----------------------------------------------------------
    // Build Ollama conversation
    // ----------------------------------------------------------

    let ollamaMessages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [];

    // System prompt
    ollamaMessages.push({
      role: "system",
      content:
        "You are Mindra, a helpful, intelligent and friendly AI assistant. " +
        "Give accurate, clear and useful answers. " +
        "When explaining technical topics, use simple step-by-step explanations. " +
        "Do not claim to have performed actions that you did not perform.",
    });

    if (
      memoryEnabled &&
      incomingMessages.length > 0
    ) {
      for (const item of incomingMessages) {
        if (
          item?.role !== "user" &&
          item?.role !== "assistant"
        ) {
          continue;
        }

        if (
          typeof item?.content !==
            "string" ||
          !item.content.trim()
        ) {
          continue;
        }

        ollamaMessages.push({
          role: item.role,
          content: item.content.trim(),
        });
      }
    }

    // For a normal message, add the current user message.
    //
    // For regeneration, the previous history already contains
    // the user message, so only add it if it isn't already
    // represented.
    const lastMessage =
      ollamaMessages[
        ollamaMessages.length - 1
      ];

    if (
      !lastMessage ||
      lastMessage.role !== "user" ||
      lastMessage.content !== message
    ) {
      ollamaMessages.push({
        role: "user",
        content: message,
      });
    }

    // ----------------------------------------------------------
    // Call Ollama
    // ----------------------------------------------------------

    let ollamaResponse: Response;

    try {
      ollamaResponse = await fetch(
        `${OLLAMA_URL}/api/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            model: requestedModel,
            messages: ollamaMessages,
            stream: true,
          }),
        }
      );
    } catch (error) {
      console.error(
        "Ollama connection error:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Could not connect to Ollama. Make sure Ollama is running.",
          details:
            error instanceof Error
              ? error.message
              : "Unknown connection error",
        },
        { status: 503 }
      );
    }

    // ----------------------------------------------------------
    // Ollama error
    // ----------------------------------------------------------

    if (!ollamaResponse.ok) {
      const errorText =
        await ollamaResponse.text();

      console.error(
        "Ollama returned error:",
        ollamaResponse.status,
        errorText
      );

      return NextResponse.json(
        {
          error:
            "Ollama request failed.",
          details: errorText,
        },
        {
          status:
            ollamaResponse.status >= 400
              ? ollamaResponse.status
              : 500,
        }
      );
    }

    if (!ollamaResponse.body) {
      return NextResponse.json(
        {
          error:
            "Ollama returned an empty response.",
        },
        { status: 502 }
      );
    }

    // ----------------------------------------------------------
    // Transform Ollama NDJSON stream into plain text
    //
    // Ollama returns lines such as:
    //
    // {"message":{"role":"assistant","content":"Hello"},"done":false}
    //
    // Your page.tsx expects plain text chunks, so we extract
    // only message.content.
    // ----------------------------------------------------------

    const reader =
      ollamaResponse.body.getReader();

    const decoder =
      new TextDecoder();

    const encoder =
      new TextEncoder();

    let buffer = "";

    const stream =
      new ReadableStream<Uint8Array>({
        async start(controller) {
          try {
            while (true) {
              const {
                value,
                done,
              } = await reader.read();

              if (done) {
                break;
              }

              buffer += decoder.decode(
                value,
                { stream: true }
              );

              const lines =
                buffer.split("\n");

              buffer =
                lines.pop() || "";

              for (const line of lines) {
                const trimmed =
                  line.trim();

                if (!trimmed) {
                  continue;
                }

                try {
                  const parsed =
                    JSON.parse(trimmed);

                  const content =
                    parsed?.message
                      ?.content;

                  if (
                    typeof content ===
                      "string" &&
                    content.length > 0
                  ) {
                    controller.enqueue(
                      encoder.encode(
                        content
                      )
                    );
                  }
                } catch (
                  parseError
                ) {
                  console.warn(
                    "Could not parse Ollama chunk:",
                    trimmed,
                    parseError
                  );
                }
              }
            }

            // Process any remaining buffered JSON.
            const finalLine =
              buffer.trim();

            if (finalLine) {
              try {
                const parsed =
                  JSON.parse(finalLine);

                const content =
                  parsed?.message
                    ?.content;

                if (
                  typeof content ===
                    "string" &&
                  content.length > 0
                ) {
                  controller.enqueue(
                    encoder.encode(
                      content
                    )
                  );
                }
              } catch {
                // Ignore incomplete final line.
              }
            }

            controller.close();
          } catch (error) {
            console.error(
              "Ollama stream error:",
              error
            );

            controller.error(error);
          } finally {
            reader.releaseLock();
          }
        },
      });

    // ----------------------------------------------------------
    // Return stream
    // ----------------------------------------------------------

    const response =
      new NextResponse(stream);

    response.headers.set(
      "Content-Type",
      "text/plain; charset=utf-8"
    );

    response.headers.set(
      "Cache-Control",
      "no-cache, no-transform"
    );

    response.headers.set(
      "X-Conversation-Id",
      conversationId
    );

    response.headers.set(
      "X-Model",
      requestedModel
    );

    return response;
  } catch (error) {
    console.error(
      "POST /api/chat error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Chat request failed.",
      },
      { status: 500 }
    );
  }
}