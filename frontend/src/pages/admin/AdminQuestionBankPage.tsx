import { useEffect, useMemo, useState } from "react";
import { AdminEditorStatusBar } from "../../components/AdminEditorStatusBar";
import { questionBankManagementItems } from "../../data/mockData";
import { fetchAdminQuestionBank, saveAdminQuestionBank } from "../../services/admin";
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
    saveHandler: (draftData, savedData) => saveAdminQuestionBank(state.authToken ?? "", draftData, savedData),
    dependencies: [state.authToken],
    fallbackMessage: "鏆傛椂鏃犳硶鑾峰彇棰樺簱鏁版嵁锛屽綋鍓嶇户缁娇鐢ㄩ缃唴瀹广€?,
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
          <span className="hero-banner__eyebrow">棰樺簱绠＄悊</span>
          <h1>鎸変富棰樼瓫閫夐鐩紝骞跺湪鍙充晶缁存姢閫夐」涓庤В鏋?/h1>
          <p>
            杩欎竴椤典弗鏍煎搴旇鏄庝功涓殑鈥滈鐩垪琛?+ 缂栬緫闈㈡澘鈥濈粨鏋勶紝琛ラ綈涓婚绛涢€夈€?
            閫夐」缂栬緫銆佹纭瓟妗堛€佽В鏋愬拰鍚敤鐘舵€併€?
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
          <span>棰樼洰鎬绘暟</span>
          <strong>{questions.length}</strong>
          <p>褰撳墠棰樺簱鍥寸粫閬撹矾瀹夊叏涓婚瀹㈣棰橈紝鍚屾椂棰勭暀鍚庣画涓婚鐨勮崏绋块鐩€?/p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>鍚敤涓?/span>
          <strong>{enabledCount}</strong>
          <p>鍚敤鐘舵€佸喅瀹氶鐩槸鍚﹁繘鍏ュ鐢熺姝ｅ紡鑰冭瘯娴佺▼銆?/p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>鑽夌 / 鍥炵湅鑱斿姩</span>
          <strong>
            {draftCount} / {linkedReviewCount}
          </strong>
          <p>姣忛亾棰橀兘搴旀寚鍚戜竴涓槑纭殑澶嶄範鍏冲崱锛岄伩鍏嶉敊棰樻病鏈夊洖鐪嬪叆鍙ｃ€?/p>
        </article>
      </section>

      <section className="surface-card">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">绛涢€夊尯</span>
            <h2>鍏堟寜涓婚鍒囨崲棰樼洰鑼冨洿</h2>
          </div>
        </div>
        <div className="filter-bar filter-bar--admin">
          <label className="form-field">
            <span>涓婚绛涢€?/span>
            <select
              value={selectedThemeId}
              onChange={(event) => setSelectedThemeId(event.target.value)}
            >
              <option value="all">鍏ㄩ儴涓婚</option>
              {themeOptions.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.title}
                </option>
              ))}
            </select>
          </label>
          <article className="surface-card inline-summary-card">
            <strong>{selectedThemeId === "all" ? "鍏ㄩ儴涓婚" : selectedQuestion?.themeTitle ?? "褰撳墠涓婚"}</strong>
            <p>褰撳墠绛涢€夊悗鍏辨湁 {filteredQuestions.length} 閬撻銆?/p>
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
                    {question.status === "enabled" ? "鍚敤涓? : "鑽夌"}
                  </span>
                </div>
                <p>{question.prompt}</p>
                <span className="inline-note">
                  {question.themeTitle} 路 鍥炵湅鍏冲崱锛歿question.reviewLevelId}
                </span>
              </button>
            ))
          ) : (
            <article className="surface-card empty-state-card">
              <strong>褰撳墠绛涢€変笅娌℃湁棰樼洰</strong>
              <p>璇峰垏鎹㈠埌鍏朵粬涓婚锛屾垨绛夊緟鍚庣杩斿洖瀵瑰簲棰樺簱鍐呭銆?/p>
            </article>
          )}
        </div>

        {selectedQuestion ? (
          <div className="page-stack">
            <article className="surface-card editor-panel">
              <span className="section-block__eyebrow">缂栬緫闈㈡澘</span>
              <h2>{selectedQuestion.id}</h2>
              <div className="chip-row">
                <span className="surface-tag">{selectedQuestion.themeTitle}</span>
                <span className="surface-tag">
                  {selectedQuestion.status === "enabled" ? "鍚敤涓? : "鑽夌"}
                </span>
                <span className="surface-tag">{selectedQuestion.reviewLevelId}</span>
              </div>

              <div className="editor-grid">
                <label className="form-field">
                  <span>鎵€灞炰富棰?/span>
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
                  <span>鐘舵€?/span>
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
                    <option value="enabled">鍚敤</option>
                    <option value="draft">鑽夌</option>
                  </select>
                </label>

                <label className="form-field form-field--wide">
                  <span>棰樺共</span>
                  <textarea
                    rows={3}
                    value={selectedQuestion.prompt}
                    onChange={(event) =>
                      updateQuestion(selectedQuestion.id, "prompt", event.target.value)
                    }
                  />
                </label>

                <label className="form-field form-field--wide">
                  <span>閫夐」璁剧疆</span>
                  <div className="option-editor-grid">
                    {selectedQuestion.options.map((option, optionIndex) => (
                      <label key={`${selectedQuestion.id}-${optionIndex}`} className="form-field">
                        <span>閫夐」 {String.fromCharCode(65 + optionIndex)}</span>
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
                  <span>姝ｇ‘绛旀</span>
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
                  <span>鍥炵湅鍏冲崱</span>
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
                    <option value="level-1">绗竴鍏?/option>
                    <option value="level-2">绗簩鍏?/option>
                    <option value="level-3">绗笁鍏?/option>
                  </select>
                </label>

                <label className="form-field form-field--wide">
                  <span>瑙ｆ瀽璇存槑</span>
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
                <span className="section-block__eyebrow">瀛︾敓绔闈㈤瑙?/span>
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
                  <span className="section-block__eyebrow">閿欓鍥炵湅棰勮</span>
                  <p>{selectedQuestion.explanation}</p>
                  <span className="surface-tag">寤鸿鍥炵湅锛歿selectedQuestion.reviewLevelId}</span>
                </article>

                <article className="surface-card admin-preview-card">
                  <span className="section-block__eyebrow">鍑洪鎻愰啋</span>
                  <ul className="plain-list">
                    <li>纭繚瑙ｆ瀽鍜屽洖鐪嬪叧鍗′繚鎸佷竴鑷淬€?/li>
                    <li>濡傛灉棰樼洰鏀规垚鑽夌锛屽缓璁悓姝ュ噯澶囨浛浠ｉ銆?/li>
                    <li>鑰冭瘯缁撴灉椤靛拰閿欓椤典細鐩存帴娑堣垂杩欓噷鐨勯€夐」涓庤В鏋愬唴瀹广€?/li>
                  </ul>
                </article>
              </div>
            </section>
          </div>
        ) : (
          <article className="surface-card empty-state-card">
            <strong>璇烽€夋嫨涓€閬撻</strong>
            <p>宸︿晶閫変腑棰樼洰鍚庯紝灏卞彲浠ョ淮鎶ゆ墍灞炰富棰樸€侀€夐」銆佺瓟妗堛€佽В鏋愬拰鍥炵湅鍏冲崱銆?/p>
          </article>
        )}
      </section>
    </div>
  );
}


