import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

import { appColors } from '@/constants/appTheme';
import { AuthProvider } from '@/store/authStore';

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: appColors.background,
    card: appColors.background,
    primary: appColors.primary,
    text: appColors.text,
  },
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </AuthProvider>
  );
}
