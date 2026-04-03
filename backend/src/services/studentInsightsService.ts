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
  getGrowthConfig,
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
    return "涓夊叧瀛︿範鍜屼富棰樿€冭瘯閮藉畬鎴愬緱寰堢ǔ瀹氾紝宸茬粡鍏峰杈冨畬鏁寸殑閬撹矾瀹夊叏鍒ゆ柇鑳藉姏銆?;
  }

  if (progress.levelResults["level-3"]) {
    return "涔樿溅闃叉姢鍜屽嚭琛屽噯澶囧姩浣滄帉鎻″緱姣旇緝瀹屾暣锛岃鏄庡畨鍏ㄤ範鎯鍦ㄥ舰鎴愩€?;
  }

  if (progress.levelResults["level-2"]) {
    return "璺嚎鍒ゆ柇鍜屽叧閿妭鐐硅瀵熸湁浜嗘槑鏄炬彁鍗囷紝姝ｅ湪褰㈡垚瀹屾暣鐨勯€氬瀹夊叏鎰忚瘑銆?;
  }

  if (progress.levelResults["level-1"]) {
    return "鍩虹瑙傚療涓庤瘑鍒凡缁忓惎鍔紝鑳藉璇嗗埆甯歌浜ら€氬厓绱犲拰鍗遍櫓琛屼负銆?;
  }

  return "宸茬粡寤虹珛瀛︿範璧风偣锛屾帴涓嬫潵瀹屾垚绗竴鍏冲悗浼氱湅鍒版洿娓呮櫚鐨勭粨鏋滃弽棣堛€?;
}

function buildFocusSummary(
  progress: Awaited<ReturnType<typeof buildStudentProgress>>,
  wrongItems: StudentExamReviewItem[],
) {
  if (progress.exam.status !== "completed") {
    return "寤鸿浼樺厛琛ュ畬鍓╀綑鍏冲崱鍜屼富棰樿€冭瘯锛屽舰鎴愬畬鏁村涔犻棴鐜€?;
  }

  if (!wrongItems.length) {
    return "褰撳墠娌℃湁閿欓闇€瑕佸洖鐪嬶紝鍙互缁х画閫氳繃 AI 鍔╂墜闂瓟宸╁浐閲嶇偣鐭ヨ瘑銆?;
  }

  return `寤鸿浼樺厛鍥炵湅 ${wrongItems.map((item) => item.reviewLabel).join("銆?)}锛屽苟瀹屾垚閿欓瀵瑰簲鐭ヨ瘑鐐归噸瀛︺€俙;
}

function buildNextSteps(
  progress: Awaited<ReturnType<typeof buildStudentProgress>>,
  wrongItems: StudentExamReviewItem[],
) {
  if (progress.exam.status === "locked") {
    return [
      "鎸夐『搴忓畬鎴愬墿浣欏叧鍗★紝涓夊叧鍏ㄩ儴瀹屾垚鍚庝細鑷姩瑙ｉ攣涓婚鑰冭瘯銆?,
      "姣忓叧瀹屾垚鍚庡厛鐪嬬粨绠楀弽棣堬紝鍐嶈繘鍏ヤ笅涓€鍏炽€?,
      "閬囧埌鍗′綇鏃跺彲鐩存帴鎵撳紑 AI 鍔╂墜鑾峰彇鏂瑰悜鎻愮ず銆?,
    ];
  }

  if (progress.exam.status === "available") {
    return [
      "涓婚鑰冭瘯宸茬粡瑙ｉ攣锛屽缓璁敖蹇畬鎴愯鍚庡珐鍥恒€?,
      "绛旈鍓嶅彲浠ュ厛鍥為【涓夊叧閲屾渶瀹规槗娣锋穯鐨勭煡璇嗙偣銆?,
      "鎻愪氦鑰冭瘯鍚庡啀鏍规嵁閿欓鍥炵湅缁撴灉鍋氶拡瀵规€у涔犮€?,
    ];
  }

  if (wrongItems.length) {
    return [
      "鍏堟煡鐪嬮敊棰樿В鏋愶紝鐞嗚В瀛︾敓绛旀鍜屾纭瓟妗堢殑宸紓銆?,
      "渚濇瀹屾垚閿欓瀵瑰簲鐭ヨ瘑鐐归噸瀛︼紝棰嗗彇棰濆鎴愰暱鍊煎鍔便€?,
      "鍐嶅洖鍒?AI 鍔╂墜缁х画鍥寸粫鏂戦┈绾裤€佺洸鍖恒€佸畨鍏ㄥ甫绛夐噸鐐瑰彂闂€?,
    ];
  }

  return [
    "淇濇寔褰撳墠瀛︿範鑺傚锛岀户缁€氳繃 AI 鍔╂墜宸╁浐閬撹矾瀹夊叏涓婚鐭ヨ瘑銆?,
    "鍙湪鎴愰暱妗ｆ椤垫煡鐪嬫柊瑙ｉ攣鐨勫瑙傘€佽兘鍔涙爣绛惧拰鍦烘櫙銆?,
    "涓嬫杩涘叆棣栭〉鏃讹紝缁х画瀛︿範鍏ュ彛浼氳嚜鍔ㄥ洖鍒版渶杩戜竴娆″仠鐣欎綅缃€?,
  ];
}

function buildAbilityTags(levelRows: LevelProgressRow[], examScore: number | null) {
  const tags: string[] = [];

  if (levelRows.find((row) => row.level_id === "level-1" && row.status === "completed")) {
    tags.push("浜ら€氳瘑鍒?);
  }
  if (levelRows.find((row) => row.level_id === "level-2" && row.status === "completed")) {
    tags.push("鍦烘櫙鍒ゆ柇");
  }
  if (levelRows.find((row) => row.level_id === "level-3" && row.status === "completed")) {
    tags.push("鍑鸿闃叉姢");
  }
  if (examScore !== null && examScore >= 90) {
    tags.push("缁煎悎瀹夊叏鍒ゆ柇");
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
      suggestion: "瀹屾垚涓婚鑰冭瘯鍚庯紝鍙湪杩欓噷鏌ョ湅閿欓銆佹纭瓟妗堝拰寤鸿鍥為【鍐呭銆?,
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
        ? `寤鸿浼樺厛鍥為【 ${wrongItems.map((item) => item.reviewLabel).join("銆?)}锛屽畬鎴愰噸瀛﹀悗鍙幏寰楁垚闀垮鍔便€俙
        : "褰撳墠娌℃湁閿欓锛岀户缁繚鎸佽壇濂界殑閬撹矾瀹夊叏瀛︿範鐘舵€併€?,
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
    throw new HttpError(404, "鏈壘鍒拌閿欓瀵瑰簲鐨勫洖椤句换鍔°€?);
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
  const [growth, levelRows, submission, growthConfig] = await Promise.all([
    getGrowthProfile(userId),
    getLevelRows(userId),
    getLatestExamSubmission(userId),
    getGrowthConfig(),
  ]);

  if (!growth) {
    throw new HttpError(404, "鏈壘鍒板鐢熸垚闀挎。妗堛€?);
  }

  const unlockedAbilityTags = buildAbilityTags(levelRows, submission?.score ?? null);
  const nextStage = [...growthConfig.stageThresholds]
    .sort((left, right) => left.threshold - right.threshold)
    .find((item) => item.threshold > growth.profile.total_points);

  return {
    characterName: "安全小卫士",
    linkedAiRole: "安全小助手",
    totalGrowthPoints: growth.profile.total_points,
    nextLevelTarget: growth.nextLevelTarget,
    nextLevelRemaining: growth.nextLevelRemaining,
    nextLevelLabel: nextStage?.label ?? null,
    streakDays: growth.profile.streak_days,
    stageLabel: growth.stage.stageLabel,
    growthSummary: growth.stage.growthSummary,
    currentAppearance: growth.profile.selected_appearance,
    currentScene: growth.profile.selected_scene,
    currentAbilityTag:
      unlockedAbilityTags[unlockedAbilityTags.length - 1] ??
      growth.dimensions.find((item) => item.id === "safety")?.currentUnlockLabel ??
      "安全观察",
    dimensions: growth.dimensions,
    unlockedAppearances: growth.unlockedAppearances,
    unlockedAbilityTags,
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
      title: "瀹屾垚鎯呭喌鍗＄墖",
      summary: `褰撳墠宸插畬鎴?${completedLevels} / ${progress.levels.length} 鍏筹紝鑰冭瘯鐘舵€佷负 ${progress.exam.status}銆俙,
      bullets: [
        `涓婚鍚嶇О锛?{progress.themeTitle}`,
        `鏈€杩戝涔犱綅缃細${progress.lastVisitedRoute}`,
        progress.exam.status === "completed"
          ? `鑰冭瘯鎴愮哗锛?{progress.exam.score ?? 0} 鍒哷
          : "鑰冭瘯灏氭湭瀹屾垚锛屾彁浜ゅ悗浼氱敓鎴愬畬鏁撮敊棰樺弽棣堛€?,
      ],
    },
    performance: {
      title: "琛ㄧ幇鎯呭喌鍗＄墖",
      summary: buildStrengthSummary(progress),
      bullets: [
        `琛ㄧ幇浜偣锛?{Object.values(progress.levelResults)[0]?.highlight ?? "鍏堝畬鎴愬叧鍗″悗鍙敓鎴愪寒鐐规€荤粨銆?}`,
        `闇€瑕佸姞寮猴細${buildFocusSummary(progress, review.items)}`,
        review.items.length
          ? `閿欓鏁伴噺锛?{review.items.length} 閬揱
          : "褰撳墠娌℃湁闇€瑕佸洖鐪嬬殑閿欓銆?,
      ],
    },
    suggestion: {
      title: "寤鸿鍗＄墖",
      summary: reportPrompt ?? "鏍规嵁褰撳墠瀹屾垚鐘舵€佺敓鎴愪笅涓€姝ュ缓璁€?,
      bullets: nextSteps,
    },
    reward: {
      title: "婵€鍔卞睍绀哄崱鐗?,
      summary: `褰撳墠宸茶幏寰?${progress.points} 绉垎鍜?${progress.badges.length} 鏋氬窘绔犮€俙,
      bullets: [
        `寰界珷锛?{progress.badges.join("銆?)}`,
        progress.exam.status === "completed" && review.items.length
          ? "瀹屾垚閿欓閲嶅鍚庤繕鑳界户缁鍙栭澶栨垚闀垮€煎鍔便€?
          : "缁х画瀹屾垚鍏冲崱鍜岃€冭瘯鍙幏寰楁柊鐨勬垚闀垮鍔便€?,
        `杩炵画瀛︿範澶╂暟锛?{growth.streakDays} 澶ー,
      ],
    },
    growth: {
      title: "鎴愰暱缁撴灉鍗＄墖",
      summary: `${growth.stageLabel}锛屽綋鍓嶆垚闀垮€?${growth.totalGrowthPoints}銆俙,
      bullets: [
        `宸茶В閿佸瑙傦細${growth.unlockedAppearances.join("銆?)}`,
        `宸茶В閿佽兘鍔涳細${growth.unlockedAbilityTags.join("銆?) || "瀹屾垚鍏冲崱鍚庤嚜鍔ㄨВ閿佽兘鍔涙爣绛?}`,
        `宸茶В閿佸満鏅細${growth.unlockedScenes.join("銆?)}`,
      ],
    },
  };
}


