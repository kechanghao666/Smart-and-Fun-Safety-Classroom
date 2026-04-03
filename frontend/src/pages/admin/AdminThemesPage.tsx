import { useEffect, useMemo, useState } from "react";
import { AdminEditorStatusBar } from "../../components/AdminEditorStatusBar";
import { themeManagementItems } from "../../data/mockData";
import { fetchAdminThemes, saveAdminThemes } from "../../services/admin";
import { useAppState } from "../../state/AppState";
import type { ThemeAccent, ThemeManagementItem } from "../../types";
import { useEditableAdminResource } from "../../utils/useEditableAdminResource";

interface ThemeCoverPreset {
  accent: ThemeAccent;
  coverIllustration: string;
  coverLabel: string;
}

interface ThemeModalState {
  mode: "create" | "edit";
  draft: ThemeManagementItem;
}

const coverPresetOptions: ThemeCoverPreset[] = [
  {
    accent: "sky",
    coverIllustration: "鏂戦┈绾夸笌淇″彿鐏彃鐢?,
    coverLabel: "钃濆ぉ鏂戦┈绾垮皝闈?,
  },
  {
    accent: "mint",
    coverIllustration: "鏍″洯鎿嶅満涓庢暀瀛︽ゼ鎻掔敾",
    coverLabel: "鏍″洯鎿嶅満灏侀潰",
  },
  {
    accent: "orange",
    coverIllustration: "瀹跺涵瀹㈠巺涓庡畨鍏ㄦ彁閱掓彃鐢?,
    coverLabel: "瀹跺涵瀹夊叏灏侀潰",
  },
];

function buildThemeId(title: string) {
  const normalized = title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-\u4e00-\u9fa5]/g, "");

  return normalized ? `theme-${normalized}` : `theme-${Date.now()}`;
}

function createThemeDraft(sortOrder: number): ThemeManagementItem {
  const preset = coverPresetOptions[0];

  return {
    id: `theme-${Date.now()}`,
    title: "鏂颁富棰?,
    description: "璇峰～鍐欎富棰樼畝浠嬨€?,
    coverLabel: preset.coverLabel,
    coverAccent: preset.accent,
    coverIllustration: preset.coverIllustration,
    isOpen: false,
    sortOrder,
  };
}

export function AdminThemesPage() {
  const { state } = useAppState();
  const canUseApi = state.authSource === "api" && Boolean(state.authToken);
  const editor = useEditableAdminResource<ThemeManagementItem[]>({
    storageKey: "admin-theme-management",
    fallbackData: themeManagementItems,
    enabled: canUseApi,
    fetcher: () => fetchAdminThemes(state.authToken ?? ""),
    saveHandler: (draftData, savedData) => saveAdminThemes(state.authToken ?? "", draftData, savedData),
    dependencies: [state.authToken],
    fallbackMessage: "鏆傛椂鏃犳硶鑾峰彇涓婚绠＄悊鏁版嵁锛屽綋鍓嶇户缁娇鐢ㄩ缃唴瀹广€?,
  });
  const themes = editor.draftData
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder);
  const [selectedId, setSelectedId] = useState(themes[0]?.id ?? "");
  const [modalState, setModalState] = useState<ThemeModalState | null>(null);

  useEffect(() => {
    setSelectedId((current) =>
      current && themes.some((item) => item.id === current) ? current : themes[0]?.id ?? "",
    );
  }, [themes]);

  const selectedTheme = useMemo(
    () => themes.find((item) => item.id === selectedId) ?? themes[0] ?? null,
    [selectedId, themes],
  );
  const openCount = themes.filter((item) => item.isOpen).length;
  const closedCount = themes.length - openCount;

  function openCreateModal() {
    const nextSortOrder =
      Math.max(0, ...themes.map((item) => item.sortOrder)) + 1;

    setModalState({
      mode: "create",
      draft: createThemeDraft(nextSortOrder),
    });
  }

  function openEditModal(theme: ThemeManagementItem) {
    setModalState({
      mode: "edit",
      draft: { ...theme },
    });
  }

  function updateModalDraft<K extends keyof ThemeManagementItem>(
    field: K,
    value: ThemeManagementItem[K],
  ) {
    setModalState((current) =>
      current
        ? {
            ...current,
            draft: {
              ...current.draft,
              [field]: value,
            },
          }
        : current,
    );
  }

  function applyPreset(preset: ThemeCoverPreset) {
    setModalState((current) =>
      current
        ? {
            ...current,
            draft: {
              ...current.draft,
              coverAccent: preset.accent,
              coverIllustration: preset.coverIllustration,
              coverLabel: preset.coverLabel,
            },
          }
        : current,
    );
  }

  function submitModal() {
    if (!modalState) {
      return;
    }

    const trimmedTitle = modalState.draft.title.trim() || "鏈懡鍚嶄富棰?;
    const trimmedDescription = modalState.draft.description.trim() || "璇疯ˉ鍏呬富棰樼畝浠嬨€?;
    const nextDraft: ThemeManagementItem = {
      ...modalState.draft,
      id:
        modalState.mode === "create"
          ? buildThemeId(trimmedTitle)
          : modalState.draft.id,
      title: trimmedTitle,
      description: trimmedDescription,
      sortOrder: Number.isNaN(modalState.draft.sortOrder)
        ? themes.length + 1
        : modalState.draft.sortOrder,
    };

    editor.updateDraft((current) => {
      if (modalState.mode === "create") {
        return [...current, nextDraft];
      }

      return current.map((item) => (item.id === nextDraft.id ? nextDraft : item));
    });
    setSelectedId(nextDraft.id);
    setModalState(null);
  }

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--admin">
        <div>
          <span className="hero-banner__eyebrow">涓婚绠＄悊</span>
          <h1>鐢ㄥ垪琛ㄣ€佸脊绐楀拰瀛︾敓绔瑙堢淮鎶や富棰樺叆鍙?/h1>
          <p>
            杩欎竴椤典弗鏍煎搴旇鏄庝功涓殑鈥滃垪琛?+ 缂栬緫寮圭獥 + 棰勮鍖衡€濈粨鏋勶紝鐢ㄦ潵缁熶竴绠＄悊涓婚鍚嶇О銆?
            绠€浠嬨€佸皝闈㈠浘銆佸紑鏀剧姸鎬佸拰鎺掑簭銆?
          </p>
        </div>
        <div className="hero-banner__actions">
          <button type="button" className="primary-button" onClick={openCreateModal}>
            鏂板涓婚
          </button>
          {selectedTheme ? (
            <button
              type="button"
              className="ghost-button"
              onClick={() => openEditModal(selectedTheme)}
            >
              缂栬緫褰撳墠涓婚
            </button>
          ) : null}
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
          <span>涓婚鎬绘暟</span>
          <strong>{themes.length}</strong>
          <p>褰撳墠棣栫増浠嶄互閬撹矾瀹夊叏鏁欒偛浣滀负鍞竴姝ｅ紡寮€鏀句富棰樸€?/p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>寮€鏀句腑</span>
          <strong>{openCount}</strong>
          <p>寮€鏀剧姸鎬佷細鐩存帴褰卞搷瀛︾敓绔富棰樺崱鍏ュ彛鍜屾暀甯堢缁熻鑼冨洿銆?/p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>寰呭紑鏀?/span>
          <strong>{closedCount}</strong>
          <p>鏈紑鏀句富棰樺彲浠ュ厛瀹屾垚灏侀潰鍜岀畝浠嬪綍鍏ワ紝鍐嶅喅瀹氭寮忎笂绾挎椂闂淬€?/p>
        </article>
      </section>

      <section className="management-layout">
        <div className="page-stack">
          {themes.length > 0 ? (
            themes.map((theme) => (
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
                  <span className="surface-tag">{theme.isOpen ? "寮€鏀句腑" : "寰呭紑鏀?}</span>
                </div>
                <p>{theme.description}</p>
                <span className="inline-note">
                  灏侀潰鍥撅細{theme.coverLabel} 路 鎺掑簭 {theme.sortOrder}
                </span>
              </button>
            ))
          ) : (
            <article className="surface-card empty-state-card">
              <strong>褰撳墠娌℃湁涓婚鏁版嵁</strong>
              <p>璇峰厛鎭㈠鏈€杩戠増鏈紝鎴栫瓑寰呬富棰樺垪琛ㄦ洿鏂板悗鍐嶇户缁煡鐪嬨€?/p>
            </article>
          )}
        </div>

        {selectedTheme ? (
          <div className="page-stack">
            <article className="surface-card admin-preview-card">
              <div className="row-between">
                <div>
                  <span className="section-block__eyebrow">褰撳墠涓婚棰勮</span>
                  <h2>{selectedTheme.title}</h2>
                </div>
                <div className="chip-row">
                  <span className="surface-tag">鎺掑簭 {selectedTheme.sortOrder}</span>
                  <span className="surface-tag">{selectedTheme.isOpen ? "宸插紑鏀? : "鏈紑鏀?}</span>
                </div>
              </div>

              <div
                className={`theme-cover-preview theme-cover-preview--${selectedTheme.coverAccent}`}
              >
                <strong>{selectedTheme.coverLabel}</strong>
                <p>{selectedTheme.coverIllustration}</p>
              </div>

              <div className={`theme-card theme-card--${selectedTheme.coverAccent}`}>
                <div className="theme-card__top">
                  <span className="surface-tag">
                    {selectedTheme.isOpen ? "褰撳墠寮€鏀句富棰? : "姝ｅ湪寮€鍙戜腑"}
                  </span>
                  <span className="surface-tag">
                    {selectedTheme.isOpen ? "鍙繘鍏? : "鏁鏈熷緟"}
                  </span>
                </div>
                <h3>{selectedTheme.title}</h3>
                <p>{selectedTheme.description}</p>
                <button
                  type="button"
                  className={selectedTheme.isOpen ? "primary-button" : "ghost-button"}
                >
                  {selectedTheme.isOpen ? "杩涘叆涓婚" : "鏁鏈熷緟"}
                </button>
              </div>
            </article>

            <section className="card-grid card-grid--two">
              <article className="surface-card admin-preview-card">
                <span className="section-block__eyebrow">椤甸潰鑱斿姩</span>
                <ul className="plain-list">
                  <li>寮€鏀剧姸鎬佷細褰卞搷瀛︾敓绔富棰樺崱鏄惁鐐逛寒銆?/li>
                  <li>鎺掑簭浼氬奖鍝嶄富棰樺崱鐗囧湪棣栭〉涓殑灞曠ず鍏堝悗銆?/li>
                  <li>灏侀潰鍥句細杩涘叆瀛︾敓绔富棰樺崱鍜屽悗鍙伴瑙堝尯鍩熴€?/li>
                </ul>
              </article>

              <article className="surface-card admin-preview-card">
                <span className="section-block__eyebrow">缂栬緫鏂瑰紡</span>
                <p>
                  鐐瑰嚮鈥滄柊澧炰富棰樷€濇垨鈥滅紪杈戝綋鍓嶄富棰樷€濅細寮瑰嚭琛ㄥ崟绐楀彛锛涚‘璁ゅ悗鍏堝啓鍏ュ綋鍓嶉厤缃锛?
                  鍐嶉€氳繃涓婃柟鐘舵€佹潯淇濆瓨涓烘渶鏂扮増鏈€?
                </p>
              </article>
            </section>
          </div>
        ) : (
          <article className="surface-card empty-state-card">
            <strong>璇烽€夋嫨涓€涓富棰?/strong>
            <p>宸︿晶閫変腑涓婚鍚庯紝灏卞彲浠ュ湪杩欓噷棰勮瀛︾敓绔崱鐗囨晥鏋滃苟缁х画缂栬緫銆?/p>
          </article>
        )}
      </section>

      {modalState ? (
        <section className="overlay-modal-backdrop">
          <article className="surface-card overlay-modal overlay-modal--wide">
            <div className="row-between">
              <div>
                <span className="section-block__eyebrow">
                  {modalState.mode === "create" ? "鏂板涓婚" : "缂栬緫涓婚"}
                </span>
                <h2>{modalState.mode === "create" ? "鍒涘缓鏂扮殑涓婚鍏ュ彛" : modalState.draft.title}</h2>
              </div>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setModalState(null)}
              >
                鍏抽棴
              </button>
            </div>

            <div className="editor-grid">
              <label className="form-field">
                <span>涓婚鍚嶇О</span>
                <input
                  value={modalState.draft.title}
                  onChange={(event) => updateModalDraft("title", event.target.value)}
                />
              </label>

              <label className="form-field">
                <span>鎺掑簭</span>
                <input
                  type="number"
                  value={modalState.draft.sortOrder}
                  onChange={(event) =>
                    updateModalDraft(
                      "sortOrder",
                      Number.isNaN(Number(event.target.value))
                        ? modalState.draft.sortOrder
                        : Number(event.target.value),
                    )
                  }
                />
              </label>

              <label className="form-field form-field--wide">
                <span>涓婚绠€浠?/span>
                <textarea
                  rows={4}
                  value={modalState.draft.description}
                  onChange={(event) => updateModalDraft("description", event.target.value)}
                />
              </label>

              <label className="form-field">
                <span>寮€鏀剧姸鎬?/span>
                <select
                  value={modalState.draft.isOpen ? "open" : "closed"}
                  onChange={(event) =>
                    updateModalDraft("isOpen", event.target.value === "open")
                  }
                >
                  <option value="open">寮€鏀?/option>
                  <option value="closed">鍏抽棴</option>
                </select>
              </label>

              <label className="form-field">
                <span>灏侀潰鍥惧悕绉?/span>
                <input
                  value={modalState.draft.coverLabel}
                  onChange={(event) => updateModalDraft("coverLabel", event.target.value)}
                />
              </label>

              <label className="form-field form-field--wide">
                <span>灏侀潰鍥捐鏄?/span>
                <textarea
                  rows={3}
                  value={modalState.draft.coverIllustration}
                  onChange={(event) =>
                    updateModalDraft("coverIllustration", event.target.value)
                  }
                />
              </label>
            </div>

            <section className="page-stack">
              <div>
                <span className="section-block__eyebrow">閫夋嫨灏侀潰鍥鹃璁?/span>
                <h3>鐐瑰嚮鍚庝細鍚屾鏇存柊灏侀潰鍥惧悕绉般€侀鑹插拰棰勮</h3>
              </div>

              <div className="cover-preset-grid">
                {coverPresetOptions.map((preset) => {
                  const isActive =
                    modalState.draft.coverAccent === preset.accent &&
                    modalState.draft.coverIllustration === preset.coverIllustration;

                  return (
                    <button
                      key={`${preset.accent}-${preset.coverLabel}`}
                      type="button"
                      className={
                        isActive
                          ? "cover-preset-card cover-preset-card--active"
                          : "cover-preset-card"
                      }
                      onClick={() => applyPreset(preset)}
                    >
                      <div className={`theme-cover-preview theme-cover-preview--${preset.accent}`}>
                        <strong>{preset.coverLabel}</strong>
                        <p>{preset.coverIllustration}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="button-row">
              <button type="button" className="ghost-button" onClick={() => setModalState(null)}>
                鍙栨秷
              </button>
              <button type="button" className="primary-button" onClick={submitModal}>
                纭鍐欏叆閰嶇疆绋?
              </button>
            </div>
          </article>
        </section>
      ) : null}
    </div>
  );
}


