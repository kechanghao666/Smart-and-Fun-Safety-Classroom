import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";

import { fetchTeacherDashboard } from "@/api/teacher";
import { AppButton } from "@/components/common/AppButton";
import { AppCard } from "@/components/common/AppCard";
import { InfoRow } from "@/components/common/InfoRow";
import { Screen } from "@/components/common/Screen";
import { ErrorState, LoadingState } from "@/components/common/StateViews";
import { appColors, spacing } from "@/constants/appTheme";
import { useAuth } from "@/store/authStore";
import type { TeacherDashboardResponse } from "@/types/contracts";
import { getErrorMessage } from "@/utils/errors";

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
    return <LoadingState />;
  }

  const focusStudents = dashboard.students.slice(0, 3);

  return (
    <Screen title="教师工作台" subtitle="移动端第一版聚焦快速查看班级与学生情况。">
      <AppCard>
        <InfoRow label="班级数量" value={dashboard.classSummaries.length} />
        <InfoRow label="关注学生" value={dashboard.students.length} />
      </AppCard>
      <View style={{ gap: spacing.sm }}>
        <AppButton title="查看班级" onPress={() => router.push("/teacher/classes")} />
        <AppButton
          title="查看学生"
          variant="secondary"
          onPress={() => router.push("/teacher/students")}
        />
      </View>
      {focusStudents.map((student) => (
        <AppCard key={student.id}>
          <Text style={{ color: appColors.text, fontSize: 18, fontWeight: "900" }}>
            {student.name}
          </Text>
          <Text style={{ color: appColors.textMuted }}>{student.className}</Text>
          <Text style={{ color: appColors.textMuted, lineHeight: 22 }}>{student.weakSpot}</Text>
        </AppCard>
      ))}
    </Screen>
  );
}
