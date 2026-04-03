import { useEffect, useMemo, useState } from "react";
import { AdminEditorStatusBar } from "../../components/AdminEditorStatusBar";
import { aiCopyTemplateItems } from "../../data/mockData";
import { fetchAdminAiCopy, saveAdminAiCopy } from "../../services/admin";
import { useAppState } from "../../state/AppState";
import type { AiCopyTemplateItem } from "../../types";
import { useEditableAdminResource } from "../../utils/useEditableAdminResource";

const previewTitleMap: Record<string, string> = {
  welcome: "棣栭〉娆㈣繋鎻愮ず棰勮",
  hint: "鍏冲崱鎻愮ず棰勮",
  report: "缁撴灉鍗℃€荤粨棰勮",
};

export function AdminAiCopyPage() {
  const { state } = useAppState();
  const canUseApi = state.authSource === "api" && Boolean(state.authToken);
  const editor = useEditableAdminResource<AiCopyTemplateItem[]>({
    storageKey: "admin-ai-copy",
    fallbackData: aiCopyTemplateItems,
    enabled: canUseApi,
    fetcher: () => fetchAdminAiCopy(state.authToken ?? ""),
    saveHandler: (draftData, savedData) => saveAdminAiCopy(state.authToken ?? "", draftData, savedData),
    dependencies: [state.authToken],
    fallbackMessage: "鏆傛椂鏃犳硶鑾峰彇 AI 鏂囨妯℃澘锛屽綋鍓嶇户缁娇鐢ㄩ缃唴瀹广€?,
  });
  const templates = editor.draftData;
  const categories = useMemo(
    () => Array.from(new Set(templates.map((item) => item.category))),
    [templates],
  );
  const [activeCategory, setActiveCategory] = useState(categories[0] ?? "");
  const filteredTemplates = useMemo(
    () =>
      activeCategory
        ? templates.filter((item) => item.category === activeCategory)
        : templates,
    [activeCategory, templates],
  );
  const [selectedId, setSelectedId] = useState(filteredTemplates[0]?.id ?? "");

  useEffect(() => {
    setActiveCategory((current) =>
      current && categories.includes(current) ? current : categories[0] ?? "",
    );
  }, [categories]);

  useEffect(() => {
    setSelectedId((current) =>
      current && filteredTemplates.some((item) => item.id === current)
        ? current
        : filteredTemplates[0]?.id ?? "",
    );
  }, [filteredTemplates]);

  const selectedTemplate = useMemo(
    () => filteredTemplates.find((item) => item.id === selectedId) ?? filteredTemplates[0] ?? null,
    [filteredTemplates, selectedId],
  );
  const welcomeCount = templates.filter((item) => item.scene.includes("welcome")).length;
  const hintCount = templates.filter((item) => item.scene.includes("hint")).length;
  const reportCount = templates.filter((item) => item.scene.includes("report")).length;

  function updateTemplate<K extends keyof AiCopyTemplateItem>(
    id: string,
    field: K,
    value: AiCopyTemplateItem[K],
  ) {
    editor.updateDraft((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  }

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--admin">
        <div>
          <span className="hero-banner__eyebrow">AI 鏂囨绠＄悊</span>
          <h1>鎸夊垎绫绘爣绛剧淮鎶ゆā鏉匡紝骞跺湪鍙充晶鍚屾棰勮</h1>
          <p>杩欎竴椤靛搴旇鏄庝功涓殑鈥滃垎绫绘爣绛鹃〉 + 缂栬緫鍖?+ 棰勮鍖衡€濈粨鏋勶紝鐢ㄦ潵缁熶竴绠＄悊娆㈣繋璇€佹彁绀鸿鍜岀粨鏋滃崱妯℃澘銆?/p>
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
          <span>妯℃澘鎬绘暟</span>
          <strong>{templates.length}</strong>
          <p>娆㈣繋璇€佸叧鍗℃彁绀哄拰缁撴灉鍗℃ā鏉块兘浠庤繖閲岀粺涓€缁存姢銆?/p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>鍒嗙被鏁伴噺</span>
          <strong>{categories.length}</strong>
          <p>寤鸿鍒嗙被淇濇寔绮剧畝锛岄伩鍏嶅悓涓€鍦烘櫙鎷嗘垚杩囧妯℃澘銆?/p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>娆㈣繋 / 鎻愮ず / 鎬荤粨</span>
          <strong>
            {welcomeCount} / {hintCount} / {reportCount}
          </strong>
          <p>缁撴灉绫绘ā鏉夸細褰卞搷 AI 缁撴灉鍗￠〉鐨勮姘斿拰鎬荤粨椋庢牸銆?/p>
        </article>
      </section>

      <section className="surface-card">
        <span className="section-block__eyebrow">鍒嗙被鏍囩椤?/span>
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
      </section>

      <section className="management-layout">
        <div className="page-stack">
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                className={
                  template.id === selectedTemplate?.id
                    ? "management-list-card management-list-card--active"
                    : "management-list-card"
                }
                onClick={() => setSelectedId(template.id)}
              >
                <span className="surface-tag">{template.scene}</span>
                <h3>{template.title}</h3>
                <p>{template.category}</p>
              </button>
            ))
          ) : (
            <article className="surface-card empty-state-card">
              <strong>褰撳墠鍒嗙被涓嬫病鏈夋ā鏉?/strong>
              <p>璇峰厛鎭㈠鏈€杩戠増鏈紝鎴栧垏鎹㈠埌鍏朵粬鏂囨鍒嗙被鏌ョ湅銆?/p>
            </article>
          )}
        </div>

        {selectedTemplate ? (
          <div className="page-stack">
            <article className="surface-card editor-panel">
              <span className="section-block__eyebrow">缂栬緫鏂囨妯℃澘</span>
              <h2>{selectedTemplate.title}</h2>
              <div className="chip-row">
                <span className="surface-tag">{selectedTemplate.category}</span>
                <span className="surface-tag">{selectedTemplate.scene}</span>
              </div>

              <div className="editor-grid">
                <label className="form-field">
                  <span>鍒嗙被</span>
                  <input
                    value={selectedTemplate.category}
                    onChange={(event) =>
                      updateTemplate(selectedTemplate.id, "category", event.target.value)
                    }
                  />
                </label>

                <label className="form-field">
                  <span>鍦烘櫙鏍囪瘑</span>
                  <input
                    value={selectedTemplate.scene}
                    onChange={(event) =>
                      updateTemplate(selectedTemplate.id, "scene", event.target.value)
                    }
                  />
                </label>

                <label className="form-field">
                  <span>妯℃澘鏍囬</span>
                  <input
                    value={selectedTemplate.title}
                    onChange={(event) =>
                      updateTemplate(selectedTemplate.id, "title", event.target.value)
                    }
                  />
                </label>

                <label className="form-field form-field--wide">
                  <span>妯℃澘姝ｆ枃</span>
                  <textarea
                    rows={7}
                    value={selectedTemplate.promptText}
                    onChange={(event) =>
                      updateTemplate(selectedTemplate.id, "promptText", event.target.value)
                    }
                  />
                </label>
              </div>
            </article>

            <section className="card-grid card-grid--two">
              <article className="surface-card admin-preview-card admin-preview-card--ai">
                <span className="section-block__eyebrow">棰勮鍖?/span>
                <h3>{previewTitleMap[selectedTemplate.scene] ?? "AI 鏂囨棰勮"}</h3>
                <article className="chat-bubble chat-bubble--assistant">
                  {selectedTemplate.promptText}
                </article>
              </article>

              <div className="page-stack">
                <article className="surface-card admin-preview-card">
                  <span className="section-block__eyebrow">妯℃澘绛栫暐鎻愰啋</span>
                  <ul className="plain-list">
                    <li>娆㈣繋璇鐭€佸弸濂姐€佹槑纭憡璇夊鐢熷厛鍋氫粈涔堛€?/li>
                    <li>鎻愮ず璇紭鍏堢粰鏂瑰悜锛屼笉鐩存帴缁欏畬鏁寸瓟妗堛€?/li>
                    <li>缁撴灉绫绘ā鏉胯鍚屾椂瑕嗙洊浜偣銆佽ˉ寮洪噸鐐瑰拰涓嬩竴姝ュ姩浣溿€?/li>
                  </ul>
                </article>

                <article className="surface-card admin-preview-card">
                  <span className="section-block__eyebrow">鏁版嵁璇存槑</span>
                  <p>褰撳墠淇濆瓨浼氬厛鍐欏叆鏈湴閰嶇疆鐗堟湰锛屽悗缁帴鍏ユ湇鍔＄鍚庡彲鐩存帴鍒囨崲涓虹粺涓€妯℃澘绠＄悊銆?/p>
                </article>
              </div>
            </section>
          </div>
        ) : (
          <article className="surface-card empty-state-card">
            <strong>璇烽€夋嫨涓€涓枃妗堟ā鏉?/strong>
            <p>宸︿晶閫変腑妯℃澘鍚庯紝灏卞彲浠ョ淮鎶ゅ垎绫汇€佸満鏅爣璇嗐€佹鏂囧拰鍙充晶棰勮銆?/p>
          </article>
        )}
      </section>
    </div>
  );
}


