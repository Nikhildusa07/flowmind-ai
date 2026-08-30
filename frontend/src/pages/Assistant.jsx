import { useEffect, useRef, useState } from "react";

const API_BASE_URL = "https://flowmind-ai-14ng.onrender.com";
const TOKEN_KEY = "flowmind_access_token";

const SUGGESTED_PROMPTS = [
  "How can I automate repetitive business tasks?",
  "How can I improve my workflow efficiency?",
  "What should I monitor in my automation system?",
  "How can AI help analyze business documents?",
];

function getAuthHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);

  return token
    ? {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }
    : {
        "Content-Type": "application/json",
      };
}

/*
 * ============================================================
 * MARKDOWN RESPONSE RENDERER
 * ============================================================
 */

function renderInlineMarkdown(text) {
  if (!text) {
    return null;
  }

  const parts = text.split(
    /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/
  );

  return parts.map((part, index) => {
    if (
      part.startsWith("**") &&
      part.endsWith("**")
    ) {
      return (
        <strong key={index}>
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (
      part.startsWith("*") &&
      part.endsWith("*") &&
      !part.startsWith("**")
    ) {
      return (
        <em key={index}>
          {part.slice(1, -1)}
        </em>
      );
    }

    if (
      part.startsWith("`") &&
      part.endsWith("`")
    ) {
      return (
        <code key={index}>
          {part.slice(1, -1)}
        </code>
      );
    }

    return (
      <span key={index}>
        {part}
      </span>
    );
  });
}

function MarkdownMessage({ content }) {
  if (!content) {
    return null;
  }

  const normalizedContent = content
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  const lines = normalizedContent.split("\n");

  const elements = [];

  let paragraphLines = [];
  let bulletItems = [];
  let numberedItems = [];

  const flushParagraph = () => {
    if (!paragraphLines.length) {
      return;
    }

    const text = paragraphLines.join(" ").trim();

    if (text) {
      elements.push(
        <p
          className="assistant-markdown-paragraph"
          key={`paragraph-${elements.length}`}
        >
          {renderInlineMarkdown(text)}
        </p>
      );
    }

    paragraphLines = [];
  };

  const flushBullets = () => {
    if (!bulletItems.length) {
      return;
    }

    elements.push(
      <ul
        className="assistant-markdown-list"
        key={`bullets-${elements.length}`}
      >
        {bulletItems.map((item, index) => (
          <li key={index}>
            {renderInlineMarkdown(item)}
          </li>
        ))}
      </ul>
    );

    bulletItems = [];
  };

  const flushNumbered = () => {
    if (!numberedItems.length) {
      return;
    }

    elements.push(
      <ol
        className="assistant-markdown-list assistant-markdown-numbered"
        key={`numbered-${elements.length}`}
      >
        {numberedItems.map((item, index) => (
          <li key={index}>
            {renderInlineMarkdown(item)}
          </li>
        ))}
      </ol>
    );

    numberedItems = [];
  };

  const flushAll = () => {
    flushParagraph();
    flushBullets();
    flushNumbered();
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();

    /*
     * Empty line
     */
    if (!line) {
      flushAll();
      return;
    }

    /*
     * Horizontal rule
     */
    if (
      line === "---" ||
      line === "***" ||
      line === "___"
    ) {
      flushAll();

      elements.push(
        <hr
          className="assistant-markdown-divider"
          key={`divider-${index}`}
        />
      );

      return;
    }

    /*
     * Markdown headings
     *
     * ### Heading
     * ## Heading
     * # Heading
     */
    const headingMatch = line.match(
      /^(#{1,4})\s+(.+)$/
    );

    if (headingMatch) {
      flushAll();

      const level = headingMatch[1].length;
      const headingText = headingMatch[2];

      if (level === 1) {
        elements.push(
          <h3
            className="assistant-markdown-heading assistant-markdown-heading-lg"
            key={`heading-${index}`}
          >
            {renderInlineMarkdown(headingText)}
          </h3>
        );
      } else if (level === 2) {
        elements.push(
          <h3
            className="assistant-markdown-heading"
            key={`heading-${index}`}
          >
            {renderInlineMarkdown(headingText)}
          </h3>
        );
      } else {
        elements.push(
          <h4
            className="assistant-markdown-heading assistant-markdown-heading-sm"
            key={`heading-${index}`}
          >
            {renderInlineMarkdown(headingText)}
          </h4>
        );
      }

      return;
    }

    /*
     * Numbered list
     *
     * 1. Item
     * 2. Item
     */
    const numberedMatch = line.match(
      /^\d+\.\s+(.+)$/
    );

    if (numberedMatch) {
      flushParagraph();
      flushBullets();

      numberedItems.push(
        numberedMatch[1]
      );

      return;
    }

    /*
     * Bullet list
     *
     * - Item
     * * Item
     * • Item
     */
    const bulletMatch = line.match(
      /^[-*•]\s+(.+)$/
    );

    if (bulletMatch) {
      flushParagraph();
      flushNumbered();

      bulletItems.push(
        bulletMatch[1]
      );

      return;
    }

    /*
     * Normal paragraph line
     */
    flushBullets();
    flushNumbered();

    paragraphLines.push(line);
  });

  flushAll();

  return (
    <div className="assistant-markdown">
      {elements}
    </div>
  );
}

/*
 * ============================================================
 * ASSISTANT
 * ============================================================
 */

function Assistant() {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm FlowMind AI. I can help you with business automation, workflows, documents, tasks, analytics, and operational decisions.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  /*
   * ============================================================
   * AUTO SCROLL
   * ============================================================
   */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  /*
   * ============================================================
   * SEND MESSAGE
   * ============================================================
   */

  const sendMessage = async (
    messageText = input
  ) => {
    const message = messageText.trim();

    if (!message || loading) {
      return;
    }

    const token =
      localStorage.getItem(TOKEN_KEY);

    if (!token) {
      setError(
        "Authentication required. Please log in again."
      );

      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
    };

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    setInput("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/ai/chat`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            message,
          }),
        }
      );

      const responseData =
        await response.json().catch(
          () => null
        );

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem(
            TOKEN_KEY
          );

          window.location.href = "/login";

          return;
        }

        throw new Error(
          responseData?.detail ||
            responseData?.message ||
            "Unable to get a response from the AI assistant."
        );
      }

      if (!responseData?.response) {
        throw new Error(
          "The AI assistant returned an empty response."
        );
      }

      setMessages((current) => [
        ...current,
        {
          id:
            responseData.conversation_id ||
            `assistant-${Date.now()}`,
          role: "assistant",
          content:
            responseData.response,
        },
      ]);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to connect to the AI assistant."
      );
    } finally {
      setLoading(false);

      textareaRef.current?.focus();
    }
  };

  /*
   * ============================================================
   * FORM
   * ============================================================
   */

  const handleSubmit = (event) => {
    event.preventDefault();

    sendMessage();
  };

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      sendMessage();
    }
  };

  /*
   * ============================================================
   * CLEAR
   * ============================================================
   */

  const clearConversation = () => {
    setMessages([
      {
        id: "welcome-new",
        role: "assistant",
        content:
          "Conversation cleared. How can I help you with your business automation?",
      },
    ]);

    setError("");
    setInput("");
  };

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className="assistant-page">

      {/* ========================================================
          PAGE HEADER
      ======================================================== */}

      <div className="page-heading">
        <div>
          <span className="eyebrow">
            INTELLIGENCE
          </span>

          <h1>AI Assistant</h1>

          <p>
            Ask FlowMind AI about workflows,
            automation, documents, analytics,
            and business operations.
          </p>
        </div>

        <div className="document-header-badge">
          <span className="status-dot" />

          <span>
            AI Assistant Ready
          </span>
        </div>
      </div>

      {/* ========================================================
          ERROR
      ======================================================== */}

      {error && (
        <div className="alert alert-warning">
          <strong>
            Assistant:
          </strong>

          <span>{error}</span>
        </div>
      )}

      {/* ========================================================
          MAIN LAYOUT
      ======================================================== */}

      <div className="assistant-layout">

        {/* ======================================================
            CHAT PANEL
        ====================================================== */}

        <section className="dashboard-panel assistant-panel">

          <div className="panel-header">
            <div>
              <span className="panel-eyebrow">
                CONVERSATION
              </span>

              <h2>
                FlowMind AI Assistant
              </h2>

              <p>
                Communicate naturally and get
                practical business automation
                guidance.
              </p>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={clearConversation}
              disabled={loading}
            >
              Clear
            </button>
          </div>

          {/* ====================================================
              MESSAGES
          ==================================================== */}

          <div className="assistant-messages">

            {messages.map((message) => (
              <div
                className={`assistant-message ${
                  message.role === "user"
                    ? "user-message"
                    : "ai-message"
                }`}
                key={message.id}
              >

                <div className="assistant-avatar">
                  {message.role === "user"
                    ? "U"
                    : "✦"}
                </div>

                <div className="assistant-message-content">

                  <span className="assistant-message-role">
                    {message.role === "user"
                      ? "You"
                      : "FlowMind AI"}
                  </span>

                  <div className="assistant-message-text">

                    {message.role ===
                    "assistant" ? (
                      <MarkdownMessage
                        content={
                          message.content
                        }
                      />
                    ) : (
                      message.content
                    )}

                  </div>

                </div>
              </div>
            ))}

            {/* ==================================================
                TYPING INDICATOR
            ================================================== */}

            {loading && (
              <div className="assistant-message ai-message">

                <div className="assistant-avatar">
                  ✦
                </div>

                <div className="assistant-message-content">

                  <span className="assistant-message-role">
                    FlowMind AI
                  </span>

                  <div className="assistant-typing">
                    <span />
                    <span />
                    <span />
                  </div>

                </div>
              </div>
            )}

            <div ref={messagesEndRef} />

          </div>

          {/* ====================================================
              INPUT
          ==================================================== */}

          <form
            className="assistant-input-area"
            onSubmit={handleSubmit}
          >

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) =>
                setInput(
                  event.target.value
                )
              }
              onKeyDown={handleKeyDown}
              placeholder="Ask FlowMind AI anything about your business..."
              rows={3}
              maxLength={5000}
              disabled={loading}
            />

            <div className="assistant-input-footer">

              <span>
                Press Enter to send · Shift +
                Enter for a new line
              </span>

              <button
                type="submit"
                className="primary-button"
                disabled={
                  loading ||
                  !input.trim()
                }
              >
                {loading
                  ? "Thinking..."
                  : "Send →"}
              </button>

            </div>

          </form>

        </section>

        {/* ======================================================
            QUICK SUGGESTIONS
        ====================================================== */}

        <aside className="dashboard-panel assistant-suggestions">

          <div className="panel-header">

            <div>
              <span className="panel-eyebrow">
                QUICK START
              </span>

              <h2>
                Try asking
              </h2>
            </div>

          </div>

          <div className="assistant-suggestion-list">

            {SUGGESTED_PROMPTS.map(
              (prompt) => (
                <button
                  type="button"
                  className="assistant-suggestion"
                  key={prompt}
                  onClick={() =>
                    sendMessage(prompt)
                  }
                  disabled={loading}
                >
                  <span>✦</span>

                  <span>
                    {prompt}
                  </span>

                  <strong>
                    →
                  </strong>
                </button>
              )
            )}

          </div>

          {/* ====================================================
              CAPABILITIES
          ==================================================== */}

          <div className="assistant-capabilities">

            <span className="panel-eyebrow">
              CAPABILITIES
            </span>

            <div>
              <span>✓</span>
              Workflow guidance
            </div>

            <div>
              <span>✓</span>
              Document intelligence
            </div>

            <div>
              <span>✓</span>
              Business automation
            </div>

            <div>
              <span>✓</span>
              Operational insights
            </div>

          </div>

        </aside>

      </div>
    </div>
  );
}

export default Assistant;