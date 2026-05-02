import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { fetchStudentProgress } from "@/api/student";
import { AppButton } from "@/components/common/AppButton";
import { AppCard } from "@/components/common/AppCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateViews";
import { Screen } from "@/components/common/Screen";
import { appColors, spacing } from "@/constants/appTheme";
import { useAuth } from "@/store/authStore";
import type { LevelId, LevelProgress, StudentProgress } from "@/types/contracts";
import { getErrorMessage } from "@/utils/errors";

function isLevelId(value: unknown): value is LevelId {
  return value === "level-1" || value === "level-2" || value === "level-3";
}

function getStatusLabel(status: LevelProgress["status"]) {
  if (status === "locked") return "暂未解锁";
  if (status === "available") return "可开始";
  if (status === "in_progress") return "进行中";
  return "已完成";
}

function getModeLabel(level: LevelProgress) {
  if (level.gameplayMode === "route") return "路线节点推进";
  if (level.gameplayMode === "guardian") return "操作守护任务";
  return "观察识别任务";
}

export function StudentLevelIntroScreen() {
  const { levelId } = useLocalSearchParams<{ levelId?: string }>();
  const { session } = useAuth();
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (!resolvedLevelId) {
    return <EmptyState title="关卡不存在" description="没有找到对应的关卡 ID。" />;
  }

  if (loading) return <LoadingState label="正在读取关卡说明..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!progress || !level) {
    return <EmptyState title="暂无关卡数据" description="请稍后重新进入主题学习。" />;
  }

  const result = progress.levelResults[level.id];
  const locked = level.status === "locked";

  return (
    <Screen title={level.title} subtitle="先看目标和规则，再进入适合手机触屏的闯关学习。">
      <AppCard>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>{getModeLabel(level)}</Text>
            <Text style={styles.title}>{level.focus}</Text>
          </View>
          <Text style={[styles.badge, locked && styles.badgeLocked]}>{getStatusLabel(level.status)}</Text>
        </View>

        <Text style={styles.description}>{level.description}</Text>

        <View style={styles.infoGrid}>
          <Info label="预计时长" value={level.duration} />
          <Info label="当前成绩" value={result ? `${result.score} 分` : "暂无"} />
          <Info label="星级记录" value={result ? `${result.stars} 星` : "暂无"} />
          <Info label="考试状态" value={progress.exam.status === "available" ? "已解锁" : progress.exam.status} />
        </View>

        <AppButton
          title={locked ? "完成前一关后解锁" : result ? "重新挑战本关" : "开始本关"}
          disabled={locked}
          onPress={() => router.push(`/student/level-flow?levelId=${level.id}`)}
        />
        {result ? (
          <AppButton
            title="查看本关结果"
            variant="secondary"
            onPress={() => router.push(`/student/level-result?levelId=${level.id}`)}
          />
        ) : null}
      </AppCard>

      <AppCard>
        <Text style={styles.sectionTitle}>这一关会做什么</Text>
        {level.gameplayMode === "route" && level.routeChallengeConfig ? (
          level.routeChallengeConfig.nodes.map((node, index) => (
            <Step key={node.id} index={index + 1} title={node.title} description={node.hint} />
          ))
        ) : level.gameplayMode === "guardian" && level.guardianChallengeConfig ? (
          level.guardianChallengeConfig.stages.map((stage, index) => (
            <Step key={stage.id} index={index + 1} title={stage.title} description={stage.detail} />
          ))
        ) : level.observationConfig ? (
          level.observationConfig.taskSteps.map((step, index) => (
            <Step key={step.id} index={index + 1} title={step.title} description={step.instruction} />
          ))
        ) : (
          <Text style={styles.description}>当前关卡暂无详细配置，将按基础完成流程处理。</Text>
        )}
      </AppCard>
    </Screen>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function Step({ index, title, description }: { index: number; title: string; description: string }) {
  return (
    <View style={styles.stepRow}>
      <Text style={styles.stepIndex}>{index}</Text>
      <View style={styles.stepText}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  eyebrow: {
    color: appColors.textMuted,
    fontSize: 13,
    fontWeight: "800",
  },
  title: {
    color: appColors.text,
    fontSize: 22,
    fontWeight: "900",
  },
  badge: {
    backgroundColor: appColors.surfaceSoft,
    borderRadius: 999,
    color: appColors.primary,
    fontSize: 13,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  badgeLocked: {
    backgroundColor: "#eef2f5",
    color: appColors.textMuted,
  },
  description: {
    color: appColors.textMuted,
    fontSize: 15,
    lineHeight: 23,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  infoCard: {
    backgroundColor: appColors.surfaceSoft,
    borderRadius: 18,
    flexBasis: "48%",
    flexGrow: 1,
    padding: spacing.md,
  },
  infoLabel: {
    color: appColors.textMuted,
    fontSize: 12,
    fontWeight: "800",
  },
  infoValue: {
    color: appColors.text,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 4,
  },
  sectionTitle: {
    color: appColors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  stepRow: {
    alignItems: "flex-start",
    borderTopColor: appColors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  stepIndex: {
    backgroundColor: appColors.surfaceSoft,
    borderRadius: 999,
    color: appColors.primary,
    fontWeight: "900",
    minWidth: 30,
    paddingVertical: 5,
    textAlign: "center",
  },
  stepText: {
    flex: 1,
    gap: spacing.xs,
  },
  stepTitle: {
    color: appColors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  stepDescription: {
    color: appColors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
});
