import type { LearningStatus } from "../types";

const labelMap: Record<LearningStatus, string> = {
  locked: "未解锁",
  available: "可进入",
  in_progress: "进行中",
  completed: "已完成",
};

export function StatusBadge({ status }: { status: LearningStatus }) {
  return (
    <span className={`status-badge status-badge--${status}`}>
      {labelMap[status]}
    </span>
  );
}

