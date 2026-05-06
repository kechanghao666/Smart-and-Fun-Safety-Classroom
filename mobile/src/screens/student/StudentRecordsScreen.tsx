import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { fetchStudentRecords } from "@/api/student";
import { AppButton } from "@/components/common/AppButton";
import { AppCard } from "@/components/common/AppCard";
import { InfoRow } from "@/components/common/InfoRow";
import { Screen } from "@/components/common/Screen";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateViews";
import { appColors, spacing } from "@/constants/appTheme";
import { useAuth } from "@/store/authStore";
import type { LearningRecordItem, LearningStatus, StudentRecordsResponse } from "@/types/contracts";
import { getErrorMessage } from "@/utils/errors";
import { formatDateTime, formatScore } from "@/utils/format";

const statusLabels: Record<LearningStatus, string> = {
  locked: "未解锁",
  available: "可开始",
  in_progress: "进行中",
  completed: "已完成",
};

const recordTypeLabels: Record<string, string> = {
  ai_chat: "AI 问答",
  exam_completed: "考试",
  growth_reward: "成长",
  level_completed: "关卡",
  level_replayed: "重玩",
  login: "登录",
  wrong_question_reviewed: "错题",
};

function getRecordTypeLabel(type: string) {
  return recordTypeLabels[type] ?? type;
}

function getRecordAction(item: LearningRecordItem) {
  if (item.route.includes("/exam/review") || item.type.includes("wrong")) {
    return {
      label: "查看错题",
      onPress: () => router.push("/student/wrong-questions"),
    };
  }

  if (item.route.includes("/exam")) {
    return {
      label: "查看考试",
      onPress: () => router.push("/student/exams"),
    };
  }

  const levelMatch = item.route.match(/level\/(level-[1-3])/);
  if (levelMatch?.[1]) {
    return {
      label: "查看关卡",
      onPress: () => router.push(`/student/level-intro?levelId=${levelMatch[1]}`),
    };
  }

  if (item.route.includes("/growth")) {
    return {
      label: "查看成长",
      onPress: () => router.push("/student/growth"),
    };
  }

  return null;
}

export function StudentRecordsScreen() {
  const { session } = useAuth();
  const [records, setRecords] = useState<StudentRecordsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.token) {
      return;
    }

    setError(null);
    try {
      setRecords(await fetchStudentRecords(session.token));
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

  if (!records) {
    return <LoadingState label="正在读取学习记录..." />;
  }

  return (
    <Screen bottomNavActive="records" title="学习记录" subtitle="按时间查看关卡、考试、错题回看和成长奖励。">
      <AppCard style={styles.overviewCard}>
        <Text style={styles.cardTitle}>学习概览</Text>
        <View style={styles.summaryGrid}>
          <InfoRow
            label="关卡进度"
            value={`${records.overview.completedLevels}/${records.overview.totalLevels}`}
          />
          <InfoRow label="考试状态" value={statusLabels[records.overview.examStatus]} />
          <InfoRow label="考试成绩" value={formatScore(records.overview.examScore)} />
          <InfoRow label="成长积分" value={records.overview.points} />
          <InfoRow label="徽章数量" value={records.overview.badges.length} />
          <InfoRow label="最近学习" value={formatDateTime(records.overview.lastLearnedAt)} />
        </View>
        <View style={styles.actionRow}>
          <AppButton title="考试" onPress={() => router.push("/student/exams")} style={styles.actionButton} />
          <AppButton
            title="错题"
            onPress={() => router.push("/student/wrong-questions")}
            style={styles.actionButton}
          />
          <AppButton
            title="结果"
            onPress={() => router.push("/student/exam-result")}
            style={styles.actionButton}
          />
        </View>
      </AppCard>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>最近动态</Text>
        <Text style={styles.sectionMeta}>{records.records.length} 条</Text>
      </View>

      {records.records.length === 0 ? (
        <EmptyState title="暂无记录" description="开始学习后，这里会出现你的学习足迹。" />
      ) : (
        records.records.map((item) => {
          const action = getRecordAction(item);

          return (
            <AppCard key={item.id} style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <Text style={styles.recordType}>{getRecordTypeLabel(item.type)}</Text>
                <Text style={styles.recordTime}>{formatDateTime(item.createdAt)}</Text>
              </View>
              <Text style={styles.recordTitle}>{item.title}</Text>
              <Text style={styles.recordDescription}>{item.description}</Text>
              {action && (
                <AppButton
                  title={action.label}
                  variant="secondary"
                  onPress={action.onPress}
                  style={styles.recordAction}
                />
              )}
            </AppCard>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  overviewCard: {
    gap: spacing.md,
  },
  cardTitle: {
    color: appColors.text,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 24,
  },
  summaryGrid: {
    gap: spacing.sm,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  actionButton: {
    flexBasis: "30%",
    flexGrow: 1,
    minWidth: 92,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: appColors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  sectionMeta: {
    color: appColors.textMuted,
    fontSize: 13,
    fontWeight: "800",
  },
  recordCard: {
    gap: spacing.sm,
  },
  recordHeader: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  recordType: {
    backgroundColor: appColors.surfaceSoft,
    borderRadius: 999,
    color: appColors.primary,
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  recordTime: {
    color: appColors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  recordTitle: {
    color: appColors.text,
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 24,
  },
  recordDescription: {
    color: appColors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  recordAction: {
    alignSelf: "flex-start",
    minWidth: 120,
  },
});
