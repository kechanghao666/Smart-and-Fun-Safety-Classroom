import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { fetchTeacherStudents } from "@/api/teacher";
import { AppButton } from "@/components/common/AppButton";
import { AppCard } from "@/components/common/AppCard";
import { AppInput } from "@/components/common/AppInput";
import { InfoRow } from "@/components/common/InfoRow";
import { PaginationControls } from "@/components/common/PaginationControls";
import { Screen } from "@/components/common/Screen";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateViews";
import { appColors, spacing } from "@/constants/appTheme";
import { useAuth } from "@/store/authStore";
import type { PaginatedResponse, TeacherStudentSummary } from "@/types/contracts";
import { getErrorMessage } from "@/utils/errors";
import { formatDateTime, formatScore } from "@/utils/format";

const PAGE_SIZE = 8;

export function TeacherStudentsScreen() {
  const { session } = useAuth();
  const [students, setStudents] = useState<PaginatedResponse<TeacherStudentSummary> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    if (!session?.token) {
      return;
    }

    setError(null);
    try {
      setStudents(await fetchTeacherStudents(session.token, page, PAGE_SIZE, query.trim()));
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    }
  }, [page, query, session?.token]);

  useEffect(() => {
    load();
  }, [load]);

  function updateQuery(nextQuery: string) {
    setQuery(nextQuery);
    setPage(1);
  }

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  if (!students) {
    return <LoadingState label="正在加载学生列表..." />;
  }

  return (
    <Screen title="学生列表" subtitle={`共 ${students.total} 名学生，支持按姓名、学号、薄弱点搜索。`}>
      <AppCard>
        <AppInput
          label="搜索学生"
          value={query}
          onChangeText={updateQuery}
          placeholder="输入姓名、学号、班级或薄弱点"
          returnKeyType="search"
        />
      </AppCard>

      {students.items.length === 0 ? (
        <EmptyState title="暂无学生" description="当前没有符合条件的学生。" />
      ) : (
        students.items.map((student) => (
          <AppCard key={student.id} style={styles.studentCard}>
            <View style={styles.rowBetween}>
              <View style={styles.studentTitleWrap}>
                <Text style={styles.title}>{student.name}</Text>
                <Text style={styles.metaText}>
                  {student.className} · 学号 {student.studentNo || "暂无"}
                </Text>
              </View>
              <Text
                style={[
                  styles.statusBadge,
                  student.completedLevels >= 3 && styles.statusBadgeDone,
                ]}>
                {student.completedLevels >= 3 ? "进度稳定" : "继续推进"}
              </Text>
            </View>
            <View style={styles.chipRow}>
              <Text style={styles.chip}>三关 {student.completedLevels}/3</Text>
              <Text style={styles.chip}>{student.examStatus}</Text>
              <Text style={styles.chip}>{formatScore(student.score)}</Text>
            </View>
            <InfoRow label="最近学习" value={formatDateTime(student.lastActiveAt)} />
            <Text style={styles.description}>{student.weakSpot}</Text>
            <AppButton
              title="查看学生详情"
              onPress={() => router.push(`/teacher/student-detail?studentId=${student.id}`)}
            />
          </AppCard>
        ))
      )}

      <PaginationControls
        page={students.page}
        total={students.total}
        totalPages={students.totalPages}
        onPageChange={setPage}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  studentCard: {
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
  title: {
    color: appColors.text,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 24,
  },
  metaText: {
    color: appColors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  statusBadge: {
    backgroundColor: "#fff2df",
    borderRadius: 999,
    color: "#a85c00",
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusBadgeDone: {
    backgroundColor: appColors.surfaceSoft,
    color: appColors.primary,
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
  description: {
    color: appColors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
});
