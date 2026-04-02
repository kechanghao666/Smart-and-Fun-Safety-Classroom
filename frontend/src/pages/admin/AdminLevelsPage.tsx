import { useCallback, useMemo, useState } from "react";
import { levelManagementItems } from "../../data/mockData";
import { fetchAdminLevels } from "../../services/admin";
import { useAppState } from "../../state/AppState";
import type { LevelManagementItem } from "../../types";
import { useApiHydration } from "../../utils/useApiHydration";
import { usePersistedState } from "../../utils/usePersistedState";

export function AdminLevelsPage() {
  const { state } = useAppState();
  const [levels, setLevels] = usePersistedState<LevelManagementItem[]>(
    "admin-level-management",
    levelManagementItems,
  );
  const canUseApi = state.authSource === "api" && Boolean(state.authToken);
  const [selectedId, setSelectedId] = useState(levels[0]?.id ?? "level-1");
  const selectedLevel = useMemo(
    () => levels.find((item) => item.id === selectedId) ?? levels[0] ?? null,
    [levels, selectedId],
  );
  const applyLevels = useCallback(
    (items: LevelManagementItem[]) => {
      setLevels(items);
      setSelectedId((current) => {
        if (current && items.some((item) => item.id === current)) {
          return current;
        }

        return items[0]?.id ?? "level-1";
      });
    },
    [setLevels],
  );
  const { error, isLoading, source } = useApiHydration({
    enabled: canUseApi,
    fetcher: () => fetchAdminLevels(state.authToken ?? ""),
    applyData: applyLevels,
    dependencies: [state.authToken],
    fallbackMessage: "暂时无法获取关卡管理数据，当前继续使用本地演示内容。",
  });

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

      <article className="feedback-box">
        <strong>{source === "api" ? "关卡配置已从后端同步" : "关卡配置正在使用本地演示数据"}</strong>
        <p>
          {isLoading
            ? "正在同步关卡管理数据..."
            : error || "当前页会在保留本地可编辑能力的同时等待后端保存接口接入。"}
        </p>
      </article>

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
