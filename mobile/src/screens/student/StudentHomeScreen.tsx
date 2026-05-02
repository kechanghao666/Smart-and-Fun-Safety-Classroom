import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { fetchStudentProgress } from "@/api/student";
import { AppButton } from "@/components/common/AppButton";
import { AppCard } from "@/components/common/AppCard";
import { InfoRow } from "@/components/common/InfoRow";
import { Screen } from "@/components/common/Screen";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateViews";
import { appColors, spacing } from "@/constants/appTheme";
import { useAuth } from "@/store/authStore";
import type { StudentProgress } from "@/types/contracts";
import { getErrorMessage } from "@/utils/errors";

export function StudentHomeScreen() {
  const { session } = useAuth();
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.token) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setProgress(await fetchStudentProgress(session.token));
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [session?.token]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  if (!progress) {
    return <EmptyState title="暂无学习数据" description="请稍后重新进入 App。" />;
  }

  return (
    <Screen
      title={`你好，${session?.displayName ?? session?.account ?? "同学"}`}
      subtitle="从主题学习开始，继续推进你的安全学习旅程。">
      <AppCard>
        <Text style={styles.cardTitle}>{progress.themeTitle}</Text>
        <InfoRow label="成长积分" value={progress.points} />
        <InfoRow label="徽章数量" value={progress.badges.length} />
        <InfoRow label="考试状态" value={progress.exam.status} />
      </AppCard>
      <View style={styles.grid}>
        <AppButton title="主题学习" onPress={() => router.push("/student/subjects")} />
        <AppButton title="考试 / 测验" variant="secondary" onPress={() => router.push("/student/exams")} />
        <AppButton title="错题回看" variant="secondary" onPress={() => router.push("/student/wrong-questions")} />
        <AppButton title="AI 助手" variant="secondary" onPress={() => router.push("/student/ai")} />
        <AppButton title="成长档案" variant="secondary" onPress={() => router.push("/student/growth")} />
        <AppButton title="学习记录" variant="secondary" onPress={() => router.push("/student/records")} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    color: appColors.text,
    fontSize: 20,
    fontWeight: "900",
  },
  grid: {
    gap: spacing.sm,
  },
});
