import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { completeStudentWrongQuestionReview, fetchStudentExamReview } from "@/api/student";
import { AppButton } from "@/components/common/AppButton";
import { AppCard } from "@/components/common/AppCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateViews";
import { Screen } from "@/components/common/Screen";
import { appColors, spacing } from "@/constants/appTheme";
import { useAuth } from "@/store/authStore";
import type { StudentExamReviewResponse } from "@/types/contracts";
import { getErrorMessage } from "@/utils/errors";

export function StudentWrongQuestionDetailScreen() {
  const { session } = useAuth();
  const { questionId } = useLocalSearchParams<{ questionId?: string }>();
  const [review, setReview] = useState<StudentExamReviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.token) return;

    setLoading(true);
    setError(null);
    try {
      setReview(await fetchStudentExamReview(session.token));
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [session?.token]);

  useEffect(() => {
    load();
  }, [load]);

  const item = useMemo(() => review?.items.find((entry) => entry.questionId === questionId), [questionId, review?.items]);

  const markReviewed = useCallback(async () => {
    if (!session?.token || !item) return;

    setMarking(true);
    try {
      await completeStudentWrongQuestionReview(session.token, item.questionId);
      await load();
      Alert.alert("已标记", "这道错题已经标记为完成回看。");
    } catch (markError) {
      Alert.alert("操作失败", getErrorMessage(markError));
    } finally {
      setMarking(false);
    }
  }, [item, load, session?.token]);

  if (loading) return <LoadingState label="正在加载错题解析..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!item) {
    return (
      <EmptyState
        title="没有找到这道错题"
        description="可以返回错题列表重新选择。"
        actionLabel="返回错题列表"
        onAction={() => router.back()}
      />
    );
  }

  return (
    <Screen bottomNavActive="records" showBackButton backTo="/student/wrong-questions" title="错题解析" subtitle={item.reviewLabel}>
      <AppCard>
        <View style={styles.headerRow}>
          <Text style={styles.label}>{item.reviewed ? "已回看" : "待回看"}</Text>
          {item.reviewedAt ? <Text style={styles.time}>{new Date(item.reviewedAt).toLocaleString()}</Text> : null}
        </View>
        <Text style={styles.prompt}>{item.prompt}</Text>
      </AppCard>

      <AppCard>
        <Text style={styles.sectionTitle}>答案对照</Text>
        <AnswerBlock label="我的答案" value={item.studentAnswer ?? "后端未记录答案文本"} muted />
        <AnswerBlock label="正确答案" value={item.correctAnswer} />
      </AppCard>

      <AppCard>
        <Text style={styles.sectionTitle}>解析与建议</Text>
        <Text style={styles.paragraph}>{item.explanation}</Text>
        <Text style={styles.suggestion}>{item.reviewSuggestion}</Text>
      </AppCard>

      <AppCard>
        <Text style={styles.sectionTitle}>回看来源</Text>
        <Text style={styles.paragraph}>建议回看：{item.reviewLabel}</Text>
        <View style={styles.actionRow}>
          <AppButton
            title="回看对应关卡"
            onPress={() => router.push(`/student/level-intro?levelId=${item.reviewLevelId}`)}
            style={styles.actionButton}
          />
          <AppButton
            title={marking ? "标记中..." : item.reviewed ? "已完成回看" : "标记已回看"}
            variant="secondary"
            disabled={item.reviewed || marking}
            onPress={markReviewed}
            style={styles.actionButton}
          />
        </View>
      </AppCard>
    </Screen>
  );
}

function AnswerBlock({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <View style={[styles.answerBlock, muted && styles.answerBlockMuted]}>
      <Text style={styles.answerLabel}>{label}</Text>
      <Text style={styles.answerValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  label: {
    backgroundColor: appColors.surfaceSoft,
    borderRadius: 999,
    color: appColors.primary,
    fontSize: 13,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  time: {
    color: appColors.textMuted,
    fontSize: 12,
  },
  prompt: {
    color: appColors.text,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 32,
  },
  sectionTitle: {
    color: appColors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  answerBlock: {
    backgroundColor: "#d8f5e7",
    borderRadius: 18,
    gap: spacing.xs,
    padding: spacing.md,
  },
  answerBlockMuted: {
    backgroundColor: appColors.surfaceSoft,
  },
  answerLabel: {
    color: appColors.textMuted,
    fontSize: 13,
    fontWeight: "800",
  },
  answerValue: {
    color: appColors.text,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 23,
  },
  paragraph: {
    color: appColors.textMuted,
    fontSize: 15,
    lineHeight: 23,
  },
  suggestion: {
    backgroundColor: "#fff2d8",
    borderRadius: 18,
    color: appColors.text,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 23,
    padding: spacing.md,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
