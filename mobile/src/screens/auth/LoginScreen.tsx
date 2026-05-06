import { Redirect, router } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/common/AppButton";
import { AppCard } from "@/components/common/AppCard";
import { AppInput } from "@/components/common/AppInput";
import { Screen } from "@/components/common/Screen";
import { LoadingState } from "@/components/common/StateViews";
import { appColors, spacing } from "@/constants/appTheme";
import { useAuth } from "@/store/authStore";
import { getErrorMessage } from "@/utils/errors";

export function LoginScreen() {
  const { status, session, signIn } = useAuth();
  const [account, setAccount] = useState("student001");
  const [password, setPassword] = useState("123456");
  const [submitting, setSubmitting] = useState(false);

  if (status === "loading") {
    return <LoadingState label="正在恢复登录状态..." />;
  }

  if (session?.role === "student") {
    return <Redirect href="/student" />;
  }

  if (session?.role === "teacher") {
    return <Redirect href="/teacher" />;
  }

  async function handleLogin() {
    setSubmitting(true);
    try {
      await signIn(account.trim(), password);
    } catch (error) {
      Alert.alert("登录失败", getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.brand}>星途知学</Text>
        <Text style={styles.slogan}>把安全教育、AI 助学和课堂反馈装进手机里。</Text>
      </View>
      <AppCard>
        <Text style={styles.title}>账号密码登录</Text>
        <AppInput label="账号" value={account} onChangeText={setAccount} />
        <AppInput label="密码" value={password} onChangeText={setPassword} secureTextEntry />
        <AppButton title="登录" onPress={handleLogin} loading={submitting} />
        <View style={styles.actionRow}>
          <AppButton title="注册账号" variant="secondary" onPress={() => router.push("/register")} />
          <AppButton
            title="忘记密码"
            variant="ghost"
            onPress={() => router.push("/forgot-password")}
          />
        </View>
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: "center",
    minHeight: "100%",
  },
  hero: {
    gap: spacing.sm,
  },
  brand: {
    color: appColors.text,
    fontSize: 42,
    fontWeight: "900",
  },
  slogan: {
    color: appColors.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    color: appColors.text,
    fontSize: 24,
    fontWeight: "900",
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
});
