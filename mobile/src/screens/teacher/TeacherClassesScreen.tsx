import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Text } from "react-native";

import { fetchTeacherClasses } from "@/api/teacher";
import { AppButton } from "@/components/common/AppButton";
import { AppCard } from "@/components/common/AppCard";
import { InfoRow } from "@/components/common/InfoRow";
import { Screen } from "@/components/common/Screen";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateViews";
import { appColors } from "@/constants/appTheme";
import { useAuth } from "@/store/authStore";
import type { PaginatedResponse, TeacherClassManagementItem } from "@/types/contracts";
import { getErrorMessage } from "@/utils/errors";

export function TeacherClassesScreen() {
  const { session } = useAuth();
  const [classes, setClasses] = useState<PaginatedResponse<TeacherClassManagementItem> | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.token) {
      return;
    }

    setError(null);
    try {
      setClasses(await fetchTeacherClasses(session.token));
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

  if (!classes) {
    return <LoadingState />;
  }

  return (
    <Screen title="班级列表" subtitle={`共 ${classes.total} 个班级。`}>
      {classes.items.length === 0 ? (
        <EmptyState title="暂无班级" />
      ) : (
        classes.items.map((item) => (
          <AppCard key={item.id}>
            <Text style={{ color: appColors.text, fontSize: 18, fontWeight: "900" }}>
              {item.name}
            </Text>
            <Text style={{ color: appColors.textMuted, lineHeight: 22 }}>{item.description}</Text>
            <InfoRow label="学生数" value={item.studentCount} />
            <InfoRow label="班级号" value={item.classCode ?? "-"} />
            <AppButton
              title="查看班级详情"
              onPress={() => router.push(`/teacher/class-detail?classId=${item.id}`)}
            />
          </AppCard>
        ))
      )}
    </Screen>
  );
}
