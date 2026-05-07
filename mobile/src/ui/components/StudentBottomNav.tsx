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
  route: string;
}[] = [
  { key: "home", label: "首页", route: "/student" },
  { key: "learning", label: "学习", route: "/student/subjects" },
  { key: "ai", label: "AI", route: "/student/ai" },
  { key: "growth", label: "成长", route: "/student/growth" },
  { key: "records", label: "记录", route: "/student/records" },
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
            <NavIcon selected={selected} type={item.key} />
            <Text style={[styles.label, selected && styles.selectedText]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function NavIcon({ selected, type }: { selected: boolean; type: StudentBottomNavKey }) {
  const color = selected ? AppTheme.colors.primary : AppTheme.colors.textMuted;
  const softColor = selected ? AppTheme.colors.primarySoft : AppTheme.colors.surfaceSoft;

  if (type === "home") {
    return (
      <View style={styles.iconCanvas}>
        <View style={[styles.homeRoof, { borderColor: color }]} />
        <View style={[styles.homeBody, { borderColor: color, backgroundColor: softColor }]} />
      </View>
    );
  }

  if (type === "learning") {
    return (
      <View style={styles.iconCanvas}>
        <View style={[styles.pathLineIcon, { backgroundColor: color }]} />
        <View style={[styles.pathDot, styles.pathDotOne, { borderColor: color, backgroundColor: softColor }]} />
        <View style={[styles.pathDot, styles.pathDotTwo, { borderColor: color, backgroundColor: softColor }]} />
        <View style={[styles.pathDot, styles.pathDotThree, { borderColor: color, backgroundColor: softColor }]} />
      </View>
    );
  }

  if (type === "ai") {
    return (
      <View style={[styles.aiChip, { borderColor: color, backgroundColor: softColor }]}>
        <Text style={[styles.aiText, { color }]}>AI</Text>
      </View>
    );
  }

  if (type === "growth") {
    return (
      <View style={styles.iconCanvas}>
        <View style={[styles.growthStem, { backgroundColor: color }]} />
        <View style={[styles.growthLeafLeft, { backgroundColor: softColor, borderColor: color }]} />
        <View style={[styles.growthLeafRight, { backgroundColor: softColor, borderColor: color }]} />
      </View>
    );
  }

  return (
    <View style={[styles.recordSheet, { borderColor: color, backgroundColor: softColor }]}>
      <View style={[styles.recordLine, { backgroundColor: color }]} />
      <View style={[styles.recordLine, { backgroundColor: color, width: 12 }]} />
      <View style={[styles.recordLine, { backgroundColor: color, width: 15 }]} />
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
  label: {
    color: AppTheme.colors.textMuted,
    fontSize: 11,
    fontWeight: "900",
  },
  selectedText: {
    color: AppTheme.colors.primary,
  },
  iconCanvas: {
    height: 24,
    position: "relative",
    width: 28,
  },
  homeRoof: {
    borderLeftWidth: 2,
    borderTopWidth: 2,
    height: 14,
    left: 7,
    position: "absolute",
    top: 2,
    transform: [{ rotate: "45deg" }],
    width: 14,
  },
  homeBody: {
    borderRadius: 5,
    borderWidth: 2,
    bottom: 2,
    height: 14,
    left: 5,
    position: "absolute",
    width: 18,
  },
  pathLineIcon: {
    borderRadius: 999,
    height: 18,
    left: 13,
    position: "absolute",
    top: 3,
    transform: [{ rotate: "28deg" }],
    width: 3,
  },
  pathDot: {
    borderRadius: 999,
    borderWidth: 2,
    height: 10,
    position: "absolute",
    width: 10,
  },
  pathDotOne: {
    left: 3,
    top: 12,
  },
  pathDotTwo: {
    left: 11,
    top: 6,
  },
  pathDotThree: {
    left: 19,
    top: 1,
  },
  aiChip: {
    alignItems: "center",
    borderRadius: 9,
    borderWidth: 2,
    height: 24,
    justifyContent: "center",
    minWidth: 28,
    paddingHorizontal: 3,
  },
  aiText: {
    fontSize: 11,
    fontWeight: "900",
  },
  growthStem: {
    borderRadius: 999,
    height: 14,
    left: 13,
    position: "absolute",
    top: 8,
    width: 3,
  },
  growthLeafLeft: {
    borderRadius: 999,
    borderWidth: 2,
    height: 13,
    left: 5,
    position: "absolute",
    top: 4,
    transform: [{ rotate: "-28deg" }],
    width: 16,
  },
  growthLeafRight: {
    borderRadius: 999,
    borderWidth: 2,
    height: 13,
    left: 12,
    position: "absolute",
    top: 2,
    transform: [{ rotate: "28deg" }],
    width: 16,
  },
  recordSheet: {
    borderRadius: 7,
    borderWidth: 2,
    gap: 3,
    height: 24,
    justifyContent: "center",
    paddingHorizontal: 5,
    width: 24,
  },
  recordLine: {
    borderRadius: 999,
    height: 2,
    width: 10,
  },
});
