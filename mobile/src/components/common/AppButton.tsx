import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";

import { appColors } from "@/constants/appTheme";

interface AppButtonProps {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function AppButton({
  title,
  onPress,
  variant = "primary",
  loading,
  disabled,
  style,
}: AppButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        (pressed || disabled || loading) && styles.pressed,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#fff" : appColors.primary} />
      ) : (
        <Text style={[styles.label, variant !== "primary" && styles.labelSecondary]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: 20,
    justifyContent: "center",
    minHeight: 50,
    paddingHorizontal: 20,
  },
  primary: {
    backgroundColor: appColors.primary,
    shadowColor: appColors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 3,
  },
  secondary: {
    backgroundColor: appColors.surfaceSoft,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  danger: {
    backgroundColor: appColors.dangerSoft,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  label: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
  },
  labelSecondary: {
    color: appColors.text,
  },
});
