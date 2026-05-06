import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { fetchTeacherClasses } from "@/api/teacher";
import { AppButton } from "@/components/common/AppButton";
import { AppCard } from "@/components/common/AppCard";
import { AppInput } from "@/components/common/AppInput";
import { InfoRow } from "@/components/common/InfoRow";
import { PaginationControls } from "@/components/common/PaginationControls";
import { Screen } from "@/components/common/Screen";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateViews";
import { appColors, spacing } from "@/constants/appTheme";
import { useAuth } from "@/store/authStore";
import type { PaginatedResponse, TeacherClassManagementItem } from "@/types/contracts";
import { getErrorMessage } from "@/utils/errors";

const PAGE_SIZE = 8;

function formatRate(value: number) {
  return `${Math.round(value)}%`;
}

export function TeacherClassesScreen() {
  const { session } = useAuth();
  const [classes, setClasses] = useState<PaginatedResponse<TeacherClassManagementItem> | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    if (!session?.token) {
      return;
    }

    setError(null);
    try {
      setClasses(await fetchTeacherClasses(session.token, page, PAGE_SIZE, query.trim()));
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

  if (!classes) {
    return <LoadingState label="正在加载班级..." />;
  }

  return (
    <Screen title="班级列表" subtitle={`共 ${classes.total} 个班级，支持按名称、班级号搜索。`}>
      <AppCard>
        <AppInput
          label="搜索班级"
          value={query}
          onChangeText={updateQuery}
          placeholder="输入班级名称、班级号或重点问题"
          returnKeyType="search"
        />
      </AppCard>

      {classes.items.length === 0 ? (
        <EmptyState title="暂无班级" description="换个关键词试试，或回到 Web 后台创建班级。" />
      ) : (
        classes.items.map((item) => (
          <AppCard key={item.id} style={styles.classCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.badge}>{item.classCode ?? "暂无班级号"}</Text>
            </View>
            <Text style={styles.description}>{item.description}</Text>
            <View style={styles.metricGrid}>
              <InfoRow label="学生数" value={item.studentCount} />
              <InfoRow label="三关完成率" value={formatRate(item.completedRate)} />
              <InfoRow label="考试完成率" value={formatRate(item.examCompletionRate)} />
              <InfoRow label="待审批" value={item.pendingApplications ?? 0} />
            </View>
            <Text style={styles.focusText}>{item.focusLabel}</Text>
            <AppButton
              title="查看班级学生"
              onPress={() => router.push(`/teacher/class-detail?classId=${item.id}`)}
            />
          </AppCard>
        ))
      )}

      <PaginationControls
        page={classes.page}
        total={classes.total}
        totalPages={classes.totalPages}
        onPageChange={setPage}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  classCard: {
    gap: spacing.md,
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  title: {
    color: appColors.text,
    flex: 1,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 24,
    minWidth: 160,
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
  description: {
    color: appColors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  metricGrid: {
    gap: spacing.sm,
  },
  focusText: {
    backgroundColor: "#f7fbff",
    borderColor: appColors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: appColors.text,
    fontSize: 14,
    lineHeight: 21,
    padding: spacing.md,
  },
});
