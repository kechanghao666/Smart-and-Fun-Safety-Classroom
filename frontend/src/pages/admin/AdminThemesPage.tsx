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
          <h1>维护主题列表、开放状态与学生端展示预览</h1>
          <p>这一页对应说明书中的“列表 + 编辑区 + 预览卡”结构，用来统一管理主题入口的展示效果和开放顺序。</p>
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
          <p>开放状态会直接影响学生端主题卡入口和教师端统计范围。</p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>待开放</span>
          <strong>{closedCount}</strong>
          <p>未开放主题可以先维护封面、简介和排序，再决定正式上线时间。</p>
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
                <span className="inline-note">
                  封面标签：{theme.coverLabel} · 排序 {theme.sortOrder}
                </span>
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
          <div className="page-stack">
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
            </article>

            <section className="card-grid card-grid--two">
              <article className="surface-card admin-preview-card admin-preview-card--theme">
                <span className="section-block__eyebrow">学生端预览</span>
                <div className="theme-card theme-card--sky">
                  <div className="theme-card__top">
                    <span className="surface-tag">
                      {selectedTheme.isOpen ? "当前开放主题" : "正在开发中"}
                    </span>
                    <span className="surface-tag">
                      {selectedTheme.isOpen ? "可进入" : "敬请期待"}
                    </span>
                  </div>
                  <h3>{selectedTheme.title}</h3>
                  <p>{selectedTheme.description}</p>
                  <button type="button" className={selectedTheme.isOpen ? "primary-button" : "ghost-button"}>
                    {selectedTheme.isOpen ? "进入主题" : "敬请期待"}
                  </button>
                </div>
              </article>

              <div className="page-stack">
                <article className="surface-card admin-preview-card">
                  <span className="section-block__eyebrow">页面联动</span>
                  <ul className="plain-list">
                    <li>开放状态会影响学生端主题卡是否点亮。</li>
                    <li>排序会影响主题卡片在首页中的展示先后。</li>
                    <li>封面标签会作为主题卡顶部辅助信息展示。</li>
                  </ul>
                </article>

                <article className="surface-card admin-preview-card">
                  <span className="section-block__eyebrow">保存说明</span>
                  <p>当前保存只会写入本地工作稿，方便前端继续演示和联调，不会直接改动服务器主题配置。</p>
                </article>
              </div>
            </section>
          </div>
        ) : (
          <article className="surface-card empty-state-card">
            <strong>请选择一个主题</strong>
            <p>左侧选中主题后，就可以在这里维护标题、封面、开放状态和学生端预览。</p>
          </article>
        )}
      </section>
    </div>
  );
}
