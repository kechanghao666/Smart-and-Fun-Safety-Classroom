import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { fetchStudentExamQuestions, fetchStudentProgress, submitStudentExam } from "@/api/student";
import { AppButton } from "@/components/common/AppButton";
import { AppCard } from "@/components/common/AppCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateViews";
import { Screen } from "@/components/common/Screen";
import { appColors, spacing } from "@/constants/appTheme";
import { useAuth } from "@/store/authStore";
import type { ExamQuestion, StudentProgress } from "@/types/contracts";
import { getErrorMessage } from "@/utils/errors";

export function StudentExamScreen() {
  const { session } = useAuth();
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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

  const answeredCount = useMemo(
    () => questions.filter((question) => answers[question.id] !== undefined).length,
    [answers, questions],
  );

  const currentQuestion = questions[currentIndex];

  const confirmSubmit = useCallback(() => {
    if (!session?.token) return;

    if (answeredCount < questions.length) {
      Alert.alert("还有题目未完成", "请先完成所有题目，再提交测验。");
      return;
    }

    Alert.alert("确认提交测验？", "提交后会由后端计算成绩，当前版本不支持重复提交。", [
      { text: "继续检查", style: "cancel" },
      {
        text: "确认提交",
        onPress: async () => {
          setSubmitting(true);
          try {
            await submitStudentExam(
              session.token,
              questions.map((question) => ({
                questionId: question.id,
                selectedIndex: answers[question.id],
              })),
            );
            const elapsedSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
            router.replace(`/student/exam-result?elapsedSeconds=${elapsedSeconds}`);
          } catch (submitError) {
            Alert.alert("提交失败", getErrorMessage(submitError));
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  }, [answeredCount, answers, questions, session?.token, startedAt]);

  if (loading) return <LoadingState label="正在进入答题页..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!progress || questions.length === 0) {
    return <EmptyState title="暂无题目" description="当前题库还没有开放测验题目。" />;
  }

  if (progress.exam.status === "locked") {
    return (
      <EmptyState
        title="测验未解锁"
        description="请先完成三关学习流程，再回来进行主题测验。"
        actionLabel="返回主题学习"
        onAction={() => router.replace("/student/subject-detail")}
      />
    );
  }

  if (progress.exam.status === "completed") {
    return (
      <EmptyState
        title="测验已完成"
        description="当前后端不支持重复提交测验，可以查看结果和错题回看。"
        actionLabel="查看结果"
        onAction={() => router.replace("/student/exam-result")}
      />
    );
  }

  if (!currentQuestion) {
    return <EmptyState title="题目不存在" description="没有找到当前题目，请返回测验列表。" />;
  }

  const progressRatio = questions.length > 0 ? answeredCount / questions.length : 0;

  return (
    <Screen bottomNavActive="learning" showBackButton backTo="/student/exams" title="主题测验" subtitle={`已完成 ${answeredCount}/${questions.length} 题`}>
      <AppCard>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            第 {currentIndex + 1} / {questions.length} 题
          </Text>
          <Text style={styles.progressText}>{Math.round(progressRatio * 100)}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${progressRatio * 100}%` }]} />
        </View>

        <Text style={styles.prompt}>{currentQuestion.prompt}</Text>
        <View style={styles.options}>
          {currentQuestion.options.map((option, optionIndex) => {
            const selected = answers[currentQuestion.id] === optionIndex;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={`${currentQuestion.id}-${optionIndex}`}
                onPress={() => setAnswers((current) => ({ ...current, [currentQuestion.id]: optionIndex }))}
                style={[styles.option, selected && styles.optionSelected]}>
                <Text style={[styles.optionPrefix, selected && styles.optionTextSelected]}>
                  {String.fromCharCode(65 + optionIndex)}
                </Text>
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{option}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.navRow}>
          <AppButton
            title="上一题"
            variant="secondary"
            disabled={currentIndex === 0 || submitting}
            onPress={() => setCurrentIndex((value) => Math.max(0, value - 1))}
            style={styles.navButton}
          />
          {currentIndex === questions.length - 1 ? (
            <AppButton title="提交测验" loading={submitting} onPress={confirmSubmit} style={styles.navButton} />
          ) : (
            <AppButton
              title="下一题"
              disabled={submitting}
              onPress={() => setCurrentIndex((value) => Math.min(questions.length - 1, value + 1))}
              style={styles.navButton}
            />
          )}
        </View>
      </AppCard>
    </Screen>
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
  prompt: {
    color: appColors.text,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 32,
  },
  options: {
    gap: spacing.md,
  },
  option: {
    alignItems: "flex-start",
    backgroundColor: appColors.surfaceSoft,
    borderColor: appColors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 56,
    padding: spacing.md,
  },
  optionSelected: {
    backgroundColor: appColors.primary,
    borderColor: appColors.primary,
  },
  optionPrefix: {
    color: appColors.primary,
    fontSize: 16,
    fontWeight: "900",
    minWidth: 24,
  },
  optionText: {
    color: appColors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 23,
  },
  optionTextSelected: {
    color: "#ffffff",
  },
  navRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  navButton: {
    flex: 1,
  },
});
