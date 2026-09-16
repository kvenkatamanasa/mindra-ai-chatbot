"use client";

import {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

type Message = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  model?: string | null;
};

type Conversation = {
  id: string;
  title: string;
  created_at?: string;
  updated_at?: string;
};

type Settings = {
  theme: "system" | "light" | "dark";
  enterToSend: boolean;
  soundEnabled: boolean;
  memoryEnabled: boolean;
};

const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  enterToSend: true,
  soundEnabled: false,
  memoryEnabled: true,
};

const AVAILABLE_MODELS = [
  "llama3.2:latest",
  "llama3.2:3b",
  "llama3.1:8b",
  "mistral:latest",
  "gemma3:latest",
];

const SETTINGS_KEY = "ai-chatbot-settings";
const MODEL_KEY = "ai-chatbot-model";
const PINNED_KEY = "ai-chatbot-pinned";

export default function ChatPage() {
  // ============================================================
  // CHAT STATE
  // ============================================================

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] =
    useState<string | null>(null);

  const [model, setModel] = useState(
    "llama3.2:latest"
  );

  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] =
    useState(true);
  const [loadingMessages, setLoadingMessages] =
    useState(false);

  const [error, setError] = useState("");

  // ============================================================
  // SEARCH
  // ============================================================

  const [searchQuery, setSearchQuery] = useState("");

  // ============================================================
  // MOBILE
  // ============================================================

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  // ============================================================
  // SETTINGS
  // ============================================================

  const [settingsOpen, setSettingsOpen] =
    useState(false);

  const [settings, setSettings] =
    useState<Settings>(DEFAULT_SETTINGS);

  // ============================================================
  // RENAME
  // ============================================================

  const [editingConversationId, setEditingConversationId] =
    useState<string | null>(null);

  const [editingTitle, setEditingTitle] =
    useState("");

  const [savingRename, setSavingRename] =
    useState(false);

  // ============================================================
  // DELETE
  // ============================================================

  const [deletingConversationId, setDeletingConversationId] =
    useState<string | null>(null);

  const [clearingAll, setClearingAll] =
    useState(false);

  // ============================================================
  // PIN
  // ============================================================

  const [pinnedConversationIds, setPinnedConversationIds] =
    useState<string[]>([]);

  // ============================================================
  // FILE UPLOAD
  // ============================================================

  const [uploadingFile, setUploadingFile] =
    useState(false);

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  // ============================================================
  // GENERATION
  // ============================================================

  const abortControllerRef =
    useRef<AbortController | null>(null);

  // ============================================================
  // TEXT TO SPEECH
  // ============================================================

  const [speakingMessageId, setSpeakingMessageId] =
    useState<string | null>(null);

  // ============================================================
  // REFS
  // ============================================================

  const textareaRef =
    useRef<HTMLTextAreaElement>(null);

  const messagesEndRef =
    useRef<HTMLDivElement>(null);

  // ============================================================
  // THEME
  // ============================================================

  function applyTheme(
    theme: Settings["theme"]
  ) {
    if (typeof document === "undefined") {
      return;
    }

    const root =
      document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
      return;
    }

    if (theme === "light") {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
      return;
    }

    const prefersDark =
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;

    root.classList.toggle(
      "dark",
      prefersDark
    );

    root.style.colorScheme =
      prefersDark ? "dark" : "light";
  }

  // ============================================================
  // LOAD LOCAL SETTINGS
  // ============================================================

  useEffect(() => {
    try {
      const savedSettings =
        localStorage.getItem(
          SETTINGS_KEY
        );

      if (savedSettings) {
        const parsed =
          JSON.parse(savedSettings);

        const merged: Settings = {
          ...DEFAULT_SETTINGS,
          ...parsed,
        };

        setSettings(merged);
        applyTheme(merged.theme);
      } else {
        applyTheme(
          DEFAULT_SETTINGS.theme
        );
      }

      const savedModel =
        localStorage.getItem(
          MODEL_KEY
        );

      if (savedModel) {
        setModel(savedModel);
      }

      const savedPinned =
        localStorage.getItem(
          PINNED_KEY
        );

      if (savedPinned) {
        const parsedPinned =
          JSON.parse(savedPinned);

        if (
          Array.isArray(parsedPinned)
        ) {
          setPinnedConversationIds(
            parsedPinned
          );
        }
      }
    } catch (err) {
      console.error(
        "Could not load local settings:",
        err
      );

      applyTheme("system");
    }
  }, []);

  // ============================================================
  // SAVE SETTINGS
  // ============================================================

  useEffect(() => {
    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(settings)
      );
    } catch (err) {
      console.error(
        "Could not save settings:",
        err
      );
    }

    applyTheme(settings.theme);
  }, [settings]);

  // ============================================================
  // SAVE MODEL
  // ============================================================

  useEffect(() => {
    try {
      localStorage.setItem(
        MODEL_KEY,
        model
      );
    } catch (err) {
      console.error(
        "Could not save model:",
        err
      );
    }
  }, [model]);

  // ============================================================
  // SAVE PINNED
  // ============================================================

  useEffect(() => {
    try {
      localStorage.setItem(
        PINNED_KEY,
        JSON.stringify(
          pinnedConversationIds
        )
      );
    } catch (err) {
      console.error(
        "Could not save pinned conversations:",
        err
      );
    }
  }, [pinnedConversationIds]);

  // ============================================================
  // SYSTEM THEME
  // ============================================================

  useEffect(() => {
    if (
      settings.theme !==
      "system"
    ) {
      return;
    }

    const mediaQuery =
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      );

    const handler = () => {
      applyTheme("system");
    };

    mediaQuery.addEventListener(
      "change",
      handler
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        handler
      );
    };
  }, [settings.theme]);

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadConversations();
  }, []);

  // ============================================================
  // AUTO SCROLL
  // ============================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // ============================================================
  // GLOBAL KEYBOARD SHORTCUTS
  // ============================================================

  useEffect(() => {
    function handleGlobalKeyDown(
      event: globalThis.KeyboardEvent
    ) {
      if (
        (event.ctrlKey ||
          event.metaKey) &&
        event.key.toLowerCase() ===
          "k"
      ) {
        event.preventDefault();

        textareaRef.current?.focus();
        return;
      }

      if (
        (event.ctrlKey ||
          event.metaKey) &&
        event.shiftKey &&
        event.key.toLowerCase() ===
          "n"
      ) {
        event.preventDefault();

        startNewChat();
        return;
      }

      if (
        (event.ctrlKey ||
          event.metaKey) &&
        event.shiftKey &&
        event.key.toLowerCase() ===
          "s"
      ) {
        event.preventDefault();

        setSettingsOpen(true);
        return;
      }

      if (event.key === "Escape") {
        if (loading) {
          stopGenerating();
        }

        setSettingsOpen(false);
        setMobileSidebarOpen(false);
      }
    }

    window.addEventListener(
      "keydown",
      handleGlobalKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleGlobalKeyDown
      );
    };
  }, [loading]);

  // ============================================================
  // FILTER CONVERSATIONS
  // ============================================================

  const filteredConversations =
    conversations
      .filter((conversation) =>
        (
          conversation.title ||
          "Untitled conversation"
        )
          .toLowerCase()
          .includes(
            searchQuery
              .trim()
              .toLowerCase()
          )
      )
      .sort((a, b) => {
        const aPinned =
          pinnedConversationIds.includes(
            a.id
          );

        const bPinned =
          pinnedConversationIds.includes(
            b.id
          );

        if (aPinned && !bPinned) {
          return -1;
        }

        if (!aPinned && bPinned) {
          return 1;
        }

        const aTime =
          a.updated_at
            ? new Date(
                a.updated_at
              ).getTime()
            : 0;

        const bTime =
          b.updated_at
            ? new Date(
                b.updated_at
              ).getTime()
            : 0;

        return bTime - aTime;
      });

  // ============================================================
  // LOAD CONVERSATIONS
  // ============================================================

  async function loadConversations() {
    try {
      setLoadingConversations(true);

      const response =
        await fetch(
          "/api/conversations",
          {
            method: "GET",
            cache: "no-store",
          }
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            `Failed to load conversations (${response.status})`
        );
      }

      setConversations(
        Array.isArray(
          data?.conversations
        )
          ? data.conversations
          : []
      );
    } catch (err) {
      console.error(
        "Load conversations error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load conversations."
      );
    } finally {
      setLoadingConversations(false);
    }
  }

  // ============================================================
  // LOAD MESSAGES
  // ============================================================

  async function loadMessages(
    id: string
  ) {
    if (
      loading ||
      loadingMessages
    ) {
      return;
    }

    try {
      setError("");
      setLoadingMessages(true);

      const response =
        await fetch(
          `/api/messages?conversationId=${encodeURIComponent(
            id
          )}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            `Failed to load messages (${response.status})`
        );
      }

      const loadedMessages: Message[] =
        Array.isArray(
          data?.messages
        )
          ? data.messages
              .filter(
                (item: any) =>
                  item.role ===
                    "user" ||
                  item.role ===
                    "assistant"
              )
              .map(
                (item: any) => ({
                  id: item.id,
                  role: item.role,
                  content:
                    item.content ||
                    "",
                  model:
                    item.model ||
                    null,
                })
              )
          : [];

      setConversationId(id);
      setMessages(
        loadedMessages
      );
      setMessage("");
      setMobileSidebarOpen(false);

      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    } catch (err) {
      console.error(
        "Load messages error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load messages."
      );
    } finally {
      setLoadingMessages(false);
    }
  }

  // ============================================================
  // NEW CHAT
  // ============================================================

  function startNewChat() {
    if (loading) {
      return;
    }

    setConversationId(null);
    setMessages([]);
    setMessage("");
    setError("");
    setSearchQuery("");
    setMobileSidebarOpen(false);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  }

  // ============================================================
  // DELETE CONVERSATION
  // ============================================================

  async function deleteConversation(
    id: string,
    askConfirmation = true
  ) {
    if (
      loading &&
      id === conversationId
    ) {
      stopGenerating();
    }

    if (askConfirmation) {
      const confirmed =
        window.confirm(
          "Delete this conversation? This action cannot be undone."
        );

      if (!confirmed) {
        return;
      }
    }

    try {
      setDeletingConversationId(id);
      setError("");

      const response =
        await fetch(
          "/api/conversations",
          {
            method: "DELETE",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              conversationId: id,
            }),
          }
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to delete conversation."
        );
      }

      setConversations(
        (previous) =>
          previous.filter(
            (conversation) =>
              conversation.id !== id
          )
      );

      setPinnedConversationIds(
        (previous) =>
          previous.filter(
            (item) => item !== id
          )
      );

      if (
        conversationId === id
      ) {
        setConversationId(null);
        setMessages([]);
        setMessage("");
      }
    } catch (err) {
      console.error(
        "Delete conversation error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete conversation."
      );
    } finally {
      setDeletingConversationId(
        null
      );
    }
  }

  // ============================================================
  // CLEAR ALL
  // ============================================================

  async function clearAllConversations() {
    if (loading) {
      stopGenerating();
    }

    if (
      conversations.length === 0
    ) {
      setError(
        "There are no conversations to delete."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Delete all ${conversations.length} conversations permanently? This action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setClearingAll(true);
      setError("");

      const response =
        await fetch(
          "/api/conversations",
          {
            method: "DELETE",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              all: true,
            }),
          }
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Could not clear all conversations."
        );
      }

      setConversations([]);
      setPinnedConversationIds([]);
      setConversationId(null);
      setMessages([]);
      setMessage("");
      setSearchQuery("");
      setSettingsOpen(false);
    } catch (err) {
      console.error(
        "Clear all conversations error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not clear all conversations."
      );

      await loadConversations();
    } finally {
      setClearingAll(false);
    }
  }

  // ============================================================
  // CLEAR CURRENT CHAT
  // ============================================================

  async function clearCurrentChat() {
    if (loading) {
      stopGenerating();
    }

    if (!conversationId) {
      setMessages([]);
      setMessage("");
      setError("");
      setSettingsOpen(false);

      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);

      return;
    }

    const confirmed =
      window.confirm(
        "Delete this current conversation permanently?"
      );

    if (!confirmed) {
      return;
    }

    await deleteConversation(
      conversationId,
      false
    );

    setSettingsOpen(false);
  }

  // ============================================================
  // PIN / UNPIN
  // ============================================================

  function togglePinConversation(
    id: string
  ) {
    setPinnedConversationIds(
      (previous) => {
        if (
          previous.includes(id)
        ) {
          return previous.filter(
            (item) => item !== id
          );
        }

        return [
          ...previous,
          id,
        ];
      }
    );
  }

  // ============================================================
  // RENAME
  // ============================================================

  function startRename(
    conversation: Conversation
  ) {
    if (loading) {
      return;
    }

    setEditingConversationId(
      conversation.id
    );

    setEditingTitle(
      conversation.title || ""
    );
  }

  function cancelRename() {
    setEditingConversationId(null);
    setEditingTitle("");
  }

  async function saveRename(
    id: string
  ) {
    const title =
      editingTitle.trim();

    if (!title) {
      setError(
        "Conversation title cannot be empty."
      );
      return;
    }

    try {
      setSavingRename(true);
      setError("");

      const response =
        await fetch(
          "/api/conversations",
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              conversationId: id,
              title,
            }),
          }
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to rename conversation."
        );
      }

      setConversations(
        (previous) =>
          previous.map(
            (conversation) =>
              conversation.id === id
                ? {
                    ...conversation,
                    title,
                  }
                : conversation
          )
      );

      setEditingConversationId(null);
      setEditingTitle("");
    } catch (err) {
      console.error(
        "Rename error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to rename conversation."
      );
    } finally {
      setSavingRename(false);
    }
  }

  // ============================================================
  // NOTIFICATION SOUND
  // ============================================================

  function playNotificationSound() {
    if (!settings.soundEnabled) {
      return;
    }

    try {
      const AudioContextClass =
        window.AudioContext;

      if (!AudioContextClass) {
        return;
      }

      const audioContext =
        new AudioContextClass();

      const oscillator =
        audioContext.createOscillator();

      const gain =
        audioContext.createGain();

      oscillator.connect(gain);
      gain.connect(
        audioContext.destination
      );

      oscillator.frequency.value =
        660;

      gain.gain.setValueAtTime(
        0.05,
        audioContext.currentTime
      );

      gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime +
          0.15
      );

      oscillator.start();

      oscillator.stop(
        audioContext.currentTime +
          0.15
      );
    } catch (err) {
      console.error(
        "Notification sound failed:",
        err
      );
    }
  }

  // ============================================================
  // TEXT TO SPEECH
  // ============================================================

  function stopSpeaking() {
    if (
      typeof window ===
        "undefined" ||
      !window.speechSynthesis
    ) {
      return;
    }

    window.speechSynthesis.cancel();
    setSpeakingMessageId(null);
  }

  function speakMessage(
    item: Message,
    index: number
  ) {
    if (
      typeof window ===
        "undefined" ||
      !window.speechSynthesis
    ) {
      setError(
        "Text-to-speech is not supported in this browser."
      );
      return;
    }

    if (!item.content) {
      return;
    }

    const speakingId =
      item.id ||
      `local-${index}`;

    if (
      speakingMessageId ===
      speakingId
    ) {
      stopSpeaking();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(
        item.content
      );

    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setSpeakingMessageId(
        speakingId
      );
    };

    utterance.onend = () => {
      setSpeakingMessageId(null);
    };

    utterance.onerror = () => {
      setSpeakingMessageId(null);

      setError(
        "Could not play text-to-speech."
      );
    };

    window.speechSynthesis.speak(
      utterance
    );
  }

  // ============================================================
  // SEND MESSAGE
  // ============================================================

  async function sendMessage(
    event?: FormEvent,
    customText?: string,
    regenerateMode = false
  ) {
    event?.preventDefault();

    const text = (
      customText !== undefined
        ? customText
        : message
    ).trim();

    if (
      !text ||
      loading
    ) {
      return;
    }

    setError("");
    setLoading(true);

    const controller =
      new AbortController();

    abortControllerRef.current =
      controller;

    // Save the conversation ID that existed before
    // the API potentially creates a new conversation.
    const previousConversationId =
      conversationId;

    if (!regenerateMode) {
      setMessage("");

      setMessages(
        (previous) => [
          ...previous,
          {
            role: "user",
            content: text,
          },
          {
            role: "assistant",
            content: "",
            model,
          },
        ]
      );
    } else {
      setMessages(
        (previous) => [
          ...previous,
          {
            role: "assistant",
            content: "",
            model,
          },
        ]
      );
    }

    try {
      const response =
        await fetch(
          "/api/chat",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              message: text,
              conversationId:
                previousConversationId,
              model,
              regenerate:
                regenerateMode,
              memoryEnabled:
                settings.memoryEnabled,
              messages:
                messages.map(
                  (item) => ({
                    role:
                      item.role,
                    content:
                      item.content,
                  })
                ),
            }),
            signal:
              controller.signal,
          }
        );

      if (!response.ok) {
        const data =
          await response
            .json()
            .catch(() => null);

        throw new Error(
          data?.error ||
            `Chat request failed (${response.status})`
        );
      }

      const newConversationId =
        response.headers.get(
          "X-Conversation-Id"
        );

      const responseModel =
        response.headers.get(
          "X-Model"
        );

      const initialMessageId =
        response.headers.get(
          "X-Message-Id"
        );

      const activeConversationId =
        newConversationId ||
        previousConversationId;

      if (activeConversationId) {
        setConversationId(
          activeConversationId
        );
      }

      if (responseModel) {
        setModel(responseModel);
      }

      if (!response.body) {
        throw new Error(
          "The AI returned an empty response."
        );
      }

      const reader =
        response.body.getReader();

      const decoder =
        new TextDecoder();

      let assistantText = "";

      while (true) {
        const {
          value,
          done,
        } =
          await reader.read();

        if (done) {
          break;
        }

        const chunk =
          decoder.decode(
            value,
            {
              stream: true,
            }
          );

        assistantText += chunk;

        setMessages(
          (previous) => {
            const updated = [
              ...previous,
            ];

            const lastIndex =
              updated.length - 1;

            if (
              lastIndex >= 0 &&
              updated[lastIndex]
                .role ===
                "assistant"
            ) {
              updated[lastIndex] = {
                ...updated[
                  lastIndex
                ],
                id:
                  initialMessageId ||
                  updated[
                    lastIndex
                  ].id,
                content:
                  assistantText,
                model:
                  responseModel ||
                  model,
              };
            }

            return updated;
          }
        );
      }

      // --------------------------------------------------------
      // SAVE ASSISTANT RESPONSE
      // --------------------------------------------------------

      if (
        assistantText.trim() &&
        activeConversationId
      ) {
        const saveResponse =
          await fetch(
            "/api/messages",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                conversationId:
                  activeConversationId,
                role: "assistant",
                content:
                  assistantText,
                model:
                  responseModel ||
                  model,
              }),
            }
          );

        const savedData =
          await saveResponse
            .json()
            .catch(() => null);

        if (!saveResponse.ok) {
          throw new Error(
            savedData?.error ||
              "Could not save AI response."
          );
        }

        const savedId =
          savedData?.message?.id;

        if (savedId) {
          setMessages(
            (previous) => {
              const updated = [
                ...previous,
              ];

              const lastIndex =
                updated.length - 1;

              if (
                lastIndex >= 0 &&
                updated[
                  lastIndex
                ].role ===
                  "assistant"
              ) {
                updated[lastIndex] = {
                  ...updated[
                    lastIndex
                  ],
                  id: savedId,
                };
              }

              return updated;
            }
          );
        }
      }

      playNotificationSound();

      await loadConversations();
    } catch (err) {
      if (
        err instanceof DOMException &&
        err.name ===
          "AbortError"
      ) {
        setMessages(
          (previous) => {
            const updated = [
              ...previous,
            ];

            const lastIndex =
              updated.length - 1;

            if (
              lastIndex >= 0 &&
              updated[lastIndex]
                .role ===
                "assistant" &&
              !updated[lastIndex]
                .content
            ) {
              updated[lastIndex] = {
                ...updated[
                  lastIndex
                ],
                content:
                  "Generation stopped.",
              };
            }

            return updated;
          }
        );

        return;
      }

      console.error(
        "Send message error:",
        err
      );

      const errorMessage =
        err instanceof Error
          ? err.message
          : "Something went wrong.";

      setError(errorMessage);

      setMessages(
        (previous) => {
          const updated = [
            ...previous,
          ];

          const lastIndex =
            updated.length - 1;

          if (
            lastIndex >= 0 &&
            updated[lastIndex]
              .role ===
              "assistant" &&
            !updated[lastIndex]
              .content
          ) {
            updated[lastIndex] = {
              ...updated[
                lastIndex
              ],
              content:
                `Sorry, something went wrong.\n\n${errorMessage}`,
            };
          }

          return updated;
        }
      );
    } finally {
      abortControllerRef.current =
        null;

      setLoading(false);

      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  }

  // ============================================================
  // STOP GENERATING
  // ============================================================

  function stopGenerating() {
    if (
      abortControllerRef.current
    ) {
      abortControllerRef.current.abort();

      abortControllerRef.current =
        null;

      setLoading(false);
    }
  }

  // ============================================================
  // COPY MESSAGE
  // ============================================================

  async function copyMessage(
    content: string
  ) {
    try {
      await navigator.clipboard.writeText(
        content
      );

      setError("");
    } catch (err) {
      console.error(
        "Copy failed:",
        err
      );

      setError(
        "Could not copy the message."
      );
    }
  }

  // ============================================================
  // REGENERATE
  // ============================================================

  async function regenerate(
    index: number
  ) {
    if (loading) {
      return;
    }

    const assistantMessage =
      messages[index];

    if (
      !assistantMessage ||
      assistantMessage.role !==
        "assistant"
    ) {
      return;
    }

    if (!assistantMessage.id) {
      setError(
        "This response cannot be regenerated because its message ID is missing."
      );
      return;
    }

    let userIndex =
      index - 1;

    while (
      userIndex >= 0 &&
      messages[userIndex]
        .role !== "user"
    ) {
      userIndex--;
    }

    if (userIndex < 0) {
      setError(
        "Could not find the original user message."
      );
      return;
    }

    const userText =
      messages[
        userIndex
      ].content.trim();

    if (!userText) {
      setError(
        "Could not regenerate this response."
      );
      return;
    }

    if (!conversationId) {
      setError(
        "Conversation ID is missing."
      );
      return;
    }

    setError("");
    setLoading(true);

    const controller =
      new AbortController();

    abortControllerRef.current =
      controller;

    // Remove old assistant message
    // from the UI.
    setMessages(
      (previous) =>
        previous.slice(
          0,
          index
        )
    );

    try {
      const response =
        await fetch(
          "/api/chat",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              message: userText,
              conversationId,
              model,
              regenerate: true,
              regenerateMessageId:
                assistantMessage.id,
              memoryEnabled:
                settings.memoryEnabled,
              messages:
                messages
                  .slice(
                    0,
                    index
                  )
                  .map(
                    (item) => ({
                      role:
                        item.role,
                      content:
                        item.content,
                    })
                  ),
            }),
            signal:
              controller.signal,
          }
        );

      if (!response.ok) {
        const data =
          await response
            .json()
            .catch(() => null);

        throw new Error(
          data?.error ||
            `Regeneration failed (${response.status})`
        );
      }

      const newConversationId =
        response.headers.get(
          "X-Conversation-Id"
        );

      const responseModel =
        response.headers.get(
          "X-Model"
        );

      if (newConversationId) {
        setConversationId(
          newConversationId
        );
      }

      if (responseModel) {
        setModel(
          responseModel
        );
      }

      if (!response.body) {
        throw new Error(
          "The AI returned an empty response."
        );
      }

      setMessages(
        (previous) => [
          ...previous,
          {
            role: "assistant",
            content: "",
            model:
              responseModel ||
              model,
          },
        ]
      );

      const reader =
        response.body.getReader();

      const decoder =
        new TextDecoder();

      let assistantText = "";

      while (true) {
        const {
          value,
          done,
        } =
          await reader.read();

        if (done) {
          break;
        }

        assistantText +=
          decoder.decode(
            value,
            {
              stream: true,
            }
          );

        setMessages(
          (previous) => {
            const updated = [
              ...previous,
            ];

            const lastIndex =
              updated.length - 1;

            if (
              lastIndex >= 0 &&
              updated[lastIndex]
                .role ===
                "assistant"
            ) {
              updated[lastIndex] = {
                ...updated[
                  lastIndex
                ],
                content:
                  assistantText,
                model:
                  responseModel ||
                  model,
              };
            }

            return updated;
          }
        );
      }

      // --------------------------------------------------------
      // SAVE REGENERATED ASSISTANT RESPONSE
      // --------------------------------------------------------

      const savedConversationId =
        newConversationId ||
        conversationId;

      if (
        assistantText.trim() &&
        savedConversationId
      ) {
        const saveResponse =
          await fetch(
            "/api/messages",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                conversationId:
                  savedConversationId,
                role: "assistant",
                content:
                  assistantText,
                model:
                  responseModel ||
                  model,
              }),
            }
          );

        const savedData =
          await saveResponse
            .json()
            .catch(() => null);

        if (!saveResponse.ok) {
          throw new Error(
            savedData?.error ||
              "Could not save regenerated response."
          );
        }

        const savedId =
          savedData?.message?.id;

        if (savedId) {
          setMessages(
            (previous) => {
              const updated = [
                ...previous,
              ];

              const lastIndex =
                updated.length - 1;

              if (
                lastIndex >= 0 &&
                updated[
                  lastIndex
                ].role ===
                  "assistant"
              ) {
                updated[lastIndex] = {
                  ...updated[
                    lastIndex
                  ],
                  id: savedId,
                };
              }

              return updated;
            }
          );
        }
      }

      playNotificationSound();

      await loadConversations();
    } catch (err) {
      if (
        err instanceof DOMException &&
        err.name ===
          "AbortError"
      ) {
        return;
      }

      console.error(
        "Regeneration error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not regenerate the response."
      );
    } finally {
      abortControllerRef.current =
        null;

      setLoading(false);

      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  }

  // ============================================================
  // EXPORT
  // ============================================================

  function exportConversation() {
    if (
      messages.length === 0
    ) {
      setError(
        "There are no messages to export."
      );
      return;
    }

    try {
      const conversationTitle =
        conversations.find(
          (conversation) =>
            conversation.id ===
            conversationId
        )?.title ||
        "Mindra Chat Conversation";

      const exportedText = [
        conversationTitle,
        "=".repeat(
          conversationTitle.length
        ),
        "",
        ...messages.map(
          (item) => {
            const role =
              item.role === "user"
                ? "You"
                : "Mindra AI";

            return `${role}:\n${item.content}\n`;
          }
        ),
      ].join("\n");

      const blob =
        new Blob(
          [exportedText],
          {
            type:
              "text/plain;charset=utf-8",
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const anchor =
        document.createElement(
          "a"
        );

      anchor.href = url;

      const safeTitle =
        conversationTitle
          .replace(
            /[^a-z0-9\s-_]/gi,
            ""
          )
          .trim()
          .replace(
            /\s+/g,
            "-"
          )
          .slice(0, 80) ||
        "conversation";

      anchor.download =
        `${safeTitle}.txt`;

      document.body.appendChild(
        anchor
      );

      anchor.click();

      document.body.removeChild(
        anchor
      );

      URL.revokeObjectURL(url);

      setError("");
    } catch (err) {
      console.error(
        "Export error:",
        err
      );

      setError(
        "Could not export conversation."
      );
    }
  }

  // ============================================================
  // FILE UPLOAD
  // ============================================================

  async function handleFileUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setUploadingFile(true);
      setError("");

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      const response =
        await fetch(
          "/api/upload",
          {
            method: "POST",
            body: formData,
          }
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.details ||
            "Could not upload file."
        );
      }

      const extractedText =
        data?.text ||
        data?.content ||
        "";

      if (!extractedText) {
        throw new Error(
          "The file was uploaded but no readable text was returned."
        );
      }

      const fileName =
        data?.file?.name ||
        file.name;

      const fileType =
        data?.file?.type ||
        file.type ||
        "file";

      setMessage(
        `Analyze the uploaded ${fileType.toUpperCase()} file "${fileName}".\n\n${extractedText}`
      );

      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    } catch (err) {
      console.error(
        "Upload error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not upload file."
      );
    } finally {
      setUploadingFile(false);

      if (fileInputRef.current) {
        fileInputRef.current.value =
          "";
      }
    }
  }

  // ============================================================
  // KEYBOARD
  // ============================================================

  function handleKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      settings.enterToSend
    ) {
      event.preventDefault();

      if (!loading) {
        sendMessage();
      }
    }
  }

  // ============================================================
  // MESSAGE RENDERER
  // ============================================================

  function renderMessageContent(
    content: string
  ) {
    const parts =
      content.split(
        /(```[\s\S]*?```)/g
      );

    return parts.map(
      (part, index) => {
        if (
          part.startsWith("```")
        ) {
          const lines =
            part.split("\n");

          const language =
            lines[0]
              .replace(
                "```",
                ""
              )
              .trim();

          const code =
            lines
              .slice(
                1,
                -1
              )
              .join("\n");

          return (
            <div
              key={index}
              className="my-3 overflow-hidden rounded-xl border border-gray-200 bg-gray-950 dark:border-gray-700"
            >
              {language && (
                <div className="border-b border-gray-800 px-3 py-2 text-xs text-gray-400">
                  {language}
                </div>
              )}

              <pre className="overflow-x-auto p-4 text-xs leading-6 text-gray-100">
                <code>
                  {code}
                </code>
              </pre>
            </div>
          );
        }

        return (
          <span
            key={index}
            className="whitespace-pre-wrap"
          >
            {part}
          </span>
        );
      }
    );
  }

  // ============================================================
  // SIDEBAR
  // ============================================================

  function renderSidebarContent(
    mobile = false
  ) {
    return (
      <div className="flex h-full flex-col">
        {/* NEW CHAT */}

        <div className="border-b border-gray-200 p-4 dark:border-gray-800">
          <button
            type="button"
            onClick={
              startNewChat
            }
            disabled={loading}
            className="w-full rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-black"
          >
            + New Chat
          </button>
        </div>

        {/* SEARCH */}

        <div className="border-b border-gray-200 p-4 dark:border-gray-800">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔎
            </span>

            <input
              type="text"
              value={
                searchQuery
              }
              onChange={(
                event
              ) =>
                setSearchQuery(
                  event.target.value
                )
              }
              placeholder="Search conversations..."
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-9 text-sm outline-none focus:border-black dark:border-gray-700 dark:bg-gray-950"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() =>
                  setSearchQuery(
                    ""
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* CONVERSATIONS */}

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Conversations
            </h2>

            {!loadingConversations &&
              conversations.length >
                0 && (
                <span className="text-xs text-gray-400">
                  {
                    filteredConversations.length
                  }
                </span>
              )}
          </div>

          {loadingConversations ? (
            <p className="px-1 text-sm text-gray-500">
              Loading...
            </p>
          ) : filteredConversations.length ===
            0 ? (
            <div className="px-1 py-6 text-center">
              <div className="text-2xl">
                🔎
              </div>

              <p className="mt-2 text-sm text-gray-500">
                {searchQuery
                  ? "No conversations found."
                  : "No conversations yet."}
              </p>

              {searchQuery && (
                <button
                  type="button"
                  onClick={() =>
                    setSearchQuery(
                      ""
                    )
                  }
                  className="mt-2 text-xs font-medium underline"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredConversations.map(
                (
                  conversation
                ) => {
                  const isEditing =
                    editingConversationId ===
                    conversation.id;

                  const isDeleting =
                    deletingConversationId ===
                    conversation.id;

                  const isPinned =
                    pinnedConversationIds.includes(
                      conversation.id
                    );

                  return (
                    <div
                      key={
                        conversation.id
                      }
                      className={`group rounded-xl ${
                        conversation.id ===
                        conversationId
                          ? "bg-gray-200 dark:bg-gray-800"
                          : "hover:bg-gray-200 dark:hover:bg-gray-800"
                      }`}
                    >
                      {!isEditing ? (
                        <div className="flex items-center">
                          <button
                            type="button"
                            disabled={
                              loadingMessages ||
                              isDeleting
                            }
                            onClick={() =>
                              loadMessages(
                                conversation.id
                              )
                            }
                            className="min-w-0 flex-1 px-3 py-2.5 text-left text-sm disabled:opacity-50"
                          >
                            <span className="flex items-center gap-2">
                              {isPinned && (
                                <span
                                  className="shrink-0"
                                  title="Pinned"
                                >
                                  📌
                                </span>
                              )}

                              <span className="block truncate">
                                {conversation.title ||
                                  "Untitled conversation"}
                              </span>
                            </span>
                          </button>

                          <div className="mr-1 flex items-center opacity-0 transition group-hover:opacity-100">
                            {/* PIN */}

                            <button
                              type="button"
                              disabled={
                                isDeleting
                              }
                              onClick={() =>
                                togglePinConversation(
                                  conversation.id
                                )
                              }
                              title={
                                isPinned
                                  ? "Unpin"
                                  : "Pin"
                              }
                              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-300 dark:hover:bg-gray-700"
                            >
                              {isPinned
                                ? "📌"
                                : "📍"}
                            </button>

                            {/* RENAME */}

                            <button
                              type="button"
                              disabled={
                                loading ||
                                isDeleting
                              }
                              onClick={() =>
                                startRename(
                                  conversation
                                )
                              }
                              title="Rename"
                              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-300 dark:hover:bg-gray-700"
                            >
                              ✏️
                            </button>

                            {/* DELETE */}

                            <button
                              type="button"
                              disabled={
                                loading ||
                                isDeleting
                              }
                              onClick={() =>
                                deleteConversation(
                                  conversation.id
                                )
                              }
                              title="Delete"
                              className="rounded-lg p-1.5 text-gray-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950"
                            >
                              {isDeleting
                                ? "..."
                                : "🗑️"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2">
                          <input
                            autoFocus
                            type="text"
                            value={
                              editingTitle
                            }
                            onChange={(
                              event
                            ) =>
                              setEditingTitle(
                                event
                                  .target
                                  .value
                              )
                            }
                            onKeyDown={(
                              event
                            ) => {
                              if (
                                event.key ===
                                "Enter"
                              ) {
                                event.preventDefault();

                                saveRename(
                                  conversation.id
                                );
                              }

                              if (
                                event.key ===
                                "Escape"
                              ) {
                                cancelRename();
                              }
                            }}
                            maxLength={
                              100
                            }
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none dark:border-gray-600 dark:bg-gray-950"
                          />

                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              disabled={
                                savingRename
                              }
                              onClick={() =>
                                saveRename(
                                  conversation.id
                                )
                              }
                              className="flex-1 rounded-lg bg-black px-2 py-1.5 text-xs font-medium text-white dark:bg-white dark:text-black"
                            >
                              {savingRename
                                ? "Saving..."
                                : "Save"}
                            </button>

                            <button
                              type="button"
                              disabled={
                                savingRename
                              }
                              onClick={
                                cancelRename
                              }
                              className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>

        {/* CLEAR ALL */}

        {conversations.length >
          0 && (
          <div className="border-t border-gray-200 p-3 dark:border-gray-800">
            <button
              type="button"
              disabled={
                clearingAll ||
                loading
              }
              onClick={
                clearAllConversations
              }
              className="w-full rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-40 dark:border-red-900 dark:hover:bg-red-950/40"
            >
              {clearingAll
                ? "Clearing..."
                : "🧹 Clear all conversations"}
            </button>
          </div>
        )}

        {/* MOBILE CLOSE */}

        {mobile && (
          <div className="border-t border-gray-200 p-3 dark:border-gray-800">
            <button
              type="button"
              onClick={() =>
                setMobileSidebarOpen(
                  false
                )
              }
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm dark:border-gray-700"
            >
              Close
            </button>
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <main className="flex min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      {/* DESKTOP SIDEBAR */}

      <aside className="hidden w-80 shrink-0 border-r border-gray-200 bg-gray-50 md:flex dark:border-gray-800 dark:bg-gray-900">
        {renderSidebarContent()}
      </aside>

      {/* MOBILE SIDEBAR */}

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() =>
              setMobileSidebarOpen(
                false
              )
            }
            className="absolute inset-0 bg-black/40"
          />

          <aside className="relative z-10 h-full w-[85%] max-w-sm border-r border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
            {renderSidebarContent(
              true
            )}
          </aside>
        </div>
      )}

      {/* MAIN */}

      <section className="flex min-w-0 flex-1 flex-col">
        {/* HEADER */}

        <header className="flex h-16 items-center justify-between border-b border-gray-200 px-3 sm:px-4 dark:border-gray-800">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() =>
                setMobileSidebarOpen(
                  true
                )
              }
              className="rounded-lg border border-gray-300 px-2.5 py-2 text-sm md:hidden dark:border-gray-700"
              aria-label="Open conversations"
            >
              ☰
            </button>

            <div className="min-w-0">
              <h1 className="truncate font-semibold">
                Mindra
              </h1>

              <p className="text-xs text-gray-500">
                AI assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* MODEL */}

            <select
              value={model}
              onChange={(
                event
              ) =>
                setModel(
                  event.target.value
                )
              }
              disabled={loading}
              className="hidden max-w-[180px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none disabled:opacity-50 sm:block dark:border-gray-700 dark:bg-gray-900"
            >
              {AVAILABLE_MODELS.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>

            {/* EXPORT */}

            <button
              type="button"
              onClick={
                exportConversation
              }
              disabled={
                messages.length ===
                0
              }
              className="hidden rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 sm:block dark:border-gray-700 dark:hover:bg-gray-800"
              title="Export conversation"
            >
              📥 Export
            </button>

            {/* SETTINGS */}

            <button
              type="button"
              onClick={() =>
                setSettingsOpen(
                  true
                )
              }
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
              title="Settings"
            >
              ⚙️
            </button>

            {/* NEW */}

            <button
              type="button"
              onClick={
                startNewChat
              }
              disabled={loading}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100 disabled:opacity-50 md:hidden dark:border-gray-700 dark:hover:bg-gray-800"
            >
              New
            </button>
          </div>
        </header>

        {/* ERROR */}

        {error && (
          <div className="mx-auto mt-4 w-full max-w-4xl px-4">
            <div className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              <span>
                {error}
              </span>

              <button
                type="button"
                onClick={() =>
                  setError("")
                }
                className="shrink-0 font-bold"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* MESSAGES */}

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
            {loadingMessages ? (
              <div className="flex min-h-[60vh] items-center justify-center text-sm text-gray-500">
                Loading conversation...
              </div>
            ) : messages.length ===
              0 ? (
              <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-3xl dark:bg-gray-800">
                  🤖
                </div>

                <h2 className="text-2xl font-bold">
                  How can I help you?
                </h2>

                <p className="mt-2 max-w-md text-sm text-gray-500">
                  Ask anything, analyze files, and get helpful AI responses.
                </p>

                <div className="mt-6 grid gap-2 text-sm sm:grid-cols-2">
                  {[
                    "Explain machine learning",
                    "Help me write Python code",
                    "Create a study plan",
                    "Analyze my resume",
                  ].map(
                    (
                      suggestion
                    ) => (
                      <button
                        key={
                          suggestion
                        }
                        type="button"
                        onClick={() => {
                          setMessage(
                            suggestion
                          );

                          textareaRef.current?.focus();
                        }}
                        className="rounded-xl border border-gray-200 px-4 py-3 text-left hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
                      >
                        {
                          suggestion
                        }
                      </button>
                    )
                  )}
                </div>
              </div>
            ) : (
              messages.map(
                (
                  item,
                  index
                ) => (
                  <div
                    key={`${item.id || "local"}-${index}`}
                    className={`flex ${
                      item.role ===
                      "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[90%] ${
                        item.role ===
                        "user"
                          ? "rounded-2xl bg-black px-4 py-3 text-white dark:bg-white dark:text-black"
                          : "w-full"
                      }`}
                    >
                      {item.role ===
                      "assistant" ? (
                        <div>
                          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-500">
                            <span>
                              🤖 Mindra
                            </span>

                            {item.model && (
                              <span>
                                •{" "}
                                {
                                  item.model
                                }
                              </span>
                            )}
                          </div>

                          <div className="text-sm leading-7">
                            {item.content
                              ? renderMessageContent(
                                  item.content
                                )
                              : loading &&
                                  index ===
                                    messages.length -
                                      1
                                ? "Thinking..."
                                : ""}
                          </div>

                          {item.content && (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              {/* COPY */}

                              <button
                                type="button"
                                onClick={() =>
                                  copyMessage(
                                    item.content
                                  )
                                }
                                className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-gray-900"
                              >
                                📋 Copy
                              </button>

                              {/* SPEAK */}

                              <button
                                type="button"
                                onClick={() =>
                                  speakMessage(
                                    item,
                                    index
                                  )
                                }
                                className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-gray-900"
                              >
                                {speakingMessageId ===
                                (item.id ||
                                  `local-${index}`)
                                  ? "⏹ Stop"
                                  : "🔊 Speak"}
                              </button>

                              {/* REGENERATE */}

                              <button
                                type="button"
                                disabled={
                                  loading ||
                                  !item.id
                                }
                                onClick={() =>
                                  regenerate(
                                    index
                                  )
                                }
                                className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs hover:bg-gray-100 disabled:opacity-50 dark:border-gray-800 dark:hover:bg-gray-900"
                              >
                                🔄 Regenerate
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap text-sm leading-6">
                          {
                            item.content
                          }
                        </div>
                      )}
                    </div>
                  </div>
                )
              )
            )}

            <div
              ref={
                messagesEndRef
              }
            />
          </div>
        </div>

        {/* INPUT */}

        <div className="border-t border-gray-200 p-3 sm:p-4 dark:border-gray-800">
          <form
            onSubmit={
              sendMessage
            }
            className="mx-auto max-w-4xl"
          >
            <div className="flex items-end gap-2 rounded-2xl border border-gray-300 bg-white p-2 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              {/* FILE */}

              <input
                ref={
                  fileInputRef
                }
                type="file"
                accept=".pdf,.docx,.txt,.md,.csv,.json"
                onChange={
                  handleFileUpload
                }
                className="hidden"
              />

              <button
                type="button"
                disabled={
                  loading ||
                  uploadingFile
                }
                onClick={() =>
                  fileInputRef.current?.click()
                }
                title="Upload file"
                className="rounded-xl border border-gray-200 px-3 py-3 text-sm hover:bg-gray-100 disabled:opacity-40 dark:border-gray-800 dark:hover:bg-gray-800"
              >
                {uploadingFile
                  ? "..."
                  : "📎"}
              </button>

              {/* TEXTAREA */}

              <textarea
                ref={
                  textareaRef
                }
                value={message}
                onChange={(
                  event
                ) =>
                  setMessage(
                    event.target
                      .value
                  )
                }
                onKeyDown={
                  handleKeyDown
                }
                placeholder="Message Mindra..."
                rows={1}
                disabled={loading}
                className="max-h-40 min-h-12 flex-1 resize-none bg-transparent px-3 py-3 text-sm outline-none disabled:opacity-50"
              />

              {/* SEND / STOP */}

              {loading ? (
                <button
                  type="button"
                  onClick={
                    stopGenerating
                  }
                  className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Stop
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={
                    !message.trim()
                  }
                  className="rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-black"
                >
                  Send
                </button>
              )}
            </div>

            <p className="mt-2 text-center text-xs text-gray-500">
              {settings.enterToSend
                ? "Enter to send • Shift + Enter for new line"
                : "Enter creates a new line • Use Send to submit"}
            </p>

            <p className="mt-1 text-center text-[11px] text-gray-400">
              Ctrl/Cmd + K: Focus •
              Ctrl/Cmd + Shift + N:
              New chat • Ctrl/Cmd +
              Shift + S: Settings •
              Esc: Stop/Close
            </p>
          </form>
        </div>
      </section>

      {/* SETTINGS */}

      {settingsOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSettingsOpen(
                false
              );
            }
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <div>
                <h2 className="text-lg font-semibold">
                  Settings
                </h2>

                <p className="text-xs text-gray-500">
                  Customize Mindra
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSettingsOpen(
                    false
                  )
                }
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                ✕
              </button>
            </div>

            {/* BODY */}

            <div className="max-h-[75vh] overflow-y-auto p-5">
              {/* MODEL */}

              <div className="mb-6">
                <label className="mb-2 block text-sm font-semibold">
                  🤖 AI Model
                </label>

                <select
                  value={model}
                  onChange={(
                    event
                  ) =>
                    setModel(
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none dark:border-gray-700 dark:bg-gray-950"
                >
                  {AVAILABLE_MODELS.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* THEME */}

              <div className="mb-6">
                <label className="mb-2 block text-sm font-semibold">
                  🎨 Theme
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    "system",
                    "light",
                    "dark",
                  ].map(
                    (
                      theme
                    ) => (
                      <button
                        key={
                          theme
                        }
                        type="button"
                        onClick={() => {
                          setSettings(
                            (
                              previous
                            ) => ({
                              ...previous,
                              theme:
                                theme as Settings["theme"],
                            })
                          );

                          applyTheme(
                            theme as Settings["theme"]
                          );
                        }}
                        className={`rounded-xl border px-3 py-3 text-sm capitalize ${
                          settings.theme ===
                          theme
                            ? "border-black bg-gray-100 font-semibold dark:border-white dark:bg-gray-800"
                            : "border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                        }`}
                      >
                        {theme ===
                        "system"
                          ? "💻 System"
                          : theme ===
                            "light"
                          ? "☀️ Light"
                          : "🌙 Dark"}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* ENTER TO SEND */}

              <div className="mb-4 flex items-center justify-between rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <div className="pr-4">
                  <h3 className="text-sm font-semibold">
                    Enter to send
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    Press Enter to send a message.
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={
                    settings.enterToSend
                  }
                  onClick={() =>
                    setSettings(
                      (
                        previous
                      ) => ({
                        ...previous,
                        enterToSend:
                          !previous.enterToSend,
                      })
                    )
                  }
                  className={`relative h-6 w-11 shrink-0 rounded-full ${
                    settings.enterToSend
                      ? "bg-black dark:bg-white"
                      : "bg-gray-300 dark:bg-gray-700"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white ${
                      settings.enterToSend
                        ? "left-6 dark:bg-black"
                        : "left-1"
                    }`}
                  />
                </button>
              </div>

              {/* SOUND */}

              <div className="mb-4 flex items-center justify-between rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <div className="pr-4">
                  <h3 className="text-sm font-semibold">
                    🔔 Response sound
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    Play a short sound when Mindra finishes responding.
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={
                    settings.soundEnabled
                  }
                  onClick={() =>
                    setSettings(
                      (
                        previous
                      ) => ({
                        ...previous,
                        soundEnabled:
                          !previous.soundEnabled,
                      })
                    )
                  }
                  className={`relative h-6 w-11 shrink-0 rounded-full ${
                    settings.soundEnabled
                      ? "bg-black dark:bg-white"
                      : "bg-gray-300 dark:bg-gray-700"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white ${
                      settings.soundEnabled
                        ? "left-6 dark:bg-black"
                        : "left-1"
                    }`}
                  />
                </button>
              </div>

              {/* MEMORY */}

              <div className="mb-6 flex items-center justify-between rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <div className="pr-4">
                  <h3 className="text-sm font-semibold">
                    🧠 Conversation memory
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    Allow Mindra to use previous messages as context.
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={
                    settings.memoryEnabled
                  }
                  onClick={() =>
                    setSettings(
                      (
                        previous
                      ) => ({
                        ...previous,
                        memoryEnabled:
                          !previous.memoryEnabled,
                      })
                    )
                  }
                  className={`relative h-6 w-11 shrink-0 rounded-full ${
                    settings.memoryEnabled
                      ? "bg-black dark:bg-white"
                      : "bg-gray-300 dark:bg-gray-700"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white ${
                      settings.memoryEnabled
                        ? "left-6 dark:bg-black"
                        : "left-1"
                    }`}
                  />
                </button>
              </div>

              {/* CHAT DATA */}

              <div className="border-t border-gray-200 pt-5 dark:border-gray-800">
                <h3 className="mb-3 text-sm font-semibold">
                  Chat data
                </h3>

                <button
                  type="button"
                  onClick={
                    clearCurrentChat
                  }
                  className="w-full rounded-xl border border-red-200 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40"
                >
                  🗑️ Clear current chat
                </button>

                <button
                  type="button"
                  disabled={
                    clearingAll ||
                    conversations.length ===
                      0
                  }
                  onClick={
                    clearAllConversations
                  }
                  className="mt-3 w-full rounded-xl border border-red-300 px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  {clearingAll
                    ? "Clearing all..."
                    : "🧹 Clear all conversations"}
                </button>

                <button
                  type="button"
                  onClick={
                    exportConversation
                  }
                  disabled={
                    messages.length ===
                    0
                  }
                  className="mt-3 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  📥 Export current conversation
                </button>

                {/* RESET */}

                <button
                  type="button"
                  onClick={() => {
                    setSettings(
                      DEFAULT_SETTINGS
                    );

                    setModel(
                      "llama3.2:latest"
                    );

                    try {
                      localStorage.setItem(
                        SETTINGS_KEY,
                        JSON.stringify(
                          DEFAULT_SETTINGS
                        )
                      );

                      localStorage.setItem(
                        MODEL_KEY,
                        "llama3.2:latest"
                      );
                    } catch {}

                    applyTheme(
                      "system"
                    );

                    setError("");
                  }}
                  className="mt-3 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  Reset settings
                </button>
              </div>
            </div>

            {/* FOOTER */}

            <div className="border-t border-gray-200 px-5 py-4 dark:border-gray-800">
              <button
                type="button"
                onClick={() =>
                  setSettingsOpen(
                    false
                  )
                }
                className="w-full rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white dark:bg-white dark:text-black"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}