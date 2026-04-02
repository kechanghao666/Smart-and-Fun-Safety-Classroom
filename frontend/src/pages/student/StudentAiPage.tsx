import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { examQuestions } from "../../data/mockData";
import { useAppState } from "../../state/AppState";
import {
  buildAiQuickPrompts,
  resolveAiReply,
  type AiChatMessage,
} from "../../utils/aiAssistant";

export function StudentAiPage() {
  const { state } = useAppState();
  const profileName = state.studentProfile?.nickname ?? "安全小卫士";
  const [input, setInput] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [assistantNotice, setAssistantNotice] = useState("");
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: `你好，${profileName}。我是安全小助手，可以围绕道路安全教育主题帮助你回顾重点、解释规则和整理复习方向。`,
    },
  ]);

  const quickPrompts = useMemo(() => buildAiQuickPrompts(4), []);
  const wrongQuestionDetails = useMemo(
    () =>
      examQuestions.filter((question) =>
        state.progress.exam.wrongQuestionIds.includes(question.id),
      ),
    [state.progress.exam.wrongQuestionIds],
  );
  const reviewPrompts = useMemo(() => {
    const prompts = wrongQuestionDetails.map((question) => ({
      id: `${question.id}-review`,
      label: question.reviewLabel,
      question: `帮我复习${question.reviewLabel}`,
    }));

    return Array.from(new Map(prompts.map((item) => [item.id, item])).values()).slice(0, 3);
  }, [wrongQuestionDetails]);

  async function ask(question: string, scene: "hint" | "qa" = "qa") {
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
        scene,
      });

      setMessages((current) => [
        ...current,
        { id: `${Date.now()}-u`, role: "user", text: trimmed },
        { id: `${Date.now()}-a`, role: "assistant", text: reply.text },
      ]);
      setAssistantNotice(reply.notice ?? "");
      setInput("");
    } finally {
      setIsAsking(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--student">
        <div>
          <span className="hero-banner__eyebrow">独立 AI 问答页</span>
          <h1>围绕道路安全主题随时提问、复习和回看</h1>
          <p>
            本页固定服务于道路安全教育主题，适合在卡关、回看错题或整理学习重点时进行轻量问答。
          </p>
        </div>
        <div className="hero-banner__actions">
          <Link className="ghost-button link-button" to="/student/theme/road-safety">
            返回主题页
          </Link>
          <Link className="ghost-button link-button" to="/student/ai-report">
            查看 AI 结果卡
          </Link>
        </div>
      </section>

      <section className="card-grid card-grid--three">
        <article className="surface-card stat-card">
          <span>当前身份</span>
          <strong>{profileName}</strong>
          <p>{state.studentProfile ? state.studentProfile.stage : "待完善学生资料"}</p>
        </article>

        <article className="surface-card stat-card">
          <span>关卡进度</span>
          <strong>
            {state.progress.levels.filter((level) => level.status === "completed").length} / 3
          </strong>
          <p>完成关卡越多，AI 越适合帮助你回顾更完整的学习闭环。</p>
        </article>

        <article className="surface-card stat-card">
          <span>考试状态</span>
          <strong>
            {state.progress.exam.status === "completed"
              ? `${state.progress.exam.score ?? 0} 分`
              : state.progress.exam.status === "available"
                ? "已解锁"
                : "未解锁"}
          </strong>
          <p>考试完成后，最适合继续追问错题和相关规则原因。</p>
        </article>
      </section>

      <section className="ai-study-layout">
        <div className="page-stack">
          <article className="surface-card">
            <span className="section-block__eyebrow">常见问题区</span>
            <h2>先从这些主题开始问</h2>
            <div className="chip-row">
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
          </article>

          <article className="surface-card">
            <span className="section-block__eyebrow">错题复习方向</span>
            <h2>根据当前结果推荐追问方向</h2>
            {reviewPrompts.length > 0 ? (
              <div className="chip-row">
                {reviewPrompts.map((prompt) => (
                  <button
                    key={prompt.id}
                    type="button"
                    className="quick-chip"
                    disabled={isAsking}
                    onClick={() => {
                      void ask(prompt.question, "hint");
                    }}
                  >
                    {prompt.label}
                  </button>
                ))}
              </div>
            ) : (
              <p>当前还没有错题推荐，可以先问斑马线、公交车盲区或乘车防护这几个主题。</p>
            )}
          </article>

          <article className="surface-card">
            <span className="section-block__eyebrow">使用边界</span>
            <h2>本页 AI 只会做这些事</h2>
            <ul className="plain-list">
              <li>只回答道路安全教育主题相关问题。</li>
              <li>优先给提示和解释，不直接替学生完成关卡答案。</li>
              <li>适合复习斑马线、盲区、头盔、安全带和候车距离等主题。</li>
            </ul>
          </article>
        </div>

        <article className="surface-card ai-study-panel">
          <div className="section-block__header">
            <div>
              <span className="section-block__eyebrow">对话区</span>
              <h2>把问题说出来，AI 会给出轻量提示</h2>
            </div>
          </div>

          <div className="ai-panel__messages ai-panel__messages--page">
            {messages.map((message) => (
              <article key={message.id} className={`chat-bubble chat-bubble--${message.role}`}>
                {message.text}
              </article>
            ))}
          </div>

          {assistantNotice ? <p className="ai-panel__notice">{assistantNotice}</p> : null}

          <form
            className="ai-panel__composer ai-panel__composer--page"
            onSubmit={(event) => {
              event.preventDefault();
              void ask(input);
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="例如：为什么过马路要看信号灯和车？"
              disabled={isAsking}
            />
            <button type="submit" className="primary-button" disabled={isAsking}>
              {isAsking ? "思考中..." : "发送问题"}
            </button>
          </form>
        </article>
      </section>
    </div>
  );
}
