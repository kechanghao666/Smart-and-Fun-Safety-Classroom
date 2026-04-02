import { useMemo, useState } from "react";
import { themeManagementItems } from "../../data/mockData";
import type { ThemeManagementItem } from "../../types";
import { usePersistedState } from "../../utils/usePersistedState";

export function AdminThemesPage() {
  const [themes, setThemes] = usePersistedState<ThemeManagementItem[]>(
    "admin-theme-management",
    themeManagementItems,
  );
  const [selectedId, setSelectedId] = useState(themes[0]?.id ?? "");
  const selectedTheme = useMemo(
    () => themes.find((item) => item.id === selectedId) ?? themes[0] ?? null,
    [selectedId, themes],
  );

  function updateTheme<K extends keyof ThemeManagementItem>(
    id: string,
    field: K,
    value: ThemeManagementItem[K],
  ) {
    setThemes((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  }

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--admin">
        <div>
          <span className="hero-banner__eyebrow">主题管理</span>
          <h1>维护主题名称、封面、简介、开放状态与排序</h1>
          <p>当前为前端可编辑原型，改动会持久化到浏览器本地存储，方便多人演示。</p>
        </div>
      </section>

      <section className="management-layout">
        <div className="page-stack">
          {themes.map((theme) => (
            <button
              key={theme.id}
              type="button"
              className={
                theme.id === selectedTheme?.id
                  ? "management-list-card management-list-card--active"
                  : "management-list-card"
              }
              onClick={() => setSelectedId(theme.id)}
            >
              <div className="row-between">
                <strong>{theme.title}</strong>
                <span className="surface-tag">{theme.isOpen ? "开放中" : "未开放"}</span>
              </div>
              <p>{theme.description}</p>
            </button>
          ))}
        </div>

        {selectedTheme ? (
          <article className="surface-card editor-panel">
            <span className="section-block__eyebrow">编辑主题</span>
            <h2>{selectedTheme.title}</h2>
            <div className="editor-grid">
              <label className="form-field">
                <span>主题名称</span>
                <input
                  value={selectedTheme.title}
                  onChange={(event) =>
                    updateTheme(selectedTheme.id, "title", event.target.value)
                  }
                />
              </label>
              <label className="form-field">
                <span>封面标签</span>
                <input
                  value={selectedTheme.coverLabel}
                  onChange={(event) =>
                    updateTheme(selectedTheme.id, "coverLabel", event.target.value)
                  }
                />
              </label>
              <label className="form-field form-field--wide">
                <span>主题简介</span>
                <textarea
                  rows={4}
                  value={selectedTheme.description}
                  onChange={(event) =>
                    updateTheme(selectedTheme.id, "description", event.target.value)
                  }
                />
              </label>
              <label className="form-field">
                <span>排序</span>
                <input
                  type="number"
                  value={selectedTheme.sortOrder}
                  onChange={(event) =>
                    updateTheme(selectedTheme.id, "sortOrder", Number(event.target.value))
                  }
                />
              </label>
              <label className="form-field">
                <span>开放状态</span>
                <select
                  value={selectedTheme.isOpen ? "open" : "closed"}
                  onChange={(event) =>
                    updateTheme(selectedTheme.id, "isOpen", event.target.value === "open")
                  }
                >
                  <option value="open">开放</option>
                  <option value="closed">关闭</option>
                </select>
              </label>
            </div>
          </article>
        ) : null}
      </section>
    </div>
  );
}
