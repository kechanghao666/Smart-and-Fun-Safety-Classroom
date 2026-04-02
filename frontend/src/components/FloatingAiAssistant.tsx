import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useAppState } from "../state/AppState";
import {
  buildAiQuickPrompts,
  resolveAiReply,
  type AiChatMessage,
} from "../utils/aiAssistant";

export function FloatingAiAssistant() {
  const { state } = useAppState();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [assistantNotice, setAssistantNotice] = useState("");
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "我是安全小助手，可以给你提示、解释安全规则，也能帮你回顾这节课的重点。",
    },
  ]);

  const quickPrompts = useMemo(() => buildAiQuickPrompts(3), []);

  async function ask(question: string) {
    const trimmed = question.trim();

    if (!trimmed) {
      return;
    }

    setIsAsking(true);
    setAssistantNotice("");
    try {
      const reply = await resolveAiReply(trimmed, {
        authSource: state.authSource,
        authToken: state.authToken,
        scene: "qa",
      });
      setMessages((current) => [
        ...current,
        { id: `${Date.now()}-u`, role: "user", text: trimmed },
        { id: `${Date.now()}-a`, role: "assistant", text: reply.text },
      ]);
      setAssistantNotice(reply.notice ?? "");
      setInput("");
      setIsOpen(true);
    } finally {
      setIsAsking(false);
    }
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
                disabled={isAsking}
                onClick={() => {
                  void ask(prompt.question);
                }}
              >
                {prompt.label}
              </button>
            ))}
          </div>

          {assistantNotice ? <p className="ai-panel__notice">{assistantNotice}</p> : null}

          <div className="ai-panel__meta-actions">
            <Link className="ghost-button link-button" to="/student/ai">
              打开独立问答页
            </Link>
          </div>

          <form
            className="ai-panel__composer"
            onSubmit={(event) => {
              event.preventDefault();
              void ask(input);
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="问我道路安全相关的问题"
              disabled={isAsking}
            />
            <button type="submit" className="primary-button" disabled={isAsking}>
              {isAsking ? "思考中..." : "发送"}
            </button>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        className="ai-fab"
        disabled={isAsking}
        onClick={() => setIsOpen((current) => !current)}
      >
        AI 助手
      </button>
    </div>
  );
}

