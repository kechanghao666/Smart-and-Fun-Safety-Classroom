import { Redirect, router } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/common/AppButton";
import { AppCard } from "@/components/common/AppCard";
import { AppInput } from "@/components/common/AppInput";
import { Screen } from "@/components/common/Screen";
import { LoadingState } from "@/components/common/StateViews";
import { appColors, spacing } from "@/constants/appTheme";
import { useAuth } from "@/store/authStore";
import type { UserRole } from "@/types/contracts";
import { getErrorMessage } from "@/utils/errors";

const roles: { label: string; value: Exclude<UserRole, "admin"> }[] = [
  { label: "学生端", value: "student" },
  { label: "教师端", value: "teacher" },
];

export function RegisterScreen() {
  const { status, session, signUp } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Exclude<UserRole, "admin">>("student");
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

  async function handleRegister() {
    if (password !== confirmPassword) {
      Alert.alert("注册失败", "两次输入的密码不一致。");
      return;
    }

    setSubmitting(true);
    try {
      await signUp({
        account: account.trim(),
        password,
        displayName: displayName.trim(),
        role,
      });
    } catch (error) {
      Alert.alert("注册失败", getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.hero}>
        <View style={styles.heroOrb} />
        <Text style={styles.brand}>创建星途账号</Text>
        <Text style={styles.slogan}>移动端第一版支持学生和教师，管理员继续使用 Web 后台。</Text>
      </View>
      <AppCard style={styles.formCard}>
        <Text style={styles.title}>选择身份并填写信息</Text>
        <AppInput label="称呼" value={displayName} onChangeText={setDisplayName} />
        <AppInput label="注册账号" value={account} onChangeText={setAccount} />
        <View style={styles.roleRow}>
          {roles.map((item) => (
            <Pressable
              accessibilityRole="button"
              key={item.value}
              onPress={() => setRole(item.value)}
              style={[styles.roleChip, role === item.value && styles.roleChipActive]}>
              <Text style={[styles.roleText, role === item.value && styles.roleTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <AppInput label="设置密码" value={password} onChangeText={setPassword} secureTextEntry />
        <AppInput
          label="确认密码"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        <AppButton title="注册并进入 App" onPress={handleRegister} loading={submitting} />
        <AppButton title="返回登录" variant="secondary" onPress={() => router.replace("/login")} />
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
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
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 42,
  },
  slogan: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 15,
    lineHeight: 23,
  },
  formCard: {
    gap: spacing.md,
  },
  title: {
    color: appColors.text,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 28,
  },
  roleRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  roleChip: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: "#fff",
  },
  roleChipActive: {
    borderColor: appColors.primary,
    backgroundColor: appColors.surfaceSoft,
  },
  roleText: {
    color: appColors.text,
    fontWeight: "800",
  },
  roleTextActive: {
    color: appColors.primaryDark,
  },
});
