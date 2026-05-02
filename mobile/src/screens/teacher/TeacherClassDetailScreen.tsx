import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Text } from "react-native";

import { fetchTeacherClassStudents } from "@/api/teacher";
import { AppCard } from "@/components/common/AppCard";
import { InfoRow } from "@/components/common/InfoRow";
import { Screen } from "@/components/common/Screen";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateViews";
import { appColors } from "@/constants/appTheme";
import { useAuth } from "@/store/authStore";
import type { PaginatedResponse, TeacherStudentSummary } from "@/types/contracts";
import { getErrorMessage } from "@/utils/errors";
import { formatScore } from "@/utils/format";

export function TeacherClassDetailScreen() {
  const { classId } = useLocalSearchParams<{ classId?: string }>();
  const { session } = useAuth();
  const [students, setStudents] = useState<PaginatedResponse<TeacherStudentSummary> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.token || !classId) {
      return;
    }

    setError(null);
    try {
      setStudents(await fetchTeacherClassStudents(session.token, classId));
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    }
  }, [classId, session?.token]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  if (!students) {
    return <LoadingState />;
  }

  return (
    <Screen title="班级详情" subtitle={`当前页展示 ${students.items.length} 名学生。`}>
      {students.items.length === 0 ? (
        <EmptyState title="暂无学生" />
      ) : (
        students.items.map((student) => (
          <AppCard key={student.id}>
            <Text style={{ color: appColors.text, fontSize: 18, fontWeight: "900" }}>
              {student.name}
            </Text>
            <InfoRow label="三关进度" value={`${student.completedLevels}/3`} />
            <InfoRow label="考试" value={student.examStatus} />
            <InfoRow label="成绩" value={formatScore(student.score)} />
          </AppCard>
        ))
      )}
    </Screen>
  );
}
