import { useEffect, useMemo, useState } from "react";
import { AdminEditorStatusBar } from "../../components/AdminEditorStatusBar";
import { aiCopyTemplateItems } from "../../data/mockData";
import { fetchAdminAiCopy } from "../../services/admin";
import { useAppState } from "../../state/AppState";
import type { AiCopyTemplateItem } from "../../types";
import { useEditableAdminResource } from "../../utils/useEditableAdminResource";

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
  const [selectedId, setSelectedId] = useState(templates[0]?.id ?? "");

  useEffect(() => {
    setSelectedId((current) =>
      current && templates.some((item) => item.id === current) ? current : templates[0]?.id ?? "",
    );
  }, [templates]);

  const categories = Array.from(new Set(templates.map((item) => item.category)));
  const selectedTemplate = useMemo(
    () => templates.find((item) => item.id === selectedId) ?? templates[0] ?? null,
    [selectedId, templates],
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
          <h1>维护欢迎语、提示语、鼓励语和结果模板</h1>
          <p>本轮保持“模板优先、真实模型补充问答”的实现策略，确保内容稳定可控。</p>
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
          <p>欢迎语、关卡提示和结果卡片模板都从这里统一维护。</p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>分类数量</span>
          <strong>{categories.length}</strong>
          <p>建议分类保持精简，避免相同场景拆成太多模板。</p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>欢迎 / 提示 / 总结</span>
          <strong>
            {welcomeCount} / {hintCount} / {reportCount}
          </strong>
          <p>结果类模板会影响学生端 AI 结果卡片的语气和总结风格。</p>
        </article>
      </section>

      <section className="surface-card">
        <span className="section-block__eyebrow">文案分类</span>
        <div className="chip-row">
          {categories.map((category) => (
            <span key={category} className="quick-chip quick-chip--static">
              {category}
            </span>
          ))}
        </div>
      </section>

      <section className="management-layout">
        <div className="page-stack">
          {templates.length > 0 ? (
            templates.map((template) => (
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
                <span className="surface-tag">{template.category}</span>
                <h3>{template.title}</h3>
                <p>{template.scene}</p>
              </button>
            ))
          ) : (
            <article className="surface-card empty-state-card">
              <strong>当前没有 AI 模板数据</strong>
              <p>请先恢复同步 / 默认数据，或等待后端返回 AI 模板列表。</p>
            </article>
          )}
        </div>

        {selectedTemplate ? (
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

            <div className="card-grid card-grid--two">
              <article className="feedback-box">
                <strong>模板策略提醒</strong>
                <p>欢迎语、关卡提示和结果模板建议保持短句、明确、可鼓励，不要写成长对话。</p>
              </article>
              <article className="feedback-box">
                <strong>联调说明</strong>
                <p>当前保存只影响前端本地工作稿，后续若接后端写接口，再整体切换为真实配置管理。</p>
              </article>
            </div>
          </article>
        ) : (
          <article className="surface-card empty-state-card">
            <strong>请选择一个文案模板</strong>
            <p>左侧选中模板后，就可以维护分类、场景标识和模板正文。</p>
          </article>
        )}
      </section>
    </div>
  );
}
