import React from "react";
import { Text } from "react-native";

import { AppButton } from "@/components/common/AppButton";
import { AppCard } from "@/components/common/AppCard";
import { InfoRow } from "@/components/common/InfoRow";
import { Screen } from "@/components/common/Screen";
import { appColors } from "@/constants/appTheme";
import { useAuth } from "@/store/authStore";

export function TeacherProfileScreen() {
  const { session, signOut } = useAuth();

  return (
    <Screen title="教师个人中心" subtitle="移动端第一版以查看数据为主。">
      <AppCard>
        <Text style={{ color: appColors.text, fontSize: 22, fontWeight: "900" }}>教师账号</Text>
        <InfoRow label="账号" value={session?.account ?? "-"} />
        <InfoRow label="称呼" value={session?.displayName ?? "-"} />
        <AppButton title="退出登录" variant="danger" onPress={signOut} />
      </AppCard>
    </Screen>
  );
}
