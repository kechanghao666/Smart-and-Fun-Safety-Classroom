import React from "react";
import { StyleSheet, Text } from "react-native";

import { AppButton } from "@/components/common/AppButton";
import { AppCard } from "@/components/common/AppCard";
import { InfoRow } from "@/components/common/InfoRow";
import { Screen } from "@/components/common/Screen";
import { appColors } from "@/constants/appTheme";
import { useAuth } from "@/store/authStore";

export function TeacherProfileScreen() {
  const { session, signOut } = useAuth();

  return (
    <Screen title="教师个人中心" subtitle="查看当前登录账号，复杂管理操作仍保留在 Web 后台。">
      <AppCard>
        <Text style={styles.title}>教师账号</Text>
        <InfoRow label="账号" value={session?.account ?? "-"} />
        <InfoRow label="称呼" value={session?.displayName ?? "-"} />
        <InfoRow label="角色" value="教师端" />
        <Text style={styles.description}>
          移动端第一版用于快速查看班级和学生学习情况；创建班级、审批、课程编辑等复杂操作建议继续使用 Web 端。
        </Text>
        <AppButton title="退出登录" variant="danger" onPress={signOut} />
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: appColors.text,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 28,
  },
  description: {
    color: appColors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
});
