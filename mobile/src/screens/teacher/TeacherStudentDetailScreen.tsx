import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Text } from "react-native";

import { fetchTeacherStudentDetail } from "@/api/teacher";
import { AppCard } from "@/components/common/AppCard";
import { InfoRow } from "@/components/common/InfoRow";
import { Screen } from "@/components/common/Screen";
import { ErrorState, LoadingState } from "@/components/common/StateViews";
import { appColors } from "@/constants/appTheme";
import { useAuth } from "@/store/authStore";
import type { TeacherStudentDetail } from "@/types/contracts";
import { getErrorMessage } from "@/utils/errors";
import { formatScore } from "@/utils/format";

export function TeacherStudentDetailScreen() {
  const { studentId } = useLocalSearchParams<{ studentId?: string }>();
  const { session } = useAuth();
  const [student, setStudent] = useState<TeacherStudentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.token || !studentId) {
      return;
    }

    setError(null);
    try {
      setStudent(await fetchTeacherStudentDetail(session.token, studentId));
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    }
  }, [session?.token, studentId]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  if (!student) {
    return <LoadingState />;
  }

  return (
    <Screen title={student.name} subtitle="查看这名学生的学习进度、错题和建议。">
      <AppCard>
        <InfoRow label="班级" value={student.className} />
        <InfoRow label="学号" value={student.studentNo ?? "-"} />
        <InfoRow label="考试成绩" value={formatScore(student.score)} />
        <Text style={{ color: appColors.textMuted, lineHeight: 22 }}>{student.growthSummary}</Text>
      </AppCard>
      <AppCard>
        <Text style={{ color: appColors.text, fontSize: 18, fontWeight: "900" }}>关卡进度</Text>
        {student.levelStatuses.map((level) => (
          <InfoRow
            key={level.levelId}
            label={level.title}
            value={`${level.status} · ${formatScore(level.score)}`}
          />
        ))}
      </AppCard>
      <AppCard>
        <Text style={{ color: appColors.text, fontSize: 18, fontWeight: "900" }}>错题与建议</Text>
        <Text style={{ color: appColors.textMuted, lineHeight: 22 }}>
          薄弱点：{student.wrongTopics.length ? student.wrongTopics.join("、") : "暂无明显薄弱点"}
        </Text>
        {student.recommendations.map((item) => (
          <Text key={item} style={{ color: appColors.textMuted, lineHeight: 22 }}>
            - {item}
          </Text>
        ))}
      </AppCard>
    </Screen>
  );
}
