import { useCallback, useMemo, useState } from "react";
import { aiCopyTemplateItems } from "../../data/mockData";
import { fetchAdminAiCopy } from "../../services/admin";
import { useAppState } from "../../state/AppState";
import type { AiCopyTemplateItem } from "../../types";
import { useApiHydration } from "../../utils/useApiHydration";
import { usePersistedState } from "../../utils/usePersistedState";

export function AdminAiCopyPage() {
  const { state } = useAppState();
  const [templates, setTemplates] = usePersistedState<AiCopyTemplateItem[]>(
    "admin-ai-copy",
    aiCopyTemplateItems,
  );
  const canUseApi = state.authSource === "api" && Boolean(state.authToken);
  const [selectedId, setSelectedId] = useState(templates[0]?.id ?? "");
  const categories = Array.from(new Set(templates.map((item) => item.category)));
  const selectedTemplate = useMemo(
    () => templates.find((item) => item.id === selectedId) ?? templates[0] ?? null,
    [selectedId, templates],
  );
  const applyTemplates = useCallback(
    (items: AiCopyTemplateItem[]) => {
      setTemplates(items);
      setSelectedId((current) => {
        if (current && items.some((item) => item.id === current)) {
          return current;
        }

        return items[0]?.id ?? "";
      });
    },
    [setTemplates],
  );
  const { error, isLoading, source } = useApiHydration({
    enabled: canUseApi,
    fetcher: () => fetchAdminAiCopy(state.authToken ?? ""),
    applyData: applyTemplates,
    dependencies: [state.authToken],
    fallbackMessage: "暂时无法获取 AI 文案模板，当前继续使用本地演示内容。",
  });

  function updateTemplate<K extends keyof AiCopyTemplateItem>(
    id: string,
    field: K,
    value: AiCopyTemplateItem[K],
  ) {
    setTemplates((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  }

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--admin">
        <div>
          <span className="hero-banner__eyebrow">AI 文案管理</span>
          <h1>维护欢迎语、提示语、鼓励语和结果模板</h1>
          <p>本轮保持“模板优先、真实模型补充问答”的实现策略。</p>
        </div>
      </section>

      <article className="feedback-box">
        <strong>{source === "api" ? "AI 模板已从后端同步" : "AI 模板正在使用本地演示数据"}</strong>
        <p>
          {isLoading
            ? "正在同步 AI 文案模板..."
            : error || "当前页会优先保留模板编辑体验，等待后端保存能力接入。"}
        </p>
      </article>

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
          {templates.map((template) => (
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
          ))}
        </div>

        {selectedTemplate ? (
          <article className="surface-card editor-panel">
            <span className="section-block__eyebrow">编辑文案模板</span>
            <h2>{selectedTemplate.title}</h2>
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
        ) : null}
      </section>
    </div>
  );
}
