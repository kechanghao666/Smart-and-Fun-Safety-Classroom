import React from "react";
import { Text } from "react-native";

import { AppButton } from "@/components/common/AppButton";
import { AppCard } from "@/components/common/AppCard";
import { InfoRow } from "@/components/common/InfoRow";
import { Screen } from "@/components/common/Screen";
import { appColors } from "@/constants/appTheme";
import { useAuth } from "@/store/authStore";

export function StudentProfileScreen() {
  const { session, signOut } = useAuth();

  return (
    <Screen bottomNavActive="home" showBackButton backTo="/student" title="个人中心" subtitle="管理当前登录状态。">
      <AppCard>
        <Text style={{ color: appColors.text, fontSize: 22, fontWeight: "900" }}>学生账号</Text>
        <InfoRow label="账号" value={session?.account ?? "-"} />
        <InfoRow label="称呼" value={session?.displayName ?? "-"} />
        <AppButton title="退出登录" variant="danger" onPress={signOut} />
      </AppCard>
    </Screen>
  );
}
