import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { buildAiQuickPrompts, getAiReply, type AiChatMessage } from "../utils/aiAssistant";

export function FloatingAiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "我是安全小助手，可以给你提示、解释安全规则，也能帮你回顾这节课的重点。",
    },
  ]);

  const quickPrompts = useMemo(() => buildAiQuickPrompts(3), []);

  function ask(question: string) {
    const trimmed = question.trim();

    if (!trimmed) {
      return;
    }

    const reply = getAiReply(trimmed);
    setMessages((current) => [
      ...current,
      { id: `${Date.now()}-u`, role: "user", text: trimmed },
      { id: `${Date.now()}-a`, role: "assistant", text: reply },
    ]);
    setInput("");
    setIsOpen(true);
  }

  return (
    <div className="ai-assistant">
      {isOpen ? (
        <section className="ai-panel">
          <header className="ai-panel__header">
            <div>
              <strong>安全小助手</strong>
              <p>轻量提示、道路安全问答、学习节点反馈</p>
            </div>
            <button
              type="button"
              className="ghost-button"
              onClick={() => setIsOpen(false)}
            >
              收起
            </button>
          </header>

          <div className="ai-panel__messages">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`chat-bubble chat-bubble--${message.role}`}
              >
                {message.text}
              </article>
            ))}
          </div>

          <div className="ai-panel__quick-list">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt.id}
                type="button"
                className="quick-chip"
                onClick={() => ask(prompt.question)}
              >
                {prompt.label}
              </button>
            ))}
          </div>

          <div className="ai-panel__meta-actions">
            <Link className="ghost-button link-button" to="/student/ai">
              打开独立问答页
            </Link>
          </div>

          <form
            className="ai-panel__composer"
            onSubmit={(event) => {
              event.preventDefault();
              ask(input);
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="问我道路安全相关的问题"
            />
            <button type="submit" className="primary-button">
              发送
            </button>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        className="ai-fab"
        onClick={() => setIsOpen((current) => !current)}
      >
        AI 助手
      </button>
    </div>
  );
}

