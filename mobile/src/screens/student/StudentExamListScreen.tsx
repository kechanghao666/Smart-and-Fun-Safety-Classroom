import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { fetchStudentExamQuestions, fetchStudentProgress } from "@/api/student";
import { AppButton } from "@/components/common/AppButton";
import { AppCard } from "@/components/common/AppCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateViews";
import { Screen } from "@/components/common/Screen";
import { appColors, spacing } from "@/constants/appTheme";
import { useAuth } from "@/store/authStore";
import type { ExamQuestion, LearningStatus, StudentProgress } from "@/types/contracts";
import { getErrorMessage } from "@/utils/errors";

function getStatusLabel(status: LearningStatus) {
  if (status === "locked") return "未解锁";
  if (status === "completed") return "已完成";
  if (status === "in_progress") return "进行中";
  return "可开始";
}

export function StudentExamListScreen() {
  const { session } = useAuth();
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.token) return;

    setLoading(true);
    setError(null);
    try {
      const [nextProgress, nextQuestions] = await Promise.all([
        fetchStudentProgress(session.token),
        fetchStudentExamQuestions(session.token),
      ]);
      setProgress(nextProgress);
      setQuestions(nextQuestions);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [session?.token]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingState label="正在加载测验信息..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!progress) {
    return <EmptyState title="暂无测验数据" description="请稍后重新进入 App。" />;
  }

  const exam = progress.exam;
  const questionCount = questions.length || exam.totalQuestions;
  const isLocked = exam.status === "locked";
  const isCompleted = exam.status === "completed";

  return (
    <Screen bottomNavActive="learning" showBackButton backTo="/student" title="考试 / 测验" subtitle="完成三关后进入主题测验，检验道路安全知识掌握情况。">
      <AppCard>
        <View style={styles.headerRow}>
          <View style={styles.titleWrap}>
            <Text style={styles.eyebrow}>道路安全主题测验</Text>
            <Text style={styles.title}>主题收口挑战</Text>
          </View>
          <Text style={[styles.badge, isCompleted && styles.badgeDone, isLocked && styles.badgeMuted]}>
            {getStatusLabel(exam.status)}
          </Text>
        </View>

        <Text style={styles.description}>
          测验题目由后端题库下发，提交后自动生成成绩，并把需要复习的题目加入错题回看。
        </Text>

        <View style={styles.metricRow}>
          <Metric label="题目数" value={questionCount || "--"} />
          <Metric label="当前成绩" value={exam.score ?? "--"} />
          <Metric label="错题数" value={exam.wrongQuestionIds.length} />
        </View>

        {isLocked ? (
          <AppButton title="先完成三关学习" onPress={() => router.push("/student/subject-detail")} />
        ) : isCompleted ? (
          <View style={styles.actionRow}>
            <AppButton title="查看结果" onPress={() => router.push("/student/exam-result")} style={styles.actionButton} />
            <AppButton
              title="查看错题"
              variant="secondary"
              onPress={() => router.push("/student/wrong-questions")}
              style={styles.actionButton}
            />
          </View>
        ) : (
          <View style={styles.actionRow}>
            <AppButton title="查看说明" variant="secondary" onPress={() => router.push("/student/exam-detail")} style={styles.actionButton} />
            <AppButton title="开始测验" onPress={() => router.push("/student/exam")} style={styles.actionButton} />
          </View>
        )}
      </AppCard>

      {questions.length === 0 ? (
        <EmptyState title="题库暂未开放" description="当前后端没有返回测验题目，请稍后再试。" />
      ) : (
        <AppCard>
          <Text style={styles.sectionTitle}>本次测验覆盖</Text>
          {questions.map((question, index) => (
            <View key={question.id} style={styles.questionRow}>
              <Text style={styles.questionIndex}>{index + 1}</Text>
              <View style={styles.questionTextWrap}>
                <Text style={styles.questionTitle} numberOfLines={2}>
                  {question.prompt}
                </Text>
                <Text style={styles.questionMeta}>{question.reviewLabel}</Text>
              </View>
            </View>
          ))}
        </AppCard>
      )}
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
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
  titleWrap: {
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
  badgeDone: {
    backgroundColor: "#d8f5e7",
    color: "#047857",
  },
  badgeMuted: {
    backgroundColor: "#eef2f5",
    color: appColors.textMuted,
  },
  description: {
    color: appColors.textMuted,
    fontSize: 15,
    lineHeight: 23,
  },
  metricRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  metric: {
    backgroundColor: appColors.surfaceSoft,
    borderRadius: 18,
    flex: 1,
    padding: spacing.md,
  },
  metricValue: {
    color: appColors.text,
    fontSize: 22,
    fontWeight: "900",
  },
  metricLabel: {
    color: appColors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  sectionTitle: {
    color: appColors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  questionRow: {
    alignItems: "flex-start",
    borderTopColor: appColors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  questionIndex: {
    backgroundColor: appColors.surfaceSoft,
    borderRadius: 999,
    color: appColors.primary,
    fontWeight: "900",
    minWidth: 30,
    paddingVertical: 5,
    textAlign: "center",
  },
  questionTextWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  questionTitle: {
    color: appColors.text,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 22,
  },
  questionMeta: {
    color: appColors.textMuted,
    fontSize: 13,
  },
});
