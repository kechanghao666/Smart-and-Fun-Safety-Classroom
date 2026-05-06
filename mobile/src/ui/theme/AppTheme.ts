import { Platform } from "react-native";

import { AppColors, AppGradients } from "./AppColors";
import { AppRadius, AppSpacing } from "./AppSpacing";
import { AppTypography } from "./AppTypography";

export const AppTheme = {
  colors: AppColors,
  gradients: AppGradients,
  radius: AppRadius,
  spacing: AppSpacing,
  typography: AppTypography,
  shadow: Platform.select({
    ios: {
      shadowColor: AppColors.shadow,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.1,
      shadowRadius: 24,
    },
    android: {
      elevation: 4,
    },
    default: {
      shadowColor: AppColors.shadow,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
    },
  }),
};

export type AppThemeType = typeof AppTheme;
