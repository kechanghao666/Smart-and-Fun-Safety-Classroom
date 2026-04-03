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
  dirty: "未保存修改",
  saved: "已保存",
  reset: "已回退",
  sync_error: "更新失败",
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
    ? "正在更新最新配置..."
    : syncError
      ? syncError
      : hasUnsavedChanges
        ? "当前配置稿存在未保存修改，点击“保存当前修改”后会写入本地配置版本。"
        : lastSavedAt
          ? `最近一次保存时间：${lastSavedAt}`
          : "当前配置已经准备就绪，可以开始编辑。";

  return (
    <article className="surface-card editor-status-bar">
      <div className="row-between editor-status-bar__header">
        <div>
          <span className="section-block__eyebrow">编辑状态条</span>
          <h2>当前配置稿与数据版本</h2>
        </div>
        <div className="chip-row">
          <span className="surface-tag">
            {source === "api" ? "服务数据已接入" : "当前使用预置数据"}
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
          保存当前修改
        </button>
        <button
          type="button"
          className="ghost-button"
          disabled={!hasUnsavedChanges}
          onClick={onResetChanges}
        >
          撤销本次修改
        </button>
        <button
          type="button"
          className="ghost-button"
          disabled={!canRestoreBaseline}
          onClick={onRestoreBaseline}
        >
          恢复最近版本
        </button>
      </div>
    </article>
  );
}
