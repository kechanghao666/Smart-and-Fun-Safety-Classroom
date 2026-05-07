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
        <View style={styles.heroOrb} />
        <Text style={styles.brand}>星途知学</Text>
        <Text style={styles.slogan}>把安全教育、AI 助学和课堂反馈装进手机里。</Text>
        <View style={styles.chipRow}>
          <Text style={styles.heroChip}>游戏化闯关</Text>
          <Text style={styles.heroChip}>AI 引导</Text>
          <Text style={styles.heroChip}>教师可看</Text>
        </View>
      </View>
      <AppCard style={styles.formCard}>
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
    paddingVertical: spacing.xl,
  },
  hero: {
    backgroundColor: appColors.primaryDark,
    borderRadius: 30,
    gap: spacing.sm,
    overflow: "hidden",
    padding: spacing.lg,
    position: "relative",
  },
  heroOrb: {
    backgroundColor: "rgba(134, 239, 172, 0.18)",
    borderRadius: 999,
    height: 190,
    position: "absolute",
    right: -70,
    top: -86,
    width: 190,
  },
  brand: {
    color: "#FFFFFF",
    fontSize: 44,
    fontWeight: "900",
    lineHeight: 52,
  },
  slogan: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 16,
    lineHeight: 24,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  heroChip: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 999,
    borderWidth: 1,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  formCard: {
    gap: spacing.md,
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
