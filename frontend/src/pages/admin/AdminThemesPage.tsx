import { useEffect, useMemo, useState } from "react";
import { AdminEditorStatusBar } from "../../components/AdminEditorStatusBar";
import { themeManagementItems } from "../../data/mockData";
import { fetchAdminThemes, saveAdminThemes } from "../../services/admin";
import { useAppState } from "../../state/AppState";
import type { ThemeAccent, ThemeManagementItem } from "../../types";
import { useEditableAdminResource } from "../../utils/useEditableAdminResource";

interface ThemeCoverPreset {
  accent: ThemeAccent;
  coverIllustration: string;
  coverLabel: string;
}

interface ThemeModalState {
  mode: "create" | "edit";
  draft: ThemeManagementItem;
}

const coverPresetOptions: ThemeCoverPreset[] = [
  {
    accent: "sky",
    coverIllustration: "斑马线与信号灯插画",
    coverLabel: "蓝天斑马线封面",
  },
  {
    accent: "mint",
    coverIllustration: "校园操场与教学楼插画",
    coverLabel: "校园操场封面",
  },
  {
    accent: "orange",
    coverIllustration: "家庭客厅与安全提醒插画",
    coverLabel: "家庭安全封面",
  },
];

function buildThemeId(title: string) {
  const normalized = title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-\u4e00-\u9fa5]/g, "");

  return normalized ? `theme-${normalized}` : `theme-${Date.now()}`;
}

function createThemeDraft(sortOrder: number): ThemeManagementItem {
  const preset = coverPresetOptions[0];

  return {
    id: `theme-${Date.now()}`,
    title: "新主题",
    description: "请填写主题简介。",
    coverLabel: preset.coverLabel,
    coverAccent: preset.accent,
    coverIllustration: preset.coverIllustration,
    isOpen: false,
    sortOrder,
  };
}

export function AdminThemesPage() {
  const { state } = useAppState();
  const canUseApi = state.authSource === "api" && Boolean(state.authToken);
  const editor = useEditableAdminResource<ThemeManagementItem[]>({
    storageKey: "admin-theme-management",
    fallbackData: themeManagementItems,
    enabled: canUseApi,
    fetcher: () => fetchAdminThemes(state.authToken ?? ""),
    saveHandler: (draftData, savedData) =>
      saveAdminThemes(state.authToken ?? "", draftData, savedData),
    dependencies: [state.authToken],
    fallbackMessage: "暂时无法获取主题管理数据，当前继续使用预置内容。",
  });
  const themes = editor.draftData
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder);
  const [selectedId, setSelectedId] = useState(themes[0]?.id ?? "");
  const [modalState, setModalState] = useState<ThemeModalState | null>(null);

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

  function openCreateModal() {
    const nextSortOrder =
      Math.max(0, ...themes.map((item) => item.sortOrder)) + 1;

    setModalState({
      mode: "create",
      draft: createThemeDraft(nextSortOrder),
    });
  }

  function openEditModal(theme: ThemeManagementItem) {
    setModalState({
      mode: "edit",
      draft: { ...theme },
    });
  }

  function updateModalDraft<K extends keyof ThemeManagementItem>(
    field: K,
    value: ThemeManagementItem[K],
  ) {
    setModalState((current) =>
      current
        ? {
            ...current,
            draft: {
              ...current.draft,
              [field]: value,
            },
          }
        : current,
    );
  }

  function applyPreset(preset: ThemeCoverPreset) {
    setModalState((current) =>
      current
        ? {
            ...current,
            draft: {
              ...current.draft,
              coverAccent: preset.accent,
              coverIllustration: preset.coverIllustration,
              coverLabel: preset.coverLabel,
            },
          }
        : current,
    );
  }

  function submitModal() {
    if (!modalState) {
      return;
    }

    const trimmedTitle = modalState.draft.title.trim() || "未命名主题";
    const trimmedDescription = modalState.draft.description.trim() || "请补充主题简介。";
    const nextDraft: ThemeManagementItem = {
      ...modalState.draft,
      id:
        modalState.mode === "create"
          ? buildThemeId(trimmedTitle)
          : modalState.draft.id,
      title: trimmedTitle,
      description: trimmedDescription,
      sortOrder: Number.isNaN(modalState.draft.sortOrder)
        ? themes.length + 1
        : modalState.draft.sortOrder,
    };

    editor.updateDraft((current) => {
      if (modalState.mode === "create") {
        return [...current, nextDraft];
      }

      return current.map((item) => (item.id === nextDraft.id ? nextDraft : item));
    });
    setSelectedId(nextDraft.id);
    setModalState(null);
  }

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--admin">
        <div>
          <span className="hero-banner__eyebrow">主题管理</span>
          <h1>用列表、弹窗和学生端预览维护主题入口</h1>
          <p>
            这一页严格对应说明书中的“列表 + 编辑弹窗 + 预览区”结构，用来统一管理主题名称、
            简介、封面图、开放状态和排序。
          </p>
        </div>
        <div className="hero-banner__actions">
          <button type="button" className="primary-button" onClick={openCreateModal}>
            新增主题
          </button>
          {selectedTheme ? (
            <button
              type="button"
              className="ghost-button"
              onClick={() => openEditModal(selectedTheme)}
            >
              编辑当前主题
            </button>
          ) : null}
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
          <p>未开放主题可以先完成封面和简介录入，再决定正式上线时间。</p>
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
                  封面图：{theme.coverLabel} · 排序 {theme.sortOrder}
                </span>
              </button>
            ))
          ) : (
            <article className="surface-card empty-state-card">
              <strong>当前没有主题数据</strong>
              <p>请先恢复最近版本，或等待主题列表更新后再继续查看。</p>
            </article>
          )}
        </div>

        {selectedTheme ? (
          <div className="page-stack">
            <article className="surface-card admin-preview-card">
              <div className="row-between">
                <div>
                  <span className="section-block__eyebrow">当前主题预览</span>
                  <h2>{selectedTheme.title}</h2>
                </div>
                <div className="chip-row">
                  <span className="surface-tag">排序 {selectedTheme.sortOrder}</span>
                  <span className="surface-tag">{selectedTheme.isOpen ? "已开放" : "未开放"}</span>
                </div>
              </div>

              <div
                className={`theme-cover-preview theme-cover-preview--${selectedTheme.coverAccent}`}
              >
                <strong>{selectedTheme.coverLabel}</strong>
                <p>{selectedTheme.coverIllustration}</p>
              </div>

              <div className={`theme-card theme-card--${selectedTheme.coverAccent}`}>
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
                <button
                  type="button"
                  className={selectedTheme.isOpen ? "primary-button" : "ghost-button"}
                >
                  {selectedTheme.isOpen ? "进入主题" : "敬请期待"}
                </button>
              </div>
            </article>

            <section className="card-grid card-grid--two">
              <article className="surface-card admin-preview-card">
                <span className="section-block__eyebrow">页面联动</span>
                <ul className="plain-list">
                  <li>开放状态会影响学生端主题卡是否点亮。</li>
                  <li>排序会影响主题卡片在首页中的展示先后。</li>
                  <li>封面图会进入学生端主题卡和后台预览区域。</li>
                </ul>
              </article>

              <article className="surface-card admin-preview-card">
                <span className="section-block__eyebrow">编辑方式</span>
                <p>
                  点击“新增主题”或“编辑当前主题”会弹出表单窗口；确认后先写入当前配置稿，
                  再通过上方状态条保存为最新版本。
                </p>
              </article>
            </section>
          </div>
        ) : (
          <article className="surface-card empty-state-card">
            <strong>请选择一个主题</strong>
            <p>左侧选中主题后，就可以在这里预览学生端卡片效果并继续编辑。</p>
          </article>
        )}
      </section>

      {modalState ? (
        <section className="overlay-modal-backdrop">
          <article className="surface-card overlay-modal overlay-modal--wide">
            <div className="row-between">
              <div>
                <span className="section-block__eyebrow">
                  {modalState.mode === "create" ? "新增主题" : "编辑主题"}
                </span>
                <h2>{modalState.mode === "create" ? "创建新的主题入口" : modalState.draft.title}</h2>
              </div>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setModalState(null)}
              >
                关闭
              </button>
            </div>

            <div className="editor-grid">
              <label className="form-field">
                <span>主题名称</span>
                <input
                  value={modalState.draft.title}
                  onChange={(event) => updateModalDraft("title", event.target.value)}
                />
              </label>

              <label className="form-field">
                <span>排序</span>
                <input
                  type="number"
                  value={modalState.draft.sortOrder}
                  onChange={(event) =>
                    updateModalDraft(
                      "sortOrder",
                      Number.isNaN(Number(event.target.value))
                        ? modalState.draft.sortOrder
                        : Number(event.target.value),
                    )
                  }
                />
              </label>

              <label className="form-field form-field--wide">
                <span>主题简介</span>
                <textarea
                  rows={4}
                  value={modalState.draft.description}
                  onChange={(event) => updateModalDraft("description", event.target.value)}
                />
              </label>

              <label className="form-field">
                <span>开放状态</span>
                <select
                  value={modalState.draft.isOpen ? "open" : "closed"}
                  onChange={(event) =>
                    updateModalDraft("isOpen", event.target.value === "open")
                  }
                >
                  <option value="open">开放</option>
                  <option value="closed">关闭</option>
                </select>
              </label>

              <label className="form-field">
                <span>封面图名称</span>
                <input
                  value={modalState.draft.coverLabel}
                  onChange={(event) => updateModalDraft("coverLabel", event.target.value)}
                />
              </label>

              <label className="form-field form-field--wide">
                <span>封面图说明</span>
                <textarea
                  rows={3}
                  value={modalState.draft.coverIllustration}
                  onChange={(event) =>
                    updateModalDraft("coverIllustration", event.target.value)
                  }
                />
              </label>
            </div>

            <section className="page-stack">
              <div>
                <span className="section-block__eyebrow">选择封面图预设</span>
                <h3>点击后会同步更新封面图名称、颜色和预览</h3>
              </div>

              <div className="cover-preset-grid">
                {coverPresetOptions.map((preset) => {
                  const isActive =
                    modalState.draft.coverAccent === preset.accent &&
                    modalState.draft.coverIllustration === preset.coverIllustration;

                  return (
                    <button
                      key={`${preset.accent}-${preset.coverLabel}`}
                      type="button"
                      className={
                        isActive
                          ? "cover-preset-card cover-preset-card--active"
                          : "cover-preset-card"
                      }
                      onClick={() => applyPreset(preset)}
                    >
                      <div className={`theme-cover-preview theme-cover-preview--${preset.accent}`}>
                        <strong>{preset.coverLabel}</strong>
                        <p>{preset.coverIllustration}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="button-row">
              <button type="button" className="ghost-button" onClick={() => setModalState(null)}>
                取消
              </button>
              <button type="button" className="primary-button" onClick={submitModal}>
                确认写入配置稿
              </button>
            </div>
          </article>
        </section>
      ) : null}
    </div>
  );
}
