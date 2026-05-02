import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { appColors } from "@/constants/appTheme";

export function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  label: {
    color: appColors.textMuted,
    fontSize: 14,
  },
  value: {
    color: appColors.text,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "right",
  },
});
