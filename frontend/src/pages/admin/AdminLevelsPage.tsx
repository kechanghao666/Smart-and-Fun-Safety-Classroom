import { useEffect, useMemo, useState } from "react";
import { AdminEditorStatusBar } from "../../components/AdminEditorStatusBar";
import { levelOneManagementDefaults } from "../../data/levelOneObservation";
import { levelManagementItems } from "../../data/mockData";
import { fetchAdminLevels, saveAdminLevels } from "../../services/admin";
import { useAppState } from "../../state/AppState";
import type {
  LevelId,
  LevelManagementItem,
  ObservationDragMarker,
  ObservationInteractionType,
  ObservationSceneConfig,
  ObservationSceneTarget,
  ObservationTaskChoice,
  ObservationTaskStep,
} from "../../types";
import { useEditableAdminResource } from "../../utils/useEditableAdminResource";

const levelStructureMap: Record<
  LevelId,
  { title: string; areas: string[]; teachingTip: string }
> = {
  "level-1": {
    title: "顶部状态栏 + 左侧任务区 + 中间主场景",
    areas: ["任务链", "街道观察场景", "即时反馈与贴纸操作"],
    teachingTip: "第一关要把观察、判断和简单拖拽串成完整的 15 分钟课堂闯关。",
  },
  "level-2": {
    title: "顶部状态条 + 路线地图 + 底部事件卡",
    areas: ["路线推进", "节点判断", "安全值反馈"],
    teachingTip: "第二关重点是路线判断和节点风险选择，维持地图推进感。",
  },
  "level-3": {
    title: "顶部步骤状态栏 + 主场景 + 底部操作区",
    areas: ["守护步骤", "场景纠错", "装备栏与放置区"],
    teachingTip: "第三关要继续保留准备动作、道具选择和纠错感。",
  },
};

const interactionTypeOptions: Array<{
  value: ObservationInteractionType;
  label: string;
}> = [
  { value: "hotspot", label: "点击热点" },
  { value: "danger_mark", label: "圈出危险点" },
  { value: "state_judge", label: "安全判断题" },
  { value: "drag_marker", label: "拖拽贴纸" },
];

const targetAccentOptions = [
  { value: "sky", label: "蓝色提醒" },
  { value: "mint", label: "绿色安全" },
  { value: "orange", label: "橙色判断" },
  { value: "danger", label: "红色危险" },
] as const;

const targetShapeOptions = [
  { value: "rect", label: "矩形区域" },
  { value: "pill", label: "胶囊区域" },
  { value: "circle", label: "圆形区域" },
] as const;

function cloneData<T>(value: T): T {
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

function targetIdsToText(targetIds: string[]) {
  return targetIds.join(", ");
}

function textToTargetIds(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function choicesToText(choices?: ObservationTaskChoice[]) {
  return (choices ?? [])
    .map((choice) => `${choice.label} | ${choice.safe ? "safe" : "risk"} | ${choice.feedback}`)
    .join("\n");
}

function textToChoices(value: string) {
  return value
    .split("\n")
    .map((line, index) => {
      const [label, mode, feedback] = line.split("|").map((item) => item.trim());

      if (!label || !mode || !feedback) {
        return null;
      }

      return {
        id: `choice-${index + 1}`,
        label,
        safe: mode === "safe",
        feedback,
      } satisfies ObservationTaskChoice;
    })
    .filter((item): item is ObservationTaskChoice => item !== null);
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

function buildLevelOneEditable(level: LevelManagementItem) {
  return {
    ...level,
    sceneAssetLabel:
      level.sceneAssetLabel || levelOneManagementDefaults.sceneAssetLabel || "level-1-city-street",
    taskOutline:
      level.taskOutline.length > 0
        ? level.taskOutline
        : cloneData(levelOneManagementDefaults.taskOutline ?? []),
    hotspotItems:
      level.hotspotItems.length > 0
        ? level.hotspotItems
        : cloneData(levelOneManagementDefaults.hotspotItems ?? []),
    propItems:
      level.propItems.length > 0
        ? level.propItems
        : cloneData(levelOneManagementDefaults.propItems ?? []),
    targetAreaNotes:
      level.targetAreaNotes.length > 0
        ? level.targetAreaNotes
        : cloneData(levelOneManagementDefaults.targetAreaNotes ?? []),
    observationScene:
      level.observationScene ?? cloneData(levelOneManagementDefaults.observationScene ?? null),
    taskSteps:
      level.taskSteps && level.taskSteps.length > 0
        ? level.taskSteps
        : cloneData(levelOneManagementDefaults.taskSteps ?? []),
    midpointCopy:
      level.midpointCopy ?? levelOneManagementDefaults.midpointCopy ?? "",
    completionCopy:
      level.completionCopy ?? levelOneManagementDefaults.completionCopy ?? "",
  };
}

function targetTypeLabel(kind: "targets" | "dangerMarkers" | "dragMarkers") {
  if (kind === "targets") {
    return "观察热点";
  }

  if (kind === "dangerMarkers") {
    return "危险点位";
  }

  return "贴纸道具";
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
        .map((item) => (item.id === "level-1" ? buildLevelOneEditable(item) : item))
        .slice()
        .sort((left, right) => left.displayOrder - right.displayOrder),
    [editor.draftData],
  );

  const [selectedId, setSelectedId] = useState<LevelId>(levels[0]?.id ?? "level-1");

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

  const selectedObservationScene =
    selectedLevel?.id === "level-1"
      ? selectedLevel.observationScene ?? levelOneManagementDefaults.observationScene ?? null
      : null;
  const selectedTaskSteps =
    selectedLevel?.id === "level-1"
      ? selectedLevel.taskSteps ?? levelOneManagementDefaults.taskSteps ?? []
      : [];
  const selectedMidpointCopy =
    selectedLevel?.id === "level-1"
      ? selectedLevel.midpointCopy ?? levelOneManagementDefaults.midpointCopy ?? ""
      : "";
  const selectedCompletionCopy =
    selectedLevel?.id === "level-1"
      ? selectedLevel.completionCopy ?? levelOneManagementDefaults.completionCopy ?? ""
      : "";

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

  function updateLevelOne(updater: (level: LevelManagementItem) => LevelManagementItem) {
    if (!selectedLevel || selectedLevel.id !== "level-1") {
      return;
    }

    editor.updateDraft((current) =>
      current.map((item) => {
        if (item.id !== "level-1") {
          return item;
        }

        return updater(buildLevelOneEditable(item));
      }),
    );
  }

  function updateObservationSceneField<K extends keyof ObservationSceneConfig>(
    field: K,
    value: ObservationSceneConfig[K],
  ) {
    updateLevelOne((level) => ({
      ...level,
      observationScene: {
        ...(level.observationScene as ObservationSceneConfig),
        [field]: value,
      },
    }));
  }

  function updateObservationTarget(
    field: "targets" | "dangerMarkers",
    targetId: string,
    patch: Partial<ObservationSceneTarget>,
  ) {
    updateLevelOne((level) => {
      const scene = level.observationScene as ObservationSceneConfig;

      return {
        ...level,
        observationScene: {
          ...scene,
          [field]: scene[field].map((item) =>
            item.id === targetId ? { ...item, ...patch } : item,
          ),
        },
      };
    });
  }

  function updateObservationDragMarker(
    markerId: string,
    patch: Partial<ObservationDragMarker>,
  ) {
    updateLevelOne((level) => {
      const scene = level.observationScene as ObservationSceneConfig;

      return {
        ...level,
        observationScene: {
          ...scene,
          dragMarkers: scene.dragMarkers.map((item) =>
            item.id === markerId ? { ...item, ...patch } : item,
          ),
        },
      };
    });
  }

  function updateObservationTaskStep(stepId: string, patch: Partial<ObservationTaskStep>) {
    updateLevelOne((level) => {
      const nextSteps = (level.taskSteps ?? []).map((step) =>
        step.id === stepId ? { ...step, ...patch } : step,
      );

      return {
        ...level,
        taskSteps: nextSteps,
        taskOutline: nextSteps.map((step) => step.title),
      };
    });
  }

  function renderObservationTargetCard(
    target: ObservationSceneTarget,
    kind: "targets" | "dangerMarkers",
  ) {
    return (
      <article
        key={target.id}
        className={
          kind === "dangerMarkers"
            ? "surface-card admin-observation-card admin-observation-card--danger"
            : "surface-card admin-observation-card"
        }
      >
        <div className="row-between">
          <strong>{target.label}</strong>
          <span className="surface-tag">{targetTypeLabel(kind)}</span>
        </div>

        <div className="editor-grid">
          <label className="form-field">
            <span>点位名称</span>
            <input
              value={target.label}
              onChange={(event) =>
                updateObservationTarget(kind, target.id, { label: event.target.value })
              }
            />
          </label>

          <label className="form-field">
            <span>提示语</span>
            <input
              value={target.hint}
              onChange={(event) =>
                updateObservationTarget(kind, target.id, { hint: event.target.value })
              }
            />
          </label>

          <label className="form-field">
            <span>顶部位置 (%)</span>
            <input
              type="number"
              value={target.top}
              onChange={(event) =>
                updateObservationTarget(kind, target.id, {
                  top: clampPercent(Number(event.target.value)),
                })
              }
            />
          </label>

          <label className="form-field">
            <span>左侧位置 (%)</span>
            <input
              type="number"
              value={target.left}
              onChange={(event) =>
                updateObservationTarget(kind, target.id, {
                  left: clampPercent(Number(event.target.value)),
                })
              }
            />
          </label>

          <label className="form-field">
            <span>宽度 (%)</span>
            <input
              type="number"
              value={target.width}
              onChange={(event) =>
                updateObservationTarget(kind, target.id, {
                  width: clampPercent(Number(event.target.value)),
                })
              }
            />
          </label>

          <label className="form-field">
            <span>高度 (%)</span>
            <input
              type="number"
              value={target.height}
              onChange={(event) =>
                updateObservationTarget(kind, target.id, {
                  height: clampPercent(Number(event.target.value)),
                })
              }
            />
          </label>

          <label className="form-field">
            <span>高亮颜色</span>
            <select
              value={target.accent}
              onChange={(event) =>
                updateObservationTarget(kind, target.id, {
                  accent: event.target.value as ObservationSceneTarget["accent"],
                })
              }
            >
              {targetAccentOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>命中形状</span>
            <select
              value={target.shape}
              onChange={(event) =>
                updateObservationTarget(kind, target.id, {
                  shape: event.target.value as ObservationSceneTarget["shape"],
                })
              }
            >
              {targetShapeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </article>
    );
  }

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--admin">
        <div>
          <span className="hero-banner__eyebrow">关卡内容管理</span>
          <h1>按关卡结构、场景配置和反馈文案维护三关内容</h1>
          <p>
            这一页严格对照说明书中的“关卡列表 + 场景配置区”结构。第一关已经升级为
            6 步观察链，管理员可以维护主场景、热点、危险点、贴纸和步骤反馈。
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
          <p>首版固定为三关学习任务，对应观察、判断和防护三类能力。</p>
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
              <span className="section-block__eyebrow">基础配置区</span>
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
                  <span>主场景素材标识</span>
                  <input
                    value={selectedLevel.sceneAssetLabel}
                    onChange={(event) =>
                      updateLevel(selectedLevel.id, "sceneAssetLabel", event.target.value)
                    }
                  />
                </label>

                <label className="form-field form-field--wide">
                  <span>任务提纲（每行一条）</span>
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
                  <span>统一反馈文案</span>
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

            {selectedLevel.id === "level-1" && selectedObservationScene ? (
              <>
                <article className="surface-card editor-panel">
                  <span className="section-block__eyebrow">第一关专用配置</span>
                  <h2>城市交通观察员 · 主场景与节奏</h2>
                  <div className="editor-grid">
                    <label className="form-field">
                      <span>场景参考名称</span>
                      <input
                        value={selectedObservationScene.referenceLabel}
                        onChange={(event) =>
                          updateObservationSceneField(
                            "referenceLabel",
                            event.target.value,
                          )
                        }
                      />
                    </label>

                    <label className="form-field">
                      <span>背景素材标识</span>
                      <input
                        value={selectedObservationScene.backgroundAsset}
                        onChange={(event) =>
                          updateObservationSceneField(
                            "backgroundAsset",
                            event.target.value,
                          )
                        }
                      />
                    </label>

                    <label className="form-field form-field--wide">
                      <span>场景引导语</span>
                      <textarea
                        rows={3}
                        value={selectedObservationScene.sceneCaption}
                        onChange={(event) =>
                          updateObservationSceneField("sceneCaption", event.target.value)
                        }
                      />
                    </label>

                    <label className="form-field form-field--wide">
                      <span>半程小结文案</span>
                      <textarea
                        rows={3}
                        value={selectedMidpointCopy}
                        onChange={(event) =>
                          updateLevelOne((level) => ({
                            ...level,
                            midpointCopy: event.target.value,
                          }))
                        }
                      />
                    </label>

                    <label className="form-field form-field--wide">
                      <span>通关结算总结</span>
                      <textarea
                        rows={3}
                        value={selectedCompletionCopy}
                        onChange={(event) =>
                          updateLevelOne((level) => ({
                            ...level,
                            completionCopy: event.target.value,
                          }))
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

                  <article className="surface-card admin-preview-card admin-preview-card--level">
                    <span className="section-block__eyebrow">第一关配置概览</span>
                    <div className="admin-observation-preview">
                      <div>
                        <strong>{selectedObservationScene.referenceLabel}</strong>
                        <p>{selectedObservationScene.sceneCaption}</p>
                      </div>
                      <div className="mini-stat-list">
                        <article>
                          <span>观察热点</span>
                          <strong>{selectedObservationScene.targets.length}</strong>
                        </article>
                        <article>
                          <span>危险点位</span>
                          <strong>{selectedObservationScene.dangerMarkers.length}</strong>
                        </article>
                        <article>
                          <span>任务步骤</span>
                          <strong>{selectedTaskSteps.length}</strong>
                        </article>
                      </div>
                    </div>
                  </article>
                </section>

                <article className="surface-card editor-panel">
                  <span className="section-block__eyebrow">热点与危险点</span>
                  <h2>主场景命中区域配置</h2>
                  <div className="page-stack page-stack--compact">
                    {selectedObservationScene.targets.map((target) =>
                      renderObservationTargetCard(target, "targets"),
                    )}
                    {selectedObservationScene.dangerMarkers.map((target) =>
                      renderObservationTargetCard(target, "dangerMarkers"),
                    )}
                  </div>
                </article>

                <article className="surface-card editor-panel">
                  <span className="section-block__eyebrow">拖拽贴纸配置</span>
                  <h2>安全贴纸与落点</h2>
                  <div className="page-stack page-stack--compact">
                    {selectedObservationScene.dragMarkers.map((marker) => (
                      <article key={marker.id} className="surface-card admin-observation-card">
                        <div className="row-between">
                          <strong>{marker.label}</strong>
                          <span className="surface-tag">贴纸道具</span>
                        </div>

                        <div className="editor-grid">
                          <label className="form-field">
                            <span>贴纸名称</span>
                            <input
                              value={marker.label}
                              onChange={(event) =>
                                updateObservationDragMarker(marker.id, {
                                  label: event.target.value,
                                })
                              }
                            />
                          </label>

                          <label className="form-field">
                            <span>表情符号</span>
                            <input
                              value={marker.emoji}
                              onChange={(event) =>
                                updateObservationDragMarker(marker.id, {
                                  emoji: event.target.value,
                                })
                              }
                            />
                          </label>

                          <label className="form-field">
                            <span>目标点位 ID</span>
                            <input
                              value={marker.targetId}
                              onChange={(event) =>
                                updateObservationDragMarker(marker.id, {
                                  targetId: event.target.value,
                                })
                              }
                            />
                          </label>

                          <label className="form-field">
                            <span>操作提示</span>
                            <input
                              value={marker.hint}
                              onChange={(event) =>
                                updateObservationDragMarker(marker.id, {
                                  hint: event.target.value,
                                })
                              }
                            />
                          </label>

                          <label className="form-field form-field--wide">
                            <span>成功反馈</span>
                            <textarea
                              rows={3}
                              value={marker.successCopy}
                              onChange={(event) =>
                                updateObservationDragMarker(marker.id, {
                                  successCopy: event.target.value,
                                })
                              }
                            />
                          </label>
                        </div>
                      </article>
                    ))}
                  </div>
                </article>

                <article className="surface-card editor-panel">
                  <span className="section-block__eyebrow">步骤链配置</span>
                  <h2>6 步观察任务链</h2>
                  <div className="page-stack page-stack--compact">
                    {selectedTaskSteps.map((step, index) => (
                      <article
                        key={step.id}
                        className="surface-card admin-observation-step-card"
                      >
                        <div className="row-between">
                          <strong>
                            第 {index + 1} 步 · {step.title}
                          </strong>
                          <span className="surface-tag">
                            {
                              interactionTypeOptions.find(
                                (option) => option.value === step.interactionType,
                              )?.label
                            }
                          </span>
                        </div>

                        <div className="editor-grid">
                          <label className="form-field">
                            <span>步骤标题</span>
                            <input
                              value={step.title}
                              onChange={(event) =>
                                updateObservationTaskStep(step.id, {
                                  title: event.target.value,
                                })
                              }
                            />
                          </label>

                          <label className="form-field">
                            <span>交互类型</span>
                            <select
                              value={step.interactionType}
                              onChange={(event) =>
                                updateObservationTaskStep(step.id, {
                                  interactionType: event.target
                                    .value as ObservationInteractionType,
                                })
                              }
                            >
                              {interactionTypeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="form-field form-field--wide">
                            <span>任务指令</span>
                            <textarea
                              rows={3}
                              value={step.instruction}
                              onChange={(event) =>
                                updateObservationTaskStep(step.id, {
                                  instruction: event.target.value,
                                })
                              }
                            />
                          </label>

                          <label className="form-field">
                            <span>目标 ID（逗号分隔）</span>
                            <input
                              value={targetIdsToText(step.targetIds)}
                              onChange={(event) =>
                                updateObservationTaskStep(step.id, {
                                  targetIds: textToTargetIds(event.target.value),
                                })
                              }
                            />
                          </label>

                          <label className="form-field">
                            <span>贴纸 ID</span>
                            <input
                              value={step.stickerId ?? ""}
                              placeholder="仅拖拽步骤需要"
                              onChange={(event) =>
                                updateObservationTaskStep(step.id, {
                                  stickerId: event.target.value.trim() || undefined,
                                })
                              }
                            />
                          </label>

                          <label className="form-field form-field--wide">
                            <span>成功反馈</span>
                            <textarea
                              rows={3}
                              value={step.successCopy}
                              onChange={(event) =>
                                updateObservationTaskStep(step.id, {
                                  successCopy: event.target.value,
                                })
                              }
                            />
                          </label>

                          <label className="form-field form-field--wide">
                            <span>错误反馈</span>
                            <textarea
                              rows={3}
                              value={step.errorCopy}
                              onChange={(event) =>
                                updateObservationTaskStep(step.id, {
                                  errorCopy: event.target.value,
                                })
                              }
                            />
                          </label>

                          <label className="form-field form-field--wide">
                            <span>AI 提示</span>
                            <textarea
                              rows={3}
                              value={step.aiHint}
                              onChange={(event) =>
                                updateObservationTaskStep(step.id, {
                                  aiHint: event.target.value,
                                })
                              }
                            />
                          </label>

                          <label className="form-field form-field--wide">
                            <span>判断选项（每行：标签 | safe/risk | 反馈）</span>
                            <textarea
                              rows={4}
                              value={choicesToText(step.choices)}
                              onChange={(event) =>
                                updateObservationTaskStep(step.id, {
                                  choices: textToChoices(event.target.value),
                                })
                              }
                            />
                          </label>
                        </div>
                      </article>
                    ))}
                  </div>
                </article>
              </>
            ) : null}

            <section className="card-grid card-grid--three">
              <article className="surface-card admin-preview-card">
                <span className="section-block__eyebrow">热点 / 节点清单</span>
                <ul className="plain-list">
                  {selectedLevel.hotspotItems.length > 0 ? (
                    selectedLevel.hotspotItems.map((item) => <li key={item}>{item}</li>)
                  ) : (
                    <li>当前关卡没有额外热点配置。</li>
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
                    selectedLevel.targetAreaNotes.map((item) => (
                      <li key={item}>{item}</li>
                    ))
                  ) : (
                    <li>当前关卡没有额外目标区域说明。</li>
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
