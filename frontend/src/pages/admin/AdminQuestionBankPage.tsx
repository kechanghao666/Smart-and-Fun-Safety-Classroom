import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { PaginationControls } from "../../components/PaginationControls";
import {
  createAdminQuestionBank,
  deleteAdminQuestionBank,
  fetchAdminQuestionBankPage,
  fetchAdminThemesPage,
  updateAdminQuestionBank,
} from "../../services/admin";
import { useAppState } from "../../state/AppState";
import type { LevelId, QuestionBankManagementItem, ThemeManagementItem } from "../../types";

const QUESTIONS_PER_PAGE = 10;

function createQuestionDraft(themes: ThemeManagementItem[]): QuestionBankManagementItem {
  const theme = themes[0];
  return {
    id: `q-${Date.now()}`,
    themeId: theme?.id ?? "road-safety",
    themeTitle: theme?.title ?? "道路安全教育",
    prompt: "请填写题目内容",
    options: ["选项 A", "选项 B", "选项 C", "选项 D"],
    correctOptionIndex: 0,
    correctLabel: "选项 A",
    explanation: "请填写题目解析",
    reviewLevelId: "level-1",
    reviewLabel: "回看第一关",
    reviewSuggestion: "建议回顾相关关卡内容。",
    status: "draft",
  };
}

export function AdminQuestionBankPage() {
  const { state } = useAppState();
  const canUseApi = state.authSource === "api" && Boolean(state.authToken);
  const [themes, setThemes] = useState<ThemeManagementItem[]>([]);
  const [questions, setQuestions] = useState<QuestionBankManagementItem[]>([]);
  const [query, setQuery] = useState("");
  const [selectedThemeId, setSelectedThemeId] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState("");
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [draft, setDraft] = useState<QuestionBankManagementItem | null>(null);
  const [isLoading, setIsLoading] = useState(canUseApi);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setPage(1);
  }, [query, selectedThemeId]);

  useEffect(() => {
    if (!canUseApi || !state.authToken) {
      setThemes([]);
      return;
    }

    let cancelled = false;
    void fetchAdminThemesPage(state.authToken, { page: 1, pageSize: 100 })
      .then((result) => {
        if (!cancelled) {
          setThemes(result.items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setThemes([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [canUseApi, state.authToken]);

  useEffect(() => {
    if (!canUseApi || !state.authToken) {
      setQuestions([]);
      setTotal(0);
      setTotalPages(1);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError("");

    void fetchAdminQuestionBankPage(state.authToken, {
      query,
      themeId: selectedThemeId === "all" ? undefined : selectedThemeId,
      page,
      pageSize: QUESTIONS_PER_PAGE,
    })
      .then((result) => {
        if (cancelled) {
          return;
        }

        setQuestions(result.items);
        setTotal(result.total);
        setTotalPages(result.totalPages);
        setSelectedId((current) =>
          current && result.items.some((item) => item.id === current) ? current : result.items[0]?.id ?? "",
        );
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : "题库数据加载失败。");
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
  }, [canUseApi, page, query, selectedThemeId, state.authToken]);

  const selectedQuestion = useMemo(
    () => questions.find((item) => item.id === selectedId) ?? questions[0] ?? null,
    [questions, selectedId],
  );

  useEffect(() => {
    setDraft(selectedQuestion ? { ...selectedQuestion } : null);
  }, [selectedQuestion]);

  const enabledCount = questions.filter((item) => item.status === "enabled").length;
  const draftCount = questions.length - enabledCount;
  const linkedReviewCount = questions.filter((item) => item.reviewLevelId).length;

  function patchDraft<K extends keyof QuestionBankManagementItem>(
    field: K,
    value: QuestionBankManagementItem[K],
  ) {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      const next = { ...current, [field]: value };
      next.correctLabel = next.options[next.correctOptionIndex] ?? next.correctLabel;
      return next;
    });
  }

  function updateOption(index: number, value: string) {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      const options = current.options.map((item, optionIndex) =>
        optionIndex === index ? value : item,
      );

      return {
        ...current,
        options,
        correctLabel: options[current.correctOptionIndex] ?? current.correctLabel,
      };
    });
  }

  async function refresh(preferredId?: string) {
    if (!state.authToken || !canUseApi) {
      return;
    }

    const result = await fetchAdminQuestionBankPage(state.authToken, {
      query,
      themeId: selectedThemeId === "all" ? undefined : selectedThemeId,
      page,
      pageSize: QUESTIONS_PER_PAGE,
    });
    setQuestions(result.items);
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

  async function handleCreateQuestion() {
    if (!state.authToken || !canUseApi) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const nextQuestion = createQuestionDraft(themes);
      await createAdminQuestionBank(state.authToken, nextQuestion);
      setNotice("已新增一条题目。");
      await refresh(nextQuestion.id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "新增题目失败。");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveQuestion() {
    if (!draft || !state.authToken || !canUseApi) {
      return;
    }

    const selectedTheme = themes.find((item) => item.id === draft.themeId);
    const nextDraft = {
      ...draft,
      themeTitle: selectedTheme?.title ?? draft.themeTitle,
      correctLabel: draft.options[draft.correctOptionIndex] ?? draft.correctLabel,
    };

    setIsSaving(true);
    setError("");

    try {
      await updateAdminQuestionBank(state.authToken, nextDraft.id, nextDraft);
      setNotice(`已保存题目 ${nextDraft.id}。`);
      await refresh(nextDraft.id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "题目保存失败。");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteQuestion() {
    if (!selectedQuestion || !state.authToken || !canUseApi) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await deleteAdminQuestionBank(state.authToken, selectedQuestion.id);
      setNotice(`已删除题目 ${selectedQuestion.id}。`);
      await refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "题目删除失败。");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--admin">
        <div>
          <span className="hero-banner__eyebrow">题库管理</span>
          <h1>搜索题目、分页浏览，并在右侧持续编辑与预览</h1>
          <p>题库页现在支持按题号、题干、主题和回看关卡搜索，并补上了新增、删除和分页能力。</p>
        </div>
        <div className="hero-banner__actions">
          <button type="button" className="primary-button" onClick={() => void handleCreateQuestion()}>
            新建题目
          </button>
          {selectedQuestion ? (
            <button type="button" className="ghost-button" onClick={() => void handleDeleteQuestion()}>
              删除当前题目
            </button>
          ) : null}
        </div>
      </section>

      <article className="feedback-box feedback-box--compact">
        <strong>{error ? "题库同步失败" : "题库已从后端加载"}</strong>
        <p>{isLoading ? "正在同步题库..." : error || notice || "可以在当前页面继续维护题目与回看信息。"} </p>
      </article>

      <section className="card-grid card-grid--three">
        <article className="surface-card stat-card stat-card--compact admin-summary-card">
          <span>筛选结果</span>
          <strong>{total}</strong>
          <p>当前搜索和主题筛选命中的题目总数。</p>
        </article>
        <article className="surface-card stat-card stat-card--compact admin-summary-card">
          <span>当前页启用中</span>
          <strong>{enabledCount}</strong>
          <p>已经正式进入学生端考试流程的题目数量。</p>
        </article>
        <article className="surface-card stat-card stat-card--compact admin-summary-card">
          <span>草稿 / 回看联动</span>
          <strong>
            {draftCount} / {linkedReviewCount}
          </strong>
          <p>每道题都应指向明确的回看关卡，避免错题无复习入口。</p>
        </article>
      </section>

      <section className="management-layout">
        <div className="page-stack">
          <article className="surface-card surface-card--compact-section">
            <div className="section-block__header">
              <div>
                <span className="section-block__eyebrow">题目列表</span>
                <h2>搜索并切换题目</h2>
              </div>
              <span className="inline-note">每页 {QUESTIONS_PER_PAGE} 题</span>
            </div>
            <div className="filter-bar filter-bar--admin">
              <label className="form-field form-field--wide">
                <span>搜索题目</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索题号、题干、主题或回看关卡"
                />
              </label>
              <label className="form-field">
                <span>主题筛选</span>
                <select
                  value={selectedThemeId}
                  onChange={(event) => setSelectedThemeId(event.target.value)}
                >
                  <option value="all">全部主题</option>
                  {themes.map((theme) => (
                    <option key={theme.id} value={theme.id}>
                      {theme.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </article>

          {questions.length > 0 ? (
            <>
              <div className="management-list-panel management-list-panel--question-bank">
                {questions.map((question) => (
                  <button
                    key={question.id}
                    type="button"
                    className={
                      question.id === selectedQuestion?.id
                        ? "management-list-card management-list-card--compact management-list-card--active"
                        : "management-list-card management-list-card--compact"
                    }
                    onClick={() => setSelectedId(question.id)}
                  >
                    <div className="row-between">
                      <strong className="management-list-card__title">{question.id}</strong>
                      <span className="surface-tag">
                        {question.status === "enabled" ? "启用中" : "草稿"}
                      </span>
                    </div>
                    <p
                      className="management-list-card__excerpt compact-copy compact-copy--two-line"
                      title={question.prompt}
                    >
                      {question.prompt}
                    </p>
                    <div className="management-list-card__meta">
                      <span>{question.themeTitle}</span>
                      <span>回看 {question.reviewLevelId}</span>
                    </div>
                  </button>
                ))}
              </div>

              <PaginationControls
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                label={`题库列表 · 共 ${total} 题`}
              />
            </>
          ) : (
            <EmptyState title="当前没有命中的题目" description="可以清空筛选条件，或者先新增一道题。" />
          )}
        </div>

        {draft ? (
          <div className="page-stack">
            <article className="surface-card editor-panel editor-panel--compact">
              <div className="section-block__header">
                <div>
                  <span className="section-block__eyebrow">编辑题目</span>
                  <h2>{draft.id}</h2>
                </div>
                <button type="button" className="primary-button" onClick={() => void handleSaveQuestion()} disabled={isSaving}>
                  保存题目
                </button>
              </div>

              <div className="chip-row">
                <span className="surface-tag">{draft.themeTitle}</span>
                <span className="surface-tag">{draft.status === "enabled" ? "启用中" : "草稿"}</span>
                <span className="surface-tag">{draft.reviewLevelId}</span>
              </div>

              <div className="editor-grid">
                <label className="form-field">
                  <span>所属主题</span>
                  <select
                    value={draft.themeId}
                    onChange={(event) => patchDraft("themeId", event.target.value)}
                  >
                    {themes.map((theme) => (
                      <option key={theme.id} value={theme.id}>
                        {theme.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  <span>状态</span>
                  <select
                    value={draft.status}
                    onChange={(event) =>
                      patchDraft("status", event.target.value as QuestionBankManagementItem["status"])
                    }
                  >
                    <option value="enabled">启用</option>
                    <option value="draft">草稿</option>
                  </select>
                </label>
                <label className="form-field form-field--wide">
                  <span>题干</span>
                  <textarea rows={3} value={draft.prompt} onChange={(event) => patchDraft("prompt", event.target.value)} />
                </label>
                <label className="form-field form-field--wide">
                  <span>选项设置</span>
                  <div className="option-editor-grid">
                    {draft.options.map((option, index) => (
                      <label key={`${draft.id}-${index}`} className="form-field">
                        <span>选项 {String.fromCharCode(65 + index)}</span>
                        <input value={option} onChange={(event) => updateOption(index, event.target.value)} />
                      </label>
                    ))}
                  </div>
                </label>
                <label className="form-field">
                  <span>正确答案</span>
                  <select
                    value={draft.correctOptionIndex}
                    onChange={(event) => patchDraft("correctOptionIndex", Number(event.target.value))}
                  >
                    {draft.options.map((_, index) => (
                      <option key={index} value={index}>
                        选项 {String.fromCharCode(65 + index)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  <span>回看关卡</span>
                  <select
                    value={draft.reviewLevelId}
                    onChange={(event) => patchDraft("reviewLevelId", event.target.value as LevelId)}
                  >
                    <option value="level-1">level-1</option>
                    <option value="level-2">level-2</option>
                    <option value="level-3">level-3</option>
                  </select>
                </label>
                <label className="form-field">
                  <span>回看标签</span>
                  <input value={draft.reviewLabel ?? ""} onChange={(event) => patchDraft("reviewLabel", event.target.value)} />
                </label>
                <label className="form-field form-field--wide">
                  <span>回看建议</span>
                  <input
                    value={draft.reviewSuggestion ?? ""}
                    onChange={(event) => patchDraft("reviewSuggestion", event.target.value)}
                  />
                </label>
                <label className="form-field form-field--wide">
                  <span>题目解析</span>
                  <textarea
                    rows={4}
                    value={draft.explanation}
                    onChange={(event) => patchDraft("explanation", event.target.value)}
                  />
                </label>
              </div>
            </article>

            <article className="surface-card admin-preview-card admin-preview-card--compact">
              <span className="section-block__eyebrow">学生端预览</span>
              <h3>{draft.prompt}</h3>
              <div className="page-stack page-stack--compact">
                {draft.options.map((option, index) => (
                  <article
                    key={`${draft.id}-preview-${index}`}
                    className={
                      index === draft.correctOptionIndex
                        ? "admin-preview-option admin-preview-option--correct"
                        : "admin-preview-option"
                    }
                  >
                    <strong>{String.fromCharCode(65 + index)}</strong>
                    <span>{option}</span>
                  </article>
                ))}
              </div>
              <article className="feedback-box feedback-box--compact">
                <strong>错题回看</strong>
                <p>
                  {draft.reviewLabel ?? "回看当前关卡"} · {draft.reviewSuggestion ?? "请补充回看建议。"}
                </p>
              </article>
            </article>
          </div>
        ) : (
          <EmptyState title="请先在左侧选择一道题" description="选中题目后，右侧会显示编辑表单和学生端预览。" />
        )}
      </section>
    </div>
  );
}
