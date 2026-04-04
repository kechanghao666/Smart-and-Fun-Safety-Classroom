import { useEffect, useMemo, useState } from "react";
import { AdminEditorStatusBar } from "../../components/AdminEditorStatusBar";
import { fetchAdminQuestionBank, saveAdminQuestionBank } from "../../services/admin";
import { useAppState } from "../../state/AppState";
import type { LevelId, QuestionBankManagementItem } from "../../types";
import { useEditableAdminResource } from "../../utils/useEditableAdminResource";

export function AdminQuestionBankPage() {
  const { state } = useAppState();
  const canUseApi = state.authSource === "api" && Boolean(state.authToken);
  const editor = useEditableAdminResource<QuestionBankManagementItem[]>({
    storageKey: "admin-question-bank",
    fallbackData: [],
    enabled: canUseApi,
    fetcher: () => fetchAdminQuestionBank(state.authToken ?? ""),
    saveHandler: (draftData, savedData) =>
      saveAdminQuestionBank(state.authToken ?? "", draftData, savedData),
    dependencies: [state.authToken],
    fallbackMessage: "暂时无法获取题库数据，当前继续使用预置内容。",
  });
  const questions = editor.draftData;
  const themeOptions = useMemo(
    () =>
      Array.from(
        new Map(
          questions.map((item) => [item.themeId, { id: item.themeId, title: item.themeTitle }]),
        ).values(),
      ),
    [questions],
  );
  const [selectedThemeId, setSelectedThemeId] = useState<string>("all");
  const filteredQuestions = useMemo(
    () =>
      selectedThemeId === "all"
        ? questions
        : questions.filter((item) => item.themeId === selectedThemeId),
    [questions, selectedThemeId],
  );
  const [selectedId, setSelectedId] = useState(filteredQuestions[0]?.id ?? "");

  useEffect(() => {
    if (
      selectedThemeId !== "all" &&
      !themeOptions.some((item) => item.id === selectedThemeId)
    ) {
      setSelectedThemeId("all");
    }
  }, [selectedThemeId, themeOptions]);

  useEffect(() => {
    setSelectedId((current) =>
      current && filteredQuestions.some((item) => item.id === current)
        ? current
        : filteredQuestions[0]?.id ?? "",
    );
  }, [filteredQuestions]);

  const selectedQuestion = useMemo(
    () =>
      filteredQuestions.find((item) => item.id === selectedId) ??
      filteredQuestions[0] ??
      null,
    [filteredQuestions, selectedId],
  );
  const enabledCount = questions.filter((item) => item.status === "enabled").length;
  const draftCount = questions.length - enabledCount;
  const linkedReviewCount = questions.filter((item) => item.reviewLevelId).length;

  function patchQuestion(
    id: string,
    updater: (current: QuestionBankManagementItem) => QuestionBankManagementItem,
  ) {
    editor.updateDraft((current) =>
      current.map((item) => (item.id === id ? updater(item) : item)),
    );
  }

  function updateQuestion<K extends keyof QuestionBankManagementItem>(
    id: string,
    field: K,
    value: QuestionBankManagementItem[K],
  ) {
    patchQuestion(id, (current) => {
      const nextItem = { ...current, [field]: value };
      return {
        ...nextItem,
        correctLabel:
          nextItem.options[nextItem.correctOptionIndex] ?? nextItem.correctLabel,
      };
    });
  }

  function updateQuestionOption(id: string, optionIndex: number, value: string) {
    patchQuestion(id, (current) => {
      const nextOptions = current.options.map((option, index) =>
        index === optionIndex ? value : option,
      );

      return {
        ...current,
        options: nextOptions,
        correctLabel:
          nextOptions[current.correctOptionIndex] ?? current.correctLabel,
      };
    });
  }

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--admin">
        <div>
          <span className="hero-banner__eyebrow">题库管理</span>
          <h1>按主题筛选题目，并在右侧维护选项与解析</h1>
          <p>
            这一页严格对应说明书中的“题目列表 + 编辑面板”结构，补齐主题筛选、
            选项编辑、正确答案、解析和启用状态。
          </p>
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
          <span>题目总数</span>
          <strong>{questions.length}</strong>
          <p>当前题库围绕道路安全主题客观题，同时预留后续主题的草稿题目。</p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>启用中</span>
          <strong>{enabledCount}</strong>
          <p>启用状态决定题目是否进入学生端正式考试流程。</p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>草稿 / 回看联动</span>
          <strong>
            {draftCount} / {linkedReviewCount}
          </strong>
          <p>每道题都应指向一个明确的复习关卡，避免错题没有回看入口。</p>
        </article>
      </section>

      <section className="surface-card">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">筛选区</span>
            <h2>先按主题切换题目范围</h2>
          </div>
        </div>
        <div className="filter-bar filter-bar--admin">
          <label className="form-field">
            <span>主题筛选</span>
            <select
              value={selectedThemeId}
              onChange={(event) => setSelectedThemeId(event.target.value)}
            >
              <option value="all">全部主题</option>
              {themeOptions.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.title}
                </option>
              ))}
            </select>
          </label>
          <article className="surface-card inline-summary-card">
            <strong>{selectedThemeId === "all" ? "全部主题" : selectedQuestion?.themeTitle ?? "当前主题"}</strong>
            <p>当前筛选后共有 {filteredQuestions.length} 道题。</p>
          </article>
        </div>
      </section>

      <section className="management-layout">
        <div className="page-stack">
          {filteredQuestions.length > 0 ? (
            filteredQuestions.map((question) => (
              <button
                key={question.id}
                type="button"
                className={
                  question.id === selectedQuestion?.id
                    ? "management-list-card management-list-card--active"
                    : "management-list-card"
                }
                onClick={() => setSelectedId(question.id)}
              >
                <div className="row-between">
                  <strong>{question.id}</strong>
                  <span className="surface-tag">
                    {question.status === "enabled" ? "启用中" : "草稿"}
                  </span>
                </div>
                <p>{question.prompt}</p>
                <span className="inline-note">
                  {question.themeTitle} · 回看关卡：{question.reviewLevelId}
                </span>
              </button>
            ))
          ) : (
            <article className="surface-card empty-state-card">
              <strong>当前筛选下没有题目</strong>
              <p>请切换到其他主题，或稍后刷新当前题库内容。</p>
            </article>
          )}
        </div>

        {selectedQuestion ? (
          <div className="page-stack">
            <article className="surface-card editor-panel">
              <span className="section-block__eyebrow">编辑面板</span>
              <h2>{selectedQuestion.id}</h2>
              <div className="chip-row">
                <span className="surface-tag">{selectedQuestion.themeTitle}</span>
                <span className="surface-tag">
                  {selectedQuestion.status === "enabled" ? "启用中" : "草稿"}
                </span>
                <span className="surface-tag">{selectedQuestion.reviewLevelId}</span>
              </div>

              <div className="editor-grid">
                <label className="form-field">
                  <span>所属主题</span>
                  <select
                    value={selectedQuestion.themeId}
                    onChange={(event) => {
                      const nextTheme =
                        themeOptions.find((item) => item.id === event.target.value) ?? null;

                      patchQuestion(selectedQuestion.id, (current) => ({
                        ...current,
                        themeId: event.target.value,
                        themeTitle: nextTheme?.title ?? current.themeTitle,
                      }));
                    }}
                  >
                    {themeOptions.map((theme) => (
                      <option key={theme.id} value={theme.id}>
                        {theme.title}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span>状态</span>
                  <select
                    value={selectedQuestion.status}
                    onChange={(event) =>
                      updateQuestion(
                        selectedQuestion.id,
                        "status",
                        event.target.value as QuestionBankManagementItem["status"],
                      )
                    }
                  >
                    <option value="enabled">启用</option>
                    <option value="draft">草稿</option>
                  </select>
                </label>

                <label className="form-field form-field--wide">
                  <span>题干</span>
                  <textarea
                    rows={3}
                    value={selectedQuestion.prompt}
                    onChange={(event) =>
                      updateQuestion(selectedQuestion.id, "prompt", event.target.value)
                    }
                  />
                </label>

                <label className="form-field form-field--wide">
                  <span>选项设置</span>
                  <div className="option-editor-grid">
                    {selectedQuestion.options.map((option, optionIndex) => (
                      <label key={`${selectedQuestion.id}-${optionIndex}`} className="form-field">
                        <span>选项 {String.fromCharCode(65 + optionIndex)}</span>
                        <input
                          value={option}
                          onChange={(event) =>
                            updateQuestionOption(
                              selectedQuestion.id,
                              optionIndex,
                              event.target.value,
                            )
                          }
                        />
                      </label>
                    ))}
                  </div>
                </label>

                <label className="form-field">
                  <span>正确答案</span>
                  <select
                    value={selectedQuestion.correctOptionIndex}
                    onChange={(event) =>
                      updateQuestion(
                        selectedQuestion.id,
                        "correctOptionIndex",
                        Number(event.target.value),
                      )
                    }
                  >
                    {selectedQuestion.options.map((option, optionIndex) => (
                      <option key={`${selectedQuestion.id}-answer-${optionIndex}`} value={optionIndex}>
                        {String.fromCharCode(65 + optionIndex)}. {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span>回看关卡</span>
                  <select
                    value={selectedQuestion.reviewLevelId}
                    onChange={(event) =>
                      updateQuestion(
                        selectedQuestion.id,
                        "reviewLevelId",
                        event.target.value as LevelId,
                      )
                    }
                  >
                    <option value="level-1">第一关</option>
                    <option value="level-2">第二关</option>
                    <option value="level-3">第三关</option>
                  </select>
                </label>

                <label className="form-field form-field--wide">
                  <span>解析说明</span>
                  <textarea
                    rows={4}
                    value={selectedQuestion.explanation}
                    onChange={(event) =>
                      updateQuestion(selectedQuestion.id, "explanation", event.target.value)
                    }
                  />
                </label>
              </div>
            </article>

            <section className="card-grid card-grid--two">
              <article className="surface-card admin-preview-card admin-preview-card--question">
                <span className="section-block__eyebrow">学生端题面预览</span>
                <h3>{selectedQuestion.prompt}</h3>
                <div className="page-stack page-stack--compact">
                  {selectedQuestion.options.map((option, optionIndex) => (
                    <article
                      key={`${selectedQuestion.id}-preview-${optionIndex}`}
                      className={
                        optionIndex === selectedQuestion.correctOptionIndex
                          ? "question-preview-option question-preview-option--correct"
                          : "question-preview-option"
                      }
                    >
                      <strong>{String.fromCharCode(65 + optionIndex)}</strong>
                      <span>{option}</span>
                    </article>
                  ))}
                </div>
              </article>

              <div className="page-stack">
                <article className="surface-card admin-preview-card">
                  <span className="section-block__eyebrow">错题回看预览</span>
                  <p>{selectedQuestion.explanation}</p>
                  <span className="surface-tag">建议回看：{selectedQuestion.reviewLevelId}</span>
                </article>

                <article className="surface-card admin-preview-card">
                  <span className="section-block__eyebrow">出题提醒</span>
                  <ul className="plain-list">
                    <li>确保解析和回看关卡保持一致。</li>
                    <li>如果题目改成草稿，建议同步准备替代题。</li>
                    <li>考试结果页和错题页会直接消费这里的选项与解析内容。</li>
                  </ul>
                </article>
              </div>
            </section>
          </div>
        ) : (
          <article className="surface-card empty-state-card">
            <strong>请选择一道题</strong>
            <p>左侧选中题目后，就可以维护所属主题、选项、答案、解析和回看关卡。</p>
          </article>
        )}
      </section>
    </div>
  );
}
