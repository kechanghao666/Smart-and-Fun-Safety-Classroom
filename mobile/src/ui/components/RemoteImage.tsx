import { Image } from "expo-image";
import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View, ViewStyle } from "react-native";

import { AppTheme } from "@/ui/theme/AppTheme";

interface RemoteImageProps {
  uri?: string | null;
  label?: string;
  style?: ViewStyle;
}

export function RemoteImage({ uri, label = "学习场景", style }: RemoteImageProps) {
  const [loading, setLoading] = useState(Boolean(uri));
  const [failed, setFailed] = useState(false);

  if (!uri || failed) {
    return (
      <View style={[styles.placeholder, style]}>
        <Text style={styles.placeholderIcon}>◆</Text>
        <Text style={styles.placeholderText}>{label}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Image
        accessibilityLabel={label}
        contentFit="cover"
        onError={() => {
          setFailed(true);
          setLoading(false);
        }}
        onLoadEnd={() => setLoading(false)}
        onLoadStart={() => setLoading(true)}
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        transition={180}
      />
      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator color={AppTheme.colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppTheme.colors.surfaceSoft,
    borderRadius: AppTheme.radius.xl,
    minHeight: 148,
    overflow: "hidden",
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.58)",
    justifyContent: "center",
  },
  placeholder: {
    alignItems: "center",
    backgroundColor: AppTheme.colors.surfaceTint,
    borderColor: AppTheme.colors.border,
    borderRadius: AppTheme.radius.xl,
    borderStyle: "dashed",
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 148,
    overflow: "hidden",
    padding: AppTheme.spacing.md,
  },
  placeholderIcon: {
    color: AppTheme.colors.primary,
    fontSize: 24,
    fontWeight: "900",
  },
  placeholderText: {
    color: AppTheme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "800",
    marginTop: AppTheme.spacing.xs,
    textAlign: "center",
  },
});
