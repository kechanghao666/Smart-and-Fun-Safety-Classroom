import { useEffect, useMemo, useState } from "react";
import { AdminEditorStatusBar } from "../../components/AdminEditorStatusBar";
import { questionBankManagementItems } from "../../data/mockData";
import { fetchAdminQuestionBank } from "../../services/admin";
import { useAppState } from "../../state/AppState";
import type { LevelId, QuestionBankManagementItem } from "../../types";
import { useEditableAdminResource } from "../../utils/useEditableAdminResource";

export function AdminQuestionBankPage() {
  const { state } = useAppState();
  const canUseApi = state.authSource === "api" && Boolean(state.authToken);
  const editor = useEditableAdminResource<QuestionBankManagementItem[]>({
    storageKey: "admin-question-bank",
    fallbackData: questionBankManagementItems,
    enabled: canUseApi,
    fetcher: () => fetchAdminQuestionBank(state.authToken ?? ""),
    dependencies: [state.authToken],
    fallbackMessage: "暂时无法获取题库数据，当前继续使用本地演示内容。",
  });
  const questions = editor.draftData;
  const [selectedId, setSelectedId] = useState(questions[0]?.id ?? "");

  useEffect(() => {
    setSelectedId((current) =>
      current && questions.some((item) => item.id === current) ? current : questions[0]?.id ?? "",
    );
  }, [questions]);

  const selectedQuestion = useMemo(
    () => questions.find((item) => item.id === selectedId) ?? questions[0] ?? null,
    [questions, selectedId],
  );
  const enabledCount = questions.filter((item) => item.status === "enabled").length;
  const draftCount = questions.length - enabledCount;
  const linkedReviewCount = questions.filter((item) => item.reviewLevelId).length;

  function updateQuestion<K extends keyof QuestionBankManagementItem>(
    id: string,
    field: K,
    value: QuestionBankManagementItem[K],
  ) {
    editor.updateDraft((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  }

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--admin">
        <div>
          <span className="hero-banner__eyebrow">题库管理</span>
          <h1>维护题目、正确答案、解析和回看关卡</h1>
          <p>题库配置会直接影响考试页、错题回看和 AI 结果卡片中的复习建议。</p>
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
          <p>当前题库围绕道路安全主题的客观题进行配置。</p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>启用中</span>
          <strong>{enabledCount}</strong>
          <p>启用状态会决定题目是否进入学生端正式考试流程。</p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>草稿 / 回看联动</span>
          <strong>
            {draftCount} / {linkedReviewCount}
          </strong>
          <p>每道题都应指向一个明确的复习关卡，避免错题没有回看入口。</p>
        </article>
      </section>

      <section className="management-layout">
        <div className="page-stack">
          {questions.length > 0 ? (
            questions.map((question) => (
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
                <span className="inline-note">回看关卡：{question.reviewLevelId}</span>
              </button>
            ))
          ) : (
            <article className="surface-card empty-state-card">
              <strong>当前没有题库数据</strong>
              <p>请先恢复同步 / 默认数据，或等待后端返回题库列表。</p>
            </article>
          )}
        </div>

        {selectedQuestion ? (
          <article className="surface-card editor-panel">
            <span className="section-block__eyebrow">编辑题目</span>
            <h2>{selectedQuestion.id}</h2>
            <div className="chip-row">
              <span className="surface-tag">
                {selectedQuestion.status === "enabled" ? "启用中" : "草稿"}
              </span>
              <span className="surface-tag">{selectedQuestion.reviewLevelId}</span>
            </div>
            <div className="editor-grid">
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
              <label className="form-field">
                <span>正确答案</span>
                <input
                  value={selectedQuestion.correctLabel}
                  onChange={(event) =>
                    updateQuestion(selectedQuestion.id, "correctLabel", event.target.value)
                  }
                />
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
            </div>

            <div className="card-grid card-grid--two">
              <article className="feedback-box">
                <strong>考试联动提醒</strong>
                <p>确保题目解析和回看关卡保持一致，这会直接决定考试后的复习路径是否清晰。</p>
              </article>
              <article className="feedback-box">
                <strong>出题建议</strong>
                <p>如果题目改成草稿，建议同步准备替代题，避免正式考试题量不足。</p>
              </article>
            </div>
          </article>
        ) : (
          <article className="surface-card empty-state-card">
            <strong>请选择一道题</strong>
            <p>左侧选中题目后，就可以维护答案、解析和错题回看关卡。</p>
          </article>
        )}
      </section>
    </div>
  );
}
