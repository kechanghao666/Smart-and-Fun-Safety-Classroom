import { useEffect, useMemo, useState } from "react";
import { AdminEditorStatusBar } from "../../components/AdminEditorStatusBar";
import { levelManagementItems } from "../../data/mockData";
import { fetchAdminLevels } from "../../services/admin";
import { useAppState } from "../../state/AppState";
import type { LevelManagementItem } from "../../types";
import { useEditableAdminResource } from "../../utils/useEditableAdminResource";

export function AdminLevelsPage() {
  const { state } = useAppState();
  const canUseApi = state.authSource === "api" && Boolean(state.authToken);
  const editor = useEditableAdminResource<LevelManagementItem[]>({
    storageKey: "admin-level-management",
    fallbackData: levelManagementItems,
    enabled: canUseApi,
    fetcher: () => fetchAdminLevels(state.authToken ?? ""),
    dependencies: [state.authToken],
    fallbackMessage: "暂时无法获取关卡管理数据，当前继续使用本地演示内容。",
  });
  const levels = editor.draftData;
  const [selectedId, setSelectedId] = useState(levels[0]?.id ?? "level-1");

  useEffect(() => {
    setSelectedId((current) =>
      current && levels.some((item) => item.id === current) ? current : levels[0]?.id ?? "level-1",
    );
  }, [levels]);

  const selectedLevel = useMemo(
    () => levels.find((item) => item.id === selectedId) ?? levels[0] ?? null,
    [levels, selectedId],
  );
  const rewardConfiguredCount = levels.filter((item) => item.rewardLabel.trim().length > 0).length;
  const feedbackConfiguredCount = levels.filter(
    (item) => item.feedbackStyle.trim().length > 0,
  ).length;

  function updateLevel<K extends keyof LevelManagementItem>(
    id: LevelManagementItem["id"],
    field: K,
    value: LevelManagementItem[K],
  ) {
    editor.updateDraft((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  }

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--admin">
        <div>
          <span className="hero-banner__eyebrow">关卡内容管理</span>
          <h1>维护关卡焦点、时长、奖励和反馈风格</h1>
          <p>这里控制三关学习的标题、奖励、反馈语气和内容节奏，是学生主链路的核心配置区。</p>
        </div>
      </section>

      <AdminEditorStatusBar
        source={editor.source}
        status={editor.status}
        isHydrating={editor.isHydrating}
        syncError={editor.syncError}
        hasUnsavedChanges={editor.hasUnsavedChanges}
        canRestoreBaseline={editor.canRestoreBaseline}
        lastSavedAt={editor.lastSavedAt}
        onSave={editor.saveChanges}
        onResetChanges={editor.resetChanges}
        onRestoreBaseline={editor.restoreBaseline}
      />

      <section className="card-grid card-grid--three">
        <article className="surface-card stat-card admin-summary-card">
          <span>关卡总数</span>
          <strong>{levels.length}</strong>
          <p>当前首版固定为三关闯关学习，对应观察、判断和防护三类能力。</p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>奖励配置</span>
          <strong>{rewardConfiguredCount}</strong>
          <p>奖励规则会直接影响学生端结算页和成长反馈展示。</p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>反馈风格</span>
          <strong>{feedbackConfiguredCount}</strong>
          <p>建议统一保持儿童友好、规则明确、鼓励式反馈。</p>
        </article>
      </section>

      <section className="management-layout">
        <div className="page-stack">
          {levels.length > 0 ? (
            levels.map((level) => (
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
                <span className="inline-note">{level.duration}</span>
              </button>
            ))
          ) : (
            <article className="surface-card empty-state-card">
              <strong>当前没有关卡数据</strong>
              <p>请先恢复同步 / 默认数据，或等待后端返回关卡配置。</p>
            </article>
          )}
        </div>

        {selectedLevel ? (
          <article className="surface-card editor-panel">
            <span className="section-block__eyebrow">编辑关卡</span>
            <h2>{selectedLevel.title}</h2>
            <div className="chip-row">
              <span className="surface-tag">{selectedLevel.focus}</span>
              <span className="surface-tag">{selectedLevel.duration}</span>
              <span className="surface-tag">{selectedLevel.rewardLabel}</span>
            </div>
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

            <div className="card-grid card-grid--two">
              <article className="feedback-box">
                <strong>页面联动</strong>
                <p>标题、奖励和反馈文案会直接影响学生端闯关页、结算页和成长体系展示。</p>
              </article>
              <article className="feedback-box">
                <strong>教学提示</strong>
                <p>建议让三关形成递进节奏：先观察，再判断，最后强化出行防护习惯。</p>
              </article>
            </div>
          </article>
        ) : (
          <article className="surface-card empty-state-card">
            <strong>请选择一个关卡</strong>
            <p>左侧选中关卡后，就可以维护标题、时长、奖励和反馈风格。</p>
          </article>
        )}
      </section>
    </div>
  );
}
