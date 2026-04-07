import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import levelOneStreetScene from "../../assets/levels/level-1-city-street.svg";
import { StudentAdventureHero } from "../../components/student/StudentAdventureHero";
import { StudentMascotBubble } from "../../components/student/StudentMascotBubble";
import { levelOneObservationConfig } from "../../data/levelOneObservation";
import { ApiError } from "../../services/http";
import { completeStudentLevel, startStudentLevel } from "../../services/student";
import { useAppState } from "../../state/AppState";
import type {
  GuardianChallengeConfig,
  GuardianChallengeStage,
  GuardianTapTarget,
  LevelCompletionPayload,
  LevelGameplayMode,
  LevelId,
  ObservationDragMarker,
  ObservationLevelConfig,
  ObservationSceneTarget,
  ObservationTaskChoice,
  ObservationTaskStep,
  RouteChallengeChoice,
  RouteChallengeConfig,
  RouteChallengeNode,
} from "../../types";
import { useStudentAiScene } from "../../utils/useStudentAiScene";

interface RouteDecisionLog {
  nodeId: string;
  nodeTitle: string;
  selectedLabel: string;
  safe: boolean;
  feedback: string;
  safetyDelta: number;
}

function isLevelId(value: string | undefined): value is LevelId {
  return value === "level-1" || value === "level-2" || value === "level-3";
}

function getLevelAccent(levelId: LevelId) {
  if (levelId === "level-2") {
    return "mint" as const;
  }

  if (levelId === "level-3") {
    return "orange" as const;
  }

  return "sky" as const;
}

function getGameplayMode(levelId: LevelId, mode?: LevelGameplayMode) {
  if (mode) {
    return mode;
  }

  if (levelId === "level-2") {
    return "route";
  }

  if (levelId === "level-3") {
    return "guardian";
  }

  return "observation";
}

function buildGuardianSequence(stage: GuardianChallengeStage) {
  const items = stage.sequenceItems ?? [];

  if (items.length <= 1) {
    return items.map((item) => item.id);
  }

  return [...items]
    .sort((left, right) => right.expectedOrder - left.expectedOrder)
    .map((item) => item.id);
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;

  if (nextIndex < 0 || nextIndex >= items.length) {
    return items;
  }

  const nextItems = [...items];
  const [item] = nextItems.splice(index, 1);
  nextItems.splice(nextIndex, 0, item);
  return nextItems;
}

function buildObservationPayload(
  levelId: LevelId,
  config: ObservationLevelConfig,
  mistakes: number,
): LevelCompletionPayload {
  const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
  const score = Math.max(78, 100 - mistakes * 6);

  return {
    score,
    stars,
    highlight: "你已经学会先找安全通行位置，再判断危险行为。",
    caution:
      mistakes === 0
        ? "继续保持先停一停、看一看、再行动的节奏。"
        : "下次还要记得同时看信号灯、来车和危险动作，不要只盯着一个点。",
    aiSummary: config.completionCopy,
    keySafetyPoints: config.taskSteps.slice(0, 3).map((step) => step.title),
    cautionPoints:
      mistakes === 0
        ? ["继续保持在起步前先观察斑马线、标志和来车。"]
        : [
            "不要只看信号灯，还要看转弯车辆有没有礼让。",
            "看见护栏、车缝和奔跑动作时，要立刻想到危险。",
          ],
    rewardIcon: "👀",
    rewardLabel: "观察识别徽章",
  };
}

function buildRoutePayload(
  config: RouteChallengeConfig,
  logs: RouteDecisionLog[],
  safety: number,
): LevelCompletionPayload {
  const safeCount = logs.filter((item) => item.safe).length;
  const stars = safety >= 3 ? 3 : safety >= 2 ? 2 : 1;
  const score = Math.max(72, Math.min(100, safeCount * 16 + safety * 8));
  const cautionPoints = logs
    .filter((item) => !item.safe)
    .map((item) => `${item.nodeTitle}：${item.feedback}`)
    .slice(0, 2);

  return {
    score,
    stars,
    highlight:
      safeCount >= logs.length - 1
        ? "你已经能沿着回家路线，一站一站做出更稳妥的决定。"
        : "你已经走完整条路线，也开始能分辨哪些选择更安全。",
    caution:
      cautionPoints[0] ??
      "遇到拐弯车、大车和视线被挡住的时候，要先停下来重新观察。",
    aiSummary: config.completionCopy,
    keySafetyPoints: logs
      .filter((item) => item.safe)
      .map((item) => `${item.nodeTitle}：${item.selectedLabel}`)
      .slice(0, 3),
    cautionPoints:
      cautionPoints.length > 0
        ? cautionPoints
        : ["整条路线都走稳了，继续保持先观察再决定的习惯。"],
    rewardIcon: "🗺️",
    rewardLabel: "路线判断徽章",
  };
}

function buildGuardianPayload(
  config: GuardianChallengeConfig,
  mistakes: number,
): LevelCompletionPayload {
  const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
  const score = Math.max(80, 100 - mistakes * 5);

  return {
    score,
    stars,
    highlight: "你已经完成公交车、私家车和电动车三种出行守护任务。",
    caution:
      mistakes === 0
        ? "很好，记得把这些动作都变成每次出门前的固定顺序。"
        : "准备出发前要先把安全动作做完整，再开始移动。",
    aiSummary: config.completionCopy,
    keySafetyPoints: config.stages.map((stage) => stage.successText),
    cautionPoints:
      mistakes === 0
        ? ["继续保持先准备安全装备，再出发的顺序。"]
        : [
            "候车时先站在安全区域，不贴近车门和路边。",
            "乘车前先完成安全带、头盔等关键保护动作。",
          ],
    rewardIcon: "🛡️",
    rewardLabel: "出行守护徽章",
  };
}

function ObservationStage({
  config,
  activeStep,
  completedStepIds,
  feedback,
  progressValue,
  activeTargetId,
  selectedStickerId,
  selectedChoiceId,
  onTargetClick,
  onChoiceClick,
  onStickerSelect,
}: {
  config: ObservationLevelConfig;
  activeStep: ObservationTaskStep;
  completedStepIds: string[];
  feedback: string;
  progressValue: number;
  activeTargetId: string | null;
  selectedStickerId: string | null;
  selectedChoiceId: string | null;
  onTargetClick: (targetId: string) => void;
  onChoiceClick: (choice: ObservationTaskChoice) => void;
  onStickerSelect: (marker: ObservationDragMarker) => void;
}) {
  const sceneTargets: Array<ObservationSceneTarget & { group: "targets" | "dangerMarkers" }> = [
    ...config.observationScene.targets.map((item) => ({ ...item, group: "targets" as const })),
    ...config.observationScene.dangerMarkers.map((item) => ({
      ...item,
      group: "dangerMarkers" as const,
    })),
  ];
  const stepNumber =
    config.taskSteps.findIndex((item) => item.id === activeStep.id) + 1;

  return (
    <section className="student-level-shell student-level-shell--observe">
      <div className="student-level-shell__top">
        <div>
          <span className="section-block__eyebrow">第一关 · 观察识别</span>
          <h2>{activeStep.title}</h2>
        </div>
        <div className="student-level-shell__stats">
          <span className="surface-tag">
            任务 {stepNumber} / {config.taskSteps.length}
          </span>
          <span className="surface-tag">进度 {progressValue}%</span>
        </div>
      </div>

      <div className="student-level-observe-layout">
        <article className="surface-card student-level-side-card">
          <div className="student-level-task-focus">
            <div className="student-level-task-focus__icon">{stepNumber}</div>
            <div>
              <strong>{activeStep.title}</strong>
              <p>{activeStep.instruction}</p>
            </div>
          </div>

          <div className="progress-bar">
            <span className="progress-bar__fill" style={{ width: `${progressValue}%` }} />
          </div>

          <div className="level-checklist">
            {config.taskSteps.map((step) => {
              const done = completedStepIds.includes(step.id);
              return (
                <article
                  key={step.id}
                  className={
                    done
                      ? "level-checklist__item level-checklist__item--done"
                      : "level-checklist__item"
                  }
                >
                  <strong>{step.title}</strong>
                  <p>{done ? step.successCopy : step.aiHint}</p>
                </article>
              );
            })}
          </div>

          <article className="student-observe-feedback">
            <strong>即时反馈</strong>
            <p>{feedback}</p>
          </article>

          {activeStep.interactionType === "state_judge" && activeStep.choices?.length ? (
            <div className="student-state-choice-grid">
              {activeStep.choices.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  className={
                    selectedChoiceId === choice.id
                      ? "student-state-choice-card student-state-choice-card--active"
                      : "student-state-choice-card"
                  }
                  onClick={() => onChoiceClick(choice)}
                >
                  <strong>{choice.label}</strong>
                  <span>{choice.safe ? "更稳妥的做法" : "想想还有没有更安全的办法"}</span>
                </button>
              ))}
            </div>
          ) : null}

          {activeStep.interactionType === "drag_marker" ? (
            <div className="student-sticker-tray">
              {config.observationScene.dragMarkers.map((marker) => (
                <button
                  key={marker.id}
                  type="button"
                  className={
                    selectedStickerId === marker.id
                      ? "student-sticker-card student-sticker-card--active"
                      : "student-sticker-card"
                  }
                  onClick={() => onStickerSelect(marker)}
                >
                  <span className="student-sticker-card__emoji">{marker.emoji}</span>
                  <div>
                    <strong>{marker.label}</strong>
                    <p>{marker.hint}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </article>

        <article className="surface-card student-level-scene-card">
          <div className="student-observe-scene-board">
            <img
              src={levelOneStreetScene}
              alt={config.observationScene.referenceLabel}
              className="student-observe-scene-board__image"
            />
            <div className="student-observe-scene-board__targets">
              {sceneTargets.map((target) => {
                const isDone = activeStep.targetIds.includes(target.id)
                  ? completedStepIds.includes(activeStep.id)
                  : false;
                const isFocus = activeStep.targetIds.includes(target.id);
                const isActive = activeTargetId === target.id;

                return (
                  <button
                    key={target.id}
                    type="button"
                    className={`student-observe-marker student-observe-marker--${target.accent} ${
                      isDone
                        ? "student-observe-marker--done"
                        : isFocus
                          ? "student-observe-marker--focus"
                          : isActive
                            ? "student-observe-marker--active"
                            : ""
                    }`}
                    style={{
                      top: `${target.top}%`,
                      left: `${target.left}%`,
                      width: `${target.width}%`,
                      height: `${target.height}%`,
                    }}
                    onClick={() => onTargetClick(target.id)}
                  >
                    <span className="student-observe-marker__pulse" />
                    <span className="student-observe-marker__label">{target.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="student-observe-photo-stage__copy">
            <span>场景提示</span>
            <strong>{config.observationScene.sceneCaption}</strong>
            <p>{activeStep.aiHint}</p>
          </div>
        </article>
      </div>
    </section>
  );
}

function RouteStage({
  config,
  routeIndex,
  routeSafety,
  decisions,
  feedback,
  onChoiceSelect,
}: {
  config: RouteChallengeConfig;
  routeIndex: number;
  routeSafety: number;
  decisions: RouteDecisionLog[];
  feedback: string | null;
  onChoiceSelect: (node: RouteChallengeNode, choice: RouteChallengeChoice) => void;
}) {
  const activeNode = config.nodes[routeIndex] ?? null;
  const progressValue = Math.round((decisions.length / config.nodes.length) * 100);

  return (
    <section className="student-level-shell student-level-shell--route">
      <div className="student-level-shell__top">
        <div>
          <span className="section-block__eyebrow">第二关 · 路线判断</span>
          <h2>{config.mapTitle}</h2>
        </div>
        <div className="student-level-shell__stats">
          <span className="surface-tag">
            安全值 {routeSafety} / 3
          </span>
          <span className="surface-tag">
            节点 {Math.min(decisions.length + 1, config.nodes.length)} / {config.nodes.length}
          </span>
        </div>
      </div>

      <div className="student-level-route-layout">
        <article className="surface-card student-route-map-card">
          <div className="student-route-map-card__header">
            <div>
              <span className="section-block__eyebrow">地图主视图</span>
              <h3>{config.routeLabel}</h3>
            </div>
            <div className="progress-bar progress-bar--compact">
              <span
                className="progress-bar__fill progress-bar__fill--mint"
                style={{ width: `${progressValue}%` }}
              />
            </div>
          </div>

          <div className="student-route-map">
            {config.nodes.map((node, index) => {
              const decision = decisions.find((item) => item.nodeId === node.id);
              const active = index === routeIndex;
              const stateClass = decision
                ? decision.safe
                  ? "student-route-map__node student-route-map__node--done"
                  : "student-route-map__node student-route-map__node--risk"
                : active
                  ? "student-route-map__node student-route-map__node--current"
                  : "student-route-map__node";

              return (
                <article
                  key={node.id}
                  className={stateClass}
                  style={{ top: `${node.position.top}%`, left: `${node.position.left}%` }}
                >
                  <span>{index + 1}</span>
                  <strong>{node.mapLabel}</strong>
                  <p>{decision ? decision.selectedLabel : node.hint}</p>
                </article>
              );
            })}
            <div className="student-route-map__legend">
              <span>{config.mapDescription}</span>
              <strong>{config.currentRoleLabel}</strong>
            </div>
          </div>

          <div className="student-route-map-card__summary">
            {decisions.map((decision) => (
              <span
                key={decision.nodeId}
                className={decision.safe ? "surface-tag" : "surface-tag surface-tag--warning"}
              >
                {decision.nodeTitle}
              </span>
            ))}
          </div>
        </article>

        <article className="surface-card student-route-choice-card">
          <span className="section-block__eyebrow">底部事件卡</span>
          <h3>{activeNode ? activeNode.title : "路线判断已完成"}</h3>
          <p className="student-route-choice-card__scenario">
            {activeNode ? activeNode.scenario : config.completionCopy}
          </p>
          <article className="student-route-choice-card__hint">
            <strong>{activeNode ? activeNode.hint : "整条路线都走完了"}</strong>
            <p>{activeNode ? activeNode.helperText : "可以点击下方按钮完成本关并进入结算。"}</p>
          </article>

          {activeNode ? (
            <div className="student-route-choice-grid">
              {activeNode.options.map((choice) => (
                <button
                  key={choice.id ?? choice.label}
                  type="button"
                  className="student-route-option"
                  onClick={() => onChoiceSelect(activeNode, choice)}
                >
                  {choice.label}
                </button>
              ))}
            </div>
          ) : null}

          {feedback ? (
            <article className="student-level-scene-tip student-level-scene-tip--mint">
              <div className="student-level-scene-tip__meta">
                <span className="student-level-scene-tip__label">节点反馈</span>
                <span className="student-level-scene-tip__status">继续前进</span>
              </div>
              <p>{feedback}</p>
            </article>
          ) : null}
        </article>
      </div>
    </section>
  );
}

function GuardianStageView({
  config,
  activeStageIndex,
  completedStageIds,
  guardianSequence,
  feedback,
  onDragComplete,
  onTapTarget,
  onMoveSequenceItem,
  onConfirmSequence,
  onSelectStage,
}: {
  config: GuardianChallengeConfig;
  activeStageIndex: number;
  completedStageIds: string[];
  guardianSequence: Record<string, string[]>;
  feedback: string | null;
  onDragComplete: (stageId: string) => void;
  onTapTarget: (stageId: string, target: GuardianTapTarget) => void;
  onMoveSequenceItem: (stageId: string, index: number, direction: -1 | 1) => void;
  onConfirmSequence: (stageId: string) => void;
  onSelectStage: (index: number) => void;
}) {
  const activeStage = config.stages[activeStageIndex] ?? config.stages[0];
  const activeSequenceIds = guardianSequence[activeStage.id] ?? [];
  const activeSequenceItems = (activeStage.sequenceItems ?? [])
    .slice()
    .sort(
      (left, right) =>
        activeSequenceIds.indexOf(left.id) - activeSequenceIds.indexOf(right.id),
    );

  return (
    <section className="student-level-shell student-level-shell--guardian">
      <div className="student-level-shell__top">
        <div>
          <span className="section-block__eyebrow">第三关 · 操作守护</span>
          <h2>{activeStage.title}</h2>
        </div>
        <div className="student-level-shell__stats">
          <span className="surface-tag">
            已完成 {completedStageIds.length} / {config.stages.length}
          </span>
        </div>
      </div>

      <div className="student-guardian-step-row">
        {config.stages.map((stage, index) => {
          const done = completedStageIds.includes(stage.id);
          return (
            <button
              key={stage.id}
              type="button"
              className={
                done
                  ? "student-guardian-step student-guardian-step--done"
                  : index === activeStageIndex
                    ? "student-guardian-step student-guardian-step--active"
                    : "student-guardian-step"
              }
              onClick={() => onSelectStage(index)}
            >
              <div className="student-guardian-step__thumb">
                <img src={stage.sceneImageUrl} alt={stage.title} />
              </div>
              <strong>{stage.stageLabel}</strong>
              <span>{done ? "已完成" : index === activeStageIndex ? "进行中" : "待完成"}</span>
            </button>
          );
        })}
      </div>

      <div className="student-guardian-stage">
        <article className="surface-card student-guardian-stage-card">
          <div className="student-level-panel-heading">
            <div>
              <span className="section-block__eyebrow">当前场景</span>
              <h3>{activeStage.stageLabel}</h3>
            </div>
            <span className="surface-tag">{activeStage.toolLabel}</span>
          </div>
          <div className="student-guardian-stage__scene">
            <div className="student-guardian-stage__photo">
              <img src={activeStage.sceneImageUrl} alt={activeStage.title} />
              {activeStage.taskType === "tap"
                ? activeStage.tapTargets?.map((target) => (
                    <button
                      key={target.id}
                      type="button"
                      className="student-guardian-tap-target"
                      style={{
                        top: `${target.top}%`,
                        left: `${target.left}%`,
                        width: `${target.width}%`,
                        height: `${target.height}%`,
                      }}
                      onClick={() => onTapTarget(activeStage.id, target)}
                    >
                      <span>{target.label}</span>
                    </button>
                  ))
                : null}
              {activeStage.taskType === "drag" && activeStage.targetZone ? (
                <button
                  type="button"
                  className={
                    completedStageIds.includes(activeStage.id)
                      ? "student-guardian-photo-target student-guardian-photo-target--done"
                      : "student-guardian-photo-target"
                  }
                  style={{
                    top: `${activeStage.targetZone.top}%`,
                    left: `${activeStage.targetZone.left}%`,
                    width: `${activeStage.targetZone.width}%`,
                    height: `${activeStage.targetZone.height}%`,
                  }}
                  onClick={() => onDragComplete(activeStage.id)}
                >
                  <span>{activeStage.targetZone.label}</span>
                </button>
              ) : null}
            </div>

            <div className="student-observe-photo-stage__copy">
              <span>任务说明</span>
              <strong>{activeStage.detail}</strong>
              <p>{activeStage.sceneCaption}</p>
            </div>
          </div>
        </article>

        <article className="surface-card student-guardian-tool-card-board">
          <span className="section-block__eyebrow">底部操作区</span>
          <h3>{activeStage.toolHint}</h3>

          {activeStage.taskType === "drag" ? (
            <div className="student-guardian-tool-grid">
              <button
                type="button"
                className={
                  completedStageIds.includes(activeStage.id)
                    ? "student-guardian-tool student-guardian-tool--done"
                    : "student-guardian-tool student-guardian-tool--focus"
                }
                onClick={() => onDragComplete(activeStage.id)}
              >
                <div className="student-guardian-tool__thumb">
                  {activeStage.toolImageUrl ? (
                    <img src={activeStage.toolImageUrl} alt={activeStage.toolLabel} />
                  ) : (
                    <div className="student-guardian-tool__placeholder">安全装备</div>
                  )}
                </div>
                <span className="student-guardian-tool__status">
                  {completedStageIds.includes(activeStage.id) ? "已放置" : "点击完成放置"}
                </span>
                <strong>{activeStage.toolLabel}</strong>
                <span>{activeStage.toolCaption ?? activeStage.actionHint}</span>
              </button>
            </div>
          ) : null}

          {activeStage.taskType === "tap" ? (
            <div className="student-state-choice-grid">
              {(activeStage.tapTargets ?? []).map((target) => (
                <button
                  key={target.id}
                  type="button"
                  className="student-state-choice-card"
                  onClick={() => onTapTarget(activeStage.id, target)}
                >
                  <strong>{target.label}</strong>
                  <span>{target.hint}</span>
                </button>
              ))}
            </div>
          ) : null}

          {activeStage.taskType === "sequence" ? (
            <div className="student-guardian-sequence-board">
              {activeSequenceItems.map((item, index) => (
                <article key={item.id} className="student-guardian-sequence-item">
                  <div>
                    <strong>
                      {index + 1}. {item.label}
                    </strong>
                    <p>把这一步移动到更合适的位置。</p>
                  </div>
                  <div className="button-row">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => onMoveSequenceItem(activeStage.id, index, -1)}
                      disabled={index === 0}
                    >
                      上移
                    </button>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => onMoveSequenceItem(activeStage.id, index, 1)}
                      disabled={index === activeSequenceItems.length - 1}
                    >
                      下移
                    </button>
                  </div>
                </article>
              ))}
              <button
                type="button"
                className="primary-button"
                onClick={() => onConfirmSequence(activeStage.id)}
              >
                确认顺序
              </button>
            </div>
          ) : null}

          {feedback ? (
            <article className="student-level-scene-tip student-level-scene-tip--mint">
              <div className="student-level-scene-tip__meta">
                <span className="student-level-scene-tip__label">场景反馈</span>
                <span className="student-level-scene-tip__status">继续守护</span>
              </div>
              <p>{feedback}</p>
            </article>
          ) : null}
        </article>
      </div>
    </section>
  );
}

export function StudentLevelPage() {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const { replaceProgress, state } = useAppState();
  const resolvedLevelId: LevelId = isLevelId(levelId) ? levelId : "level-1";
  const currentLevel =
    state.progress.levels.find((level) => level.id === resolvedLevelId) ?? null;
  const currentLevelResult = state.progress.levelResults[resolvedLevelId];
  const canUseApi = state.authSource === "api" && Boolean(state.authToken);
  const startRequestRef = useRef<LevelId | null>(null);
  const gameplayMode = getGameplayMode(resolvedLevelId, currentLevel?.gameplayMode);
  const accent = getLevelAccent(resolvedLevelId);
  const observationConfig = currentLevel?.observationConfig ?? levelOneObservationConfig;
  const routeConfig = currentLevel?.routeChallengeConfig ?? null;
  const guardianConfig = currentLevel?.guardianChallengeConfig ?? null;
  const [syncError, setSyncError] = useState("");
  const [isFinishing, setIsFinishing] = useState(false);
  const [completionError, setCompletionError] = useState("");

  const [observationStepIndex, setObservationStepIndex] = useState(0);
  const [completedObservationStepIds, setCompletedObservationStepIds] = useState<string[]>([]);
  const [observationFeedback, setObservationFeedback] = useState(
    observationConfig.taskSteps[0]?.instruction ?? "",
  );
  const [activeObservationTargetId, setActiveObservationTargetId] = useState<string | null>(
    null,
  );
  const [selectedObservationChoiceId, setSelectedObservationChoiceId] = useState<string | null>(
    null,
  );
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [observationMistakes, setObservationMistakes] = useState(0);

  const [routeIndex, setRouteIndex] = useState(0);
  const [routeSafety, setRouteSafety] = useState(3);
  const [routeFeedback, setRouteFeedback] = useState<string | null>(null);
  const [routeDecisions, setRouteDecisions] = useState<RouteDecisionLog[]>([]);

  const [guardianStageIndex, setGuardianStageIndex] = useState(0);
  const [completedGuardianStageIds, setCompletedGuardianStageIds] = useState<string[]>([]);
  const [guardianFeedback, setGuardianFeedback] = useState<string | null>(null);
  const [guardianSequence, setGuardianSequence] = useState<Record<string, string[]>>({});
  const [guardianMistakes, setGuardianMistakes] = useState(0);

  const activeObservationStep =
    observationConfig.taskSteps[
      Math.min(observationStepIndex, observationConfig.taskSteps.length - 1)
    ] ?? observationConfig.taskSteps[0];
  const activeRouteNode = routeConfig?.nodes[routeIndex] ?? null;
  const currentTaskCount =
    gameplayMode === "observation"
      ? observationConfig.taskSteps.length
      : gameplayMode === "route"
        ? routeConfig?.nodes.length ?? 0
        : guardianConfig?.stages.length ?? 0;
  const completedTaskCount =
    gameplayMode === "observation"
      ? completedObservationStepIds.length
      : gameplayMode === "route"
        ? routeDecisions.length
        : completedGuardianStageIds.length;
  const progressValue =
    currentTaskCount > 0 ? Math.round((completedTaskCount / currentTaskCount) * 100) : 0;
  const resultRoute = `/student/theme/road-safety/level/${resolvedLevelId}/result`;

  useEffect(() => {
    if (!currentLevel || !canUseApi || !state.authToken) {
      return;
    }

    if (startRequestRef.current === resolvedLevelId) {
      return;
    }

    startRequestRef.current = resolvedLevelId;
    setSyncError("");

    void startStudentLevel(state.authToken, resolvedLevelId)
      .then((progress) => {
        replaceProgress(progress);
      })
      .catch((error) => {
        setSyncError(
          error instanceof ApiError
            ? error.message
            : "关卡状态同步失败，但你仍然可以继续浏览当前页面。",
        );
      });
  }, [canUseApi, currentLevel, replaceProgress, resolvedLevelId, state.authToken]);

  useEffect(() => {
    setCompletionError("");
    setObservationStepIndex(0);
    setCompletedObservationStepIds([]);
    setObservationFeedback(observationConfig.taskSteps[0]?.instruction ?? "");
    setActiveObservationTargetId(null);
    setSelectedObservationChoiceId(null);
    setSelectedStickerId(null);
    setObservationMistakes(0);
    setRouteIndex(0);
    setRouteSafety(3);
    setRouteFeedback(null);
    setRouteDecisions([]);
    setGuardianStageIndex(0);
    setCompletedGuardianStageIds([]);
    setGuardianFeedback(null);
    setGuardianMistakes(0);
    setGuardianSequence(
      (guardianConfig?.stages ?? []).reduce<Record<string, string[]>>((map, stage) => {
        map[stage.id] = buildGuardianSequence(stage);
        return map;
      }, {}),
    );
  }, [guardianConfig?.stages, observationConfig.taskSteps, resolvedLevelId]);

  const levelHintPrompt = useMemo(() => {
    if (gameplayMode === "observation") {
      return `我正在做第一关“${currentLevel?.title ?? "城市交通观察员"}”，当前任务是“${activeObservationStep?.title ?? "观察路口"}”，请提醒我这一小步最该先看什么。`;
    }

    if (gameplayMode === "route") {
      return `我正在做第二关“${currentLevel?.title ?? "放学回家路线挑战"}”，已经完成 ${routeDecisions.length} 个节点，当前安全值是 ${routeSafety}，请提醒我这一站最应该注意什么。`;
    }

    return `我正在做第三关“${currentLevel?.title ?? "安全出行守护任务"}”，已经完成 ${completedGuardianStageIds.length} 个守护子任务，请提醒我当前场景的关键安全动作。`;
  }, [
    activeObservationStep?.title,
    completedGuardianStageIds.length,
    currentLevel?.title,
    gameplayMode,
    routeDecisions.length,
    routeSafety,
  ]);

  const {
    isLoading: isHintLoading,
    message: hintMessage,
    notice: hintNotice,
    refresh: refreshHint,
  } = useStudentAiScene({
    prompt: levelHintPrompt,
    scene: "hint",
    levelId: resolvedLevelId,
    fallbackText:
      gameplayMode === "observation"
        ? activeObservationStep?.aiHint ?? "先看清场景，再开始行动。"
        : gameplayMode === "route"
          ? activeRouteNode?.hint ?? "先观察来车和视线，再做选择。"
          : guardianConfig?.stages[guardianStageIndex]?.toolHint ??
            "先把安全动作做完整，再准备出发。",
  });

  function moveObservationStepForward() {
    setObservationStepIndex((current) =>
      Math.min(current + 1, observationConfig.taskSteps.length - 1),
    );
    setSelectedObservationChoiceId(null);
    setSelectedStickerId(null);
  }

  function completeObservationStep(step: ObservationTaskStep, focusId?: string) {
    setCompletedObservationStepIds((current) =>
      current.includes(step.id) ? current : [...current, step.id],
    );
    setObservationFeedback(step.successCopy);
    setActiveObservationTargetId(focusId ?? step.targetIds[0] ?? null);

    if (step.id !== observationConfig.taskSteps[observationConfig.taskSteps.length - 1]?.id) {
      window.setTimeout(() => {
        moveObservationStepForward();
      }, 240);
    }
  }

  function handleObservationMistake(message: string, focusId?: string) {
    setObservationMistakes((current) => current + 1);
    setObservationFeedback(message);
    setActiveObservationTargetId(focusId ?? null);
  }

  function handleObservationTargetClick(targetId: string) {
    if (!activeObservationStep) {
      return;
    }

    setActiveObservationTargetId(targetId);

    if (activeObservationStep.interactionType === "state_judge") {
      setObservationFeedback("先结合下方选项做判断，再决定现在能不能行动。");
      return;
    }

    if (activeObservationStep.interactionType === "drag_marker") {
      if (!selectedStickerId || selectedStickerId !== activeObservationStep.stickerId) {
        handleObservationMistake("先在左侧选中正确的安全贴纸，再贴到目标位置。", targetId);
        return;
      }

      if (activeObservationStep.targetIds.includes(targetId)) {
        const marker = observationConfig.observationScene.dragMarkers.find(
          (item) => item.id === selectedStickerId,
        );
        completeObservationStep(activeObservationStep, targetId);
        if (marker?.successCopy) {
          setObservationFeedback(marker.successCopy);
        }
        return;
      }

      handleObservationMistake(activeObservationStep.errorCopy, targetId);
      return;
    }

    if (activeObservationStep.targetIds.includes(targetId)) {
      completeObservationStep(activeObservationStep, targetId);
      return;
    }

    handleObservationMistake(activeObservationStep.errorCopy, targetId);
  }

  function handleObservationChoiceClick(choice: ObservationTaskChoice) {
    if (!activeObservationStep) {
      return;
    }

    setSelectedObservationChoiceId(choice.id);

    if (choice.safe) {
      completeObservationStep(activeObservationStep, activeObservationStep.targetIds[0]);
      setObservationFeedback(choice.feedback);
      return;
    }

    handleObservationMistake(choice.feedback, activeObservationStep.targetIds[0]);
  }

  function handleRouteChoiceSelect(node: RouteChallengeNode, choice: RouteChallengeChoice) {
    if (routeDecisions.some((item) => item.nodeId === node.id)) {
      return;
    }

    const safetyDelta = choice.safetyDelta ?? (choice.safe ? 0 : -1);
    const nextSafety = Math.max(0, routeSafety + safetyDelta);
    const nextLog: RouteDecisionLog = {
      nodeId: node.id,
      nodeTitle: node.title,
      selectedLabel: choice.label,
      safe: choice.safe,
      feedback: choice.feedback,
      safetyDelta,
    };

    setRouteSafety(nextSafety);
    setRouteFeedback(choice.feedback);
    setRouteDecisions((current) => [...current, nextLog]);
    setRouteIndex((current) => Math.min(current + 1, (routeConfig?.nodes.length ?? 1) - 1));
  }

  function completeGuardianStage(stage: GuardianChallengeStage, feedback: string) {
    setCompletedGuardianStageIds((current) =>
      current.includes(stage.id) ? current : [...current, stage.id],
    );
    setGuardianFeedback(feedback);

    const nextIndex = (guardianConfig?.stages ?? []).findIndex(
      (item) => !completedGuardianStageIds.includes(item.id) && item.id !== stage.id,
    );

    if (nextIndex >= 0) {
      setGuardianStageIndex(nextIndex);
    }
  }

  function handleGuardianDragComplete(stageId: string) {
    const stage = guardianConfig?.stages.find((item) => item.id === stageId);

    if (!stage) {
      return;
    }

    completeGuardianStage(stage, stage.successText);
  }

  function handleGuardianTapTarget(stageId: string, target: GuardianTapTarget) {
    const stage = guardianConfig?.stages.find((item) => item.id === stageId);

    if (!stage) {
      return;
    }

    if (target.correct) {
      completeGuardianStage(stage, target.feedback);
      return;
    }

    setGuardianMistakes((current) => current + 1);
    setGuardianFeedback(target.feedback);
  }

  function handleGuardianSequenceMove(
    stageId: string,
    index: number,
    direction: -1 | 1,
  ) {
    setGuardianSequence((current) => ({
      ...current,
      [stageId]: moveItem(current[stageId] ?? [], index, direction),
    }));
  }

  function handleGuardianSequenceConfirm(stageId: string) {
    const stage = guardianConfig?.stages.find((item) => item.id === stageId);

    if (!stage || !stage.sequenceItems) {
      return;
    }

    const currentOrder = guardianSequence[stageId] ?? [];
    const isCorrect = stage.sequenceItems.every(
      (item, index) => currentOrder[index] === item.id,
    );

    if (isCorrect) {
      completeGuardianStage(stage, stage.successText);
      return;
    }

    setGuardianMistakes((current) => current + 1);
    setGuardianFeedback("顺序还可以再想一想，先把保护动作排在最前面。");
  }

  const completionReady =
    gameplayMode === "observation"
      ? completedObservationStepIds.length === observationConfig.taskSteps.length
      : gameplayMode === "route"
        ? routeDecisions.length === (routeConfig?.nodes.length ?? 0)
        : completedGuardianStageIds.length === (guardianConfig?.stages.length ?? 0);

  async function finishLevel() {
    if (!currentLevel || !canUseApi || !state.authToken || !completionReady) {
      return;
    }

    setCompletionError("");
    setIsFinishing(true);

    try {
      const payload =
        gameplayMode === "observation"
          ? buildObservationPayload(resolvedLevelId, observationConfig, observationMistakes)
          : gameplayMode === "route" && routeConfig
            ? buildRoutePayload(routeConfig, routeDecisions, routeSafety)
            : guardianConfig
              ? buildGuardianPayload(guardianConfig, guardianMistakes)
              : null;

      if (!payload) {
        throw new Error("当前关卡配置不完整，无法完成结算。");
      }

      const response = await completeStudentLevel(state.authToken, resolvedLevelId, payload);
      replaceProgress(response.progress);
      navigate(resultRoute);
    } catch (error) {
      setCompletionError(
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "关卡结算失败，请稍后再试。",
      );
    } finally {
      setIsFinishing(false);
    }
  }

  if (!currentLevel) {
    return (
      <section className="surface-card empty-state-card">
        <span className="section-block__eyebrow">关卡加载</span>
        <h2>没有找到对应的关卡</h2>
        <button
          type="button"
          className="primary-button"
          onClick={() => navigate("/student/theme/road-safety")}
        >
          返回主题页
        </button>
      </section>
    );
  }

  if (currentLevel.status === "locked") {
    return (
      <section className="surface-card empty-state-card">
        <span className="section-block__eyebrow">关卡未解锁</span>
        <h2>请先完成前一关，再进入当前挑战</h2>
        <button
          type="button"
          className="primary-button"
          onClick={() => navigate("/student/theme/road-safety")}
        >
          返回主题页
        </button>
      </section>
    );
  }

  return (
    <div className="page-stack student-page student-page--level">
      <StudentAdventureHero
        eyebrow={
          gameplayMode === "observation"
            ? "第一关 · 观察识别"
            : gameplayMode === "route"
              ? "第二关 · 路线判断"
              : "第三关 · 操作守护"
        }
        title={currentLevel.title}
        description={currentLevel.description}
        bubbleTitle="AI 提醒"
        bubbleText={isHintLoading ? "正在整理当前关卡提示..." : hintMessage}
        mascotLabel={String(Math.min(completedTaskCount + 1, currentTaskCount || 1))}
        mascotHint={hintNotice}
        accent={accent}
        variant="level"
        stats={[
          { label: "当前进度", value: `${completedTaskCount} / ${currentTaskCount}`, accent },
          { label: "预计时长", value: currentLevel.duration, accent: "mint" },
          {
            label: "当前状态",
            value: currentLevelResult ? "可重新挑战" : "进行中",
            accent: "orange",
          },
        ]}
        actions={
          <>
            <button
              type="button"
              className="ghost-button"
              onClick={() => navigate("/student/theme/road-safety")}
            >
              返回主题页
            </button>
            {currentLevelResult ? (
              <button
                type="button"
                className="ghost-button"
                onClick={() => navigate(resultRoute)}
              >
                查看上次结算
              </button>
            ) : null}
          </>
        }
      />

      {syncError ? (
        <article className="feedback-box">
          <strong>同步提醒</strong>
          <p>{syncError}</p>
        </article>
      ) : null}

      {completionError ? (
        <article className="feedback-box">
          <strong>结算失败</strong>
          <p>{completionError}</p>
        </article>
      ) : null}

      {gameplayMode === "observation" ? (
        <ObservationStage
          config={observationConfig}
          activeStep={activeObservationStep}
          completedStepIds={completedObservationStepIds}
          feedback={observationFeedback}
          progressValue={progressValue}
          activeTargetId={activeObservationTargetId}
          selectedStickerId={selectedStickerId}
          selectedChoiceId={selectedObservationChoiceId}
          onTargetClick={handleObservationTargetClick}
          onChoiceClick={handleObservationChoiceClick}
          onStickerSelect={(marker) => setSelectedStickerId(marker.id)}
        />
      ) : null}

      {gameplayMode === "route" && routeConfig ? (
        <RouteStage
          config={routeConfig}
          routeIndex={routeIndex}
          routeSafety={routeSafety}
          decisions={routeDecisions}
          feedback={routeFeedback}
          onChoiceSelect={handleRouteChoiceSelect}
        />
      ) : null}

      {gameplayMode === "guardian" && guardianConfig ? (
        <GuardianStageView
          config={guardianConfig}
          activeStageIndex={guardianStageIndex}
          completedStageIds={completedGuardianStageIds}
          guardianSequence={guardianSequence}
          feedback={guardianFeedback}
          onDragComplete={handleGuardianDragComplete}
          onTapTarget={handleGuardianTapTarget}
          onMoveSequenceItem={handleGuardianSequenceMove}
          onConfirmSequence={handleGuardianSequenceConfirm}
          onSelectStage={setGuardianStageIndex}
        />
      ) : null}

      <section className="student-card-grid student-card-grid--two">
        <article className="surface-card student-level-rule-card">
          <span className="section-block__eyebrow">玩法规则</span>
          <h2>
            {gameplayMode === "observation"
              ? "先观察，再判断"
              : gameplayMode === "route"
                ? "先停下，再决策"
                : "先准备，再出发"}
          </h2>
          <div className="student-level-mini-rules">
            <article className="student-level-mini-rules__card">
              <strong>本关目标</strong>
              <p>{currentLevel.focus}</p>
            </article>
            <article className="student-level-mini-rules__card">
              <strong>完成后获得</strong>
              <p>
                {gameplayMode === "observation"
                  ? "观察识别徽章与本关结算页"
                  : gameplayMode === "route"
                    ? "路线判断徽章与本关结算页"
                    : "出行守护徽章与主题考试解锁机会"}
              </p>
            </article>
          </div>
        </article>

        <StudentMascotBubble
          eyebrow="结算准备"
          title={completionReady ? "可以进入独立结算页了" : "先完成当前关卡任务"}
          message={
            completionReady
              ? "完成本关后会进入独立结算页，你也可以在之后重新挑战。"
              : "所有关键任务完成后，结算按钮才会亮起。"
          }
          accent={accent}
          notice={
            currentLevelResult
              ? "这是一关已完成后的重新挑战，不会重复发放首次奖励。"
              : "首次通关会推动下一关或考试解锁。"
          }
          actions={
            <>
              <button
                type="button"
                className="ghost-button"
                onClick={() => void refreshHint()}
                disabled={isHintLoading}
              >
                {isHintLoading ? "刷新中..." : "换一条提示"}
              </button>
              <button
                type="button"
                className="primary-button primary-button--playful"
                disabled={!completionReady || isFinishing}
                onClick={() => {
                  void finishLevel();
                }}
              >
                {isFinishing ? "结算中..." : "完成本关并进入结算"}
              </button>
            </>
          }
        />
      </section>

      <section className="surface-card student-level-replay-card">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">重新挑战</span>
            <h2>已完成关卡也可以随时再练一遍</h2>
          </div>
          <span className="surface-tag">
            {currentLevelResult ? "本关已完成" : "本关尚未首次通关"}
          </span>
        </div>
        <p>
          重玩会刷新本关展示成绩和结算页内容，但不会重复发放首次通关奖励，也不会回退已经解锁的下一关或主题考试。
        </p>
        <div className="button-row">
          <button
            type="button"
            className="ghost-button"
            onClick={() => navigate("/student/theme/road-safety")}
          >
            返回主题页
          </button>
          {currentLevelResult ? (
            <button
              type="button"
              className="primary-button"
              onClick={() => window.location.reload()}
            >
              重新挑战本关
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
