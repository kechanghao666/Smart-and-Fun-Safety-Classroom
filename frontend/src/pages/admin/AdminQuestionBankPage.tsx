import { useMemo, useState } from "react";
import { questionBankManagementItems } from "../../data/mockData";
import type { LevelId, QuestionBankManagementItem } from "../../types";
import { usePersistedState } from "../../utils/usePersistedState";

export function AdminQuestionBankPage() {
  const [questions, setQuestions] = usePersistedState<QuestionBankManagementItem[]>(
    "admin-question-bank",
    questionBankManagementItems,
  );
  const [selectedId, setSelectedId] = useState(questions[0]?.id ?? "");
  const selectedQuestion = useMemo(
    () => questions.find((item) => item.id === selectedId) ?? questions[0] ?? null,
    [questions, selectedId],
  );

  function updateQuestion<K extends keyof QuestionBankManagementItem>(
    id: string,
    field: K,
    value: QuestionBankManagementItem[K],
  ) {
    setQuestions((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  }

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--admin">
        <div>
          <span className="hero-banner__eyebrow">题库管理</span>
          <h1>维护题目、正确答案、解析和回看关卡</h1>
          <p>题库结构已经对齐学生端考试页和错题回看需求。</p>
        </div>
      </section>

      <section className="management-layout">
        <div className="page-stack">
          {questions.map((question) => (
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
            </button>
          ))}
        </div>

        {selectedQuestion ? (
          <article className="surface-card editor-panel">
            <span className="section-block__eyebrow">编辑题目</span>
            <h2>{selectedQuestion.id}</h2>
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
          </article>
        ) : null}
      </section>
    </div>
  );
}
