import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { appColors, spacing } from "@/constants/appTheme";
import { AppButton } from "./AppButton";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({
  page,
  total,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  if (totalPages <= 1) {
    return (
      <Text style={styles.meta}>
        共 {total} 条，当前第 {page} 页
      </Text>
    );
  }

  return (
    <View style={styles.wrap}>
      <AppButton
        title="上一页"
        variant="secondary"
        disabled={page <= 1}
        onPress={() => onPageChange(Math.max(1, page - 1))}
        style={styles.button}
      />
      <Text style={styles.meta}>
        {page} / {totalPages} 页，共 {total} 条
      </Text>
      <AppButton
        title="下一页"
        variant="secondary"
        disabled={page >= totalPages}
        onPress={() => onPageChange(Math.min(totalPages, page + 1))}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  button: {
    minWidth: 92,
  },
  meta: {
    color: appColors.textMuted,
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
    textAlign: "center",
  },
});
