import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";

import { AppTheme } from "@/ui/theme/AppTheme";

interface PrimaryActionButtonProps {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "soft";
  style?: ViewStyle;
}

export function PrimaryActionButton({
  label,
  onPress,
  disabled,
  loading,
  variant = "primary",
  style,
}: PrimaryActionButtonProps) {
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
        <ActivityIndicator color={variant === "primary" ? AppTheme.colors.white : AppTheme.colors.primary} />
      ) : (
        <Text style={[styles.label, variant !== "primary" && styles.labelSecondary]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: AppTheme.radius.pill,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: AppTheme.spacing.lg,
  },
  primary: {
    backgroundColor: AppTheme.colors.primary,
    ...AppTheme.shadow,
  },
  secondary: {
    backgroundColor: AppTheme.colors.surface,
    borderColor: AppTheme.colors.border,
    borderWidth: 1,
  },
  soft: {
    backgroundColor: AppTheme.colors.primarySoft,
  },
  pressed: {
    opacity: 0.74,
    transform: [{ scale: 0.98 }],
  },
  label: {
    color: AppTheme.colors.white,
    fontSize: 16,
    fontWeight: "900",
  },
  labelSecondary: {
    color: AppTheme.colors.text,
  },
});
