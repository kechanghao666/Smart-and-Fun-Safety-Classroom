import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { fetchTeacherClassStudents } from "@/api/teacher";
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

export function TeacherClassDetailScreen() {
  const { classId } = useLocalSearchParams<{ classId?: string }>();
  const { session } = useAuth();
  const [students, setStudents] = useState<PaginatedResponse<TeacherStudentSummary> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    if (!session?.token || !classId) {
      return;
    }

    setError(null);
    try {
      setStudents(
        await fetchTeacherClassStudents(session.token, classId, page, PAGE_SIZE, query.trim()),
      );
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    }
  }, [classId, page, query, session?.token]);

  useEffect(() => {
    load();
  }, [load]);

  function updateQuery(nextQuery: string) {
    setQuery(nextQuery);
    setPage(1);
  }

  if (!classId) {
    return <ErrorState message="缺少班级 ID，无法查看班级详情。" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  if (!students) {
    return <LoadingState label="正在加载班级学生..." />;
  }

  return (
    <Screen title="班级学生" subtitle={`共 ${students.total} 名学生，可按姓名、学号或薄弱点搜索。`}>
      <AppCard>
        <AppInput
          label="搜索本班学生"
          value={query}
          onChangeText={updateQuery}
          placeholder="输入姓名、学号、薄弱点"
          returnKeyType="search"
        />
      </AppCard>

      {students.items.length === 0 ? (
        <EmptyState title="暂无学生" description="当前班级没有符合条件的学生。" />
      ) : (
        students.items.map((student) => (
          <AppCard key={student.id} style={styles.studentCard}>
            <View style={styles.rowBetween}>
              <View style={styles.studentTitleWrap}>
                <Text style={styles.title}>{student.name}</Text>
                <Text style={styles.metaText}>学号 {student.studentNo || "暂无"}</Text>
              </View>
              <Text style={styles.badge}>{student.completedLevels}/3 关</Text>
            </View>
            <View style={styles.infoGroup}>
              <InfoRow label="考试状态" value={student.examStatus} />
              <InfoRow label="考试成绩" value={formatScore(student.score)} />
              <InfoRow label="最近学习" value={formatDateTime(student.lastActiveAt)} />
            </View>
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
  infoGroup: {
    gap: spacing.sm,
  },
  description: {
    color: appColors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
});
