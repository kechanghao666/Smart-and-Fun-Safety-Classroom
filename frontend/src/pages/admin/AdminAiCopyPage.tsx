import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { PaginationControls } from "../../components/PaginationControls";
import {
  createAdminAiCopy,
  deleteAdminAiCopy,
  fetchAdminAiCopyPage,
  updateAdminAiCopy,
} from "../../services/admin";
import { useAppState } from "../../state/AppState";
import type { AiCopyTemplateItem } from "../../types";

const previewTitleMap: Record<string, string> = {
  welcome: "首页欢迎提示预览",
  hint: "关卡提示预览",
  report: "结果卡总结预览",
};

const PAGE_SIZE = 10;

function createAiCopyDraft(category: string): AiCopyTemplateItem {
  return {
    id: `copy-${Date.now()}`,
    category: category || "welcome",
    title: "新文案模板",
    scene: "welcome",
    promptText: "请填写新的 AI 文案内容。",
  };
}

export function AdminAiCopyPage() {
  const { state } = useAppState();
  const canUseApi = state.authSource === "api" && Boolean(state.authToken);
  const [templates, setTemplates] = useState<AiCopyTemplateItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState<AiCopyTemplateItem | null>(null);
  const [isLoading, setIsLoading] = useState(canUseApi);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setPage(1);
  }, [activeCategory, query]);

  useEffect(() => {
    if (!canUseApi || !state.authToken) {
      setTemplates([]);
      setCategories([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError("");

    void Promise.all([
      fetchAdminAiCopyPage(state.authToken, { page, pageSize: PAGE_SIZE, category: activeCategory || undefined, query }),
      fetchAdminAiCopyPage(state.authToken, { page: 1, pageSize: 200 }),
    ])
      .then(([pageResult, allResult]) => {
        if (cancelled) {
          return;
        }

        setTemplates(pageResult.items);
        setTotal(pageResult.total);
        setTotalPages(pageResult.totalPages);
        setCategories(Array.from(new Set(allResult.items.map((item) => item.category))));
        setSelectedId((current) =>
          current && pageResult.items.some((item) => item.id === current)
            ? current
            : pageResult.items[0]?.id ?? "",
        );
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : "AI 文案加载失败。");
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
  }, [activeCategory, canUseApi, page, query, state.authToken]);

  useEffect(() => {
    setActiveCategory((current) => current || categories[0] || "");
  }, [categories]);

  const selectedTemplate = useMemo(
    () => templates.find((item) => item.id === selectedId) ?? templates[0] ?? null,
    [selectedId, templates],
  );

  useEffect(() => {
    setDraft(selectedTemplate ? { ...selectedTemplate } : null);
  }, [selectedTemplate]);

  const welcomeCount = templates.filter((item) => item.scene.includes("welcome")).length;
  const hintCount = templates.filter((item) => item.scene.includes("hint")).length;
  const reportCount = templates.filter((item) => item.scene.includes("report")).length;

  function patchDraft<K extends keyof AiCopyTemplateItem>(field: K, value: AiCopyTemplateItem[K]) {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  }

  async function refresh(preferredId?: string) {
    if (!state.authToken || !canUseApi) {
      return;
    }

    const result = await fetchAdminAiCopyPage(state.authToken, {
      page,
      pageSize: PAGE_SIZE,
      category: activeCategory || undefined,
      query,
    });
    setTemplates(result.items);
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

  async function handleCreateTemplate() {
    if (!state.authToken || !canUseApi) {
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      const template = createAiCopyDraft(activeCategory || categories[0] || "welcome");
      await createAdminAiCopy(state.authToken, template);
      setNotice("已创建新的 AI 文案模板。");
      await refresh(template.id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "AI 文案创建失败。");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveTemplate() {
    if (!draft || !state.authToken || !canUseApi) {
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      await updateAdminAiCopy(state.authToken, draft.id, draft);
      setNotice(`已保存模板 ${draft.title}。`);
      await refresh(draft.id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "AI 文案保存失败。");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteTemplate() {
    if (!selectedTemplate || !state.authToken || !canUseApi) {
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      await deleteAdminAiCopy(state.authToken, selectedTemplate.id);
      setNotice(`已删除模板 ${selectedTemplate.title}。`);
      await refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "AI 文案删除失败。");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--admin">
        <div>
          <span className="hero-banner__eyebrow">AI 文案管理</span>
          <h1>按分类和关键字筛文案，右侧同步编辑与预览</h1>
          <p>AI 文案页现在补上了分类内搜索与分页，模板多起来后也能稳定管理。</p>
        </div>
        <div className="hero-banner__actions">
          <button type="button" className="primary-button" onClick={() => void handleCreateTemplate()}>
            新建模板
          </button>
          {selectedTemplate ? (
            <button type="button" className="ghost-button" onClick={() => void handleDeleteTemplate()}>
              删除当前模板
            </button>
          ) : null}
        </div>
      </section>

      <article className="feedback-box feedback-box--compact">
        <strong>{error ? "AI 文案同步失败" : "AI 文案已从后端加载"}</strong>
        <p>{isLoading ? "正在同步 AI 文案..." : error || notice || "可以在这里维护分类、场景和文案正文。"} </p>
      </article>

      <section className="card-grid card-grid--three">
        <article className="surface-card stat-card stat-card--compact admin-summary-card">
          <span>筛选结果</span>
          <strong>{total}</strong>
          <p>符合当前分类和搜索条件的模板总数。</p>
        </article>
        <article className="surface-card stat-card stat-card--compact admin-summary-card">
          <span>欢迎 / 提示 / 总结</span>
          <strong>
            {welcomeCount} / {hintCount} / {reportCount}
          </strong>
          <p>用于快速判断当前页模板的场景分布。</p>
        </article>
        <article className="surface-card stat-card stat-card--compact admin-summary-card">
          <span>分类数量</span>
          <strong>{categories.length}</strong>
          <p>模板分类越清晰，后续运营和维护越省力。</p>
        </article>
      </section>

      <section className="surface-card surface-card--compact-section">
        <div className="admin-tab-row">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={category === activeCategory ? "admin-tab admin-tab--active" : "admin-tab"}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="filter-bar filter-bar--admin">
          <label className="form-field form-field--wide">
            <span>分类内搜索</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索模板标题、场景或正文"
            />
          </label>
        </div>
      </section>

      <section className="management-layout">
        <div className="page-stack page-stack--compact-density">
          {templates.length > 0 ? (
            <>
              <div className="management-list-panel management-list-panel--compact">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    className={
                      template.id === selectedTemplate?.id
                        ? "management-list-card management-list-card--compact management-list-card--active"
                        : "management-list-card management-list-card--compact"
                    }
                    onClick={() => setSelectedId(template.id)}
                  >
                    <span className="surface-tag">{template.scene}</span>
                    <h3>{template.title}</h3>
                    <p className="compact-copy compact-copy--one-line" title={template.category}>
                      {template.category}
                    </p>
                  </button>
                ))}
              </div>

              <PaginationControls
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                label={`模板列表 · 共 ${total} 个`}
              />
            </>
          ) : (
            <EmptyState title="当前没有命中的模板" description="可以清空搜索，或先新建一个模板。" />
          )}
        </div>

        {draft ? (
          <div className="page-stack">
            <article className="surface-card editor-panel editor-panel--compact">
              <div className="section-block__header">
                <div>
                  <span className="section-block__eyebrow">编辑模板</span>
                  <h2>{draft.title}</h2>
                </div>
                <button type="button" className="primary-button" onClick={() => void handleSaveTemplate()} disabled={isSaving}>
                  保存模板
                </button>
              </div>

              <div className="editor-grid">
                <label className="form-field">
                  <span>分类</span>
                  <input value={draft.category} onChange={(event) => patchDraft("category", event.target.value)} />
                </label>
                <label className="form-field">
                  <span>场景标识</span>
                  <input value={draft.scene} onChange={(event) => patchDraft("scene", event.target.value)} />
                </label>
                <label className="form-field">
                  <span>模板标题</span>
                  <input value={draft.title} onChange={(event) => patchDraft("title", event.target.value)} />
                </label>
                <label className="form-field form-field--wide">
                  <span>模板正文</span>
                  <textarea
                    rows={8}
                    value={draft.promptText}
                    onChange={(event) => patchDraft("promptText", event.target.value)}
                  />
                </label>
              </div>
            </article>

            <section className="card-grid card-grid--two">
              <article className="surface-card admin-preview-card admin-preview-card--ai admin-preview-card--compact">
                <span className="section-block__eyebrow">预览区</span>
                <h3>{previewTitleMap[draft.scene] ?? "AI 文案预览"}</h3>
                <article className="chat-bubble chat-bubble--assistant">
                  {draft.promptText}
                </article>
              </article>

              <div className="page-stack">
                <article className="surface-card admin-preview-card admin-preview-card--compact">
                  <span className="section-block__eyebrow">模板提醒</span>
                  <ul className="plain-list">
                    <li>欢迎语要短、友好、明确告诉学生先做什么。</li>
                    <li>提示语优先给方向，不直接给完整答案。</li>
                    <li>结果类模板要同时覆盖亮点、补强重点和下一步动作。</li>
                  </ul>
                </article>

                <article className="surface-card admin-preview-card admin-preview-card--compact">
                  <span className="section-block__eyebrow">维护建议</span>
                  <p>分类和场景越稳定，前端接入和后端 AI 代理就越不容易发生错配。</p>
                </article>
              </div>
            </section>
          </div>
        ) : (
          <EmptyState title="请选择一个文案模板" description="选中模板后，就可以继续维护分类、场景标识、正文和右侧预览。" />
        )}
      </section>
    </div>
  );
}
