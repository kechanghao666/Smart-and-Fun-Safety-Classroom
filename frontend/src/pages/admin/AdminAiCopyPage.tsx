import { useEffect, useMemo, useState } from "react";
import { AdminEditorStatusBar } from "../../components/AdminEditorStatusBar";
import { aiCopyTemplateItems } from "../../data/mockData";
import { fetchAdminAiCopy } from "../../services/admin";
import { useAppState } from "../../state/AppState";
import type { AiCopyTemplateItem } from "../../types";
import { useEditableAdminResource } from "../../utils/useEditableAdminResource";

const previewTitleMap: Record<string, string> = {
  welcome: "首页欢迎提示预览",
  hint: "关卡提示预览",
  report: "结果卡总结预览",
};

export function AdminAiCopyPage() {
  const { state } = useAppState();
  const canUseApi = state.authSource === "api" && Boolean(state.authToken);
  const editor = useEditableAdminResource<AiCopyTemplateItem[]>({
    storageKey: "admin-ai-copy",
    fallbackData: aiCopyTemplateItems,
    enabled: canUseApi,
    fetcher: () => fetchAdminAiCopy(state.authToken ?? ""),
    dependencies: [state.authToken],
    fallbackMessage: "暂时无法获取 AI 文案模板，当前继续使用本地演示内容。",
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
          <span className="hero-banner__eyebrow">AI 文案管理</span>
          <h1>按分类标签维护模板，并在右侧同步预览</h1>
          <p>这一页对应说明书中的“分类标签页 + 编辑区 + 预览区”结构，用来统一管理欢迎语、提示语和结果卡模板。</p>
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
          <span>模板总数</span>
          <strong>{templates.length}</strong>
          <p>欢迎语、关卡提示和结果卡模板都从这里统一维护。</p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>分类数量</span>
          <strong>{categories.length}</strong>
          <p>建议分类保持精简，避免同一场景拆成过多模板。</p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>欢迎 / 提示 / 总结</span>
          <strong>
            {welcomeCount} / {hintCount} / {reportCount}
          </strong>
          <p>结果类模板会影响 AI 结果卡页的语气和总结风格。</p>
        </article>
      </section>

      <section className="surface-card">
        <span className="section-block__eyebrow">分类标签页</span>
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
              <strong>当前分类下没有模板</strong>
              <p>请先恢复同步 / 默认数据，或切换到其他文案分类查看。</p>
            </article>
          )}
        </div>

        {selectedTemplate ? (
          <div className="page-stack">
            <article className="surface-card editor-panel">
              <span className="section-block__eyebrow">编辑文案模板</span>
              <h2>{selectedTemplate.title}</h2>
              <div className="chip-row">
                <span className="surface-tag">{selectedTemplate.category}</span>
                <span className="surface-tag">{selectedTemplate.scene}</span>
              </div>

              <div className="editor-grid">
                <label className="form-field">
                  <span>分类</span>
                  <input
                    value={selectedTemplate.category}
                    onChange={(event) =>
                      updateTemplate(selectedTemplate.id, "category", event.target.value)
                    }
                  />
                </label>

                <label className="form-field">
                  <span>场景标识</span>
                  <input
                    value={selectedTemplate.scene}
                    onChange={(event) =>
                      updateTemplate(selectedTemplate.id, "scene", event.target.value)
                    }
                  />
                </label>

                <label className="form-field">
                  <span>模板标题</span>
                  <input
                    value={selectedTemplate.title}
                    onChange={(event) =>
                      updateTemplate(selectedTemplate.id, "title", event.target.value)
                    }
                  />
                </label>

                <label className="form-field form-field--wide">
                  <span>模板正文</span>
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
                <span className="section-block__eyebrow">预览区</span>
                <h3>{previewTitleMap[selectedTemplate.scene] ?? "AI 文案预览"}</h3>
                <article className="chat-bubble chat-bubble--assistant">
                  {selectedTemplate.promptText}
                </article>
              </article>

              <div className="page-stack">
                <article className="surface-card admin-preview-card">
                  <span className="section-block__eyebrow">模板策略提醒</span>
                  <ul className="plain-list">
                    <li>欢迎语要短、友好、明确告诉学生先做什么。</li>
                    <li>提示语优先给方向，不直接给完整答案。</li>
                    <li>结果类模板要同时覆盖亮点、补强重点和下一步动作。</li>
                  </ul>
                </article>

                <article className="surface-card admin-preview-card">
                  <span className="section-block__eyebrow">联调说明</span>
                  <p>当前保存只影响前端本地工作稿。后续如果接真实后台写接口，再整体替换成真实模板管理。</p>
                </article>
              </div>
            </section>
          </div>
        ) : (
          <article className="surface-card empty-state-card">
            <strong>请选择一个文案模板</strong>
            <p>左侧选中模板后，就可以维护分类、场景标识、正文和右侧预览。</p>
          </article>
        )}
      </section>
    </div>
  );
}
