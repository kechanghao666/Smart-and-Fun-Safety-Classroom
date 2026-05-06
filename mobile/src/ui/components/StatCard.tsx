import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppTheme } from "@/ui/theme/AppTheme";

interface StatCardProps {
  label: string;
  value: string | number;
  tone?: "primary" | "success" | "warning" | "secondary";
}

export function StatCard({ label, value, tone = "primary" }: StatCardProps) {
  return (
    <View style={[styles.card, styles[tone]]}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: AppTheme.radius.lg,
    flex: 1,
    minHeight: 82,
    padding: AppTheme.spacing.md,
  },
  primary: {
    backgroundColor: AppTheme.colors.primarySoft,
  },
  success: {
    backgroundColor: AppTheme.colors.successSoft,
  },
  warning: {
    backgroundColor: AppTheme.colors.warningSoft,
  },
  secondary: {
    backgroundColor: AppTheme.colors.secondarySoft,
  },
  value: {
    color: AppTheme.colors.text,
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 30,
  },
  label: {
    color: AppTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "800",
    marginTop: AppTheme.spacing.xxs,
  },
});
