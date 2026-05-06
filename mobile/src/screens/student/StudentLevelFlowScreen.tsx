import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { completeStudentLevel, fetchStudentProgress, startStudentLevel } from "@/api/student";
import { AppButton } from "@/components/common/AppButton";
import { AppCard } from "@/components/common/AppCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateViews";
import { Screen } from "@/components/common/Screen";
import { appColors, spacing } from "@/constants/appTheme";
import { useAuth } from "@/store/authStore";
import type {
  GuardianChallengeStage,
  LevelCompletionPayload,
  LevelId,
  LevelProgress,
  ObservationTaskStep,
  RouteChallengeChoice,
  StudentProgress,
} from "@/types/contracts";
import { getErrorMessage } from "@/utils/errors";

const resultCopy: Record<
  LevelId,
  Omit<LevelCompletionPayload, "score" | "stars">
> = {
  "level-1": {
    highlight: "你已经会先找斑马线、再看路牌和红绿灯，还能认出危险动作了。",
    caution: "看到绿灯也要继续看车，别着急往前冲。",
    aiSummary: "恭喜成为城市交通观察员。你已经学会先观察、再判断、最后行动。",
    keySafetyPoints: ["先找斑马线", "同时观察信号灯和车辆", "主动识别危险动作"],
    cautionPoints: ["不要只盯着绿灯", "不要翻越护栏或抢跑"],
    rewardIcon: "★",
    rewardLabel: "观察员徽章 + 40 积分",
  },
  "level-2": {
    highlight: "你能在关键路口保持冷静，做出比较稳妥的路线判断。",
    caution: "记得看到绿灯也要继续观察车辆和盲区。",
    aiSummary: "路线判断完成。每到一个节点先停一停、看一看，再做选择。",
    keySafetyPoints: ["每到节点先停一停", "绿灯也要继续看车", "主动绕开公交车盲区"],
    cautionPoints: ["不要为了抄近路忽略规则", "越接近终点越不能放松"],
    rewardIcon: "★",
    rewardLabel: "路线先锋徽章 + 40 积分",
  },
  "level-3": {
    highlight: "你已经会在不同乘车场景里补齐关键防护动作了。",
    caution: "出发前先准备好，再行动，安全就会更稳。",
    aiSummary: "把防护动作变成习惯，才是真正的安全守护达人。",
    keySafetyPoints: ["候车站在安全线后", "上车先系安全带", "乘坐电动车先戴头盔"],
    cautionPoints: ["别急着出发", "先完成安全装备和步骤检查"],
    rewardIcon: "★",
    rewardLabel: "守护达人徽章 + 40 积分",
  },
};

function isLevelId(value: unknown): value is LevelId {
  return value === "level-1" || value === "level-2" || value === "level-3";
}

function getObservationStars(mistakes: number) {
  if (mistakes <= 1) return 3;
  if (mistakes <= 3) return 2;
  return 1;
}

function buildPayload(levelId: LevelId, score: number, stars: number): LevelCompletionPayload {
  return {
    ...resultCopy[levelId],
    score,
    stars,
  };
}

function getLevelTaskCount(level: LevelProgress) {
  if (level.gameplayMode === "route") return level.routeChallengeConfig?.nodes.length ?? 0;
  if (level.gameplayMode === "guardian") return level.guardianChallengeConfig?.stages.length ?? 0;
  return level.observationConfig?.taskSteps.length ?? 0;
}

export function StudentLevelFlowScreen() {
  const { levelId } = useLocalSearchParams<{ levelId?: string }>();
  const { session } = useAuth();
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [observationIndex, setObservationIndex] = useState(0);
  const [observationDoneIds, setObservationDoneIds] = useState<string[]>([]);
  const [observationMistakes, setObservationMistakes] = useState(0);
  const [observationFeedback, setObservationFeedback] = useState("先读任务，再点选你认为正确的安全线索。");

  const [routeIndex, setRouteIndex] = useState(0);
  const [routeSafety, setRouteSafety] = useState(3);
  const [routeCompletedIds, setRouteCompletedIds] = useState<string[]>([]);
  const [routeFeedback, setRouteFeedback] = useState("每到一个节点，先停一停、看一看，再做决定。");

  const [guardianIndex, setGuardianIndex] = useState(0);
  const [guardianDoneIds, setGuardianDoneIds] = useState<string[]>([]);
  const [guardianMistakes, setGuardianMistakes] = useState(0);
  const [guardianSequence, setGuardianSequence] = useState<string[]>([]);
  const [guardianFeedback, setGuardianFeedback] = useState("根据当前场景，完成最重要的安全动作。");

  const resolvedLevelId = isLevelId(levelId) ? levelId : null;

  const load = useCallback(async () => {
    if (!session?.token) return;

    setLoading(true);
    setError(null);
    try {
      setProgress(await fetchStudentProgress(session.token));
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [session?.token]);

  useEffect(() => {
    load();
  }, [load]);

  const level = useMemo(
    () => progress?.levels.find((item) => item.id === resolvedLevelId) ?? null,
    [progress?.levels, resolvedLevelId],
  );
  const levelIdFromProgress = level?.id;
  const levelStatus = level?.status;

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (!session?.token || !levelIdFromProgress || !resolvedLevelId) return;
      if (levelStatus === "locked") {
        setStarting(false);
        return;
      }

      setStarting(true);
      try {
        const nextProgress = await startStudentLevel(session.token, resolvedLevelId);
        if (!cancelled) {
          setProgress(nextProgress);
        }
      } catch (startError) {
        if (!cancelled) {
          setError(getErrorMessage(startError));
        }
      } finally {
        if (!cancelled) {
          setStarting(false);
        }
      }
    }

    start();

    return () => {
      cancelled = true;
    };
  }, [levelIdFromProgress, levelStatus, resolvedLevelId, session?.token]);

  const taskCount = level ? getLevelTaskCount(level) : 0;
  const completedCount =
    level?.gameplayMode === "route"
      ? routeCompletedIds.length
      : level?.gameplayMode === "guardian"
        ? guardianDoneIds.length
        : observationDoneIds.length;
  const readyToFinish = taskCount > 0 && completedCount >= taskCount;

  const completeLevel = useCallback(
    async (payload: LevelCompletionPayload) => {
      if (!session?.token || !resolvedLevelId) return;

      setFinishing(true);
      try {
        await completeStudentLevel(session.token, resolvedLevelId, payload);
        router.replace(`/student/level-result?levelId=${resolvedLevelId}`);
      } catch (finishError) {
        Alert.alert("结算失败", getErrorMessage(finishError));
      } finally {
        setFinishing(false);
      }
    },
    [resolvedLevelId, session?.token],
  );

  if (!resolvedLevelId) {
    return <EmptyState title="关卡不存在" description="没有找到对应的关卡 ID。" />;
  }
  if (loading || starting) return <LoadingState label="正在进入关卡..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!progress || !level) {
    return <EmptyState title="暂无关卡数据" description="请返回主题详情后重新进入。" />;
  }
  if (level.status === "locked") {
    return (
      <EmptyState
        title="当前关卡未解锁"
        description="请先完成前一关，再回来挑战这一关。"
        actionLabel="返回主题详情"
        onAction={() => router.replace("/student/subject-detail")}
      />
    );
  }

  return (
    <Screen bottomNavActive="learning" showBackButton backTo={`/student/level-intro?levelId=${level.id}`} title={level.title} subtitle={`${completedCount}/${taskCount || 1} 个任务已完成`}>
      <AppCard>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>{level.focus}</Text>
          <Text style={styles.progressText}>{Math.round((completedCount / Math.max(1, taskCount)) * 100)}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${(completedCount / Math.max(1, taskCount)) * 100}%` }]} />
        </View>
        <Text style={styles.description}>{level.description}</Text>
      </AppCard>

      {level.gameplayMode === "route" ? (
        <RouteChallenge
          level={level}
          completedIds={routeCompletedIds}
          feedback={routeFeedback}
          index={routeIndex}
          safety={routeSafety}
          onChoose={(nodeId, choice) => {
            const nextSafety = Math.max(0, Math.min(3, routeSafety + choice.safetyDelta));
            setRouteSafety(nextSafety);
            setRouteFeedback(choice.feedback);
            setRouteCompletedIds((current) => (current.includes(nodeId) ? current : [...current, nodeId]));
          }}
          onNext={() => {
            setRouteIndex((current) => Math.min(current + 1, (level.routeChallengeConfig?.nodes.length ?? 1) - 1));
            setRouteFeedback("继续下一站，先观察再选择。");
          }}
          onFinish={() => {
            const scoreMap: Record<number, number> = { 3: 100, 2: 88, 1: 76, 0: 60 };
            const stars = routeSafety >= 3 ? 3 : routeSafety === 2 ? 2 : 1;
            completeLevel(buildPayload(level.id, scoreMap[routeSafety] ?? 60, stars));
          }}
          readyToFinish={readyToFinish}
          finishing={finishing}
        />
      ) : level.gameplayMode === "guardian" ? (
        <GuardianChallenge
          level={level}
          completedIds={guardianDoneIds}
          feedback={guardianFeedback}
          index={guardianIndex}
          sequence={guardianSequence}
          onWrong={(message) => {
            setGuardianMistakes((current) => current + 1);
            setGuardianFeedback(message);
          }}
          onCompleteStage={(stage) => {
            setGuardianFeedback(stage.successText);
            setGuardianDoneIds((current) => (current.includes(stage.id) ? current : [...current, stage.id]));
            setGuardianSequence([]);
          }}
          onSelectSequence={(id) => setGuardianSequence((current) => (current.includes(id) ? current : [...current, id]))}
          onResetSequence={() => setGuardianSequence([])}
          onNext={() => {
            setGuardianIndex((current) => Math.min(current + 1, (level.guardianChallengeConfig?.stages.length ?? 1) - 1));
            setGuardianSequence([]);
            setGuardianFeedback("进入下一段守护任务。");
          }}
          onFinish={() => {
            const stars = guardianMistakes === 0 ? 3 : guardianMistakes <= 2 ? 2 : 1;
            const score = Math.max(82, 100 - guardianMistakes * 6);
            completeLevel(buildPayload(level.id, score, stars));
          }}
          readyToFinish={readyToFinish}
          finishing={finishing}
        />
      ) : (
        <ObservationChallenge
          level={level}
          completedIds={observationDoneIds}
          feedback={observationFeedback}
          index={observationIndex}
          onCorrect={(step) => {
            setObservationFeedback(step.successCopy);
            setObservationDoneIds((current) => (current.includes(step.id) ? current : [...current, step.id]));
          }}
          onWrong={(step) => {
            setObservationMistakes((current) => current + 1);
            setObservationFeedback(step.errorCopy);
          }}
          onNext={() => {
            setObservationIndex((current) => Math.min(current + 1, (level.observationConfig?.taskSteps.length ?? 1) - 1));
            setObservationFeedback("继续观察下一步安全线索。");
          }}
          onFinish={() => {
            const stars = getObservationStars(observationMistakes);
            const score = Math.max(78, 100 - observationMistakes * 4);
            completeLevel(buildPayload(level.id, score, stars));
          }}
          readyToFinish={readyToFinish}
          finishing={finishing}
        />
      )}
    </Screen>
  );
}

function ObservationChallenge({
  level,
  completedIds,
  feedback,
  index,
  onCorrect,
  onWrong,
  onNext,
  onFinish,
  readyToFinish,
  finishing,
}: {
  level: LevelProgress;
  completedIds: string[];
  feedback: string;
  index: number;
  onCorrect: (step: ObservationTaskStep) => void;
  onWrong: (step: ObservationTaskStep) => void;
  onNext: () => void;
  onFinish: () => void;
  readyToFinish: boolean;
  finishing: boolean;
}) {
  const config = level.observationConfig;
  const step = config?.taskSteps[index];
  const stepDone = step ? completedIds.includes(step.id) : false;

  if (!config || !step) {
    return <EmptyState title="暂无观察任务" description="当前关卡缺少观察配置。" />;
  }

  const options = buildObservationOptions(config, step);

  return (
    <AppCard>
      <Text style={styles.sectionTitle}>{step.title}</Text>
      <Text style={styles.description}>{step.instruction}</Text>
      <Text style={styles.notice}>{feedback}</Text>
      <View style={styles.optionList}>
        {options.map((option) => (
          <ChoiceButton
            key={option.id}
            disabled={stepDone}
            label={option.label}
            onPress={() => {
              if (option.correct) onCorrect(step);
              else onWrong(step);
            }}
          />
        ))}
      </View>
      <FlowActions
        canGoNext={stepDone && index < config.taskSteps.length - 1}
        canFinish={readyToFinish}
        finishing={finishing}
        onNext={onNext}
        onFinish={onFinish}
      />
    </AppCard>
  );
}

function buildObservationOptions(
  config: NonNullable<LevelProgress["observationConfig"]>,
  step: ObservationTaskStep,
) {
  if (step.interactionType === "state_judge" && step.choices) {
    return step.choices.map((choice) => ({
      id: choice.id,
      label: choice.label,
      correct: choice.safe,
    }));
  }

  const targets = [
    ...config.observationScene.targets,
    ...config.observationScene.dangerMarkers,
    ...config.observationScene.dragMarkers,
  ];
  const correct = targets
    .filter((target) => {
      const referenceId = "targetId" in target ? String(target.targetId) : target.id;
      return step.targetIds.includes(referenceId) || step.targetIds.includes(target.id);
    })
    .map((target) => ({
      id: target.id,
      label: step.interactionType === "drag_marker" ? `把${target.label}放到正确观察点` : target.label,
      correct: true,
    }));
  const decoys = targets
    .filter((target) => !correct.some((item) => item.id === target.id))
    .slice(0, 2)
    .map((target) => ({
      id: `decoy-${target.id}`,
      label: target.label,
      correct: false,
    }));

  return [...correct, ...decoys];
}

function RouteChallenge({
  level,
  completedIds,
  feedback,
  index,
  safety,
  onChoose,
  onNext,
  onFinish,
  readyToFinish,
  finishing,
}: {
  level: LevelProgress;
  completedIds: string[];
  feedback: string;
  index: number;
  safety: number;
  onChoose: (nodeId: string, choice: RouteChallengeChoice) => void;
  onNext: () => void;
  onFinish: () => void;
  readyToFinish: boolean;
  finishing: boolean;
}) {
  const config = level.routeChallengeConfig;
  const node = config?.nodes[index];
  const nodeDone = node ? completedIds.includes(node.id) : false;

  if (!config || !node) {
    return <EmptyState title="暂无路线任务" description="当前关卡缺少路线配置。" />;
  }

  return (
    <AppCard>
      <Text style={styles.sectionTitle}>{node.title}</Text>
      <Text style={styles.description}>{node.scenario}</Text>
      <Text style={styles.notice}>安全值：{safety}/3 · {feedback}</Text>
      <View style={styles.routeLine}>
        {config.nodes.map((item) => (
          <View key={item.id} style={[styles.routeNode, completedIds.includes(item.id) && styles.routeNodeDone]}>
            <Text style={styles.routeNodeText}>{item.mapLabel}</Text>
          </View>
        ))}
      </View>
      <View style={styles.optionList}>
        {node.options.map((choice) => (
          <ChoiceButton
            key={choice.id}
            disabled={nodeDone}
            label={choice.label}
            onPress={() => onChoose(node.id, choice)}
          />
        ))}
      </View>
      <FlowActions
        canGoNext={nodeDone && index < config.nodes.length - 1}
        canFinish={readyToFinish}
        finishing={finishing}
        onNext={onNext}
        onFinish={onFinish}
      />
    </AppCard>
  );
}

function GuardianChallenge({
  level,
  completedIds,
  feedback,
  index,
  sequence,
  onWrong,
  onCompleteStage,
  onSelectSequence,
  onResetSequence,
  onNext,
  onFinish,
  readyToFinish,
  finishing,
}: {
  level: LevelProgress;
  completedIds: string[];
  feedback: string;
  index: number;
  sequence: string[];
  onWrong: (message: string) => void;
  onCompleteStage: (stage: GuardianChallengeStage) => void;
  onSelectSequence: (id: string) => void;
  onResetSequence: () => void;
  onNext: () => void;
  onFinish: () => void;
  readyToFinish: boolean;
  finishing: boolean;
}) {
  const config = level.guardianChallengeConfig;
  const stage = config?.stages[index];
  const stageDone = stage ? completedIds.includes(stage.id) : false;

  if (!config || !stage) {
    return <EmptyState title="暂无守护任务" description="当前关卡缺少守护配置。" />;
  }

  const currentStage = stage;

  function validateSequence() {
    const items = currentStage.sequenceItems ?? [];
    const expected = [...items].sort((left, right) => left.expectedOrder - right.expectedOrder).map((item) => item.id);
    const correct = expected.every((item, itemIndex) => sequence[itemIndex] === item);

    if (correct) {
      onCompleteStage(currentStage);
    } else {
      onWrong("顺序还不对，先想一想出发前最先要做什么。");
      onResetSequence();
    }
  }

  return (
    <AppCard>
      <Text style={styles.sectionTitle}>{currentStage.title}</Text>
      <Text style={styles.description}>{currentStage.detail}</Text>
      <Text style={styles.notice}>{feedback}</Text>

      {currentStage.taskType === "tap" ? (
        <View style={styles.optionList}>
          {(currentStage.tapTargets ?? []).map((target) => (
            <ChoiceButton
              key={target.id}
              disabled={stageDone}
              label={target.label}
              onPress={() => {
                if (target.correct) onCompleteStage(currentStage);
                else onWrong(target.feedback || target.hint);
              }}
            />
          ))}
        </View>
      ) : currentStage.taskType === "sequence" ? (
        <View style={styles.optionList}>
          <Text style={styles.description}>已选择顺序：{sequence.length ? sequence.join(" -> ") : "还未选择"}</Text>
          {(currentStage.sequenceItems ?? []).map((item) => (
            <ChoiceButton
              key={item.id}
              disabled={stageDone || sequence.includes(item.id)}
              label={item.label}
              onPress={() => onSelectSequence(item.id)}
            />
          ))}
          <AppButton
            title="检查顺序"
            disabled={stageDone || sequence.length !== (currentStage.sequenceItems?.length ?? 0)}
            onPress={validateSequence}
          />
        </View>
      ) : (
        <View style={styles.optionList}>
          <ChoiceButton
            disabled={stageDone}
            label={`${currentStage.toolLabel} -> ${currentStage.stageLabel}`}
            onPress={() => onCompleteStage(currentStage)}
          />
        </View>
      )}

      <FlowActions
        canGoNext={stageDone && index < config.stages.length - 1}
        canFinish={readyToFinish}
        finishing={finishing}
        onNext={onNext}
        onFinish={onFinish}
      />
    </AppCard>
  );
}

function ChoiceButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.choice, pressed && styles.choicePressed, disabled && styles.choiceDisabled]}>
      <Text style={styles.choiceText}>{label}</Text>
    </Pressable>
  );
}

function FlowActions({
  canGoNext,
  canFinish,
  finishing,
  onNext,
  onFinish,
}: {
  canGoNext: boolean;
  canFinish: boolean;
  finishing: boolean;
  onNext: () => void;
  onFinish: () => void;
}) {
  return (
    <View style={styles.actionRow}>
      {canGoNext ? (
        <AppButton title="下一步" onPress={onNext} style={styles.actionButton} />
      ) : (
        <AppButton title="继续完成任务" disabled variant="secondary" style={styles.actionButton} />
      )}
      <AppButton
        title="完成本关"
        loading={finishing}
        disabled={!canFinish}
        onPress={onFinish}
        style={styles.actionButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressText: {
    color: appColors.textMuted,
    fontSize: 13,
    fontWeight: "800",
  },
  progressTrack: {
    backgroundColor: appColors.surfaceSoft,
    borderRadius: 999,
    height: 10,
    overflow: "hidden",
  },
  progressBar: {
    backgroundColor: appColors.primary,
    borderRadius: 999,
    height: "100%",
  },
  description: {
    color: appColors.textMuted,
    fontSize: 15,
    lineHeight: 23,
  },
  sectionTitle: {
    color: appColors.text,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 30,
  },
  notice: {
    backgroundColor: appColors.surfaceSoft,
    borderRadius: 18,
    color: appColors.text,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 23,
    padding: spacing.md,
  },
  optionList: {
    gap: spacing.sm,
  },
  choice: {
    backgroundColor: appColors.surfaceSoft,
    borderColor: appColors.border,
    borderRadius: 18,
    borderWidth: 1,
    minHeight: 54,
    justifyContent: "center",
    padding: spacing.md,
  },
  choicePressed: {
    opacity: 0.72,
  },
  choiceDisabled: {
    opacity: 0.55,
  },
  choiceText: {
    color: appColors.text,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 23,
  },
  routeLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  routeNode: {
    backgroundColor: "#eef2f5",
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  routeNodeDone: {
    backgroundColor: appColors.surfaceSoft,
  },
  routeNodeText: {
    color: appColors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
