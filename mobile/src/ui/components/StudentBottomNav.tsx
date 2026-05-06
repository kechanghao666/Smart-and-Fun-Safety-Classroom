import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppTheme } from "@/ui/theme/AppTheme";

export type StudentBottomNavKey = "home" | "learning" | "ai" | "growth" | "records";

interface StudentBottomNavProps {
  active: StudentBottomNavKey;
}

const items: {
  key: StudentBottomNavKey;
  label: string;
  icon: string;
  route: string;
}[] = [
  { key: "home", label: "首页", icon: "首", route: "/student" },
  { key: "learning", label: "学习", icon: "学", route: "/student/subjects" },
  { key: "ai", label: "AI", icon: "AI", route: "/student/ai" },
  { key: "growth", label: "成长", icon: "成", route: "/student/growth" },
  { key: "records", label: "记录", icon: "记", route: "/student/records" },
];

export function StudentBottomNav({ active }: StudentBottomNavProps) {
  return (
    <View style={styles.nav}>
      {items.map((item) => {
        const selected = item.key === active;
        return (
          <Pressable
            accessibilityRole="button"
            key={item.key}
            onPress={() => router.push(item.route)}
            style={({ pressed }) => [styles.item, selected && styles.selectedItem, pressed && styles.pressed]}>
            <Text style={[styles.icon, selected && styles.selectedText]}>{item.icon}</Text>
            <Text style={[styles.label, selected && styles.selectedText]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderColor: AppTheme.colors.border,
    borderRadius: AppTheme.radius.xl,
    borderWidth: 1,
    flexDirection: "row",
    gap: AppTheme.spacing.xxs,
    padding: AppTheme.spacing.xs,
    ...AppTheme.shadow,
  },
  item: {
    alignItems: "center",
    borderRadius: AppTheme.radius.lg,
    flex: 1,
    gap: 2,
    justifyContent: "center",
    minHeight: 56,
  },
  selectedItem: {
    backgroundColor: AppTheme.colors.primarySoft,
  },
  pressed: {
    opacity: 0.74,
  },
  icon: {
    color: AppTheme.colors.textMuted,
    fontSize: 15,
    fontWeight: "900",
  },
  label: {
    color: AppTheme.colors.textMuted,
    fontSize: 11,
    fontWeight: "900",
  },
  selectedText: {
    color: AppTheme.colors.primary,
  },
});
