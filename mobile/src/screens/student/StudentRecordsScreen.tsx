import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { fetchStudentRecords } from "@/api/student";
import { AppButton } from "@/components/common/AppButton";
import { AppCard } from "@/components/common/AppCard";
import { InfoRow } from "@/components/common/InfoRow";
import { Screen } from "@/components/common/Screen";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateViews";
import { appColors, spacing } from "@/constants/appTheme";
import { useAuth } from "@/store/authStore";
import type { StudentRecordsResponse } from "@/types/contracts";
import { getErrorMessage } from "@/utils/errors";
import { formatDateTime, formatScore } from "@/utils/format";

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
    return <LoadingState />;
  }

  return (
    <Screen title="学习记录" subtitle="这里展示最近的学习动作和考试表现。">
      <AppCard>
        <InfoRow label="完成关卡" value={records.overview.completedLevels} />
        <InfoRow label="考试成绩" value={formatScore(records.overview.examScore)} />
        <InfoRow label="成长积分" value={records.overview.points} />
        <View style={styles.actionRow}>
          <AppButton title="考试" onPress={() => router.push("/student/exams")} style={styles.actionButton} />
          <AppButton
            title="错题"
            variant="secondary"
            onPress={() => router.push("/student/wrong-questions")}
            style={styles.actionButton}
          />
          <AppButton
            title="结果"
            variant="secondary"
            onPress={() => router.push("/student/exam-result")}
            style={styles.actionButton}
          />
        </View>
      </AppCard>
      {records.records.length === 0 ? (
        <EmptyState title="暂无记录" description="开始学习后，这里会出现你的学习足迹。" />
      ) : (
        records.records.map((item) => (
          <AppCard key={item.id}>
            <Text style={{ color: appColors.text, fontSize: 18, fontWeight: "900" }}>
              {item.title}
            </Text>
            <Text style={{ color: appColors.textMuted, lineHeight: 22 }}>{item.description}</Text>
            <Text style={{ color: appColors.textMuted }}>{formatDateTime(item.createdAt)}</Text>
          </AppCard>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
