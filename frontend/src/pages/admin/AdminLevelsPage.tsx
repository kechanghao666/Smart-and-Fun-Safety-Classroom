import { useMemo, useState } from "react";
import { levelManagementItems } from "../../data/mockData";
import type { LevelManagementItem } from "../../types";
import { usePersistedState } from "../../utils/usePersistedState";

export function AdminLevelsPage() {
  const [levels, setLevels] = usePersistedState<LevelManagementItem[]>(
    "admin-level-management",
    levelManagementItems,
  );
  const [selectedId, setSelectedId] = useState(levels[0]?.id ?? "level-1");
  const selectedLevel = useMemo(
    () => levels.find((item) => item.id === selectedId) ?? levels[0] ?? null,
    [levels, selectedId],
  );

  function updateLevel<K extends keyof LevelManagementItem>(
    id: LevelManagementItem["id"],
    field: K,
    value: LevelManagementItem[K],
  ) {
    setLevels((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  }

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--admin">
        <div>
          <span className="hero-banner__eyebrow">关卡内容管理</span>
          <h1>维护关卡焦点、时长、奖励和反馈风格</h1>
          <p>这一页对应说明书里的关卡内容后台，前端先提供可编辑原型结构。</p>
        </div>
      </section>

      <section className="management-layout">
        <div className="page-stack">
          {levels.map((level) => (
            <button
              key={level.id}
              type="button"
              className={
                level.id === selectedLevel?.id
                  ? "management-list-card management-list-card--active"
                  : "management-list-card"
              }
              onClick={() => setSelectedId(level.id)}
            >
              <span className="surface-tag">{level.focus}</span>
              <h3>{level.title}</h3>
              <p>{level.rewardLabel}</p>
            </button>
          ))}
        </div>

        {selectedLevel ? (
          <article className="surface-card editor-panel">
            <span className="section-block__eyebrow">编辑关卡</span>
            <h2>{selectedLevel.title}</h2>
            <div className="editor-grid">
              <label className="form-field">
                <span>关卡标题</span>
                <input
                  value={selectedLevel.title}
                  onChange={(event) =>
                    updateLevel(selectedLevel.id, "title", event.target.value)
                  }
                />
              </label>
              <label className="form-field">
                <span>学习焦点</span>
                <input
                  value={selectedLevel.focus}
                  onChange={(event) =>
                    updateLevel(selectedLevel.id, "focus", event.target.value)
                  }
                />
              </label>
              <label className="form-field">
                <span>预计时长</span>
                <input
                  value={selectedLevel.duration}
                  onChange={(event) =>
                    updateLevel(selectedLevel.id, "duration", event.target.value)
                  }
                />
              </label>
              <label className="form-field">
                <span>奖励规则</span>
                <input
                  value={selectedLevel.rewardLabel}
                  onChange={(event) =>
                    updateLevel(selectedLevel.id, "rewardLabel", event.target.value)
                  }
                />
              </label>
              <label className="form-field form-field--wide">
                <span>反馈风格</span>
                <textarea
                  rows={4}
                  value={selectedLevel.feedbackStyle}
                  onChange={(event) =>
                    updateLevel(selectedLevel.id, "feedbackStyle", event.target.value)
                  }
                />
              </label>
            </div>
          </article>
        ) : null}
      </section>
    </div>
  );
}
