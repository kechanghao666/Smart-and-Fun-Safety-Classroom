import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { StudentAdventureHero } from "../../components/student/StudentAdventureHero";
import { StudentMascotBubble } from "../../components/student/StudentMascotBubble";
import { examQuestions } from "../../data/mockData";
import { useAppState } from "../../state/AppState";
import {
  buildAiQuickPrompts,
  resolveAiReply,
  type AiChatMessage,
} from "../../utils/aiAssistant";

export function StudentAiPage() {
  const { state } = useAppState();
  const profileName = state.studentProfile?.nickname ?? "安全学员";
  const [input, setInput] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [assistantNotice, setAssistantNotice] = useState("");
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: `你好，${profileName}。我是安全小助手，可以陪你一起复习道路安全重点、解释规则，还能帮你整理下一步复习方向。`,
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

    return Array.from(new Map(prompts.map((item) => [item.id, item])).values()).slice(
      0,
      3,
    );
  }, [wrongQuestionDetails]);
  const completedLevels = state.progress.levels.filter(
    (level) => level.status === "completed",
  ).length;
  const examStatusLabel =
    state.progress.exam.status === "completed"
      ? `${state.progress.exam.score ?? 0} 分`
      : state.progress.exam.status === "available"
        ? "考试已解锁"
        : "还没解锁";

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
    <div className="page-stack student-page student-page--ai">
      <StudentAdventureHero
        eyebrow="AI 冒险营地"
        title="把问题说给安全小助手听"
        description="这里像一个轻量复习营地。你可以点卡片快速提问，也可以自己输入问题，让 AI 用短句帮你理清方向。"
        bubbleTitle="先试试这样问"
        bubbleText={
          reviewPrompts[0]?.label
            ? `如果你刚做完题，可以先问“${reviewPrompts[0].label}”`
            : "试试问斑马线、盲区、安全带或候车距离。"
        }
        mascotLabel="AI"
        mascotHint={
          assistantNotice ||
          "我只回答道路安全主题，还会优先给你提示而不是直接给答案。"
        }
        accent="sky"
        variant="exam"
        stats={[
          { label: "你的身份", value: profileName, accent: "mint" },
          { label: "关卡进度", value: `${completedLevels}/3`, accent: "sky" },
          { label: "考试状态", value: examStatusLabel, accent: "orange" },
        ]}
        actions={
          <>
            <Link className="ghost-button link-button" to="/student/theme/road-safety">
              返回主题地图
            </Link>
            <Link className="ghost-button link-button" to="/student/ai-report">
              查看 AI 结果卡
            </Link>
          </>
        }
      />

      <section className="student-card-grid student-card-grid--two">
        <article className="surface-card student-ai-prompt-board">
          <div className="student-section-heading">
            <span className="section-block__eyebrow">快速提问卡</span>
            <h2>点一下就能开始问</h2>
          </div>

          <div className="student-ai-card-grid">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt.id}
                type="button"
                className="student-ai-prompt-card"
                disabled={isAsking}
                onClick={() => {
                  void ask(prompt.question);
                }}
              >
                <span>马上问</span>
                <strong>{prompt.label}</strong>
              </button>
            ))}
          </div>
        </article>

        <StudentMascotBubble
          eyebrow="补强任务"
          title="如果刚做完考试，先点这些复习方向"
          message={
            reviewPrompts.length > 0
              ? "这些提问会更贴近你当前的错题和薄弱点。"
              : "你现在还没有错题推荐，也可以直接从上面的快速提问卡开始。"
          }
          accent="mint"
          actions={
            reviewPrompts.length > 0 ? (
              <>
                {reviewPrompts.map((prompt) => (
                  <button
                    key={prompt.id}
                    type="button"
                    className="ghost-button"
                    disabled={isAsking}
                    onClick={() => {
                      void ask(prompt.question, "hint");
                    }}
                  >
                    {prompt.label}
                  </button>
                ))}
              </>
            ) : (
              <Link
                className="ghost-button link-button"
                to="/student/theme/road-safety/wrong-questions"
              >
                去看错题回看页
              </Link>
            )
          }
          visual={
            <div className="student-ai-repair-stage">
              <div className="student-ai-repair-stage__header">
                <span className="student-ai-repair-stage__badge">
                  {reviewPrompts.length > 0 ? "推荐补强" : "自由提问"}
                </span>
                <strong>
                  {reviewPrompts.length > 0 ? `${reviewPrompts.length} 个方向` : "先从上方问题卡开始"}
                </strong>
              </div>
              <div className="student-ai-repair-stage__board">
                {reviewPrompts.length > 0 ? (
                  reviewPrompts.slice(0, 3).map((prompt, index) => (
                    <div key={prompt.id} className="student-ai-repair-stage__item">
                      <span>{index + 1}</span>
                      <p>{prompt.label}</p>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="student-ai-repair-stage__empty-icon">
                      <span />
                      <span />
                      <span />
                    </div>
                    <p className="student-ai-repair-stage__empty-copy">
                      当前没有错题推荐，先从上面的快速提问卡开始和 AI 复习吧。
                    </p>
                  </>
                )}
              </div>
            </div>
          }
        />
      </section>

      <section className="student-ai-workspace">
        <article className="surface-card student-ai-rule-card">
          <div className="student-section-heading">
            <span className="section-block__eyebrow">可以帮你什么</span>
            <h2>把 AI 当成轻量复习搭子</h2>
          </div>

          <div className="student-checklist">
            <div className="student-checklist__item">
              <span className="student-checklist__dot" />
              <span>只回答道路安全教育主题的问题。</span>
            </div>
            <div className="student-checklist__item">
              <span className="student-checklist__dot" />
              <span>优先给提示、解释和复习方向，不直接替你完成答案。</span>
            </div>
            <div className="student-checklist__item">
              <span className="student-checklist__dot" />
              <span>最适合拿来回看斑马线、盲区、安全带和候车距离这些重点。</span>
            </div>
          </div>
        </article>

        <article className="surface-card student-ai-chat-stage">
          <div className="student-section-heading">
            <span className="section-block__eyebrow">聊天舞台</span>
            <h2>把问题说出来，小助手会用短句回应你</h2>
          </div>

          <div className="student-ai-chat-log">
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
              placeholder="例如：过马路为什么要先看信号灯和来车？"
              disabled={isAsking}
            />
            <button
              type="submit"
              className="primary-button primary-button--playful"
              disabled={isAsking}
            >
              {isAsking ? "思考中..." : "发送问题"}
            </button>
          </form>
        </article>
      </section>
    </div>
  );
}
