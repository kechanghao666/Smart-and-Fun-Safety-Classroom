import type {
  TeacherClassSummary,
  TeacherStudentDetail,
  TeacherStudentSummary,
} from "../types";

export type TeacherAttentionLevel = "stable" | "watch" | "urgent";

export interface TeacherActionItem {
  id: string;
  title: string;
  detail: string;
}

export function getTeacherAttentionLevel(
  student:
    | TeacherStudentSummary
    | Pick<TeacherStudentDetail, "completedLevels" | "score" | "examStatus">,
): TeacherAttentionLevel {
  if (student.completedLevels <= 1) {
    return "urgent";
  }

  if (student.score !== null && student.score < 80) {
    return "urgent";
  }

  if (student.completedLevels === 2 || student.score === null) {
    return "watch";
  }

  return "stable";
}

export function getTeacherAttentionLabel(level: TeacherAttentionLevel) {
  if (level === "urgent") {
    return "需立即跟进";
  }

  if (level === "watch") {
    return "继续推进";
  }

  return "表现稳定";
}

export function buildTeacherDashboardActions(
  students: TeacherStudentSummary[],
  classSummaries: TeacherClassSummary[],
): TeacherActionItem[] {
  const urgentStudents = students.filter(
    (student) => getTeacherAttentionLevel(student) === "urgent",
  );
  const watchStudents = students.filter(
    (student) => getTeacherAttentionLevel(student) === "watch",
  );
  const lowCompletionClass = classSummaries
    .slice()
    .sort((left, right) => left.completedRate - right.completedRate)[0];

  return [
    {
      id: "urgent",
      title: "优先跟进高风险学生",
      detail:
        urgentStudents.length > 0
          ? `当前有 ${urgentStudents.length} 位学生需要优先跟进，建议先查看他们的学生详情页。`
          : "当前没有明显高风险学生，可以优先巩固整体班级节奏。",
    },
    {
      id: "class",
      title: "优先补弱班级",
      detail: lowCompletionClass
        ? `${lowCompletionClass.name} 的完成率相对更低，建议优先补强路口判断和盲区复习。`
        : "当前所有班级都已建立基础学习节奏。",
    },
    {
      id: "exam",
      title: "推动形成学习闭环",
      detail:
        watchStudents.length > 0
          ? `还有 ${watchStudents.length} 位学生处于“已推进但未完全收口”阶段，适合提醒完成考试或最后一关。`
          : "当前大部分学生已经形成较完整的主题学习闭环。",
    },
  ];
}

export function buildTeacherStudentActions(student: TeacherStudentDetail) {
  const levelActions = student.levelStatuses
    .filter((level) => level.status !== "completed")
    .map((level) => `优先推进 ${level.title}`);

  const followUpActions = [
    `围绕“${student.weakSpot}”安排一次课后口头追问`,
    student.examStatus.includes("未考试") || student.examStatus.includes("未解锁")
      ? "提醒尽快完成剩余任务，形成完整“三关 + 考试”闭环"
      : "引导回看错题与薄弱点，继续巩固已完成的主题内容",
  ];

  return [...levelActions, ...followUpActions].slice(0, 3);
}
