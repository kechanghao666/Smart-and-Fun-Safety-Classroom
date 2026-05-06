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
import type { LevelId, StudentProgress } from "@/types/contracts";
import { getErrorMessage } from "@/utils/errors";

const levelSequence: LevelId[] = ["level-1", "level-2", "level-3"];

function isLevelId(value: unknown): value is LevelId {
  return value === "level-1" || value === "level-2" || value === "level-3";
}

export function StudentLevelResultScreen() {
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
  const result = resolvedLevelId ? progress?.levelResults[resolvedLevelId] : null;
  const nextLevel = useMemo(() => {
    if (!progress || !resolvedLevelId) return null;
    const currentIndex = levelSequence.indexOf(resolvedLevelId);
    const nextLevelId = levelSequence[currentIndex + 1];
    return progress.levels.find((item) => item.id === nextLevelId) ?? null;
  }, [progress, resolvedLevelId]);

  if (!resolvedLevelId) {
    return <EmptyState title="关卡不存在" description="没有找到对应的关卡 ID。" />;
  }
  if (loading) return <LoadingState label="正在读取关卡结果..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!progress || !level || !result) {
    return (
      <EmptyState
        title="还没有本关结果"
        description="完成关卡后，这里会展示得分、星级和下一步建议。"
        actionLabel="进入本关"
        onAction={() => router.replace(`/student/level-flow?levelId=${resolvedLevelId}`)}
      />
    );
  }

  const canEnterNext = nextLevel && nextLevel.status !== "locked";
  const examReady = !nextLevel && progress.exam.status === "available";

  return (
    <Screen bottomNavActive="learning" showBackButton backTo="/student/subject-detail" title={`${level.title} · 结算`} subtitle="本关结果已同步到学习进度、成长档案和学习记录。">
      <AppCard style={styles.scoreCard}>
        <Text style={styles.rewardIcon}>{result.rewardIcon ?? "★"}</Text>
        <Text style={styles.score}>{result.score} 分</Text>
        <Text style={styles.stars}>{result.stars} 星</Text>
        <Text style={styles.summary}>{result.aiSummary}</Text>
      </AppCard>

      <AppCard>
        <Text style={styles.sectionTitle}>这次做得好</Text>
        <Text style={styles.paragraph}>{result.highlight}</Text>
        <Text style={styles.sectionTitle}>下次要注意</Text>
        <Text style={styles.paragraph}>{result.caution}</Text>
      </AppCard>

      <AppCard>
        <Text style={styles.sectionTitle}>关键安全点</Text>
        {(result.keySafetyPoints ?? [result.highlight]).map((item) => (
          <View key={item} style={styles.pointRow}>
            <Text style={styles.pointDot}>•</Text>
            <Text style={styles.pointText}>{item}</Text>
          </View>
        ))}
      </AppCard>

      <AppCard>
        <Text style={styles.sectionTitle}>下一步</Text>
        {canEnterNext ? (
          <AppButton title="进入下一关" onPress={() => router.push(`/student/level-intro?levelId=${nextLevel.id}`)} />
        ) : examReady ? (
          <AppButton title="进入考试 / 测验" onPress={() => router.push("/student/exams")} />
        ) : (
          <AppButton title="返回主题详情" onPress={() => router.push("/student/subject-detail")} />
        )}
        <AppButton title="重新挑战本关" variant="secondary" onPress={() => router.push(`/student/level-flow?levelId=${level.id}`)} />
        <AppButton title="返回主题详情" variant="secondary" onPress={() => router.push("/student/subject-detail")} />
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scoreCard: {
    alignItems: "center",
  },
  rewardIcon: {
    color: appColors.primary,
    fontSize: 42,
    fontWeight: "900",
  },
  score: {
    color: appColors.text,
    fontSize: 46,
    fontWeight: "900",
    lineHeight: 54,
  },
  stars: {
    color: appColors.warning,
    fontSize: 18,
    fontWeight: "900",
  },
  summary: {
    color: appColors.textMuted,
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
  },
  sectionTitle: {
    color: appColors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  paragraph: {
    color: appColors.textMuted,
    fontSize: 15,
    lineHeight: 23,
  },
  pointRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
  },
  pointDot: {
    color: appColors.primary,
    fontSize: 18,
    fontWeight: "900",
  },
  pointText: {
    color: appColors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 23,
  },
});
