import { useEffect, useMemo, useState } from "react";
import { AdminEditorStatusBar } from "../../components/AdminEditorStatusBar";
import { levelManagementItems } from "../../data/mockData";
import { fetchAdminLevels, saveAdminLevels } from "../../services/admin";
import { useAppState } from "../../state/AppState";
import type {
  GuardianChallengeConfig,
  GuardianChallengeStage,
  GuardianTaskType,
  LevelGameplayMode,
  LevelId,
  LevelManagementItem,
  ObservationSceneConfig,
  ObservationTaskStep,
  RouteChallengeConfig,
  RouteChallengeNode,
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

function createRouteNode(index: number): RouteChallengeNode {
  return {
    id: `node-${Date.now()}-${index}`,
    title: `节点 ${index + 1}`,
    mapLabel: `节点 ${index + 1}`,
    scenario: "请填写该路线节点对应的事件描述。",
    hint: "请填写教师给学生的提示。",
    helperText: "请填写节点辅助说明。",
    position: { top: 30 + index * 8, left: 20 + index * 10 },
    options: [
      {
        label: "安全做法",
        safe: true,
        feedback: "请填写安全选项反馈。",
        safetyDelta: 8,
      },
      {
        label: "危险做法",
        safe: false,
        feedback: "请填写危险选项反馈。",
        safetyDelta: -10,
      },
    ],
  };
}

function createGuardianStage(index: number): GuardianChallengeStage {
  return {
    id: `stage-${Date.now()}-${index}`,
    title: `守护任务 ${index + 1}`,
    detail: "请填写该场景的任务说明。",
    toolLabel: "工具",
    toolHint: "请填写工具提示。",
    stageLabel: index === 0 ? "公交车" : index === 1 ? "私家车" : "电动车",
    successText: "请填写完成提示。",
    taskType: index === 2 ? "sequence" : index === 1 ? "tap" : "drag",
    sceneImageUrl: "",
    sceneSourcePageUrl: "",
    sceneCaption: "请填写场景说明。",
    actionHint: "请填写操作提示。",
  };
}

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

  function patchSelected(updater: (current: LevelManagementItem) => LevelManagementItem) {
    if (!selectedLevel) {
      return;
    }

    editor.updateDraft((current) =>
      current.map((item) =>
        item.id === selectedLevel.id ? updater(cloneValue(item)) : item,
      ),
    );
  }

  function applyJsonField(field: JsonField) {
    if (!selectedLevel) {
      return;
    }

    try {
      const rawValue = jsonDrafts[field];

      if (field === "observationScene") {
        updateLevel(selectedLevel.id, "observationScene", JSON.parse(rawValue) as ObservationSceneConfig);
      }

      if (field === "taskSteps") {
        updateLevel(selectedLevel.id, "taskSteps", JSON.parse(rawValue) as ObservationTaskStep[]);
      }

      if (field === "routeChallengeConfig") {
        updateLevel(selectedLevel.id, "routeChallengeConfig", JSON.parse(rawValue) as RouteChallengeConfig);
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

  const routeCount = levels.filter((item) => item.gameplayMode === "route").length;
  const guardianCount = levels.filter((item) => item.gameplayMode === "guardian").length;
  const observationCount = levels.filter((item) => item.gameplayMode === "observation").length;
  const routeConfig = selectedLevel?.routeChallengeConfig ?? null;
  const guardianConfig = selectedLevel?.guardianChallengeConfig ?? null;
  const observationScene = selectedLevel?.observationScene ?? null;
  const taskSteps = selectedLevel?.taskSteps ?? [];

  function updateRouteNode(index: number, updater: (node: RouteChallengeNode) => RouteChallengeNode) {
    if (!routeConfig) {
      return;
    }
    patchSelected((current) => ({
      ...current,
      routeChallengeConfig: {
        ...routeConfig,
        nodes: routeConfig.nodes.map((node, nodeIndex) =>
          nodeIndex === index ? updater(cloneValue(node)) : node,
        ),
      },
    }));
  }

  function updateGuardianStage(
    index: number,
    updater: (stage: GuardianChallengeStage) => GuardianChallengeStage,
  ) {
    if (!guardianConfig) {
      return;
    }
    patchSelected((current) => ({
      ...current,
      guardianChallengeConfig: {
        ...guardianConfig,
        stages: guardianConfig.stages.map((stage, stageIndex) =>
          stageIndex === index ? updater(cloneValue(stage)) : stage,
        ),
      },
    }));
  }

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--admin">
        <div>
          <span className="hero-banner__eyebrow">关卡内容管理</span>
          <h1>先用结构化表单改玩法，再在高级区维护 JSON</h1>
          <p>关卡页现在保留三关固定入口，主编辑区优先暴露结构化字段，JSON 被收进折叠区，只给高级维护使用。</p>
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
        <article className="surface-card stat-card stat-card--compact admin-summary-card">
          <span>观察识别</span>
          <strong>{observationCount}</strong>
          <p>主要配置场景热点、危险点和任务链。</p>
        </article>
        <article className="surface-card stat-card stat-card--compact admin-summary-card">
          <span>路线判断</span>
          <strong>{routeCount}</strong>
          <p>重点维护地图节点、事件卡与安全值反馈。</p>
        </article>
        <article className="surface-card stat-card stat-card--compact admin-summary-card">
          <span>操作守护</span>
          <strong>{guardianCount}</strong>
          <p>围绕公交车、私家车、电动车三段任务组织场景。</p>
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
                  ? "management-list-card management-list-card--compact management-list-card--active"
                  : "management-list-card management-list-card--compact"
              }
              onClick={() => setSelectedId(level.id)}
            >
              <div className="row-between">
                <strong>{level.title}</strong>
                <span className="surface-tag">{level.gameplayMode ?? "observation"}</span>
              </div>
              <p className="compact-copy compact-copy--two-line" title={level.focus}>
                {level.focus}
              </p>
              <span className="inline-note">{level.rewardLabel}</span>
            </button>
          ))}
        </div>

        {selectedLevel ? (
          <div className="page-stack">
            <article className="surface-card editor-panel editor-panel--compact">
              <span className="section-block__eyebrow">基础字段</span>
              <h2>{selectedLevel.title}</h2>
              <div className="editor-grid">
                <label className="form-field">
                  <span>关卡标题</span>
                  <input value={selectedLevel.title} onChange={(event) => updateLevel(selectedLevel.id, "title", event.target.value)} />
                </label>
                <label className="form-field">
                  <span>学习焦点</span>
                  <input value={selectedLevel.focus} onChange={(event) => updateLevel(selectedLevel.id, "focus", event.target.value)} />
                </label>
                <label className="form-field">
                  <span>玩法模式</span>
                  <select
                    value={selectedLevel.gameplayMode ?? "observation"}
                    onChange={(event) =>
                      updateLevel(selectedLevel.id, "gameplayMode", event.target.value as LevelGameplayMode)
                    }
                  >
                    <option value="observation">observation</option>
                    <option value="route">route</option>
                    <option value="guardian">guardian</option>
                  </select>
                </label>
                <label className="form-field">
                  <span>预计时长</span>
                  <input value={selectedLevel.duration} onChange={(event) => updateLevel(selectedLevel.id, "duration", event.target.value)} />
                </label>
                <label className="form-field">
                  <span>场景素材标识</span>
                  <input value={selectedLevel.sceneAssetLabel} onChange={(event) => updateLevel(selectedLevel.id, "sceneAssetLabel", event.target.value)} />
                </label>
                <label className="form-field">
                  <span>奖励文案</span>
                  <input value={selectedLevel.rewardLabel} onChange={(event) => updateLevel(selectedLevel.id, "rewardLabel", event.target.value)} />
                </label>
                <label className="form-field form-field--wide">
                  <span>反馈风格</span>
                  <input value={selectedLevel.feedbackStyle} onChange={(event) => updateLevel(selectedLevel.id, "feedbackStyle", event.target.value)} />
                </label>
                <label className="form-field form-field--wide">
                  <span>反馈说明</span>
                  <textarea rows={3} value={selectedLevel.feedbackCopy} onChange={(event) => updateLevel(selectedLevel.id, "feedbackCopy", event.target.value)} />
                </label>
              </div>
            </article>

            <article className="surface-card editor-panel editor-panel--compact">
              <span className="section-block__eyebrow">概要列表</span>
              <h2>快速维护任务、热点、道具和目标区</h2>
              <div className="editor-grid">
                <label className="form-field form-field--wide">
                  <span>任务链（每行一条）</span>
                  <textarea rows={4} value={linesToText(selectedLevel.taskOutline)} onChange={(event) => updateLevel(selectedLevel.id, "taskOutline", textToLines(event.target.value))} />
                </label>
                <label className="form-field form-field--wide">
                  <span>热点或节点（每行一条）</span>
                  <textarea rows={4} value={linesToText(selectedLevel.hotspotItems)} onChange={(event) => updateLevel(selectedLevel.id, "hotspotItems", textToLines(event.target.value))} />
                </label>
                <label className="form-field form-field--wide">
                  <span>道具列表（每行一条）</span>
                  <textarea rows={4} value={linesToText(selectedLevel.propItems)} onChange={(event) => updateLevel(selectedLevel.id, "propItems", textToLines(event.target.value))} />
                </label>
                <label className="form-field form-field--wide">
                  <span>目标区域说明（每行一条）</span>
                  <textarea rows={4} value={linesToText(selectedLevel.targetAreaNotes)} onChange={(event) => updateLevel(selectedLevel.id, "targetAreaNotes", textToLines(event.target.value))} />
                </label>
              </div>
            </article>

            {(selectedLevel.gameplayMode ?? "observation") === "observation" && observationScene ? (
              <article className="surface-card editor-panel editor-panel--compact">
                <span className="section-block__eyebrow">观察识别表单</span>
                <h2>先维护场景，再维护任务步骤</h2>
                <div className="editor-grid">
                  <label className="form-field">
                    <span>背景素材</span>
                    <input
                      value={observationScene.backgroundAsset}
                      onChange={(event) =>
                        patchSelected((current) => ({
                          ...current,
                          observationScene: { ...observationScene, backgroundAsset: event.target.value },
                        }))
                      }
                    />
                  </label>
                  <label className="form-field">
                    <span>参考标签</span>
                    <input
                      value={observationScene.referenceLabel}
                      onChange={(event) =>
                        patchSelected((current) => ({
                          ...current,
                          observationScene: { ...observationScene, referenceLabel: event.target.value },
                        }))
                      }
                    />
                  </label>
                  <label className="form-field form-field--wide">
                    <span>场景说明</span>
                    <textarea
                      rows={3}
                      value={observationScene.sceneCaption}
                      onChange={(event) =>
                        patchSelected((current) => ({
                          ...current,
                          observationScene: { ...observationScene, sceneCaption: event.target.value },
                        }))
                      }
                    />
                  </label>
                </div>

                <div className="page-stack page-stack--compact">
                  {taskSteps.map((step, index) => (
                    <article key={step.id} className="surface-card admin-inline-editor-card">
                      <div className="editor-grid">
                        <label className="form-field">
                          <span>步骤标题</span>
                          <input
                            value={step.title}
                            onChange={(event) =>
                              patchSelected((current) => ({
                                ...current,
                                taskSteps: taskSteps.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, title: event.target.value } : item,
                                ),
                              }))
                            }
                          />
                        </label>
                        <label className="form-field">
                          <span>交互类型</span>
                          <select
                            value={step.interactionType}
                            onChange={(event) =>
                              patchSelected((current) => ({
                                ...current,
                                taskSteps: taskSteps.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, interactionType: event.target.value as ObservationTaskStep["interactionType"] }
                                    : item,
                                ),
                              }))
                            }
                          >
                            <option value="hotspot">hotspot</option>
                            <option value="danger_mark">danger_mark</option>
                            <option value="state_judge">state_judge</option>
                            <option value="drag_marker">drag_marker</option>
                          </select>
                        </label>
                        <label className="form-field form-field--wide">
                          <span>任务说明</span>
                          <input
                            value={step.instruction}
                            onChange={(event) =>
                              patchSelected((current) => ({
                                ...current,
                                taskSteps: taskSteps.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, instruction: event.target.value } : item,
                                ),
                              }))
                            }
                          />
                        </label>
                      </div>
                    </article>
                  ))}
                </div>
              </article>
            ) : null}

            {(selectedLevel.gameplayMode ?? "observation") === "route" && routeConfig ? (
              <article className="surface-card editor-panel editor-panel--compact">
                <span className="section-block__eyebrow">路线判断表单</span>
                <h2>地图信息、节点事件和安全值反馈</h2>
                <div className="editor-grid">
                  <label className="form-field">
                    <span>地图标题</span>
                    <input value={routeConfig.mapTitle} onChange={(event) => patchSelected((current) => ({ ...current, routeChallengeConfig: { ...routeConfig, mapTitle: event.target.value } }))} />
                  </label>
                  <label className="form-field">
                    <span>路线标签</span>
                    <input value={routeConfig.routeLabel} onChange={(event) => patchSelected((current) => ({ ...current, routeChallengeConfig: { ...routeConfig, routeLabel: event.target.value } }))} />
                  </label>
                  <label className="form-field">
                    <span>安全值标签</span>
                    <input value={routeConfig.safetyLabel} onChange={(event) => patchSelected((current) => ({ ...current, routeChallengeConfig: { ...routeConfig, safetyLabel: event.target.value } }))} />
                  </label>
                  <label className="form-field">
                    <span>角色标签</span>
                    <input value={routeConfig.currentRoleLabel} onChange={(event) => patchSelected((current) => ({ ...current, routeChallengeConfig: { ...routeConfig, currentRoleLabel: event.target.value } }))} />
                  </label>
                  <label className="form-field form-field--wide">
                    <span>地图说明</span>
                    <textarea rows={3} value={routeConfig.mapDescription} onChange={(event) => patchSelected((current) => ({ ...current, routeChallengeConfig: { ...routeConfig, mapDescription: event.target.value } }))} />
                  </label>
                  <label className="form-field form-field--wide">
                    <span>完成提示</span>
                    <textarea rows={3} value={routeConfig.completionCopy} onChange={(event) => patchSelected((current) => ({ ...current, routeChallengeConfig: { ...routeConfig, completionCopy: event.target.value } }))} />
                  </label>
                </div>

                <div className="page-stack page-stack--compact">
                  {routeConfig.nodes.map((node, index) => (
                    <article key={node.id} className="surface-card admin-inline-editor-card">
                      <div className="row-between">
                        <strong>{node.title}</strong>
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() =>
                            patchSelected((current) => ({
                              ...current,
                              routeChallengeConfig: {
                                ...routeConfig,
                                nodes: routeConfig.nodes.filter((_, nodeIndex) => nodeIndex !== index),
                              },
                            }))
                          }
                        >
                          删除节点
                        </button>
                      </div>
                      <div className="editor-grid">
                        <label className="form-field">
                          <span>节点标题</span>
                          <input value={node.title} onChange={(event) => updateRouteNode(index, (current) => ({ ...current, title: event.target.value }))} />
                        </label>
                        <label className="form-field">
                          <span>地图标签</span>
                          <input value={node.mapLabel} onChange={(event) => updateRouteNode(index, (current) => ({ ...current, mapLabel: event.target.value }))} />
                        </label>
                        <label className="form-field form-field--wide">
                          <span>事件描述</span>
                          <textarea rows={3} value={node.scenario} onChange={(event) => updateRouteNode(index, (current) => ({ ...current, scenario: event.target.value }))} />
                        </label>
                        <label className="form-field form-field--wide">
                          <span>提示说明</span>
                          <input value={node.hint} onChange={(event) => updateRouteNode(index, (current) => ({ ...current, hint: event.target.value }))} />
                        </label>
                      </div>
                    </article>
                  ))}
                  <div className="button-row">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() =>
                        patchSelected((current) => ({
                          ...current,
                          routeChallengeConfig: {
                            ...routeConfig,
                            nodes: [...routeConfig.nodes, createRouteNode(routeConfig.nodes.length)],
                          },
                        }))
                      }
                    >
                      新增路线节点
                    </button>
                  </div>
                </div>
              </article>
            ) : null}

            {(selectedLevel.gameplayMode ?? "observation") === "guardian" && guardianConfig ? (
              <article className="surface-card editor-panel editor-panel--compact">
                <span className="section-block__eyebrow">操作守护表单</span>
                <h2>场景步骤、任务类型和完成反馈</h2>
                <label className="form-field form-field--wide">
                  <span>完成提示</span>
                  <textarea rows={3} value={guardianConfig.completionCopy} onChange={(event) => patchSelected((current) => ({ ...current, guardianChallengeConfig: { ...guardianConfig, completionCopy: event.target.value } }))} />
                </label>

                <div className="page-stack page-stack--compact">
                  {guardianConfig.stages.map((stage, index) => (
                    <article key={stage.id} className="surface-card admin-inline-editor-card">
                      <div className="row-between">
                        <strong>{stage.title}</strong>
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() =>
                            patchSelected((current) => ({
                              ...current,
                              guardianChallengeConfig: {
                                ...guardianConfig,
                                stages: guardianConfig.stages.filter((_, stageIndex) => stageIndex !== index),
                              },
                            }))
                          }
                        >
                          删除任务
                        </button>
                      </div>
                      <div className="editor-grid">
                        <label className="form-field">
                          <span>任务标题</span>
                          <input value={stage.title} onChange={(event) => updateGuardianStage(index, (current) => ({ ...current, title: event.target.value }))} />
                        </label>
                        <label className="form-field">
                          <span>阶段标签</span>
                          <input value={stage.stageLabel} onChange={(event) => updateGuardianStage(index, (current) => ({ ...current, stageLabel: event.target.value }))} />
                        </label>
                        <label className="form-field">
                          <span>任务类型</span>
                          <select
                            value={stage.taskType}
                            onChange={(event) => updateGuardianStage(index, (current) => ({ ...current, taskType: event.target.value as GuardianTaskType }))}
                          >
                            <option value="drag">drag</option>
                            <option value="tap">tap</option>
                            <option value="sequence">sequence</option>
                          </select>
                        </label>
                        <label className="form-field form-field--wide">
                          <span>任务说明</span>
                          <textarea rows={3} value={stage.detail} onChange={(event) => updateGuardianStage(index, (current) => ({ ...current, detail: event.target.value }))} />
                        </label>
                        <label className="form-field form-field--wide">
                          <span>操作提示</span>
                          <input value={stage.actionHint} onChange={(event) => updateGuardianStage(index, (current) => ({ ...current, actionHint: event.target.value }))} />
                        </label>
                      </div>
                    </article>
                  ))}
                  <div className="button-row">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() =>
                        patchSelected((current) => ({
                          ...current,
                          guardianChallengeConfig: {
                            ...guardianConfig,
                            stages: [...guardianConfig.stages, createGuardianStage(guardianConfig.stages.length)],
                          },
                        }))
                      }
                    >
                      新增守护任务
                    </button>
                  </div>
                </div>
              </article>
            ) : null}

            <details className="surface-card admin-json-panel">
              <summary>高级 JSON 配置</summary>
              <div className="page-stack">
                {[
                  ["observationScene", "Observation Scene JSON"],
                  ["taskSteps", "Observation Task Steps JSON"],
                  ["routeChallengeConfig", "Route Challenge JSON"],
                  ["guardianChallengeConfig", "Guardian Challenge JSON"],
                ].map(([field, label]) => (
                  <article key={field} className="page-stack page-stack--compact">
                    <label className="form-field form-field--wide">
                      <span>{label}</span>
                      <textarea
                        className="text-area"
                        rows={14}
                        value={jsonDrafts[field as JsonField]}
                        onChange={(event) =>
                          setJsonDrafts((current) => ({
                            ...current,
                            [field]: event.target.value,
                          }))
                        }
                      />
                    </label>
                    {jsonErrors[field as JsonField] ? (
                      <p className="form-error">{jsonErrors[field as JsonField]}</p>
                    ) : null}
                    <div className="button-row">
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => applyJsonField(field as JsonField)}
                      >
                        应用 {label}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </details>
          </div>
        ) : (
          <article className="surface-card empty-state-card">
            <strong>当前没有关卡数据</strong>
            <p>请先恢复最近版本，或等待关卡配置同步后再继续编辑。</p>
          </article>
        )}
      </section>
    </div>
  );
}
