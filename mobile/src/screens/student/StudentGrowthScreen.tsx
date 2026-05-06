import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  fetchStudentExamReview,
  fetchStudentGrowth,
  fetchStudentRecords,
} from "@/api/student";
import { AppCard } from "@/components/common/AppCard";
import { InfoRow } from "@/components/common/InfoRow";
import { Screen } from "@/components/common/Screen";
import { ErrorState, LoadingState } from "@/components/common/StateViews";
import { appColors, spacing } from "@/constants/appTheme";
import { useAuth } from "@/store/authStore";
import type {
  LearningStatus,
  StudentExamReviewResponse,
  StudentGrowthResponse,
  StudentRecordsResponse,
} from "@/types/contracts";
import { getErrorMessage } from "@/utils/errors";
import { formatScore } from "@/utils/format";

interface GrowthViewData {
  growth: StudentGrowthResponse;
  records: StudentRecordsResponse;
  review: StudentExamReviewResponse;
}

const statusLabels: Record<LearningStatus, string> = {
  locked: "未解锁",
  available: "可开始",
  in_progress: "进行中",
  completed: "已完成",
};

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function StudentGrowthScreen() {
  const { session } = useAuth();
  const [data, setData] = useState<GrowthViewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.token) {
      return;
    }

    setError(null);
    try {
      const [growth, records, review] = await Promise.all([
        fetchStudentGrowth(session.token),
        fetchStudentRecords(session.token),
        fetchStudentExamReview(session.token),
      ]);
      setData({ growth, records, review });
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

  if (!data) {
    return <LoadingState label="正在整理成长档案..." />;
  }

  const { growth, records, review } = data;
  const overview = records.overview;

  return (
    <Screen bottomNavActive="growth" title="成长档案" subtitle="用真实学习数据查看你的成长积分、阶段和能力标签。">
      <AppCard style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{growth.characterName.slice(0, 1)}</Text>
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.characterName}>{growth.characterName}</Text>
            <Text style={styles.summary}>{growth.growthSummary}</Text>
          </View>
        </View>
        <View style={styles.statGrid}>
          <StatTile label="成长积分" value={growth.totalGrowthPoints} />
          <StatTile label="完成关卡" value={`${overview.completedLevels}/${overview.totalLevels}`} />
          <StatTile label="考试成绩" value={formatScore(overview.examScore)} />
          <StatTile label="错题待回看" value={review.totalWrongQuestions} />
        </View>
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>当前成长状态</Text>
        <InfoRow label="阶段" value={growth.stageLabel} />
        <InfoRow label="能力标签" value={growth.currentAbilityTag} />
        <InfoRow label="当前外观" value={growth.currentAppearance} />
        <InfoRow label="展示场景" value={growth.currentScene} />
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>学习表现</Text>
        <InfoRow label="考试状态" value={statusLabels[overview.examStatus]} />
        <InfoRow label="徽章数量" value={overview.badges.length} />
        <InfoRow label="最近学习" value={overview.lastLearnedAt ? "已有记录" : "暂无记录"} />
        <InfoRow label="错题建议" value={review.suggestion || "暂无错题建议"} />
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    gap: spacing.lg,
  },
  heroTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: appColors.surfaceSoft,
    borderColor: appColors.border,
    borderRadius: 28,
    borderWidth: 1,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  avatarText: {
    color: appColors.primary,
    fontSize: 24,
    fontWeight: "900",
  },
  heroCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  characterName: {
    color: appColors.text,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 28,
  },
  summary: {
    color: appColors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  statTile: {
    backgroundColor: appColors.surfaceSoft,
    borderColor: appColors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexBasis: "47%",
    flexGrow: 1,
    minHeight: 82,
    padding: spacing.md,
  },
  statValue: {
    color: appColors.text,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 28,
  },
  statLabel: {
    color: appColors.textMuted,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  cardTitle: {
    color: appColors.text,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 24,
  },
});
