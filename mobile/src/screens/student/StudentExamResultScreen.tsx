import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { fetchStudentExamReview, fetchStudentProgress } from "@/api/student";
import { AppButton } from "@/components/common/AppButton";
import { AppCard } from "@/components/common/AppCard";
import { ErrorState, LoadingState } from "@/components/common/StateViews";
import { Screen } from "@/components/common/Screen";
import { appColors, spacing } from "@/constants/appTheme";
import { useAuth } from "@/store/authStore";
import type { StudentExamReviewResponse, StudentProgress } from "@/types/contracts";
import { getErrorMessage } from "@/utils/errors";

export function StudentExamResultScreen() {
  const { session } = useAuth();
  const { elapsedSeconds } = useLocalSearchParams<{ elapsedSeconds?: string }>();
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [review, setReview] = useState<StudentExamReviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.token) return;

    setLoading(true);
    setError(null);
    try {
      const [nextProgress, nextReview] = await Promise.all([
        fetchStudentProgress(session.token),
        fetchStudentExamReview(session.token),
      ]);
      setProgress(nextProgress);
      setReview(nextReview);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [session?.token]);

  useEffect(() => {
    load();
  }, [load]);

  const elapsedText = useMemo(() => {
    const seconds = Number(elapsedSeconds);
    if (!Number.isFinite(seconds) || seconds <= 0) return "暂无记录";
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return minutes > 0 ? `${minutes} 分 ${rest} 秒` : `${rest} 秒`;
  }, [elapsedSeconds]);

  if (loading) return <LoadingState label="正在生成测验结果..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!progress || !review) return <LoadingState label="正在同步测验结果..." />;

  const exam = progress.exam;
  const total = exam.totalQuestions || review.items.length;
  const wrongCount = review.totalWrongQuestions;
  const correctCount = Math.max(0, total - wrongCount);
  const correctRate = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  return (
    <Screen bottomNavActive="records" showBackButton backTo="/student/exams" title="测验结果" subtitle="成绩和错题来自后端记录，方便后续继续复习。">
      <AppCard style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>本次成绩</Text>
        <Text style={styles.score}>{exam.score ?? "--"} 分</Text>
        <Text style={styles.suggestion}>{review.suggestion || "继续保持复习节奏，重点回看错题解析。"}</Text>
      </AppCard>

      <View style={styles.metrics}>
        <Metric label="正确率" value={`${correctRate}%`} />
        <Metric label="正确题数" value={`${correctCount}/${total}`} />
        <Metric label="错题数" value={`${wrongCount}`} />
        <Metric label="本次用时" value={elapsedText} />
      </View>

      <AppCard>
        <Text style={styles.sectionTitle}>下一步</Text>
        <AppButton title="查看错题回看" onPress={() => router.push("/student/wrong-questions")} />
        <AppButton title="返回学习记录" variant="secondary" onPress={() => router.push("/student/records")} />
        <AppButton title="返回主题学习" variant="secondary" onPress={() => router.push("/student/subject-detail")} />
      </AppCard>
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <AppCard style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  scoreCard: {
    alignItems: "center",
  },
  scoreLabel: {
    color: appColors.textMuted,
    fontSize: 13,
    fontWeight: "800",
  },
  score: {
    color: appColors.primary,
    fontSize: 52,
    fontWeight: "900",
    lineHeight: 60,
  },
  suggestion: {
    color: appColors.textMuted,
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
  },
  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  metric: {
    flexBasis: "48%",
    flexGrow: 1,
    minWidth: 140,
  },
  metricValue: {
    color: appColors.text,
    fontSize: 22,
    fontWeight: "900",
  },
  metricLabel: {
    color: appColors.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  sectionTitle: {
    color: appColors.text,
    fontSize: 18,
    fontWeight: "900",
  },
});
