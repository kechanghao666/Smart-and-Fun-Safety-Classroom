import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppTheme } from "@/ui/theme/AppTheme";

interface MascotBadgeProps {
  label?: string;
  level?: string;
}

export function MascotBadge({ label = "安全小星", level = "Lv.1" }: MascotBadgeProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.glow} />
      <View style={styles.head}>
        <View style={styles.eyeLeft} />
        <View style={styles.eyeRight} />
        <View style={styles.smile} />
      </View>
      <View style={styles.body}>
        <Text style={styles.bodyText}>★</Text>
      </View>
      <Text numberOfLines={1} style={styles.label}>
        {label}
      </Text>
      <Text style={styles.level}>{level}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    backgroundColor: AppTheme.colors.surface,
    borderColor: AppTheme.colors.border,
    borderRadius: AppTheme.radius.xl,
    borderWidth: 1,
    overflow: "hidden",
    padding: AppTheme.spacing.xs,
    width: 86,
  },
  glow: {
    backgroundColor: AppTheme.colors.primarySoft,
    borderRadius: 999,
    height: 70,
    position: "absolute",
    right: -20,
    top: -24,
    width: 70,
  },
  head: {
    backgroundColor: "#FFE1B8",
    borderRadius: 24,
    height: 48,
    position: "relative",
    width: 48,
  },
  eyeLeft: {
    backgroundColor: AppTheme.colors.text,
    borderRadius: 3,
    height: 6,
    left: 13,
    position: "absolute",
    top: 18,
    width: 6,
  },
  eyeRight: {
    backgroundColor: AppTheme.colors.text,
    borderRadius: 3,
    height: 6,
    position: "absolute",
    right: 13,
    top: 18,
    width: 6,
  },
  smile: {
    borderBottomColor: AppTheme.colors.text,
    borderBottomWidth: 2,
    borderRadius: 12,
    bottom: 12,
    height: 8,
    left: 16,
    position: "absolute",
    width: 16,
  },
  body: {
    alignItems: "center",
    backgroundColor: AppTheme.colors.primary,
    borderRadius: 16,
    height: 28,
    justifyContent: "center",
    marginTop: -4,
    width: 42,
  },
  bodyText: {
    color: AppTheme.colors.white,
    fontSize: 14,
    fontWeight: "900",
  },
  label: {
    color: AppTheme.colors.text,
    fontSize: 11,
    fontWeight: "900",
    marginTop: AppTheme.spacing.xxs,
    maxWidth: 70,
  },
  level: {
    color: AppTheme.colors.primary,
    fontSize: 10,
    fontWeight: "900",
  },
});
