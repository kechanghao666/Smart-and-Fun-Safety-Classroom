import React from "react";
import { router, type Href } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { appColors, spacing } from "@/constants/appTheme";
import { StudentBottomNav, type StudentBottomNavKey } from "@/ui/components/StudentBottomNav";

interface ScreenProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  contentStyle?: ViewStyle;
  keyboardAvoiding?: boolean;
  bottomNavActive?: StudentBottomNavKey;
  showBackButton?: boolean;
  backLabel?: string;
  backTo?: Href;
}

export function Screen({
  title,
  subtitle,
  children,
  contentStyle,
  keyboardAvoiding,
  bottomNavActive,
  showBackButton,
  backLabel = "返回",
  backTo,
}: ScreenProps) {
  function goBack() {
    if (backTo) {
      router.push(backTo);
      return;
    }
    router.back();
  }

  const content = (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.content, contentStyle, bottomNavActive && styles.contentWithBottomNav]}>
      {showBackButton && (
        <Pressable
          accessibilityRole="button"
          onPress={goBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}>
          <Text style={styles.backIcon}>‹</Text>
          <Text style={styles.backText}>{backLabel}</Text>
        </Pressable>
      )}
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      {children}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {keyboardAvoiding ? (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={12}
            style={styles.keyboardAvoiding}>
            {content}
          </KeyboardAvoidingView>
        ) : (
          content
        )}
        {bottomNavActive && (
          <View style={styles.bottomNavDock}>
            <StudentBottomNav active={bottomNavActive} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: appColors.background,
  },
  container: {
    flex: 1,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  content: {
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  contentWithBottomNav: {
    paddingBottom: 112,
  },
  backButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#ffffff",
    borderColor: appColors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    minHeight: 42,
    paddingHorizontal: spacing.md,
  },
  backButtonPressed: {
    opacity: 0.72,
  },
  backIcon: {
    color: appColors.text,
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 26,
  },
  backText: {
    color: appColors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  bottomNavDock: {
    bottom: 0,
    left: 0,
    padding: spacing.md,
    paddingTop: spacing.xs,
    position: "absolute",
    right: 0,
  },
  header: {
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  title: {
    color: appColors.text,
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 34,
  },
  subtitle: {
    color: appColors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
});
