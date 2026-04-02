import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { examQuestions } from "../../data/mockData";
import { useAppState } from "../../state/AppState";
import { buildAiQuickPrompts, getAiReply, type AiChatMessage } from "../../utils/aiAssistant";

export function StudentAiPage() {
  const { state } = useAppState();
  const profileName = state.studentProfile?.nickname ?? "小小安全员";
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: `你好，${profileName}。我是安全小助手，可以帮你回顾道路安全重点、解释规则，也能根据你的学习进度给出提示。`,
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
  }

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--student">
        <div>
          <span className="hero-banner__eyebrow">AI 问答页</span>
          <h1>围绕道路安全主题随时提问、复习和回看</h1>
          <p>
            当前 AI 仅回答道路安全教育相关内容，会优先结合你的闯关进度和考试情况给出提示。
          </p>
        </div>
        <div className="hero-banner__actions">
          <Link className="ghost-button link-button" to="/student/theme/road-safety">
            返回主题页
          </Link>
          <Link className="ghost-button link-button" to="/student/ai-report">
            查看 AI 结果卡片
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
          <span>闯关进度</span>
          <strong>
            {state.progress.levels.filter((level) => level.status === "completed").length} / 3
          </strong>
          <p>完成关卡越多，越适合用 AI 回顾重点和错题。</p>
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
          <p>如果你刚做完考试，这里最适合继续追问错题和规则原因。</p>
        </article>
      </section>

      <section className="ai-study-layout">
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

          <form
            className="ai-panel__composer ai-panel__composer--page"
            onSubmit={(event) => {
              event.preventDefault();
              ask(input);
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="例如：为什么过马路要看红绿灯？"
            />
            <button type="submit" className="primary-button">
              发送问题
            </button>
          </form>
        </article>

        <div className="page-stack">
          <article className="surface-card">
            <span className="section-block__eyebrow">快捷提问</span>
            <h2>先从这些主题开始问</h2>
            <div className="chip-row">
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
          </article>

          <article className="surface-card">
            <span className="section-block__eyebrow">错题回看建议</span>
            <h2>根据当前学习结果推荐追问方向</h2>
            {reviewPrompts.length > 0 ? (
              <div className="chip-row">
                {reviewPrompts.map((prompt) => (
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
            ) : (
              <p>
                目前还没有错题推荐，你可以先问“斑马线怎么走”“为什么不能在车前突然跑出”这类问题。
              </p>
            )}
          </article>

          <article className="surface-card">
            <span className="section-block__eyebrow">使用范围</span>
            <h2>这页 AI 会遵守的边界</h2>
            <ul className="plain-list">
              <li>只回答道路安全教育相关问题</li>
              <li>优先给提示和解释，不直接替你完成闯关答案</li>
              <li>更适合复习“斑马线、盲区、头盔、上下车安全”等主题</li>
            </ul>
          </article>
        </div>
      </section>
    </div>
  );
}

