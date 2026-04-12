import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { PaginationControls } from "../../components/PaginationControls";
import {
  createAdminTheme,
  deleteAdminTheme,
  fetchAdminThemesPage,
  updateAdminTheme,
} from "../../services/admin";
import { useAppState } from "../../state/AppState";
import type { ThemeAccent, ThemeManagementItem } from "../../types";

interface ThemeCoverPreset {
  accent: ThemeAccent;
  coverIllustration: string;
  coverLabel: string;
}

const PAGE_SIZE = 10;

const coverPresetOptions: ThemeCoverPreset[] = [
  { accent: "sky", coverIllustration: "斑马线与信号灯插画", coverLabel: "蓝天斑马线封面" },
  { accent: "mint", coverIllustration: "校园操场与教学楼插画", coverLabel: "校园操场封面" },
  { accent: "orange", coverIllustration: "家庭客厅与安全提醒插画", coverLabel: "家庭安全封面" },
];

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
  const [themes, setThemes] = useState<ThemeManagementItem[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState<ThemeManagementItem | null>(null);
  const [isLoading, setIsLoading] = useState(canUseApi);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    if (!canUseApi || !state.authToken) {
      setThemes([]);
      setTotal(0);
      setTotalPages(1);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError("");

    void fetchAdminThemesPage(state.authToken, { query, page, pageSize: PAGE_SIZE })
      .then((result) => {
        if (cancelled) {
          return;
        }

        setThemes(result.items);
        setTotal(result.total);
        setTotalPages(result.totalPages);
        setSelectedId((current) =>
          current && result.items.some((item) => item.id === current) ? current : result.items[0]?.id ?? "",
        );
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : "主题数据加载失败。");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [canUseApi, page, query, state.authToken]);

  const selectedTheme = useMemo(
    () => themes.find((item) => item.id === selectedId) ?? themes[0] ?? null,
    [selectedId, themes],
  );

  useEffect(() => {
    setDraft(selectedTheme ? { ...selectedTheme } : null);
  }, [selectedTheme]);

  const openCount = themes.filter((item) => item.isOpen).length;
  const closedCount = themes.length - openCount;

  function patchDraft<K extends keyof ThemeManagementItem>(field: K, value: ThemeManagementItem[K]) {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  }

  async function refresh(preferredId?: string) {
    if (!state.authToken || !canUseApi) {
      return;
    }
    const result = await fetchAdminThemesPage(state.authToken, { query, page, pageSize: PAGE_SIZE });
    setThemes(result.items);
    setTotal(result.total);
    setTotalPages(result.totalPages);
    setSelectedId((current) =>
      preferredId && result.items.some((item) => item.id === preferredId)
        ? preferredId
        : current && result.items.some((item) => item.id === current)
          ? current
          : result.items[0]?.id ?? "",
    );
  }

  async function handleCreateTheme() {
    if (!state.authToken || !canUseApi) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const nextTheme = createThemeDraft(total + 1);
      nextTheme.id = `theme-${Date.now()}`;
      await createAdminTheme(state.authToken, nextTheme);
      setNotice("已创建新主题。");
      await refresh(nextTheme.id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "创建主题失败。");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveTheme() {
    if (!draft || !state.authToken || !canUseApi) {
      return;
    }

    const trimmedTitle = draft.title.trim() || "未命名主题";
    const nextTheme = { ...draft, title: trimmedTitle, id: draft.id };

    setIsSaving(true);
    setError("");

    try {
      await updateAdminTheme(state.authToken, nextTheme.id, nextTheme);
      setNotice(`已保存主题 ${nextTheme.title}。`);
      await refresh(nextTheme.id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "主题保存失败。");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteTheme() {
    if (!selectedTheme || !state.authToken || !canUseApi) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await deleteAdminTheme(state.authToken, selectedTheme.id);
      setNotice(`已删除主题 ${selectedTheme.title}。`);
      await refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "主题删除失败。");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--admin">
        <div>
          <span className="hero-banner__eyebrow">主题管理</span>
          <h1>左侧筛选主题，右侧直接编辑与预览</h1>
          <p>主题页改成固定工作区，列表支持搜索和分页，右侧编辑和预览始终同屏，不会再丢上下文。</p>
        </div>
        <div className="hero-banner__actions">
          <button type="button" className="primary-button" onClick={() => void handleCreateTheme()}>
            新增主题
          </button>
          {selectedTheme ? (
            <button type="button" className="ghost-button" onClick={() => void handleDeleteTheme()}>
              删除当前主题
            </button>
          ) : null}
        </div>
      </section>

      <article className="feedback-box feedback-box--compact">
        <strong>{error ? "主题数据同步失败" : "主题数据已从后端加载"}</strong>
        <p>{isLoading ? "正在同步主题数据..." : error || notice || "可以在当前页面直接完成主题维护。"} </p>
      </article>

      <section className="card-grid card-grid--three">
        <article className="surface-card stat-card stat-card--compact admin-summary-card">
          <span>筛选结果</span>
          <strong>{total}</strong>
          <p>符合当前搜索条件的主题总数。</p>
        </article>
        <article className="surface-card stat-card stat-card--compact admin-summary-card">
          <span>当前页开放中</span>
          <strong>{openCount}</strong>
          <p>当前页内已开放给学生端的主题数量。</p>
        </article>
        <article className="surface-card stat-card stat-card--compact admin-summary-card">
          <span>当前页待开放</span>
          <strong>{closedCount}</strong>
          <p>仍处于筹备或占位状态的主题数量。</p>
        </article>
      </section>

      <section className="management-layout">
        <div className="page-stack">
          <article className="surface-card surface-card--compact-section">
            <div className="section-block__header">
              <div>
                <span className="section-block__eyebrow">主题列表</span>
                <h2>搜索并切换主题</h2>
              </div>
              <span className="inline-note">每页 {PAGE_SIZE} 条</span>
            </div>
            <div className="filter-bar filter-bar--admin">
              <label className="form-field form-field--wide">
                <span>搜索主题</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索主题名称或简介"
                />
              </label>
            </div>
          </article>

          {themes.length > 0 ? (
            <>
              <div className="management-list-panel management-list-panel--compact">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    className={
                      theme.id === selectedTheme?.id
                        ? "management-list-card management-list-card--compact management-list-card--active"
                        : "management-list-card management-list-card--compact"
                    }
                    onClick={() => setSelectedId(theme.id)}
                  >
                    <div className="row-between">
                      <strong>{theme.title}</strong>
                      <span className="surface-tag">{theme.isOpen ? "开放中" : "待开放"}</span>
                    </div>
                    <p className="compact-copy compact-copy--two-line" title={theme.description}>
                      {theme.description}
                    </p>
                    <span className="inline-note">排序 {theme.sortOrder}</span>
                  </button>
                ))}
              </div>
              <PaginationControls
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                label={`主题列表 · 共 ${total} 个`}
              />
            </>
          ) : (
            <EmptyState title="当前没有命中的主题" description="可以清空搜索条件，或者先新增一个主题。" />
          )}
        </div>

        {draft ? (
          <div className="page-stack">
            <article className="surface-card editor-panel editor-panel--compact">
              <div className="section-block__header">
                <div>
                  <span className="section-block__eyebrow">编辑主题</span>
                  <h2>{draft.title}</h2>
                </div>
                <button type="button" className="primary-button" onClick={() => void handleSaveTheme()} disabled={isSaving}>
                  保存主题
                </button>
              </div>

              <div className="editor-grid">
                <label className="form-field">
                  <span>主题名称</span>
                  <input value={draft.title} onChange={(event) => patchDraft("title", event.target.value)} />
                </label>
                <label className="form-field">
                  <span>排序</span>
                  <input
                    type="number"
                    value={draft.sortOrder}
                    onChange={(event) => patchDraft("sortOrder", Number(event.target.value) || 0)}
                  />
                </label>
                <label className="form-field">
                  <span>开放状态</span>
                  <select
                    value={draft.isOpen ? "open" : "closed"}
                    onChange={(event) => patchDraft("isOpen", event.target.value === "open")}
                  >
                    <option value="open">开放中</option>
                    <option value="closed">待开放</option>
                  </select>
                </label>
                <label className="form-field form-field--wide">
                  <span>主题简介</span>
                  <textarea
                    rows={4}
                    value={draft.description}
                    onChange={(event) => patchDraft("description", event.target.value)}
                  />
                </label>
              </div>

              <div className="page-stack page-stack--compact">
                <span className="section-block__eyebrow">封面预设</span>
                <div className="admin-preset-grid">
                  {coverPresetOptions.map((preset) => (
                    <button
                      key={preset.coverLabel}
                      type="button"
                      className={
                        draft.coverLabel === preset.coverLabel
                          ? "admin-preset-card admin-preset-card--active"
                          : "admin-preset-card"
                      }
                      onClick={() => {
                        patchDraft("coverAccent", preset.accent);
                        patchDraft("coverIllustration", preset.coverIllustration);
                        patchDraft("coverLabel", preset.coverLabel);
                      }}
                    >
                      <strong>{preset.coverLabel}</strong>
                      <p>{preset.coverIllustration}</p>
                    </button>
                  ))}
                </div>
              </div>
            </article>

            <article className="surface-card admin-preview-card admin-preview-card--compact admin-preview-card--theme">
              <span className="section-block__eyebrow">学生端预览</span>
              <h3>{draft.title}</h3>
              <div className={`theme-cover-preview theme-cover-preview--${draft.coverAccent}`}>
                <strong>{draft.coverLabel}</strong>
                <p>{draft.coverIllustration}</p>
              </div>
              <div className={`theme-cover-preview theme-cover-preview--${draft.coverAccent} admin-theme-preview-card`}>
                <div className="theme-card__top admin-theme-preview-card__top">
                  <span className="surface-tag">{draft.isOpen ? "当前开放主题" : "正在筹备中"}</span>
                  <span className="surface-tag">排序 {draft.sortOrder}</span>
                </div>
                <strong>{draft.title}</strong>
                <p>{draft.description}</p>
                <button
                  type="button"
                  className={
                    draft.isOpen
                      ? "primary-button admin-theme-preview-card__button"
                      : "ghost-button admin-theme-preview-card__button admin-theme-preview-card__button--muted"
                  }
                >
                  {draft.isOpen ? "进入主题" : "敬请期待"}
                </button>
              </div>
            </article>
          </div>
        ) : (
          <EmptyState
            title="请先在左侧选择一个主题"
            description="选中主题后，右侧会同时展示编辑表单和学生端预览。"
          />
        )}
      </section>
    </div>
  );
}
