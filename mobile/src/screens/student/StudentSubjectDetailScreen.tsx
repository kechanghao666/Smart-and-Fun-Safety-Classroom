import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { fetchStudentProgress } from "@/api/student";
import { AppButton } from "@/components/common/AppButton";
import { AppCard } from "@/components/common/AppCard";
import { Screen } from "@/components/common/Screen";
import { ErrorState, LoadingState } from "@/components/common/StateViews";
import { appColors, spacing } from "@/constants/appTheme";
import { useAuth } from "@/store/authStore";
import type { StudentProgress } from "@/types/contracts";
import { getErrorMessage } from "@/utils/errors";

export function StudentSubjectDetailScreen() {
  const { session } = useAuth();
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.token) {
      return;
    }

    setError(null);
    try {
      setProgress(await fetchStudentProgress(session.token));
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

  if (!progress) {
    return <LoadingState />;
  }

  return (
    <Screen title={progress.themeTitle} subtitle="按顺序完成三关，理解交通安全关键知识。">
      {progress.levels.map((level) => (
        <AppCard key={level.id}>
          <View style={styles.row}>
            <Text style={styles.title}>{level.title}</Text>
            <Text style={styles.badge}>{level.status}</Text>
          </View>
          <Text style={styles.description}>{level.description}</Text>
          <Text style={styles.meta}>重点：{level.focus} · {level.duration}</Text>
          <Text style={styles.meta}>
            {progress.levelResults[level.id]
              ? `${progress.levelResults[level.id]?.score} 分 · ${progress.levelResults[level.id]?.stars} 星`
              : "暂无成绩"}
          </Text>
          <AppButton
            title={level.status === "locked" ? "暂未解锁" : level.status === "completed" ? "查看 / 重玩这一关" : "进入这一关"}
            disabled={level.status === "locked"}
            onPress={() => router.push(`/student/level-intro?levelId=${level.id}`)}
          />
        </AppCard>
      ))}
      <AppCard>
        <Text style={styles.title}>主题测验</Text>
        <Text style={styles.description}>
          三关完成后进入道路安全主题测验。提交后可以查看成绩、结果和错题回看。
        </Text>
        <View style={styles.row}>
          <Text style={styles.meta}>当前状态：{progress.exam.status}</Text>
          <Text style={styles.meta}>成绩：{progress.exam.score ?? "暂无"}</Text>
        </View>
        <AppButton
          title={progress.exam.status === "locked" ? "完成三关后解锁" : "进入考试 / 测验"}
          disabled={progress.exam.status === "locked"}
          onPress={() => router.push("/student/exams")}
        />
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  title: {
    color: appColors.text,
    flex: 1,
    fontSize: 18,
    fontWeight: "900",
  },
  badge: {
    color: appColors.primary,
    fontWeight: "900",
  },
  description: {
    color: appColors.textMuted,
    lineHeight: 22,
  },
  meta: {
    color: appColors.text,
    fontWeight: "800",
  },
});
