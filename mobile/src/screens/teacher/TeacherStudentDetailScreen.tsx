import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { fetchTeacherStudentDetail } from "@/api/teacher";
import { AppCard } from "@/components/common/AppCard";
import { InfoRow } from "@/components/common/InfoRow";
import { Screen } from "@/components/common/Screen";
import { ErrorState, LoadingState } from "@/components/common/StateViews";
import { appColors, spacing } from "@/constants/appTheme";
import { useAuth } from "@/store/authStore";
import type { LearningStatus, TeacherStudentDetail } from "@/types/contracts";
import { getErrorMessage } from "@/utils/errors";
import { formatDateTime, formatScore } from "@/utils/format";

const statusLabels: Record<LearningStatus, string> = {
  locked: "未解锁",
  available: "可开始",
  in_progress: "进行中",
  completed: "已完成",
};

export function TeacherStudentDetailScreen() {
  const { studentId } = useLocalSearchParams<{ studentId?: string }>();
  const { session } = useAuth();
  const [student, setStudent] = useState<TeacherStudentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.token || !studentId) {
      return;
    }

    setError(null);
    try {
      setStudent(await fetchTeacherStudentDetail(session.token, studentId));
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    }
  }, [session?.token, studentId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!studentId) {
    return <ErrorState message="缺少学生 ID，无法查看学生详情。" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  if (!student) {
    return <LoadingState label="正在加载学生详情..." />;
  }

  return (
    <Screen title={student.name} subtitle="查看这名学生的学习进度、错题情况和跟进建议。">
      <AppCard style={styles.heroCard}>
        <View style={styles.rowBetween}>
          <View style={styles.studentTitleWrap}>
            <Text style={styles.studentName}>{student.name}</Text>
            <Text style={styles.metaText}>
              {student.className} · 学号 {student.studentNo || "暂无"}
            </Text>
          </View>
          <Text style={styles.badge}>{student.motivationLabel}</Text>
        </View>
        <View style={styles.metricGrid}>
          <View style={styles.metricTile}>
            <Text style={styles.metricValue}>{student.completedLevels}/3</Text>
            <Text style={styles.metricLabel}>关卡进度</Text>
          </View>
          <View style={styles.metricTile}>
            <Text style={styles.metricValue}>{formatScore(student.score)}</Text>
            <Text style={styles.metricLabel}>考试成绩</Text>
          </View>
          <View style={styles.metricTile}>
            <Text style={styles.metricValue}>{student.growthPoints ?? "-"}</Text>
            <Text style={styles.metricLabel}>成长积分</Text>
          </View>
          <View style={styles.metricTile}>
            <Text style={styles.metricValue}>{formatDateTime(student.lastActiveAt)}</Text>
            <Text style={styles.metricLabel}>最近学习</Text>
          </View>
        </View>
        <Text style={styles.description}>{student.growthSummary}</Text>
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>关卡表现</Text>
        {student.levelStatuses.map((level) => (
          <View key={level.levelId} style={styles.levelCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.levelTitle}>{level.title}</Text>
              <Text style={styles.levelBadge}>{statusLabels[level.status]}</Text>
            </View>
            <InfoRow label="成绩" value={formatScore(level.score)} />
            <Text style={styles.description}>{level.note}</Text>
          </View>
        ))}
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>错题情况</Text>
        {student.wrongTopics.length === 0 ? (
          <Text style={styles.description}>暂无明显薄弱点。</Text>
        ) : (
          <View style={styles.chipRow}>
            {student.wrongTopics.map((topic) => (
              <Text key={topic} style={styles.chip}>
                {topic}
              </Text>
            ))}
          </View>
        )}
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>建议动作</Text>
        {student.recommendations.length === 0 ? (
          <Text style={styles.description}>暂无额外建议。</Text>
        ) : (
          student.recommendations.map((item, index) => (
            <View key={`${item}-${index}`} style={styles.recommendation}>
              <Text style={styles.recommendationIndex}>{index + 1}</Text>
              <Text style={styles.recommendationText}>{item}</Text>
            </View>
          ))
        )}
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    gap: spacing.md,
  },
  rowBetween: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  studentTitleWrap: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  studentName: {
    color: appColors.text,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 28,
  },
  metaText: {
    color: appColors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  badge: {
    backgroundColor: appColors.surfaceSoft,
    borderRadius: 999,
    color: appColors.primary,
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  metricTile: {
    backgroundColor: appColors.surfaceSoft,
    borderColor: appColors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexBasis: "47%",
    flexGrow: 1,
    minHeight: 84,
    padding: spacing.md,
  },
  metricValue: {
    color: appColors.text,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 24,
  },
  metricLabel: {
    color: appColors.textMuted,
    fontSize: 12,
    fontWeight: "800",
    marginTop: spacing.xs,
  },
  description: {
    color: appColors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  cardTitle: {
    color: appColors.text,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 24,
  },
  levelCard: {
    borderColor: appColors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  levelTitle: {
    color: appColors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 22,
  },
  levelBadge: {
    color: appColors.primary,
    fontSize: 12,
    fontWeight: "900",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  chip: {
    backgroundColor: "#f3f7fb",
    borderRadius: 999,
    color: appColors.text,
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  recommendation: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
  },
  recommendationIndex: {
    backgroundColor: appColors.primary,
    borderRadius: 999,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 22,
    overflow: "hidden",
    textAlign: "center",
    width: 22,
  },
  recommendationText: {
    color: appColors.textMuted,
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },
});
