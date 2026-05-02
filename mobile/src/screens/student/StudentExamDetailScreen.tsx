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
import type { ExamQuestion, StudentProgress } from "@/types/contracts";
import { getErrorMessage } from "@/utils/errors";

export function StudentExamDetailScreen() {
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

  if (loading) return <LoadingState label="正在准备测验说明..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!progress || questions.length === 0) {
    return <EmptyState title="暂无测验题目" description="当前题库还没有开放移动端测验题目。" />;
  }

  const isLocked = progress.exam.status === "locked";
  const isCompleted = progress.exam.status === "completed";

  return (
    <Screen title="测验说明" subtitle="开始前先看清规则，答题过程中可以前后切换检查。">
      <AppCard>
        <Text style={styles.title}>道路安全主题测验</Text>
        <Text style={styles.description}>
          当前移动端复用后端已有考试接口。后端目前提供单选作答模型，提交后会立即生成成绩和错题回看。
        </Text>

        <View style={styles.ruleList}>
          <Rule label="题目数量" value={`${questions.length} 题`} />
          <Rule label="答题方式" value="逐题选择，可返回修改" />
          <Rule label="提交规则" value="全部作答后提交，成绩由后端计算" />
          <Rule label="错题处理" value="错题会进入错题页，可查看解析并标记回看" />
        </View>

        {isLocked ? (
          <AppButton title="返回完成三关" onPress={() => router.push("/student/subject-detail")} />
        ) : isCompleted ? (
          <AppButton title="查看测验结果" onPress={() => router.push("/student/exam-result")} />
        ) : (
          <AppButton title="开始答题" onPress={() => router.push("/student/exam")} />
        )}
      </AppCard>

      <AppCard>
        <Text style={styles.sectionTitle}>题目复习方向</Text>
        {questions.map((question) => (
          <View key={question.id} style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>{question.reviewLabel}</Text>
            <Text style={styles.reviewText} numberOfLines={2}>
              {question.reviewSuggestion}
            </Text>
          </View>
        ))}
      </AppCard>
    </Screen>
  );
}

function Rule({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.rule}>
      <Text style={styles.ruleLabel}>{label}</Text>
      <Text style={styles.ruleValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    color: appColors.text,
    fontSize: 22,
    fontWeight: "900",
  },
  description: {
    color: appColors.textMuted,
    fontSize: 15,
    lineHeight: 23,
  },
  ruleList: {
    gap: spacing.sm,
  },
  rule: {
    backgroundColor: appColors.surfaceSoft,
    borderRadius: 18,
    gap: spacing.xs,
    padding: spacing.md,
  },
  ruleLabel: {
    color: appColors.textMuted,
    fontSize: 13,
    fontWeight: "800",
  },
  ruleValue: {
    color: appColors.text,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 22,
  },
  sectionTitle: {
    color: appColors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  reviewRow: {
    borderTopColor: appColors.border,
    borderTopWidth: 1,
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  reviewLabel: {
    color: appColors.primary,
    fontSize: 13,
    fontWeight: "900",
  },
  reviewText: {
    color: appColors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
});
