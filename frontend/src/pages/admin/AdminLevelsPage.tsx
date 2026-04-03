import { useEffect, useMemo, useState } from "react";
import { AdminEditorStatusBar } from "../../components/AdminEditorStatusBar";
import { levelManagementItems } from "../../data/mockData";
import { fetchAdminLevels } from "../../services/admin";
import { useAppState } from "../../state/AppState";
import type { LevelId, LevelManagementItem } from "../../types";
import { useEditableAdminResource } from "../../utils/useEditableAdminResource";

const levelStructureMap: Record<
  LevelId,
  { title: string; areas: string[]; teachingTip: string }
> = {
  "level-1": {
    title: "顶部状态栏 + 左任务区 + 中间场景区",
    areas: ["任务清单", "交通场景热点", "即时观察反馈"],
    teachingTip: "第一关重点是先观察，再点击关键安全点位。",
  },
  "level-2": {
    title: "顶部状态条 + 地图主视图 + 底部事件卡",
    areas: ["路线地图", "节点事件卡", "安全值反馈"],
    teachingTip: "第二关重点是逐节点判断，保持路线选择的连贯性。",
  },
  "level-3": {
    title: "顶部步骤状态栏 + 中间主场景 + 底部操作区",
    areas: ["守护步骤", "主场景任务", "操作确认区"],
    teachingTip: "第三关重点是把乘车防护动作补齐，不漏掉关键准备。",
  },
};

function linesToText(lines: string[]) {
  return lines.join("\n");
}

function textToLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function AdminLevelsPage() {
  const { state } = useAppState();
  const canUseApi = state.authSource === "api" && Boolean(state.authToken);
  const editor = useEditableAdminResource<LevelManagementItem[]>({
    storageKey: "admin-level-management",
    fallbackData: levelManagementItems,
    enabled: canUseApi,
    fetcher: () => fetchAdminLevels(state.authToken ?? ""),
    dependencies: [state.authToken],
    fallbackMessage: "暂时无法获取关卡管理数据，当前继续使用预置内容。",
  });
  const levels = editor.draftData
    .slice()
    .sort((left, right) => left.displayOrder - right.displayOrder);
  const [selectedId, setSelectedId] = useState(levels[0]?.id ?? "level-1");

  useEffect(() => {
    setSelectedId((current) =>
      current && levels.some((item) => item.id === current)
        ? current
        : levels[0]?.id ?? "level-1",
    );
  }, [levels]);

  const selectedLevel = useMemo(
    () => levels.find((item) => item.id === selectedId) ?? levels[0] ?? null,
    [levels, selectedId],
  );
  const rewardConfiguredCount = levels.filter(
    (item) => item.rewardLabel.trim().length > 0,
  ).length;
  const feedbackConfiguredCount = levels.filter(
    (item) => item.feedbackCopy.trim().length > 0,
  ).length;
  const selectedStructure = selectedLevel ? levelStructureMap[selectedLevel.id] : null;

  function updateLevel<K extends keyof LevelManagementItem>(
    id: LevelManagementItem["id"],
    field: K,
    value: LevelManagementItem[K],
  ) {
    editor.updateDraft((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  }

  function updateLevelListField(
    id: LevelManagementItem["id"],
    field: "taskOutline" | "hotspotItems" | "propItems" | "targetAreaNotes",
    value: string,
  ) {
    updateLevel(id, field, textToLines(value));
  }

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--admin">
        <div>
          <span className="hero-banner__eyebrow">关卡内容管理</span>
          <h1>按关卡结构、场景配置和反馈文案维护三关内容</h1>
          <p>
            这一页严格对应说明书中的“关卡列表 + 场景配置区”结构，补齐场景图、
            任务内容、反馈文案、展示顺序、热点配置和拖拽道具说明。
          </p>
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
          <p>首版固定为三关学习，对应观察、判断和防护三类能力。</p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>奖励配置</span>
          <strong>{rewardConfiguredCount}</strong>
          <p>奖励规则会直接影响学生端结算页和成长反馈展示。</p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>反馈文案</span>
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
                <div className="row-between">
                  <strong>{level.title}</strong>
                  <span className="surface-tag">顺序 {level.displayOrder}</span>
                </div>
                <p>{level.sceneAssetLabel}</p>
                <span className="inline-note">{level.rewardLabel}</span>
              </button>
            ))
          ) : (
            <article className="surface-card empty-state-card">
              <strong>当前没有关卡数据</strong>
              <p>请先恢复最近版本，或等待关卡配置更新后再继续查看。</p>
            </article>
          )}
        </div>

        {selectedLevel ? (
          <div className="page-stack">
            <article className="surface-card editor-panel">
              <span className="section-block__eyebrow">场景配置区</span>
              <h2>{selectedLevel.title}</h2>
              <div className="chip-row">
                <span className="surface-tag">{selectedLevel.focus}</span>
                <span className="surface-tag">{selectedLevel.duration}</span>
                <span className="surface-tag">顺序 {selectedLevel.displayOrder}</span>
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
                  <span>展示顺序</span>
                  <input
                    type="number"
                    value={selectedLevel.displayOrder}
                    onChange={(event) =>
                      updateLevel(
                        selectedLevel.id,
                        "displayOrder",
                        Number.isNaN(Number(event.target.value))
                          ? selectedLevel.displayOrder
                          : Number(event.target.value),
                      )
                    }
                  />
                </label>

                <label className="form-field form-field--wide">
                  <span>场景图</span>
                  <input
                    value={selectedLevel.sceneAssetLabel}
                    onChange={(event) =>
                      updateLevel(selectedLevel.id, "sceneAssetLabel", event.target.value)
                    }
                  />
                </label>

                <label className="form-field form-field--wide">
                  <span>任务内容（每行一条）</span>
                  <textarea
                    rows={5}
                    value={linesToText(selectedLevel.taskOutline)}
                    onChange={(event) =>
                      updateLevelListField(selectedLevel.id, "taskOutline", event.target.value)
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

                <label className="form-field">
                  <span>反馈风格</span>
                  <input
                    value={selectedLevel.feedbackStyle}
                    onChange={(event) =>
                      updateLevel(selectedLevel.id, "feedbackStyle", event.target.value)
                    }
                  />
                </label>

                <label className="form-field form-field--wide">
                  <span>反馈文案</span>
                  <textarea
                    rows={4}
                    value={selectedLevel.feedbackCopy}
                    onChange={(event) =>
                      updateLevel(selectedLevel.id, "feedbackCopy", event.target.value)
                    }
                  />
                </label>

                <label className="form-field form-field--wide">
                  <span>场景热点 / 节点配置（每行一条）</span>
                  <textarea
                    rows={4}
                    value={linesToText(selectedLevel.hotspotItems)}
                    onChange={(event) =>
                      updateLevelListField(selectedLevel.id, "hotspotItems", event.target.value)
                    }
                  />
                </label>

                <label className="form-field form-field--wide">
                  <span>拖拽道具列表（每行一条）</span>
                  <textarea
                    rows={4}
                    value={linesToText(selectedLevel.propItems)}
                    onChange={(event) =>
                      updateLevelListField(selectedLevel.id, "propItems", event.target.value)
                    }
                  />
                </label>

                <label className="form-field form-field--wide">
                  <span>目标区域说明（每行一条）</span>
                  <textarea
                    rows={4}
                    value={linesToText(selectedLevel.targetAreaNotes)}
                    onChange={(event) =>
                      updateLevelListField(
                        selectedLevel.id,
                        "targetAreaNotes",
                        event.target.value,
                      )
                    }
                  />
                </label>
              </div>
            </article>

            <section className="card-grid card-grid--two">
              <article className="surface-card admin-preview-card admin-preview-card--level">
                <span className="section-block__eyebrow">学生端结构预览</span>
                <h3>{selectedStructure?.title}</h3>
                <ul className="plain-list">
                  {selectedStructure?.areas.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p>{selectedStructure?.teachingTip}</p>
              </article>

              <article className="surface-card admin-preview-card">
                <span className="section-block__eyebrow">场景与任务预览</span>
                <div className="theme-cover-preview theme-cover-preview--sky">
                  <strong>{selectedLevel.sceneAssetLabel}</strong>
                  <p>当前场景图会在学生端主场景区域展示。</p>
                </div>
                <ul className="plain-list">
                  {selectedLevel.taskOutline.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            </section>

            <section className="card-grid card-grid--three">
              <article className="surface-card admin-preview-card">
                <span className="section-block__eyebrow">热点 / 节点配置</span>
                <ul className="plain-list">
                  {selectedLevel.hotspotItems.length > 0 ? (
                    selectedLevel.hotspotItems.map((item) => <li key={item}>{item}</li>)
                  ) : (
                    <li>当前关卡不需要单独配置热点。</li>
                  )}
                </ul>
              </article>

              <article className="surface-card admin-preview-card">
                <span className="section-block__eyebrow">道具列表</span>
                <ul className="plain-list">
                  {selectedLevel.propItems.length > 0 ? (
                    selectedLevel.propItems.map((item) => <li key={item}>{item}</li>)
                  ) : (
                    <li>当前关卡不使用拖拽道具。</li>
                  )}
                </ul>
              </article>

              <article className="surface-card admin-preview-card">
                <span className="section-block__eyebrow">目标区域说明</span>
                <ul className="plain-list">
                  {selectedLevel.targetAreaNotes.length > 0 ? (
                    selectedLevel.targetAreaNotes.map((item) => <li key={item}>{item}</li>)
                  ) : (
                    <li>当前关卡不需要额外目标区域说明。</li>
                  )}
                </ul>
              </article>
            </section>
          </div>
        ) : (
          <article className="surface-card empty-state-card">
            <strong>请选择一个关卡</strong>
            <p>左侧选中关卡后，就可以维护场景图、任务、热点、道具和反馈文案。</p>
          </article>
        )}
      </section>
    </div>
  );
}
