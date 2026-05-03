import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { fetchTeacherDashboard } from "@/api/teacher";
import { AppButton } from "@/components/common/AppButton";
import { AppCard } from "@/components/common/AppCard";
import { Screen } from "@/components/common/Screen";
import { ErrorState, LoadingState } from "@/components/common/StateViews";
import { appColors, spacing } from "@/constants/appTheme";
import { useAuth } from "@/store/authStore";
import type { TeacherClassSummary, TeacherDashboardResponse } from "@/types/contracts";
import { getErrorMessage } from "@/utils/errors";
import { formatScore } from "@/utils/format";

function formatRate(value: number) {
  return `${Math.round(value)}%`;
}

function MetricTile({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.metricTile}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function ClassSummaryCard({ item }: { item: TeacherClassSummary }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/teacher/class-detail?classId=${item.id}`)}
      style={({ pressed }) => [styles.classCard, pressed && styles.pressed]}>
      <View style={styles.rowBetween}>
        <Text style={styles.itemTitle}>{item.name}</Text>
        <Text style={styles.badge}>{item.studentCount} 人</Text>
      </View>
      <Text style={styles.mutedText}>{item.focusLabel}</Text>
      <View style={styles.chipRow}>
        <Text style={styles.chip}>三关 {formatRate(item.completedRate)}</Text>
        <Text style={styles.chip}>考试 {formatRate(item.examCompletionRate)}</Text>
      </View>
    </Pressable>
  );
}

export function TeacherHomeScreen() {
  const { session } = useAuth();
  const [dashboard, setDashboard] = useState<TeacherDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.token) {
      return;
    }

    setError(null);
    try {
      setDashboard(await fetchTeacherDashboard(session.token));
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    }
  }, [session?.token]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  if (!dashboard) {
    return <LoadingState label="正在加载教师工作台..." />;
  }

  const focusStudents = dashboard.students.slice(0, 4);
  const averageScore =
    dashboard.students
      .map((student) => student.score)
      .filter((score): score is number => typeof score === "number")
      .reduce((sum, score, _, scores) => sum + score / scores.length, 0) || null;

  return (
    <Screen title="教师工作台" subtitle="先看班级趋势，再跟进需要帮助的学生。">
      <AppCard>
        <View style={styles.metricGrid}>
          <MetricTile label="班级数量" value={dashboard.classSummaries.length} />
          <MetricTile label="学生数量" value={dashboard.students.length} />
          <MetricTile label="平均成绩" value={formatScore(averageScore)} />
          <MetricTile label="优先跟进" value={focusStudents.length} />
        </View>
      </AppCard>

      <View style={styles.actionRow}>
        <AppButton
          title="查看班级"
          onPress={() => router.push("/teacher/classes")}
          style={styles.actionButton}
        />
        <AppButton
          title="查看学生"
          variant="secondary"
          onPress={() => router.push("/teacher/students")}
          style={styles.actionButton}
        />
      </View>

      <AppCard>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>优先跟进学生</Text>
          <Text style={styles.metaText}>按风险和进度排序</Text>
        </View>
        {focusStudents.length === 0 ? (
          <Text style={styles.mutedText}>暂无需要优先跟进的学生。</Text>
        ) : (
          focusStudents.map((student) => (
            <Pressable
              accessibilityRole="button"
              key={student.id}
              onPress={() => router.push(`/teacher/student-detail?studentId=${student.id}`)}
              style={({ pressed }) => [styles.studentRow, pressed && styles.pressed]}>
              <View style={styles.studentMain}>
                <Text style={styles.itemTitle}>{student.name}</Text>
                <Text style={styles.metaText}>
                  {student.className} · {student.studentNo || "暂无学号"}
                </Text>
                <Text style={styles.mutedText}>{student.weakSpot}</Text>
              </View>
              <View style={styles.studentAside}>
                <Text style={styles.badge}>{student.completedLevels}/3 关</Text>
                <Text style={styles.metaText}>{formatScore(student.score)}</Text>
              </View>
            </Pressable>
          ))
        )}
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>班级概览</Text>
        {dashboard.classSummaries.length === 0 ? (
          <Text style={styles.mutedText}>暂无班级数据。</Text>
        ) : (
          dashboard.classSummaries.slice(0, 3).map((item) => (
            <ClassSummaryCard key={item.id} item={item} />
          ))
        )}
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 28,
  },
  metricLabel: {
    color: appColors.textMuted,
    fontSize: 13,
    fontWeight: "800",
    marginTop: spacing.xs,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  actionButton: {
    flexBasis: "46%",
    flexGrow: 1,
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  cardTitle: {
    color: appColors.text,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 24,
  },
  itemTitle: {
    color: appColors.text,
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 22,
  },
  mutedText: {
    color: appColors.textMuted,
    fontSize: 14,
    lineHeight: 21,
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
  studentRow: {
    borderColor: appColors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
  },
  studentMain: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  studentAside: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  classCard: {
    borderColor: appColors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.72,
  },
});
