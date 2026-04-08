import { useEffect, useMemo, useState } from "react";
import { AdminEditorStatusBar } from "../../components/AdminEditorStatusBar";
import { levelManagementItems } from "../../data/mockData";
import { fetchAdminLevels, saveAdminLevels } from "../../services/admin";
import { useAppState } from "../../state/AppState";
import type {
  GuardianChallengeConfig,
  LevelGameplayMode,
  LevelId,
  LevelManagementItem,
  ObservationSceneConfig,
  ObservationTaskStep,
  RouteChallengeConfig,
} from "../../types";
import { useEditableAdminResource } from "../../utils/useEditableAdminResource";

function cloneValue<T>(value: T) {
  return JSON.parse(JSON.stringify(value)) as T;
}

function linesToText(lines: string[]) {
  return lines.join("\n");
}

function textToLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function prettyJson(value: unknown) {
  return JSON.stringify(value ?? null, null, 2);
}

type JsonField =
  | "observationScene"
  | "taskSteps"
  | "routeChallengeConfig"
  | "guardianChallengeConfig";

export function AdminLevelsPage() {
  const { state } = useAppState();
  const canUseApi = state.authSource === "api" && Boolean(state.authToken);
  const editor = useEditableAdminResource<LevelManagementItem[]>({
    storageKey: "admin-level-management",
    fallbackData: levelManagementItems,
    enabled: canUseApi,
    fetcher: () => fetchAdminLevels(state.authToken ?? ""),
    saveHandler: (draftData, savedData) =>
      saveAdminLevels(state.authToken ?? "", draftData, savedData),
    dependencies: [state.authToken],
    fallbackMessage: "暂时无法获取关卡管理数据，当前继续使用预置内容。",
  });

  const levels = useMemo(
    () =>
      editor.draftData
        .slice()
        .sort((left, right) => left.displayOrder - right.displayOrder),
    [editor.draftData],
  );
  const [selectedId, setSelectedId] = useState<LevelId>(levels[0]?.id ?? "level-1");
  const [jsonDrafts, setJsonDrafts] = useState<Record<JsonField, string>>({
    observationScene: "",
    taskSteps: "",
    routeChallengeConfig: "",
    guardianChallengeConfig: "",
  });
  const [jsonErrors, setJsonErrors] = useState<Partial<Record<JsonField, string>>>({});

  useEffect(() => {
    setSelectedId((current) =>
      levels.some((item) => item.id === current) ? current : levels[0]?.id ?? "level-1",
    );
  }, [levels]);

  const selectedLevel =
    levels.find((item) => item.id === selectedId) ?? levels[0] ?? null;

  useEffect(() => {
    if (!selectedLevel) {
      return;
    }

    setJsonDrafts({
      observationScene: prettyJson(selectedLevel.observationScene ?? {}),
      taskSteps: prettyJson(selectedLevel.taskSteps ?? []),
      routeChallengeConfig: prettyJson(selectedLevel.routeChallengeConfig ?? {}),
      guardianChallengeConfig: prettyJson(selectedLevel.guardianChallengeConfig ?? {}),
    });
    setJsonErrors({});
  }, [selectedLevel]);

  function updateLevel<K extends keyof LevelManagementItem>(
    id: LevelId,
    field: K,
    value: LevelManagementItem[K],
  ) {
    editor.updateDraft((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  }

  function applyJsonField(field: JsonField) {
    if (!selectedLevel) {
      return;
    }

    try {
      const rawValue = jsonDrafts[field];

      if (field === "observationScene") {
        updateLevel(
          selectedLevel.id,
          "observationScene",
          JSON.parse(rawValue) as ObservationSceneConfig,
        );
      }

      if (field === "taskSteps") {
        updateLevel(
          selectedLevel.id,
          "taskSteps",
          JSON.parse(rawValue) as ObservationTaskStep[],
        );
      }

      if (field === "routeChallengeConfig") {
        updateLevel(
          selectedLevel.id,
          "routeChallengeConfig",
          JSON.parse(rawValue) as RouteChallengeConfig,
        );
      }

      if (field === "guardianChallengeConfig") {
        updateLevel(
          selectedLevel.id,
          "guardianChallengeConfig",
          JSON.parse(rawValue) as GuardianChallengeConfig,
        );
      }

      setJsonErrors((current) => ({ ...current, [field]: undefined }));
    } catch (error) {
      setJsonErrors((current) => ({
        ...current,
        [field]: error instanceof Error ? error.message : "JSON 解析失败",
      }));
    }
  }

  const routeNodeCount = levels.filter((item) => item.gameplayMode === "route").length;
  const guardianCount = levels.filter((item) => item.gameplayMode === "guardian").length;
  const observationCount = levels.filter((item) => item.gameplayMode === "observation").length;

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--admin">
        <div>
          <span className="hero-banner__eyebrow">关卡内容管理</span>
          <h1>统一编辑三关的玩法模式与配置内容</h1>
          <p>这一页现在同时支持观察识别、路线判断和操作守护三种模式，不再只偏第一关。管理员修改后，学生端会直接以后端下发配置渲染。</p>
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
          <span>观察识别关卡</span>
          <strong>{observationCount}</strong>
          <p>这类关卡主要配置场景热点、危险点、判断题和拖拽贴纸。</p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>路线判断关卡</span>
          <strong>{routeNodeCount}</strong>
          <p>这类关卡配置地图节点、事件卡、选项和安全值反馈。</p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>操作守护关卡</span>
          <strong>{guardianCount}</strong>
          <p>这类关卡配置公交车、私家车、电动车等分场景守护任务。</p>
        </article>
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
              <div className="row-between">
                <strong>{level.title}</strong>
                <span className="surface-tag">{level.gameplayMode ?? "observation"}</span>
              </div>
              <p>{level.focus}</p>
              <span className="inline-note">{level.rewardLabel}</span>
            </button>
          ))}
        </div>

        {selectedLevel ? (
          <div className="page-stack">
            <article className="surface-card editor-panel">
              <span className="section-block__eyebrow">基础字段</span>
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
                  <span>玩法模式</span>
                  <select
                    value={selectedLevel.gameplayMode ?? "observation"}
                    onChange={(event) =>
                      updateLevel(
                        selectedLevel.id,
                        "gameplayMode",
                        event.target.value as LevelGameplayMode,
                      )
                    }
                  >
                    <option value="observation">observation</option>
                    <option value="route">route</option>
                    <option value="guardian">guardian</option>
                  </select>
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
                  <span>场景素材标识</span>
                  <input
                    value={selectedLevel.sceneAssetLabel}
                    onChange={(event) =>
                      updateLevel(selectedLevel.id, "sceneAssetLabel", event.target.value)
                    }
                  />
                </label>
                <label className="form-field">
                  <span>奖励文案</span>
                  <input
                    value={selectedLevel.rewardLabel}
                    onChange={(event) =>
                      updateLevel(selectedLevel.id, "rewardLabel", event.target.value)
                    }
                  />
                </label>
                <label className="form-field form-field--wide">
                  <span>反馈风格</span>
                  <input
                    value={selectedLevel.feedbackStyle}
                    onChange={(event) =>
                      updateLevel(selectedLevel.id, "feedbackStyle", event.target.value)
                    }
                  />
                </label>
                <label className="form-field form-field--wide">
                  <span>反馈说明</span>
                  <textarea
                    className="text-area"
                    rows={3}
                    value={selectedLevel.feedbackCopy}
                    onChange={(event) =>
                      updateLevel(selectedLevel.id, "feedbackCopy", event.target.value)
                    }
                  />
                </label>
              </div>
            </article>

            <article className="surface-card editor-panel">
              <span className="section-block__eyebrow">概要列表</span>
              <h2>编辑任务说明、热点、道具和目标区域</h2>
              <div className="editor-grid">
                <label className="form-field form-field--wide">
                  <span>任务链（每行一条）</span>
                  <textarea
                    className="text-area"
                    rows={4}
                    value={linesToText(selectedLevel.taskOutline)}
                    onChange={(event) =>
                      updateLevel(selectedLevel.id, "taskOutline", textToLines(event.target.value))
                    }
                  />
                </label>
                <label className="form-field form-field--wide">
                  <span>热点或节点（每行一条）</span>
                  <textarea
                    className="text-area"
                    rows={4}
                    value={linesToText(selectedLevel.hotspotItems)}
                    onChange={(event) =>
                      updateLevel(selectedLevel.id, "hotspotItems", textToLines(event.target.value))
                    }
                  />
                </label>
                <label className="form-field form-field--wide">
                  <span>道具列表（每行一条）</span>
                  <textarea
                    className="text-area"
                    rows={4}
                    value={linesToText(selectedLevel.propItems)}
                    onChange={(event) =>
                      updateLevel(selectedLevel.id, "propItems", textToLines(event.target.value))
                    }
                  />
                </label>
                <label className="form-field form-field--wide">
                  <span>目标区域说明（每行一条）</span>
                  <textarea
                    className="text-area"
                    rows={4}
                    value={linesToText(selectedLevel.targetAreaNotes)}
                    onChange={(event) =>
                      updateLevel(
                        selectedLevel.id,
                        "targetAreaNotes",
                        textToLines(event.target.value),
                      )
                    }
                  />
                </label>
              </div>
            </article>

            <article className="surface-card editor-panel">
              <span className="section-block__eyebrow">玩法配置</span>
              <h2>按当前模式编辑详细 JSON 配置</h2>

              {(selectedLevel.gameplayMode ?? "observation") === "observation" ? (
                <div className="page-stack page-stack--compact">
                  <label className="form-field form-field--wide">
                    <span>Observation Scene JSON</span>
                    <textarea
                      className="text-area"
                      rows={14}
                      value={jsonDrafts.observationScene}
                      onChange={(event) =>
                        setJsonDrafts((current) => ({
                          ...current,
                          observationScene: event.target.value,
                        }))
                      }
                    />
                  </label>
                  {jsonErrors.observationScene ? (
                    <p className="form-error">{jsonErrors.observationScene}</p>
                  ) : null}
                  <div className="button-row">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => applyJsonField("observationScene")}
                    >
                      应用场景配置
                    </button>
                  </div>

                  <label className="form-field form-field--wide">
                    <span>Observation Task Steps JSON</span>
                    <textarea
                      className="text-area"
                      rows={16}
                      value={jsonDrafts.taskSteps}
                      onChange={(event) =>
                        setJsonDrafts((current) => ({
                          ...current,
                          taskSteps: event.target.value,
                        }))
                      }
                    />
                  </label>
                  {jsonErrors.taskSteps ? (
                    <p className="form-error">{jsonErrors.taskSteps}</p>
                  ) : null}
                  <div className="button-row">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => applyJsonField("taskSteps")}
                    >
                      应用任务链配置
                    </button>
                  </div>
                </div>
              ) : null}

              {(selectedLevel.gameplayMode ?? "observation") === "route" ? (
                <div className="page-stack page-stack--compact">
                  <label className="form-field form-field--wide">
                    <span>Route Challenge Config JSON</span>
                    <textarea
                      className="text-area"
                      rows={18}
                      value={jsonDrafts.routeChallengeConfig}
                      onChange={(event) =>
                        setJsonDrafts((current) => ({
                          ...current,
                          routeChallengeConfig: event.target.value,
                        }))
                      }
                    />
                  </label>
                  {jsonErrors.routeChallengeConfig ? (
                    <p className="form-error">{jsonErrors.routeChallengeConfig}</p>
                  ) : null}
                  <div className="button-row">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => applyJsonField("routeChallengeConfig")}
                    >
                      应用路线配置
                    </button>
                  </div>
                </div>
              ) : null}

              {(selectedLevel.gameplayMode ?? "observation") === "guardian" ? (
                <div className="page-stack page-stack--compact">
                  <label className="form-field form-field--wide">
                    <span>Guardian Challenge Config JSON</span>
                    <textarea
                      className="text-area"
                      rows={18}
                      value={jsonDrafts.guardianChallengeConfig}
                      onChange={(event) =>
                        setJsonDrafts((current) => ({
                          ...current,
                          guardianChallengeConfig: event.target.value,
                        }))
                      }
                    />
                  </label>
                  {jsonErrors.guardianChallengeConfig ? (
                    <p className="form-error">{jsonErrors.guardianChallengeConfig}</p>
                  ) : null}
                  <div className="button-row">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => applyJsonField("guardianChallengeConfig")}
                    >
                      应用守护配置
                    </button>
                  </div>
                </div>
              ) : null}
            </article>

            <section className="card-grid card-grid--three">
              <article className="surface-card admin-preview-card">
                <span className="section-block__eyebrow">玩法模式</span>
                <strong>{selectedLevel.gameplayMode ?? "observation"}</strong>
                <p>学生端会根据这个模式切换成观察识别、路线判断或操作守护页面。</p>
              </article>
              <article className="surface-card admin-preview-card">
                <span className="section-block__eyebrow">任务数</span>
                <strong>{selectedLevel.taskOutline.length}</strong>
                <p>当前配置稿中的任务链条数，用于主题页和关卡壳层展示。</p>
              </article>
              <article className="surface-card admin-preview-card">
                <span className="section-block__eyebrow">热点 / 节点数</span>
                <strong>{selectedLevel.hotspotItems.length}</strong>
                <p>当前配置稿中的热点、地图节点或场景焦点数量。</p>
              </article>
            </section>
          </div>
        ) : (
          <article className="surface-card empty-state-card">
            <strong>请选择一个关卡</strong>
            <p>左侧选中关卡后，就可以编辑它的玩法模式和详细配置。</p>
          </article>
        )}
      </section>
    </div>
  );
}
