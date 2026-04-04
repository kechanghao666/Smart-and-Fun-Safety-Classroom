import type { LearningStatus } from "../types";

const labelMap: Record<LearningStatus, string> = {
  locked: "未开启",
  available: "已开启未完成",
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