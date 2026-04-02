import { useEffect, useMemo, useState } from "react";
import { AdminEditorStatusBar } from "../../components/AdminEditorStatusBar";
import { themeManagementItems } from "../../data/mockData";
import { fetchAdminThemes } from "../../services/admin";
import { useAppState } from "../../state/AppState";
import type { ThemeManagementItem } from "../../types";
import { useEditableAdminResource } from "../../utils/useEditableAdminResource";

export function AdminThemesPage() {
  const { state } = useAppState();
  const canUseApi = state.authSource === "api" && Boolean(state.authToken);
  const editor = useEditableAdminResource<ThemeManagementItem[]>({
    storageKey: "admin-theme-management",
    fallbackData: themeManagementItems,
    enabled: canUseApi,
    fetcher: () => fetchAdminThemes(state.authToken ?? ""),
    dependencies: [state.authToken],
    fallbackMessage: "暂时无法获取主题管理数据，当前继续使用本地演示内容。",
  });
  const themes = editor.draftData;
  const [selectedId, setSelectedId] = useState(themes[0]?.id ?? "");

  useEffect(() => {
    setSelectedId((current) =>
      current && themes.some((item) => item.id === current) ? current : themes[0]?.id ?? "",
    );
  }, [themes]);

  const selectedTheme = useMemo(
    () => themes.find((item) => item.id === selectedId) ?? themes[0] ?? null,
    [selectedId, themes],
  );
  const openCount = themes.filter((item) => item.isOpen).length;
  const closedCount = themes.length - openCount;

  function updateTheme<K extends keyof ThemeManagementItem>(
    id: string,
    field: K,
    value: ThemeManagementItem[K],
  ) {
    editor.updateDraft((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  }

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--admin">
        <div>
          <span className="hero-banner__eyebrow">主题管理</span>
          <h1>维护主题名称、封面、简介、开放状态与排序</h1>
          <p>这一页负责管理主题入口信息，并决定哪些主题会对教师端和学生端开放。</p>
        </div>
      </section>

      <AdminEditorStatusBar
        source={editor.source}
        status={editor.status}
        isHydrating={editor.isHydrating}
        syncError={editor.syncError}
        hasUnsavedChanges={editor.hasUnsavedChanges}
        canRestoreBaseline={editor.canRestoreBaseline}
        lastSavedAt={editor.lastSavedAt}
        onSave={editor.saveChanges}
        onResetChanges={editor.resetChanges}
        onRestoreBaseline={editor.restoreBaseline}
      />

      <section className="card-grid card-grid--three">
        <article className="surface-card stat-card admin-summary-card">
          <span>主题总数</span>
          <strong>{themes.length}</strong>
          <p>当前首版仍以道路安全教育作为唯一正式开放主题。</p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>开放中</span>
          <strong>{openCount}</strong>
          <p>开放状态会影响学生端主题列表和教师端统计口径。</p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>待开放</span>
          <strong>{closedCount}</strong>
          <p>未开放主题可以先维护封面和简介，再决定正式上线时间。</p>
        </article>
      </section>

      <section className="management-layout">
        <div className="page-stack">
          {themes.length > 0 ? (
            themes.map((theme) => (
              <button
                key={theme.id}
                type="button"
                className={
                  theme.id === selectedTheme?.id
                    ? "management-list-card management-list-card--active"
                    : "management-list-card"
                }
                onClick={() => setSelectedId(theme.id)}
              >
                <div className="row-between">
                  <strong>{theme.title}</strong>
                  <span className="surface-tag">{theme.isOpen ? "开放中" : "待开放"}</span>
                </div>
                <p>{theme.description}</p>
                <span className="inline-note">封面标签：{theme.coverLabel}</span>
              </button>
            ))
          ) : (
            <article className="surface-card empty-state-card">
              <strong>当前没有主题数据</strong>
              <p>请先恢复同步 / 默认数据，或等待后端返回主题列表。</p>
            </article>
          )}
        </div>

        {selectedTheme ? (
          <article className="surface-card editor-panel">
            <span className="section-block__eyebrow">编辑主题</span>
            <h2>{selectedTheme.title}</h2>
            <div className="chip-row">
              <span className="surface-tag">{selectedTheme.isOpen ? "已开放" : "未开放"}</span>
              <span className="surface-tag">排序 {selectedTheme.sortOrder}</span>
              <span className="surface-tag">{selectedTheme.coverLabel}</span>
            </div>
            <div className="editor-grid">
              <label className="form-field">
                <span>主题名称</span>
                <input
                  value={selectedTheme.title}
                  onChange={(event) =>
                    updateTheme(selectedTheme.id, "title", event.target.value)
                  }
                />
              </label>
              <label className="form-field">
                <span>封面标签</span>
                <input
                  value={selectedTheme.coverLabel}
                  onChange={(event) =>
                    updateTheme(selectedTheme.id, "coverLabel", event.target.value)
                  }
                />
              </label>
              <label className="form-field form-field--wide">
                <span>主题简介</span>
                <textarea
                  rows={4}
                  value={selectedTheme.description}
                  onChange={(event) =>
                    updateTheme(selectedTheme.id, "description", event.target.value)
                  }
                />
              </label>
              <label className="form-field">
                <span>排序</span>
                <input
                  type="number"
                  value={selectedTheme.sortOrder}
                  onChange={(event) => {
                    const nextValue = Number(event.target.value);
                    updateTheme(
                      selectedTheme.id,
                      "sortOrder",
                      Number.isNaN(nextValue) ? 0 : nextValue,
                    );
                  }}
                />
              </label>
              <label className="form-field">
                <span>开放状态</span>
                <select
                  value={selectedTheme.isOpen ? "open" : "closed"}
                  onChange={(event) =>
                    updateTheme(selectedTheme.id, "isOpen", event.target.value === "open")
                  }
                >
                  <option value="open">开放</option>
                  <option value="closed">关闭</option>
                </select>
              </label>
            </div>

            <div className="card-grid card-grid--two">
              <article className="feedback-box">
                <strong>页面联动</strong>
                <p>开放状态会影响学生端主题卡入口，排序会影响主题展示顺序。</p>
              </article>
              <article className="feedback-box">
                <strong>保存说明</strong>
                <p>保存只会写入当前浏览器的本地工作稿，不会直接修改服务器配置。</p>
              </article>
            </div>
          </article>
        ) : (
          <article className="surface-card empty-state-card">
            <strong>请选择一个主题</strong>
            <p>左侧选中主题后，就可以在这里维护标题、封面和开放状态。</p>
          </article>
        )}
      </section>
    </div>
  );
}
