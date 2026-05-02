import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Text } from "react-native";

import { fetchStudentProgress } from "@/api/student";
import { AppButton } from "@/components/common/AppButton";
import { AppCard } from "@/components/common/AppCard";
import { Screen } from "@/components/common/Screen";
import { ErrorState, LoadingState } from "@/components/common/StateViews";
import { appColors } from "@/constants/appTheme";
import { useAuth } from "@/store/authStore";
import type { StudentProgress } from "@/types/contracts";
import { getErrorMessage } from "@/utils/errors";

export function StudentSubjectsScreen() {
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
    <Screen title="主题学习" subtitle="移动端第一版先接入当前开放主题。">
      <AppCard>
        <Text style={{ color: appColors.text, fontSize: 22, fontWeight: "900" }}>
          {progress.themeTitle}
        </Text>
        <Text style={{ color: appColors.textMuted, lineHeight: 22 }}>
          共 {progress.levels.length} 个关卡，完成后可进入主题测验。
        </Text>
        <AppButton title="进入主题详情" onPress={() => router.push("/student/subject-detail")} />
      </AppCard>
    </Screen>
  );
}
