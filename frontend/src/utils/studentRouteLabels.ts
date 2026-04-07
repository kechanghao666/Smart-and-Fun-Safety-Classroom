import type { LevelId, LevelProgress } from "../types";

const defaultLevelNameMap: Record<LevelId, string> = {
  "level-1": "第一关",
  "level-2": "第二关",
  "level-3": "第三关",
};

function resolveLevelName(levelId: LevelId, levels: LevelProgress[]) {
  return levels.find((level) => level.id === levelId)?.title ?? defaultLevelNameMap[levelId];
}

export function getStudentRouteLabel(
  route: string | null | undefined,
  levels: LevelProgress[],
) {
  if (!route) {
    return "学习首页";
  }

  if (route === "/student/home") {
    return "学习首页";
  }

  if (route === "/student/profile-setup") {
    return "资料补全页";
  }

  if (route === "/student/theme/road-safety") {
    return "道路安全主题地图";
  }

  if (route === "/student/theme/road-safety/exam") {
    return "主题考试";
  }

  if (route === "/student/theme/road-safety/exam/result") {
    return "考试结果页";
  }

  if (route === "/student/theme/road-safety/wrong-questions") {
    return "错题回看";
  }

  if (route === "/student/records") {
    return "学习记录";
  }

  if (route === "/student/growth") {
    return "成长档案";
  }

  if (route === "/student/ai") {
    return "AI 助手";
  }

  if (route === "/student/ai-report") {
    return "AI 结果卡";
  }

  const levelResultMatch = route.match(
    /^\/student\/theme\/road-safety\/level\/(level-[123])\/result$/,
  );

  if (levelResultMatch) {
    const levelId = levelResultMatch[1] as LevelId;
    return `${resolveLevelName(levelId, levels)}结算页`;
  }

  const levelMatch = route.match(/^\/student\/theme\/road-safety\/level\/(level-[123])$/);

  if (levelMatch) {
    const levelId = levelMatch[1] as LevelId;
    return resolveLevelName(levelId, levels);
  }

  return "学习页面";
}
