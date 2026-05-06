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
  mint: { backgroundColor: AppTheme.colors.primarySoft, color: AppTheme.colors.primary },
  blue: { backgroundColor: AppTheme.colors.secondarySoft, color: AppTheme.colors.secondary },
  amber: { backgroundColor: AppTheme.colors.accentSoft, color: AppTheme.colors.warning },
  rose: { backgroundColor: AppTheme.colors.dangerSoft, color: AppTheme.colors.danger },
};

export function FeatureCard({ icon, title, description, onPress, tone = "mint" }: FeatureCardProps) {
  const toneStyle = toneStyles[tone];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={[styles.iconWrap, { backgroundColor: toneStyle.backgroundColor }]}>
        <Text style={[styles.icon, { color: toneStyle.color }]}>{icon}</Text>
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
    borderColor: AppTheme.colors.border,
    borderRadius: AppTheme.radius.xl,
    borderWidth: 1,
    flex: 1,
    minHeight: 118,
    padding: AppTheme.spacing.md,
    ...AppTheme.shadow,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
  iconWrap: {
    alignItems: "center",
    borderRadius: AppTheme.radius.lg,
    height: 40,
    justifyContent: "center",
    marginBottom: AppTheme.spacing.xs,
    width: 40,
  },
  icon: {
    fontSize: 18,
    fontWeight: "900",
  },
  title: {
    color: AppTheme.colors.text,
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 20,
  },
  description: {
    color: AppTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: AppTheme.spacing.xxs,
  },
});
