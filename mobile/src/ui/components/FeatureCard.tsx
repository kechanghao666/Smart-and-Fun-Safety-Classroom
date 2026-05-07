import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppTheme } from "@/ui/theme/AppTheme";

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
  tone?: "mint" | "blue" | "amber" | "rose";
}

const toneStyles = {
  mint: { backgroundColor: AppTheme.colors.primarySoft, color: AppTheme.colors.primary, wash: "#F4FFFA" },
  blue: { backgroundColor: AppTheme.colors.secondarySoft, color: AppTheme.colors.secondary, wash: "#F7FBFF" },
  amber: { backgroundColor: AppTheme.colors.accentSoft, color: AppTheme.colors.warning, wash: "#FFFCF4" },
  rose: { backgroundColor: AppTheme.colors.dangerSoft, color: AppTheme.colors.danger, wash: "#FFF8F7" },
};

export function FeatureCard({ icon, title, description, onPress, tone = "mint" }: FeatureCardProps) {
  const toneStyle = toneStyles[tone];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, { backgroundColor: toneStyle.wash }, pressed && styles.pressed]}>
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: toneStyle.backgroundColor }]}>
          <View style={[styles.iconHalo, { borderColor: toneStyle.color }]} />
          <Text style={[styles.icon, { color: toneStyle.color }]}>{icon}</Text>
        </View>
        <View style={[styles.arrowCircle, { backgroundColor: toneStyle.backgroundColor }]}>
          <Text style={[styles.arrow, { color: toneStyle.color }]}>›</Text>
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text numberOfLines={2} style={styles.description}>
        {description}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppTheme.colors.surface,
    borderColor: "rgba(255,255,255,0.82)",
    borderRadius: AppTheme.radius.xl,
    borderWidth: 1,
    flex: 1,
    minHeight: 128,
    overflow: "hidden",
    padding: AppTheme.spacing.md,
    ...AppTheme.shadow,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: AppTheme.spacing.sm,
  },
  iconWrap: {
    alignItems: "center",
    borderRadius: 20,
    height: 44,
    justifyContent: "center",
    position: "relative",
    width: 44,
  },
  iconHalo: {
    borderRadius: 999,
    borderWidth: 1,
    height: 28,
    opacity: 0.32,
    position: "absolute",
    width: 28,
  },
  icon: {
    fontSize: 18,
    fontWeight: "900",
  },
  arrowCircle: {
    alignItems: "center",
    borderRadius: 999,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  arrow: {
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 24,
  },
  title: {
    color: AppTheme.colors.text,
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 22,
  },
  description: {
    color: AppTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: AppTheme.spacing.xxs,
  },
});
