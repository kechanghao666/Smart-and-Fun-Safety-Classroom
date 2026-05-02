import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Text } from "react-native";

import { fetchTeacherStudents } from "@/api/teacher";
import { AppButton } from "@/components/common/AppButton";
import { AppCard } from "@/components/common/AppCard";
import { InfoRow } from "@/components/common/InfoRow";
import { Screen } from "@/components/common/Screen";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateViews";
import { appColors } from "@/constants/appTheme";
import { useAuth } from "@/store/authStore";
import type { PaginatedResponse, TeacherStudentSummary } from "@/types/contracts";
import { getErrorMessage } from "@/utils/errors";
import { formatScore } from "@/utils/format";

export function TeacherStudentsScreen() {
  const { session } = useAuth();
  const [students, setStudents] = useState<PaginatedResponse<TeacherStudentSummary> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.token) {
      return;
    }

    setError(null);
    try {
      setStudents(await fetchTeacherStudents(session.token));
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

  if (!students) {
    return <LoadingState />;
  }

  return (
    <Screen title="学生列表" subtitle={`共 ${students.total} 名学生。`}>
      {students.items.length === 0 ? (
        <EmptyState title="暂无学生" />
      ) : (
        students.items.map((student) => (
          <AppCard key={student.id}>
            <Text style={{ color: appColors.text, fontSize: 18, fontWeight: "900" }}>
              {student.name}
            </Text>
            <InfoRow label="班级" value={student.className} />
            <InfoRow label="三关" value={`${student.completedLevels}/3`} />
            <InfoRow label="成绩" value={formatScore(student.score)} />
            <Text style={{ color: appColors.textMuted, lineHeight: 22 }}>{student.weakSpot}</Text>
            <AppButton
              title="查看学生详情"
              onPress={() => router.push(`/teacher/student-detail?studentId=${student.id}`)}
            />
          </AppCard>
        ))
      )}
    </Screen>
  );
}
