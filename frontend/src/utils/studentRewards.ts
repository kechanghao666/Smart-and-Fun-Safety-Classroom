import type { StudentRewardProgress } from "../types";

export const WRONG_QUESTION_REVIEW_REWARD = 10;
export const STREAK_REWARD_POINTS: Record<number, number> = {
  3: 20,
  7: 40,
};
export const STREAK_REWARD_DAYS = Object.keys(STREAK_REWARD_POINTS).map((value) =>
  Number(value),
);

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function createInitialRewardProgress(): StudentRewardProgress {
  return {
    studyDates: [],
    claimedStreakDays: [],
    reviewedWrongQuestionIds: [],
  };
}

export function normalizeStudyDates(dates: string[]) {
  return [...new Set(dates)].sort((left, right) => left.localeCompare(right));
}

function parseDateKey(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`);
}

function formatDateKey(date: Date) {
  return getLocalDateKey(date);
}

function subtractDays(dateKey: string, amount: number) {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() - amount);
  return formatDateKey(date);
}

export function getCurrentStreakDays(studyDates: string[]) {
  const normalized = normalizeStudyDates(studyDates);

  if (normalized.length === 0) {
    return 0;
  }

  let streakDays = 1;
  let cursor = normalized[normalized.length - 1];

  for (let index = normalized.length - 2; index >= 0; index -= 1) {
    const expectedPrevious = subtractDays(cursor, 1);

    if (normalized[index] !== expectedPrevious) {
      break;
    }

    streakDays += 1;
    cursor = normalized[index];
  }

  return streakDays;
}

export function getAvailableStreakRewardDays(progress: StudentRewardProgress) {
  const streakDays = getCurrentStreakDays(progress.studyDates);

  return STREAK_REWARD_DAYS.filter(
    (day) => streakDays >= day && !progress.claimedStreakDays.includes(day),
  );
}

export function getNextStreakGoal(progress: StudentRewardProgress) {
  const streakDays = getCurrentStreakDays(progress.studyDates);

  return (
    STREAK_REWARD_DAYS.find(
      (day) => day > streakDays && !progress.claimedStreakDays.includes(day),
    ) ?? null
  );
}
