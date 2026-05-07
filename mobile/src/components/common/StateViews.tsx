import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { appColors, spacing } from "@/constants/appTheme";
import { AppButton } from "./AppButton";

export function LoadingState({ label = "正在加载..." }: { label?: string }) {
  return (
    <View style={styles.state}>
      <View style={styles.stateOrb}>
        <ActivityIndicator color={appColors.primary} />
      </View>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.state}>
      <View style={styles.stateOrb}>
        <Text style={styles.stateMark}>i</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.text}>{description}</Text>}
      {actionLabel && onAction && <AppButton title={actionLabel} variant="secondary" onPress={onAction} />}
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.state}>
      <View style={[styles.stateOrb, styles.errorOrb]}>
        <Text style={styles.errorMark}>!</Text>
      </View>
      <Text style={styles.title}>暂时加载失败</Text>
      <Text style={styles.text}>{message}</Text>
      {onRetry && <AppButton title="重新加载" variant="secondary" onPress={onRetry} />}
    </View>
  );
}

const styles = StyleSheet.create({
  state: {
    alignItems: "center",
    backgroundColor: appColors.background,
    flex: 1,
    gap: spacing.sm,
    justifyContent: "center",
    padding: spacing.lg,
  },
  stateOrb: {
    alignItems: "center",
    backgroundColor: appColors.surface,
    borderColor: appColors.border,
    borderRadius: 28,
    borderWidth: 1,
    height: 56,
    justifyContent: "center",
    shadowColor: appColors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    width: 56,
  },
  errorOrb: {
    backgroundColor: appColors.dangerSoft,
    borderColor: "#FFD4CF",
  },
  stateMark: {
    color: appColors.primary,
    fontSize: 22,
    fontWeight: "900",
  },
  errorMark: {
    color: appColors.danger,
    fontSize: 22,
    fontWeight: "900",
  },
  title: {
    color: appColors.text,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  text: {
    color: appColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
