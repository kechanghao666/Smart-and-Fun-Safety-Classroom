import React, { useCallback, useEffect, useState } from "react";
import { Text } from "react-native";

import { fetchStudentGrowth } from "@/api/student";
import { AppCard } from "@/components/common/AppCard";
import { InfoRow } from "@/components/common/InfoRow";
import { Screen } from "@/components/common/Screen";
import { ErrorState, LoadingState } from "@/components/common/StateViews";
import { appColors } from "@/constants/appTheme";
import { useAuth } from "@/store/authStore";
import type { StudentGrowthResponse } from "@/types/contracts";
import { getErrorMessage } from "@/utils/errors";

export function StudentGrowthScreen() {
  const { session } = useAuth();
  const [growth, setGrowth] = useState<StudentGrowthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.token) {
      return;
    }

    setError(null);
    try {
      setGrowth(await fetchStudentGrowth(session.token));
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

  if (!growth) {
    return <LoadingState />;
  }

  return (
    <Screen title="成长档案" subtitle="查看你的成长积分、形象和能力标签。">
      <AppCard>
        <Text style={{ color: appColors.text, fontSize: 22, fontWeight: "900" }}>
          {growth.characterName}
        </Text>
        <Text style={{ color: appColors.textMuted, lineHeight: 22 }}>{growth.growthSummary}</Text>
        <InfoRow label="成长积分" value={growth.totalGrowthPoints} />
        <InfoRow label="阶段" value={growth.stageLabel} />
        <InfoRow label="外观" value={growth.currentAppearance} />
        <InfoRow label="能力" value={growth.currentAbilityTag} />
        <InfoRow label="场景" value={growth.currentScene} />
      </AppCard>
    </Screen>
  );
}
