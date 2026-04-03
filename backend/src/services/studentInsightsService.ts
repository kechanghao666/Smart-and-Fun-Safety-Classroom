import { getDb } from "../db/connection";
import type {
  ExamQuestion,
  ExamSubmissionRow,
  LevelProgressRow,
  StudentAiReportResponse,
  StudentExamReviewItem,
  StudentExamReviewResponse,
  StudentGrowthResponse,
  StudentRecordsResponse,
} from "../types/contracts";
import { HttpError } from "../utils/httpError";
import { getAiPromptByScene, getExamQuestionsFromDb } from "./courseContentService";
import {
  completeWrongQuestionReview,
  getGrowthProfile,
  getLatestLearningRecordTime,
  getLearningRecords,
  getReviewedQuestionMap,
} from "./growthService";
import { buildStudentProgress } from "./studentService";

async function getLatestExamSubmission(userId: string) {
  const db = await getDb();

  return db.get<ExamSubmissionRow>(
    `
      SELECT id, user_id, answers_json, score, wrong_question_ids_json, submitted_at
      FROM exam_submissions
      WHERE user_id = ?
      ORDER BY submitted_at DESC
      LIMIT 1
    `,
    userId,
  );
}

async function getLevelRows(userId: string) {
  const db = await getDb();
  const rows = await db.all<LevelProgressRow[]>(
    `
      SELECT
        user_id, level_id, status, score, stars, highlight, caution, ai_summary,
        started_at, completed_at, updated_at
      FROM level_progress
      WHERE user_id = ?
      ORDER BY level_id ASC
    `,
    userId,
  );

  return rows;
}

function buildStrengthSummary(progress: Awaited<ReturnType<typeof buildStudentProgress>>) {
  if (progress.exam.status === "completed" && progress.exam.wrongQuestionIds.length === 0) {
    return "三关学习和主题考试都完成得很稳定，已经具备较完整的道路安全判断能力。";
  }

  if (progress.levelResults["level-3"]) {
    return "乘车防护和出行准备动作掌握得比较完整，说明安全习惯正在形成。";
  }

  if (progress.levelResults["level-2"]) {
    return "路线判断和关键节点观察有了明显提升，正在形成完整的通学安全意识。";
  }

  if (progress.levelResults["level-1"]) {
    return "基础观察与识别已经启动，能够识别常见交通元素和危险行为。";
  }

  return "已经建立学习起点，接下来完成第一关后会看到更清晰的结果反馈。";
}

function buildFocusSummary(
  progress: Awaited<ReturnType<typeof buildStudentProgress>>,
  wrongItems: StudentExamReviewItem[],
) {
  if (progress.exam.status !== "completed") {
    return "建议优先补完剩余关卡和主题考试，形成完整学习闭环。";
  }

  if (!wrongItems.length) {
    return "当前没有错题需要回看，可以继续通过 AI 助手问答巩固重点知识。";
  }

  return `建议优先回看 ${wrongItems.map((item) => item.reviewLabel).join("、")}，并完成错题对应知识点重学。`;
}

function buildNextSteps(
  progress: Awaited<ReturnType<typeof buildStudentProgress>>,
  wrongItems: StudentExamReviewItem[],
) {
  if (progress.exam.status === "locked") {
    return [
      "按顺序完成剩余关卡，三关全部完成后会自动解锁主题考试。",
      "每关完成后先看结算反馈，再进入下一关。",
      "遇到卡住时可直接打开 AI 助手获取方向提示。",
    ];
  }

  if (progress.exam.status === "available") {
    return [
      "主题考试已经解锁，建议尽快完成课后巩固。",
      "答题前可以先回顾三关里最容易混淆的知识点。",
      "提交考试后再根据错题回看结果做针对性复习。",
    ];
  }

  if (wrongItems.length) {
    return [
      "先查看错题解析，理解学生答案和正确答案的差异。",
      "依次完成错题对应知识点重学，领取额外成长值奖励。",
      "再回到 AI 助手继续围绕斑马线、盲区、安全带等重点发问。",
    ];
  }

  return [
    "保持当前学习节奏，继续通过 AI 助手巩固道路安全主题知识。",
    "可在成长档案页查看新解锁的外观、能力标签和场景。",
    "下次进入首页时，继续学习入口会自动回到最近一次停留位置。",
  ];
}

function buildAbilityTags(levelRows: LevelProgressRow[], examScore: number | null) {
  const tags: string[] = [];

  if (levelRows.find((row) => row.level_id === "level-1" && row.status === "completed")) {
    tags.push("交通识别");
  }
  if (levelRows.find((row) => row.level_id === "level-2" && row.status === "completed")) {
    tags.push("场景判断");
  }
  if (levelRows.find((row) => row.level_id === "level-3" && row.status === "completed")) {
    tags.push("出行防护");
  }
  if (examScore !== null && examScore >= 90) {
    tags.push("综合安全判断");
  }

  return tags;
}

export async function getStudentRecords(userId: string): Promise<StudentRecordsResponse> {
  const [progress, records, lastLearnedAt] = await Promise.all([
    buildStudentProgress(userId),
    getLearningRecords(userId, 20),
    getLatestLearningRecordTime(userId),
  ]);

  return {
    overview: {
      themeId: progress.themeId,
      themeTitle: progress.themeTitle,
      completedLevels: progress.levels.filter((level) => level.status === "completed").length,
      totalLevels: progress.levels.length,
      examStatus: progress.exam.status,
      examScore: progress.exam.score,
      lastVisitedRoute: progress.lastVisitedRoute,
      lastLearnedAt,
      continueRoute: progress.lastVisitedRoute,
      badges: progress.badges,
      points: progress.points,
    },
    records,
  };
}

export async function getStudentExamReview(
  userId: string,
): Promise<StudentExamReviewResponse> {
  const [progress, submission, questions, reviewedMap] = await Promise.all([
    buildStudentProgress(userId),
    getLatestExamSubmission(userId),
    getExamQuestionsFromDb(),
    getReviewedQuestionMap(userId),
  ]);

  if (!submission || progress.exam.status !== "completed") {
    return {
      totalWrongQuestions: 0,
      suggestion: "完成主题考试后，可在这里查看错题、正确答案和建议回顾内容。",
      items: [],
    };
  }

  const answerMap = new Map<string, number>();

  try {
    const answers = JSON.parse(submission.answers_json) as Array<{
      questionId: string;
      selectedIndex: number;
    }>;
    for (const answer of answers) {
      answerMap.set(answer.questionId, answer.selectedIndex);
    }
  } catch {
    // ignore malformed legacy data and treat student answer as empty
  }

  const wrongItems = questions
    .filter((question) => progress.exam.wrongQuestionIds.includes(question.id))
    .map<StudentExamReviewItem>((question) => ({
      questionId: question.id,
      prompt: question.prompt,
      studentAnswer:
        typeof answerMap.get(question.id) === "number"
          ? question.options[answerMap.get(question.id)!] ?? null
          : null,
      correctAnswer: question.options[question.correctIndex] ?? "",
      explanation: question.explanation,
      reviewLevelId: question.reviewLevelId,
      reviewLabel: question.reviewLabel,
      reviewSuggestion: question.reviewSuggestion,
      reviewed: reviewedMap.has(question.id),
      reviewedAt: reviewedMap.get(question.id) ?? null,
    }));

  return {
    totalWrongQuestions: wrongItems.length,
    suggestion:
      wrongItems.length > 0
        ? `建议优先回顾 ${wrongItems.map((item) => item.reviewLabel).join("、")}，完成重学后可获得成长奖励。`
        : "当前没有错题，继续保持良好的道路安全学习状态。",
    items: wrongItems,
  };
}

export async function completeStudentWrongQuestionReview(
  userId: string,
  questionId: string,
) {
  const review = await getStudentExamReview(userId);
  const target = review.items.find((item) => item.questionId === questionId);

  if (!target) {
    throw new HttpError(404, "未找到该错题对应的回顾任务。");
  }

  await completeWrongQuestionReview(userId, questionId);

  return {
    review: (await getStudentExamReview(userId)).items.find(
      (item) => item.questionId === questionId,
    ),
    growth: await getStudentGrowth(userId),
  };
}

export async function getStudentGrowth(userId: string): Promise<StudentGrowthResponse> {
  const [growth, levelRows, submission] = await Promise.all([
    getGrowthProfile(userId),
    getLevelRows(userId),
    getLatestExamSubmission(userId),
  ]);

  if (!growth) {
    throw new HttpError(404, "未找到学生成长档案。");
  }

  return {
    characterName: "安全小卫士",
    linkedAiRole: "安全小助手",
    totalGrowthPoints: growth.profile.total_points,
    nextLevelTarget: growth.nextLevelTarget,
    nextLevelRemaining: growth.nextLevelRemaining,
    streakDays: growth.profile.streak_days,
    stageLabel: growth.stage.stageLabel,
    growthSummary: growth.stage.growthSummary,
    dimensions: growth.dimensions,
    unlockedAppearances: growth.unlockedAppearances,
    unlockedAbilityTags: buildAbilityTags(levelRows, submission?.score ?? null),
    unlockedScenes: growth.unlockedScenes,
    history: growth.history,
  };
}

export async function getStudentAiReport(
  userId: string,
): Promise<StudentAiReportResponse> {
  const [progress, review, growth, reportPrompt] = await Promise.all([
    buildStudentProgress(userId),
    getStudentExamReview(userId),
    getStudentGrowth(userId),
    getAiPromptByScene("report"),
  ]);
  const completedLevels = progress.levels.filter((level) => level.status === "completed").length;
  const nextSteps = buildNextSteps(progress, review.items);

  return {
    completion: {
      title: "完成情况卡片",
      summary: `当前已完成 ${completedLevels} / ${progress.levels.length} 关，考试状态为 ${progress.exam.status}。`,
      bullets: [
        `主题名称：${progress.themeTitle}`,
        `最近学习位置：${progress.lastVisitedRoute}`,
        progress.exam.status === "completed"
          ? `考试成绩：${progress.exam.score ?? 0} 分`
          : "考试尚未完成，提交后会生成完整错题反馈。",
      ],
    },
    performance: {
      title: "表现情况卡片",
      summary: buildStrengthSummary(progress),
      bullets: [
        `表现亮点：${Object.values(progress.levelResults)[0]?.highlight ?? "先完成关卡后可生成亮点总结。"}`,
        `需要加强：${buildFocusSummary(progress, review.items)}`,
        review.items.length
          ? `错题数量：${review.items.length} 道`
          : "当前没有需要回看的错题。",
      ],
    },
    suggestion: {
      title: "建议卡片",
      summary: reportPrompt ?? "根据当前完成状态生成下一步建议。",
      bullets: nextSteps,
    },
    reward: {
      title: "激励展示卡片",
      summary: `当前已获得 ${progress.points} 积分和 ${progress.badges.length} 枚徽章。`,
      bullets: [
        `徽章：${progress.badges.join("、")}`,
        progress.exam.status === "completed" && review.items.length
          ? "完成错题重学后还能继续领取额外成长值奖励。"
          : "继续完成关卡和考试可获得新的成长奖励。",
        `连续学习天数：${growth.streakDays} 天`,
      ],
    },
    growth: {
      title: "成长结果卡片",
      summary: `${growth.stageLabel}，当前成长值 ${growth.totalGrowthPoints}。`,
      bullets: [
        `已解锁外观：${growth.unlockedAppearances.join("、")}`,
        `已解锁能力：${growth.unlockedAbilityTags.join("、") || "完成关卡后自动解锁能力标签"}`,
        `已解锁场景：${growth.unlockedScenes.join("、")}`,
      ],
    },
  };
}
