import React from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

import { appColors, spacing } from "@/constants/appTheme";

interface AppInputProps extends TextInputProps {
  label: string;
}

export function AppInput({ label, style, ...props }: AppInputProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={appColors.textMuted}
        style={[styles.input, style]}
        autoCapitalize="none"
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  label: {
    color: appColors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  input: {
    backgroundColor: "#F8FBFF",
    borderColor: appColors.border,
    borderRadius: 20,
    borderWidth: 1,
    color: appColors.text,
    fontSize: 16,
    minHeight: 54,
    paddingHorizontal: 18,
  },
});
