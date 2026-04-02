import type { EditorStatus } from "../utils/useEditableAdminResource";

interface AdminEditorStatusBarProps {
  source: "api" | "mock";
  status: EditorStatus;
  isHydrating: boolean;
  syncError: string;
  hasUnsavedChanges: boolean;
  canRestoreBaseline: boolean;
  lastSavedAt: string;
  onSave: () => void;
  onResetChanges: () => void;
  onRestoreBaseline: () => void;
}

const statusLabelMap: Record<EditorStatus, string> = {
  clean: "待编辑",
  dirty: "未保存改动",
  saved: "已保存",
  reset: "已回退",
  sync_error: "同步失败",
};

export function AdminEditorStatusBar({
  source,
  status,
  isHydrating,
  syncError,
  hasUnsavedChanges,
  canRestoreBaseline,
  lastSavedAt,
  onSave,
  onResetChanges,
  onRestoreBaseline,
}: AdminEditorStatusBarProps) {
  const summary = isHydrating
    ? "正在同步最新配置..."
    : syncError
      ? syncError
      : hasUnsavedChanges
        ? "当前工作稿存在未保存改动，点击“保存到本地”后会写入本地持久化。"
        : lastSavedAt
          ? `最近一次本地保存：${lastSavedAt}`
          : "当前工作台已经就绪，可以开始编辑。";

  return (
    <article className="surface-card editor-status-bar">
      <div className="row-between editor-status-bar__header">
        <div>
          <span className="section-block__eyebrow">编辑状态条</span>
          <h2>本地工作稿与同步快照</h2>
        </div>
        <div className="chip-row">
          <span className="surface-tag">
            {source === "api" ? "后端读取中 / 已同步" : "本地演示数据"}
          </span>
          <span className={`editor-status-pill editor-status-pill--${status}`}>
            {statusLabelMap[status]}
          </span>
        </div>
      </div>

      <p>{summary}</p>

      <div className="button-row">
        <button
          type="button"
          className="primary-button"
          disabled={!hasUnsavedChanges}
          onClick={onSave}
        >
          保存到本地
        </button>
        <button
          type="button"
          className="ghost-button"
          disabled={!hasUnsavedChanges}
          onClick={onResetChanges}
        >
          撤销未保存修改
        </button>
        <button
          type="button"
          className="ghost-button"
          disabled={!canRestoreBaseline}
          onClick={onRestoreBaseline}
        >
          恢复同步 / 默认数据
        </button>
      </div>
    </article>
  );
}
