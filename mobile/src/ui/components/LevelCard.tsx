import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { LearningStatus, LevelProgress, LevelResult } from "@/types/contracts";
import { AppTheme } from "@/ui/theme/AppTheme";
import { RemoteImage, type RemoteImageVariant } from "./RemoteImage";

interface LevelCardProps {
  level: LevelProgress;
  index: number;
  result?: LevelResult;
  imageUrl?: string | null;
  imageVariant?: RemoteImageVariant;
  onPress: () => void;
}

const statusMeta: Record<LearningStatus, { label: string; color: string; background: string }> = {
  locked: {
    label: "未解锁",
    color: AppTheme.colors.textMuted,
    background: "#EEF2F6",
  },
  available: {
    label: "可开始",
    color: AppTheme.colors.primary,
    background: AppTheme.colors.primarySoft,
  },
  in_progress: {
    label: "进行中",
    color: AppTheme.colors.secondary,
    background: AppTheme.colors.secondarySoft,
  },
  completed: {
    label: "已完成",
    color: AppTheme.colors.success,
    background: AppTheme.colors.successSoft,
  },
};

export function getLevelStatusText(status: LearningStatus) {
  return statusMeta[status]?.label ?? "待开始";
}

export function LevelCard({ level, index, result, imageUrl, imageVariant = "default", onPress }: LevelCardProps) {
  const meta = statusMeta[level.status];
  const disabled = level.status === "locked";
  const isActive = level.status === "available" || level.status === "in_progress";

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isActive && styles.activeCard,
        disabled && styles.lockedCard,
        pressed && styles.pressed,
      ]}>
      <View style={styles.nodeColumn}>
        <View style={[styles.node, isActive && styles.activeNode, level.status === "completed" && styles.doneNode]}>
          <Text style={styles.nodeText}>{level.status === "completed" ? "✓" : index + 1}</Text>
        </View>
        <View style={styles.pathLine} />
      </View>
      <View style={styles.content}>
        <View style={styles.imageWrap}>
          <RemoteImage label={level.focus} style={styles.image} uri={imageUrl} variant={imageVariant} />
          <View style={[styles.statusBadge, { backgroundColor: meta.background }]}>
            <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{level.title}</Text>
        </View>
        <Text numberOfLines={2} style={styles.description}>
          {level.description}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{level.focus}</Text>
          <Text style={styles.metaText}>{level.duration}</Text>
          <Text style={styles.starText}>
            {result ? `${result.stars} 星 · ${result.score} 分` : disabled ? "完成上一关解锁" : "准备挑战"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppTheme.colors.surface,
    borderColor: "rgba(255,255,255,0.82)",
    borderRadius: AppTheme.radius.xl,
    borderWidth: 1,
    flexDirection: "row",
    gap: AppTheme.spacing.md,
    padding: AppTheme.spacing.md,
    ...AppTheme.shadow,
  },
  activeCard: {
    borderColor: AppTheme.colors.primary,
  },
  lockedCard: {
    opacity: 0.72,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  nodeColumn: {
    alignItems: "center",
    width: 42,
  },
  node: {
    alignItems: "center",
    backgroundColor: "#E8EEF4",
    borderRadius: 21,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  activeNode: {
    backgroundColor: AppTheme.colors.primary,
  },
  doneNode: {
    backgroundColor: AppTheme.colors.success,
  },
  nodeText: {
    color: AppTheme.colors.white,
    fontSize: 16,
    fontWeight: "900",
  },
  pathLine: {
    backgroundColor: AppTheme.colors.border,
    flex: 1,
    marginTop: AppTheme.spacing.xs,
    minHeight: 102,
    width: 3,
  },
  content: {
    flex: 1,
    gap: AppTheme.spacing.sm,
  },
  imageWrap: {
    borderRadius: AppTheme.radius.xl,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    minHeight: 168,
  },
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: AppTheme.spacing.sm,
    justifyContent: "space-between",
  },
  title: {
    color: AppTheme.colors.text,
    flex: 1,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 24,
  },
  statusBadge: {
    borderRadius: AppTheme.radius.pill,
    position: "absolute",
    right: AppTheme.spacing.sm,
    top: AppTheme.spacing.sm,
    paddingHorizontal: AppTheme.spacing.sm,
    paddingVertical: AppTheme.spacing.xxs,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "900",
  },
  description: {
    color: AppTheme.colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: AppTheme.spacing.xs,
  },
  metaText: {
    backgroundColor: AppTheme.colors.surfaceSoft,
    borderRadius: AppTheme.radius.pill,
    color: AppTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: AppTheme.spacing.sm,
    paddingVertical: AppTheme.spacing.xxs,
  },
  starText: {
    backgroundColor: AppTheme.colors.accentSoft,
    borderRadius: AppTheme.radius.pill,
    color: AppTheme.colors.warning,
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: AppTheme.spacing.sm,
    paddingVertical: AppTheme.spacing.xxs,
  },
});
