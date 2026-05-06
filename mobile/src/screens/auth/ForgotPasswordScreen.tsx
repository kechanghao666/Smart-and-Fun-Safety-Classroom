import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Text } from "react-native";

import { resetPasswordWithAccount } from "@/api/auth";
import { AppButton } from "@/components/common/AppButton";
import { AppCard } from "@/components/common/AppCard";
import { AppInput } from "@/components/common/AppInput";
import { Screen } from "@/components/common/Screen";
import { appColors } from "@/constants/appTheme";
import { getErrorMessage } from "@/utils/errors";

export function ForgotPasswordScreen() {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleReset() {
    setSubmitting(true);
    try {
      await resetPasswordWithAccount({ account: account.trim(), password });
      Alert.alert("密码已重置", "请使用新密码登录。");
      router.replace("/login");
    } catch (error) {
      Alert.alert("重置失败", getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen title="忘记密码" subtitle="请输入账号，并设置一个新密码。">
      <AppCard>
        <AppInput label="账号" value={account} onChangeText={setAccount} />
        <AppInput label="新密码" value={password} onChangeText={setPassword} secureTextEntry />
        <AppButton title="确认重置" onPress={handleReset} loading={submitting} />
        <AppButton title="返回登录" variant="secondary" onPress={() => router.replace("/login")} />
        <Text style={{ color: appColors.textMuted, lineHeight: 20 }}>
          如果账号被管理员停用，请联系平台管理员处理。
        </Text>
      </AppCard>
    </Screen>
  );
}
