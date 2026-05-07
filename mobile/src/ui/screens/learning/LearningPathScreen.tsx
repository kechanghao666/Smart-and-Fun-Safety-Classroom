import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateViews";
import { Screen } from "@/components/common/Screen";
import type { LevelProgress, StudentProgress } from "@/types/contracts";
import { getLevelStatusText, LevelCard } from "@/ui/components/LevelCard";
import { PrimaryActionButton } from "@/ui/components/PrimaryActionButton";
import { RemoteImage } from "@/ui/components/RemoteImage";
import { AppTheme } from "@/ui/theme/AppTheme";
import { getDefaultLevelImageUrl, getDefaultThemeImageUrl, resolveAssetUrl } from "@/utils/assetUrl";
import { previewStudentProgress } from "../previewData";
import { useLearningPathViewModel } from "./LearningPathViewModel";

function getLevelImageUrl(level: LevelProgress) {
  const guardianStage = level.guardianChallengeConfig?.stages.find((stage) => stage.sceneImageUrl);
  if (guardianStage?.sceneImageUrl) {
    return resolveAssetUrl(guardianStage.sceneImageUrl);
  }

  const guardianTool = level.guardianChallengeConfig?.stages.find((stage) => stage.toolImageUrl);
  return resolveAssetUrl(guardianTool?.toolImageUrl) ?? getDefaultLevelImageUrl(level.id);
}

function getCompletedCount(progress: StudentProgress) {
  return progress.levels.filter((level) => level.status === "completed").length;
}

function getNextLevel(progress: StudentProgress) {
  return (
    progress.levels.find((level) => level.status === "in_progress") ??
    progress.levels.find((level) => level.status === "available") ??
    progress.levels.find((level) => level.status !== "locked")
  );
}

interface LearningPathScreenProps {
  mode?: "overview" | "detail";
}

export function LearningPathScreen({ mode = "detail" }: LearningPathScreenProps) {
  const { state, reload } = useLearningPathViewModel();

  if (state.status === "loading") {
    return <LoadingState label="正在加载学习路径..." />;
  }

  if (state.status === "error") {
    return <ErrorState message={state.message} onRetry={reload} />;
  }

  if (state.status === "empty") {
    return (
      <EmptyState
        actionLabel="重新加载"
        description="暂时没有可学习的主题。"
        onAction={reload}
        title="暂无主题"
      />
    );
  }

  return <LearningPathContent mode={mode} progress={state.progress} />;
}

export function LearningPathContent({ mode = "detail", progress }: LearningPathScreenProps & { progress: StudentProgress }) {
  const completed = getCompletedCount(progress);
  const nextLevel = getNextLevel(progress);
  const examUnlocked = progress.exam.status !== "locked";
  const themeImageUrl = getDefaultThemeImageUrl();

  return (
    <Screen
      backTo="/student/subjects"
      bottomNavActive="learning"
      contentStyle={styles.screen}
      showBackButton={mode === "detail"}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>主题学习</Text>
          <Text style={styles.title}>{progress.themeTitle}</Text>
          <Text style={styles.subtitle}>沿着三关路径，一步一步解锁安全出行能力。</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeNumber}>{completed}/{progress.levels.length}</Text>
          <Text style={styles.badgeText}>已完成</Text>
        </View>
      </View>

      <View style={styles.themeCard}>
        <RemoteImage label={progress.themeTitle} style={styles.themeImage} uri={themeImageUrl} variant="theme" />
        <View style={styles.themeBody}>
          <Text style={styles.themeTitle}>道路安全星途</Text>
          <Text style={styles.themeDescription}>
            观察识别、路线判断、乘车守护三段式挑战，完成后进入主题测验。
          </Text>
          <View style={styles.themeMetaRow}>
            <Text style={styles.themeMeta}>成长积分 {progress.points}</Text>
            <Text style={styles.themeMeta}>徽章 {progress.badges.length}</Text>
            <Text style={styles.themeMeta}>考试 {getLevelStatusText(progress.exam.status)}</Text>
          </View>
          <PrimaryActionButton
            label={nextLevel ? `继续：${nextLevel.focus}` : examUnlocked ? "进入主题测验" : "查看学习路径"}
            onPress={() =>
              nextLevel
                ? router.push(`/student/level-intro?levelId=${nextLevel.id}`)
                : router.push(examUnlocked ? "/student/exams" : "/student/subject-detail")
            }
            style={styles.themeAction}
          />
        </View>
      </View>

      {mode === "overview" ? (
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>当前开放主题</Text>
          <Text style={styles.overviewText}>共 {progress.levels.length} 个挑战节点，完成后可进入考试测验。</Text>
          <PrimaryActionButton label="查看完整学习路径" onPress={() => router.push("/student/subject-detail")} />
        </View>
      ) : (
        <View style={styles.pathSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>闯关路径</Text>
            <Text style={styles.sectionHint}>点击节点进入挑战</Text>
          </View>
          {progress.levels.map((level, index) => (
            <LevelCard
              imageUrl={getLevelImageUrl(level)}
              imageVariant={level.id}
              index={index}
              key={level.id}
              level={level}
              onPress={() => router.push(`/student/level-intro?levelId=${level.id}`)}
              result={progress.levelResults[level.id]}
            />
          ))}
          <View style={styles.examCard}>
            <Text style={styles.examTitle}>主题测验</Text>
            <Text style={styles.examDescription}>
              三关完成后进入测验，提交后可查看结果、错题和复习建议。
            </Text>
            <View style={styles.examRow}>
              <Text style={styles.examStatus}>状态：{getLevelStatusText(progress.exam.status)}</Text>
              <Text style={styles.examStatus}>题量：{progress.exam.totalQuestions}</Text>
            </View>
            <PrimaryActionButton
              disabled={!examUnlocked}
              label={examUnlocked ? "进入考试测验" : "完成三关后解锁"}
              onPress={() => router.push("/student/exams")}
              variant={examUnlocked ? "primary" : "soft"}
            />
          </View>
        </View>
      )}
    </Screen>
  );
}

export function LearningPathScreenPreview() {
  return <LearningPathContent mode="detail" progress={previewStudentProgress} />;
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: AppTheme.colors.background,
    gap: AppTheme.spacing.md,
    paddingHorizontal: AppTheme.spacing.md,
    paddingTop: AppTheme.spacing.md,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: AppTheme.spacing.md,
    justifyContent: "space-between",
  },
  headerCopy: {
    flex: 1,
    gap: AppTheme.spacing.xxs,
  },
  kicker: {
    color: AppTheme.colors.primary,
    fontSize: 13,
    fontWeight: "900",
  },
  title: {
    color: AppTheme.colors.text,
    ...AppTheme.typography.heroTitle,
  },
  subtitle: {
    color: AppTheme.colors.textSecondary,
    ...AppTheme.typography.body,
  },
  badge: {
    alignItems: "center",
    backgroundColor: AppTheme.colors.primarySoft,
    borderRadius: AppTheme.radius.xl,
    padding: AppTheme.spacing.sm,
    width: 82,
  },
  badgeNumber: {
    color: AppTheme.colors.primary,
    fontSize: 20,
    fontWeight: "900",
  },
  badgeText: {
    color: AppTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: "900",
  },
  themeCard: {
    backgroundColor: AppTheme.colors.surface,
    borderColor: AppTheme.colors.border,
    borderRadius: AppTheme.radius.xl,
    borderWidth: 1,
    overflow: "hidden",
    ...AppTheme.shadow,
  },
  themeImage: {
    borderRadius: 0,
    minHeight: 168,
  },
  themeBody: {
    gap: AppTheme.spacing.sm,
    padding: AppTheme.spacing.lg,
  },
  themeTitle: {
    color: AppTheme.colors.text,
    ...AppTheme.typography.pageTitle,
  },
  themeDescription: {
    color: AppTheme.colors.textSecondary,
    ...AppTheme.typography.body,
  },
  themeMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: AppTheme.spacing.xs,
  },
  themeMeta: {
    backgroundColor: AppTheme.colors.surfaceSoft,
    borderRadius: AppTheme.radius.pill,
    color: AppTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: AppTheme.spacing.sm,
    paddingVertical: AppTheme.spacing.xxs,
  },
  themeAction: {
    alignSelf: "flex-start",
    minWidth: 170,
  },
  overviewCard: {
    backgroundColor: AppTheme.colors.surface,
    borderColor: AppTheme.colors.border,
    borderRadius: AppTheme.radius.xl,
    borderWidth: 1,
    gap: AppTheme.spacing.sm,
    padding: AppTheme.spacing.lg,
    ...AppTheme.shadow,
  },
  overviewTitle: {
    color: AppTheme.colors.text,
    ...AppTheme.typography.cardTitle,
  },
  overviewText: {
    color: AppTheme.colors.textSecondary,
    ...AppTheme.typography.body,
  },
  pathSection: {
    gap: AppTheme.spacing.md,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: AppTheme.colors.text,
    ...AppTheme.typography.pageTitle,
  },
  sectionHint: {
    color: AppTheme.colors.textMuted,
    fontSize: 12,
    fontWeight: "900",
  },
  examCard: {
    backgroundColor: AppTheme.colors.surface,
    borderColor: AppTheme.colors.border,
    borderRadius: AppTheme.radius.xl,
    borderWidth: 1,
    gap: AppTheme.spacing.sm,
    padding: AppTheme.spacing.lg,
    ...AppTheme.shadow,
  },
  examTitle: {
    color: AppTheme.colors.text,
    ...AppTheme.typography.cardTitle,
  },
  examDescription: {
    color: AppTheme.colors.textSecondary,
    ...AppTheme.typography.body,
  },
  examRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: AppTheme.spacing.sm,
  },
  examStatus: {
    color: AppTheme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "900",
  },
});
