export function formatScore(score: number | null | undefined) {
  return typeof score === "number" ? `${score} 分` : "暂无成绩";
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "暂无记录";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}
