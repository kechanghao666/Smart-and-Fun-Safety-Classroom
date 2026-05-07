import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateViews";
import { Screen } from "@/components/common/Screen";
import type { LearningStatus, StudentProgress } from "@/types/contracts";
import { FeatureCard } from "@/ui/components/FeatureCard";
import { MascotBadge } from "@/ui/components/MascotBadge";
import { PrimaryActionButton } from "@/ui/components/PrimaryActionButton";
import { StatCard } from "@/ui/components/StatCard";
import { AppTheme } from "@/ui/theme/AppTheme";
import { previewStudentProgress } from "../previewData";
import { useHomeViewModel } from "./HomeViewModel";

function statusText(status: LearningStatus) {
  const map: Record<LearningStatus, string> = {
    locked: "未解锁",
    available: "可开始",
    in_progress: "进行中",
    completed: "已完成",
  };
  return map[status] ?? "待开始";
}

function getContinueRoute(progress: StudentProgress) {
  if (progress.exam.status !== "locked" && progress.levels.every((level) => level.status === "completed")) {
    return "/student/exams" as const;
  }
  return "/student/subject-detail" as const;
}

function getProgressRatio(progress: StudentProgress) {
  if (!progress.levels.length) {
    return 0;
  }
  const completed = progress.levels.filter((level) => level.status === "completed").length;
  return completed / progress.levels.length;
}

export function HomeScreen() {
  const { displayName, profile, state, reload } = useHomeViewModel();

  if (state.status === "loading") {
    return <LoadingState label="正在打开你的学习星图..." />;
  }

  if (state.status === "error") {
    return <ErrorState message={state.message} onRetry={reload} />;
  }

  if (state.status === "empty") {
    return (
      <EmptyState
        actionLabel="重新加载"
        description="暂时没有拿到学习数据，请确认网络或稍后再试。"
        onAction={reload}
        title="还没有学习数据"
      />
    );
  }

  return (
    <HomeContent
      displayName={displayName}
      profileLabel={profile?.avatarLabel ?? "安全小星"}
      profileLevel={profile?.stage ?? "Lv.1"}
      progress={state.progress}
    />
  );
}

export function HomeContent({
  displayName,
  profileLabel,
  profileLevel,
  progress,
}: {
  displayName: string;
  profileLabel: string;
  profileLevel: string;
  progress: StudentProgress;
}) {
  const completedLevels = progress.levels.filter((level) => level.status === "completed").length;
  const ratio = getProgressRatio(progress);

  const featureRows = [
    [
      {
        icon: "◆",
        title: "主题学习",
        description: "沿着路径完成三关挑战",
        route: "/student/subjects",
        tone: "mint" as const,
      },
      {
        icon: "✓",
        title: "考试测验",
        description: "完成关卡后检验掌握度",
        route: "/student/exams",
        tone: "blue" as const,
      },
    ],
    [
      {
        icon: "!",
        title: "错题回看",
        description: "复盘容易混淆的知识点",
        route: "/student/wrong-questions",
        tone: "rose" as const,
      },
      {
        icon: "AI",
        title: "AI 助手",
        description: "随时提问，获得短句引导",
        route: "/student/ai",
        tone: "amber" as const,
      },
    ],
    [
      {
        icon: "★",
        title: "成长档案",
        description: "查看积分、徽章和能力标签",
        route: "/student/growth",
        tone: "mint" as const,
      },
      {
        icon: "☰",
        title: "学习记录",
        description: "回看最近练习与通关轨迹",
        route: "/student/records",
        tone: "blue" as const,
      },
    ],
  ];

  return (
    <Screen bottomNavActive="home" contentStyle={styles.screen}>
      <View style={styles.hero}>
        <View style={styles.heroGlow} />
        <View style={styles.heroText}>
          <Text style={styles.kicker}>星途学习站</Text>
          <Text style={styles.heroTitle}>你好，{displayName}</Text>
          <Text style={styles.heroSubtitle}>今天继续完成 1 个安全挑战吧</Text>
        </View>
        <MascotBadge label={profileLabel} level={profileLevel} />
      </View>

      <View style={styles.progressCard}>
        <View style={styles.orbOne} />
        <View style={styles.orbTwo} />
        <View style={styles.progressTop}>
          <View style={styles.progressCopy}>
            <Text style={styles.progressLabel}>正在学习</Text>
            <Text style={styles.progressTitle}>{progress.themeTitle}</Text>
            <Text style={styles.progressHint}>观察、判断、守护，沿着三关路径拿到主题徽章。</Text>
          </View>
          <View style={styles.progressBadge}>
            <Text style={styles.progressBadgeValue}>{Math.round(ratio * 100)}%</Text>
            <Text style={styles.progressBadgeLabel}>完成度</Text>
          </View>
        </View>
        <View style={styles.statRow}>
          <StatCard label="成长积分" value={progress.points} />
          <StatCard label="徽章" tone="success" value={progress.badges.length} />
          <StatCard label="考试" tone="warning" value={statusText(progress.exam.status)} />
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.max(8, Math.round(ratio * 100))}%` }]} />
        </View>
        <View style={styles.progressFooter}>
          <Text style={styles.progressText}>
            已完成 {completedLevels}/{progress.levels.length} 关
          </Text>
          <Text style={styles.progressText}>下一步：{progress.exam.status !== "locked" ? "主题测验" : "继续闯关"}</Text>
        </View>
        <PrimaryActionButton
          label={progress.exam.status !== "locked" ? "继续测验" : "继续学习"}
          onPress={() => router.push(getContinueRoute(progress))}
          style={styles.continueButton}
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>快捷行动</Text>
        <Pressable onPress={() => router.push("/student/profile")}>
          <Text style={styles.profileLink}>个人中心</Text>
        </Pressable>
      </View>
      {featureRows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.featureRow}>
          {row.map((item) => (
            <FeatureCard
              description={item.description}
              icon={item.icon}
              key={item.title}
              onPress={() => router.push(item.route)}
              title={item.title}
              tone={item.tone}
            />
          ))}
        </View>
      ))}
    </Screen>
  );
}

export function HomeScreenPreview() {
  return (
    <HomeContent
      displayName="学生示例账号"
      profileLabel="机智观察员"
      profileLevel="小学高段"
      progress={previewStudentProgress}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: AppTheme.colors.background,
    gap: AppTheme.spacing.lg,
    paddingHorizontal: AppTheme.spacing.md,
    paddingTop: AppTheme.spacing.md,
  },
  hero: {
    alignItems: "center",
    backgroundColor: AppTheme.colors.surface,
    borderColor: "rgba(255,255,255,0.82)",
    borderRadius: AppTheme.radius.xl,
    borderWidth: 1,
    flexDirection: "row",
    gap: AppTheme.spacing.md,
    justifyContent: "space-between",
    overflow: "hidden",
    padding: AppTheme.spacing.md,
    position: "relative",
    ...AppTheme.shadow,
  },
  heroGlow: {
    backgroundColor: AppTheme.colors.primarySoft,
    borderRadius: 999,
    height: 150,
    left: -62,
    position: "absolute",
    top: -76,
    width: 150,
  },
  heroText: {
    flex: 1,
    gap: AppTheme.spacing.xxs,
  },
  kicker: {
    color: AppTheme.colors.primary,
    fontSize: 13,
    fontWeight: "900",
  },
  heroTitle: {
    color: AppTheme.colors.text,
    ...AppTheme.typography.heroTitle,
  },
  heroSubtitle: {
    color: AppTheme.colors.textSecondary,
    ...AppTheme.typography.body,
  },
  progressCard: {
    backgroundColor: "#0B4F4A",
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: AppTheme.radius.xl,
    borderWidth: 1,
    overflow: "hidden",
    padding: AppTheme.spacing.lg,
    position: "relative",
    ...AppTheme.shadow,
  },
  orbOne: {
    backgroundColor: "rgba(120, 255, 212, 0.18)",
    borderRadius: 90,
    height: 180,
    position: "absolute",
    right: -70,
    top: -80,
    width: 180,
  },
  orbTwo: {
    backgroundColor: "rgba(47, 128, 237, 0.22)",
    borderRadius: 72,
    bottom: -70,
    height: 144,
    left: -48,
    position: "absolute",
    width: 144,
  },
  progressLabel: {
    color: "#A7F3D0",
    fontSize: 13,
    fontWeight: "900",
  },
  progressTitle: {
    color: AppTheme.colors.white,
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 30,
    marginTop: AppTheme.spacing.xxs,
  },
  progressTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: AppTheme.spacing.md,
    justifyContent: "space-between",
  },
  progressCopy: {
    flex: 1,
    minWidth: 0,
  },
  progressHint: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21,
    marginTop: AppTheme.spacing.xs,
  },
  progressBadge: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderColor: "rgba(255,255,255,0.24)",
    borderRadius: AppTheme.radius.xl,
    borderWidth: 1,
    padding: AppTheme.spacing.sm,
    width: 82,
  },
  progressBadgeValue: {
    color: AppTheme.colors.white,
    fontSize: 22,
    fontWeight: "900",
  },
  progressBadgeLabel: {
    color: "rgba(255,255,255,0.74)",
    fontSize: 11,
    fontWeight: "900",
  },
  statRow: {
    flexDirection: "row",
    gap: AppTheme.spacing.xs,
    marginTop: AppTheme.spacing.md,
  },
  progressTrack: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: AppTheme.radius.pill,
    height: 12,
    marginTop: AppTheme.spacing.md,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: "#86EFAC",
    borderRadius: AppTheme.radius.pill,
    height: "100%",
  },
  progressFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: AppTheme.spacing.xs,
  },
  progressText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    fontWeight: "800",
  },
  continueButton: {
    alignSelf: "flex-start",
    backgroundColor: "#20C997",
    marginTop: AppTheme.spacing.md,
    minWidth: 154,
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
  profileLink: {
    color: AppTheme.colors.primary,
    fontSize: 13,
    fontWeight: "900",
  },
  featureRow: {
    flexDirection: "row",
    gap: AppTheme.spacing.sm,
  },
});
