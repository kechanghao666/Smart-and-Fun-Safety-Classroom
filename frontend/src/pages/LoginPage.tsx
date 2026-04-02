import { useNavigate } from "react-router-dom";
import { defaultRoleRoute, useAppState } from "../state/AppState";
import type { UserRole } from "../types";

const roleCards: Array<{
  role: UserRole;
  title: string;
  description: string;
  highlights: string[];
}> = [
  {
    role: "student",
    title: "学生端",
    description: "从主题学习、三关闯关到考试和 AI 结果卡片，完整走一遍课堂学习流程。",
    highlights: ["继续学习", "主题详情", "AI 助手", "考试解锁"],
  },
  {
    role: "teacher",
    title: "教师端",
    description: "查看班级完成率、考试状态和学生个体学习结果，为课堂和课后反馈做准备。",
    highlights: ["班级总览", "学生列表", "薄弱点查看"],
  },
  {
    role: "admin",
    title: "管理员端",
    description: "规划主题管理、关卡配置、题库维护、AI 文案和平台数据统计入口。",
    highlights: ["主题管理", "关卡内容", "题库", "数据统计"],
  },
];

export function LoginPage() {
  const { setRole } = useAppState();
  const navigate = useNavigate();

  function handleEnter(role: UserRole) {
    setRole(role);
    navigate(defaultRoleRoute[role]);
  }

  return (
    <div className="login-page">
      <section className="hero-panel">
        <div className="hero-panel__content">
          <span className="hero-panel__eyebrow">儿童友好 + 安全教育 + 多端协作</span>
          <h1>智趣安全学堂</h1>
          <p>
            当前版本已建立前端基线原型，支持学生端、教师端、管理员端的角色切换，
            也为后续多人并行开发预留了共享类型、路由和学习状态模型。
          </p>
          <div className="hero-panel__tags">
            <span>道路安全教育</span>
            <span>三关闯关</span>
            <span>主题考试</span>
            <span>AI 结果卡片</span>
          </div>
        </div>
      </section>

      <section className="card-grid card-grid--three">
        {roleCards.map((card) => (
          <article key={card.role} className="surface-card role-card">
            <div className="role-card__header">
              <span className="surface-tag">{card.role}</span>
              <h2>{card.title}</h2>
            </div>
            <p>{card.description}</p>
            <div className="chip-row">
              {card.highlights.map((item) => (
                <span key={item} className="quick-chip quick-chip--static">
                  {item}
                </span>
              ))}
            </div>
            <button
              type="button"
              className="primary-button primary-button--wide"
              onClick={() => handleEnter(card.role)}
            >
              进入 {card.title}
            </button>
          </article>
        ))}
      </section>
    </div>
  );
}

