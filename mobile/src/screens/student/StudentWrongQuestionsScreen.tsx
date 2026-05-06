import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { completeStudentWrongQuestionReview, fetchStudentExamReview } from "@/api/student";
import { AppButton } from "@/components/common/AppButton";
import { AppCard } from "@/components/common/AppCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateViews";
import { Screen } from "@/components/common/Screen";
import { appColors, spacing } from "@/constants/appTheme";
import { useAuth } from "@/store/authStore";
import type { StudentExamReviewItem, StudentExamReviewResponse } from "@/types/contracts";
import { getErrorMessage } from "@/utils/errors";

type FilterKey = "all" | "todo" | "done";

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "todo", label: "待回看" },
  { key: "done", label: "已回看" },
];

export function StudentWrongQuestionsScreen() {
  const { session } = useAuth();
  const [review, setReview] = useState<StudentExamReviewResponse | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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

  const items = useMemo(() => {
    const source = review?.items ?? [];
    if (filter === "todo") return source.filter((item) => !item.reviewed);
    if (filter === "done") return source.filter((item) => item.reviewed);
    return source;
  }, [filter, review?.items]);

  const markReviewed = useCallback(
    async (item: StudentExamReviewItem) => {
      if (!session?.token) return;

      setUpdatingId(item.questionId);
      try {
        await completeStudentWrongQuestionReview(session.token, item.questionId);
        await load();
      } catch (updateError) {
        Alert.alert("操作失败", getErrorMessage(updateError));
      } finally {
        setUpdatingId(null);
      }
    },
    [load, session?.token],
  );

  if (loading) return <LoadingState label="正在加载错题回看..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!review || review.items.length === 0) {
    return (
      <EmptyState
        title="还没有错题"
        description="完成主题测验后，系统会把需要回看的题目放到这里。"
        actionLabel="去测验"
        onAction={() => router.push("/student/exams")}
      />
    );
  }

  return (
    <Screen bottomNavActive="records" showBackButton backTo="/student" title="错题回看" subtitle={review.suggestion || "错题解析和回看建议来自后端记录。"}>
      <View style={styles.filterRow}>
        {filters.map((item) => (
          <Pressable
            accessibilityRole="button"
            key={item.key}
            onPress={() => setFilter(item.key)}
            style={[styles.filterButton, filter === item.key && styles.filterButtonActive]}>
            <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      {items.length === 0 ? (
        <EmptyState title="当前筛选没有错题" description="可以切换筛选条件查看其他错题。" />
      ) : (
        items.map((item) => (
          <AppCard key={item.questionId}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleWrap}>
                <Text style={styles.reviewLabel}>{item.reviewLabel}</Text>
                <Text style={styles.prompt} numberOfLines={3}>
                  {item.prompt}
                </Text>
              </View>
              <Text style={[styles.status, item.reviewed ? styles.statusDone : styles.statusTodo]}>
                {item.reviewed ? "已回看" : "待回看"}
              </Text>
            </View>
            <Text style={styles.answerLine} numberOfLines={1}>
              我的答案：{item.studentAnswer ?? "未记录"}
            </Text>
            <Text style={styles.answerLine} numberOfLines={1}>
              正确答案：{item.correctAnswer}
            </Text>
            <View style={styles.actionRow}>
              <AppButton
                title="查看解析"
                onPress={() => router.push(`/student/wrong-question-detail?questionId=${encodeURIComponent(item.questionId)}`)}
                style={styles.actionButton}
              />
              <AppButton
                title={updatingId === item.questionId ? "标记中..." : item.reviewed ? "已完成" : "标记回看"}
                variant="secondary"
                disabled={item.reviewed || updatingId === item.questionId}
                onPress={() => markReviewed(item)}
                style={styles.actionButton}
              />
            </View>
          </AppCard>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  filterButton: {
    backgroundColor: appColors.surface,
    borderColor: appColors.border,
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    paddingVertical: spacing.sm,
  },
  filterButtonActive: {
    backgroundColor: appColors.primary,
    borderColor: appColors.primary,
  },
  filterText: {
    color: appColors.textMuted,
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center",
  },
  filterTextActive: {
    color: "#ffffff",
  },
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  cardTitleWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  reviewLabel: {
    color: appColors.primary,
    fontSize: 13,
    fontWeight: "900",
  },
  prompt: {
    color: appColors.text,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 25,
  },
  status: {
    borderRadius: 999,
    fontSize: 13,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  statusDone: {
    backgroundColor: "#d8f5e7",
    color: "#047857",
  },
  statusTodo: {
    backgroundColor: "#fff2d8",
    color: appColors.warning,
  },
  answerLine: {
    color: appColors.textMuted,
    fontSize: 15,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
