import { useEffect, useMemo, useState } from "react";
import { AdminEditorStatusBar } from "../../components/AdminEditorStatusBar";
import { levelManagementItems } from "../../data/mockData";
import { fetchAdminLevels, saveAdminLevels } from "../../services/admin";
import { useAppState } from "../../state/AppState";
import type { LevelId, LevelManagementItem } from "../../types";
import { useEditableAdminResource } from "../../utils/useEditableAdminResource";

const levelStructureMap: Record<
  LevelId,
  { title: string; areas: string[]; teachingTip: string }
> = {
  "level-1": {
    title: "椤堕儴鐘舵€佹爮 + 宸︿换鍔″尯 + 涓棿鍦烘櫙鍖?,
    areas: ["浠诲姟娓呭崟", "浜ら€氬満鏅儹鐐?, "鍗虫椂瑙傚療鍙嶉"],
    teachingTip: "绗竴鍏抽噸鐐规槸鍏堣瀵燂紝鍐嶇偣鍑诲叧閿畨鍏ㄧ偣浣嶃€?,
  },
  "level-2": {
    title: "椤堕儴鐘舵€佹潯 + 鍦板浘涓昏鍥?+ 搴曢儴浜嬩欢鍗?,
    areas: ["璺嚎鍦板浘", "鑺傜偣浜嬩欢鍗?, "瀹夊叏鍊煎弽棣?],
    teachingTip: "绗簩鍏抽噸鐐规槸閫愯妭鐐瑰垽鏂紝淇濇寔璺嚎閫夋嫨鐨勮繛璐€с€?,
  },
  "level-3": {
    title: "椤堕儴姝ラ鐘舵€佹爮 + 涓棿涓诲満鏅?+ 搴曢儴鎿嶄綔鍖?,
    areas: ["瀹堟姢姝ラ", "涓诲満鏅换鍔?, "鎿嶄綔纭鍖?],
    teachingTip: "绗笁鍏抽噸鐐规槸鎶婁箻杞﹂槻鎶ゅ姩浣滆ˉ榻愶紝涓嶆紡鎺夊叧閿噯澶囥€?,
  },
};

function linesToText(lines: string[]) {
  return lines.join("\n");
}

function textToLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function AdminLevelsPage() {
  const { state } = useAppState();
  const canUseApi = state.authSource === "api" && Boolean(state.authToken);
  const editor = useEditableAdminResource<LevelManagementItem[]>({
    storageKey: "admin-level-management",
    fallbackData: levelManagementItems,
    enabled: canUseApi,
    fetcher: () => fetchAdminLevels(state.authToken ?? ""),
    saveHandler: (draftData, savedData) => saveAdminLevels(state.authToken ?? "", draftData, savedData),
    dependencies: [state.authToken],
    fallbackMessage: "鏆傛椂鏃犳硶鑾峰彇鍏冲崱绠＄悊鏁版嵁锛屽綋鍓嶇户缁娇鐢ㄩ缃唴瀹广€?,
  });
  const levels = editor.draftData
    .slice()
    .sort((left, right) => left.displayOrder - right.displayOrder);
  const [selectedId, setSelectedId] = useState(levels[0]?.id ?? "level-1");

  useEffect(() => {
    setSelectedId((current) =>
      current && levels.some((item) => item.id === current)
        ? current
        : levels[0]?.id ?? "level-1",
    );
  }, [levels]);

  const selectedLevel = useMemo(
    () => levels.find((item) => item.id === selectedId) ?? levels[0] ?? null,
    [levels, selectedId],
  );
  const rewardConfiguredCount = levels.filter(
    (item) => item.rewardLabel.trim().length > 0,
  ).length;
  const feedbackConfiguredCount = levels.filter(
    (item) => item.feedbackCopy.trim().length > 0,
  ).length;
  const selectedStructure = selectedLevel ? levelStructureMap[selectedLevel.id] : null;

  function updateLevel<K extends keyof LevelManagementItem>(
    id: LevelManagementItem["id"],
    field: K,
    value: LevelManagementItem[K],
  ) {
    editor.updateDraft((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  }

  function updateLevelListField(
    id: LevelManagementItem["id"],
    field: "taskOutline" | "hotspotItems" | "propItems" | "targetAreaNotes",
    value: string,
  ) {
    updateLevel(id, field, textToLines(value));
  }

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--admin">
        <div>
          <span className="hero-banner__eyebrow">鍏冲崱鍐呭绠＄悊</span>
          <h1>鎸夊叧鍗＄粨鏋勩€佸満鏅厤缃拰鍙嶉鏂囨缁存姢涓夊叧鍐呭</h1>
          <p>
            杩欎竴椤典弗鏍煎搴旇鏄庝功涓殑鈥滃叧鍗″垪琛?+ 鍦烘櫙閰嶇疆鍖衡€濈粨鏋勶紝琛ラ綈鍦烘櫙鍥俱€?
            浠诲姟鍐呭銆佸弽棣堟枃妗堛€佸睍绀洪『搴忋€佺儹鐐归厤缃拰鎷栨嫿閬撳叿璇存槑銆?
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
          <span>鍏冲崱鎬绘暟</span>
          <strong>{levels.length}</strong>
          <p>棣栫増鍥哄畾涓轰笁鍏冲涔狅紝瀵瑰簲瑙傚療銆佸垽鏂拰闃叉姢涓夌被鑳藉姏銆?/p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>濂栧姳閰嶇疆</span>
          <strong>{rewardConfiguredCount}</strong>
          <p>濂栧姳瑙勫垯浼氱洿鎺ュ奖鍝嶅鐢熺缁撶畻椤靛拰鎴愰暱鍙嶉灞曠ず銆?/p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>鍙嶉鏂囨</span>
          <strong>{feedbackConfiguredCount}</strong>
          <p>寤鸿缁熶竴淇濇寔鍎跨鍙嬪ソ銆佽鍒欐槑纭€侀紦鍔卞紡鍙嶉銆?/p>
        </article>
      </section>

      <section className="management-layout">
        <div className="page-stack">
          {levels.length > 0 ? (
            levels.map((level) => (
              <button
                key={level.id}
                type="button"
                className={
                  level.id === selectedLevel?.id
                    ? "management-list-card management-list-card--active"
                    : "management-list-card"
                }
                onClick={() => setSelectedId(level.id)}
              >
                <div className="row-between">
                  <strong>{level.title}</strong>
                  <span className="surface-tag">椤哄簭 {level.displayOrder}</span>
                </div>
                <p>{level.sceneAssetLabel}</p>
                <span className="inline-note">{level.rewardLabel}</span>
              </button>
            ))
          ) : (
            <article className="surface-card empty-state-card">
              <strong>褰撳墠娌℃湁鍏冲崱鏁版嵁</strong>
              <p>璇峰厛鎭㈠鏈€杩戠増鏈紝鎴栫瓑寰呭叧鍗￠厤缃洿鏂板悗鍐嶇户缁煡鐪嬨€?/p>
            </article>
          )}
        </div>

        {selectedLevel ? (
          <div className="page-stack">
            <article className="surface-card editor-panel">
              <span className="section-block__eyebrow">鍦烘櫙閰嶇疆鍖?/span>
              <h2>{selectedLevel.title}</h2>
              <div className="chip-row">
                <span className="surface-tag">{selectedLevel.focus}</span>
                <span className="surface-tag">{selectedLevel.duration}</span>
                <span className="surface-tag">椤哄簭 {selectedLevel.displayOrder}</span>
              </div>

              <div className="editor-grid">
                <label className="form-field">
                  <span>鍏冲崱鏍囬</span>
                  <input
                    value={selectedLevel.title}
                    onChange={(event) =>
                      updateLevel(selectedLevel.id, "title", event.target.value)
                    }
                  />
                </label>

                <label className="form-field">
                  <span>瀛︿範鐒︾偣</span>
                  <input
                    value={selectedLevel.focus}
                    onChange={(event) =>
                      updateLevel(selectedLevel.id, "focus", event.target.value)
                    }
                  />
                </label>

                <label className="form-field">
                  <span>棰勮鏃堕暱</span>
                  <input
                    value={selectedLevel.duration}
                    onChange={(event) =>
                      updateLevel(selectedLevel.id, "duration", event.target.value)
                    }
                  />
                </label>

                <label className="form-field">
                  <span>灞曠ず椤哄簭</span>
                  <input
                    type="number"
                    value={selectedLevel.displayOrder}
                    onChange={(event) =>
                      updateLevel(
                        selectedLevel.id,
                        "displayOrder",
                        Number.isNaN(Number(event.target.value))
                          ? selectedLevel.displayOrder
                          : Number(event.target.value),
                      )
                    }
                  />
                </label>

                <label className="form-field form-field--wide">
                  <span>鍦烘櫙鍥?/span>
                  <input
                    value={selectedLevel.sceneAssetLabel}
                    onChange={(event) =>
                      updateLevel(selectedLevel.id, "sceneAssetLabel", event.target.value)
                    }
                  />
                </label>

                <label className="form-field form-field--wide">
                  <span>浠诲姟鍐呭锛堟瘡琛屼竴鏉★級</span>
                  <textarea
                    rows={5}
                    value={linesToText(selectedLevel.taskOutline)}
                    onChange={(event) =>
                      updateLevelListField(selectedLevel.id, "taskOutline", event.target.value)
                    }
                  />
                </label>

                <label className="form-field">
                  <span>濂栧姳瑙勫垯</span>
                  <input
                    value={selectedLevel.rewardLabel}
                    onChange={(event) =>
                      updateLevel(selectedLevel.id, "rewardLabel", event.target.value)
                    }
                  />
                </label>

                <label className="form-field">
                  <span>鍙嶉椋庢牸</span>
                  <input
                    value={selectedLevel.feedbackStyle}
                    onChange={(event) =>
                      updateLevel(selectedLevel.id, "feedbackStyle", event.target.value)
                    }
                  />
                </label>

                <label className="form-field form-field--wide">
                  <span>鍙嶉鏂囨</span>
                  <textarea
                    rows={4}
                    value={selectedLevel.feedbackCopy}
                    onChange={(event) =>
                      updateLevel(selectedLevel.id, "feedbackCopy", event.target.value)
                    }
                  />
                </label>

                <label className="form-field form-field--wide">
                  <span>鍦烘櫙鐑偣 / 鑺傜偣閰嶇疆锛堟瘡琛屼竴鏉★級</span>
                  <textarea
                    rows={4}
                    value={linesToText(selectedLevel.hotspotItems)}
                    onChange={(event) =>
                      updateLevelListField(selectedLevel.id, "hotspotItems", event.target.value)
                    }
                  />
                </label>

                <label className="form-field form-field--wide">
                  <span>鎷栨嫿閬撳叿鍒楄〃锛堟瘡琛屼竴鏉★級</span>
                  <textarea
                    rows={4}
                    value={linesToText(selectedLevel.propItems)}
                    onChange={(event) =>
                      updateLevelListField(selectedLevel.id, "propItems", event.target.value)
                    }
                  />
                </label>

                <label className="form-field form-field--wide">
                  <span>鐩爣鍖哄煙璇存槑锛堟瘡琛屼竴鏉★級</span>
                  <textarea
                    rows={4}
                    value={linesToText(selectedLevel.targetAreaNotes)}
                    onChange={(event) =>
                      updateLevelListField(
                        selectedLevel.id,
                        "targetAreaNotes",
                        event.target.value,
                      )
                    }
                  />
                </label>
              </div>
            </article>

            <section className="card-grid card-grid--two">
              <article className="surface-card admin-preview-card admin-preview-card--level">
                <span className="section-block__eyebrow">瀛︾敓绔粨鏋勯瑙?/span>
                <h3>{selectedStructure?.title}</h3>
                <ul className="plain-list">
                  {selectedStructure?.areas.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p>{selectedStructure?.teachingTip}</p>
              </article>

              <article className="surface-card admin-preview-card">
                <span className="section-block__eyebrow">鍦烘櫙涓庝换鍔￠瑙?/span>
                <div className="theme-cover-preview theme-cover-preview--sky">
                  <strong>{selectedLevel.sceneAssetLabel}</strong>
                  <p>褰撳墠鍦烘櫙鍥句細鍦ㄥ鐢熺涓诲満鏅尯鍩熷睍绀恒€?/p>
                </div>
                <ul className="plain-list">
                  {selectedLevel.taskOutline.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            </section>

            <section className="card-grid card-grid--three">
              <article className="surface-card admin-preview-card">
                <span className="section-block__eyebrow">鐑偣 / 鑺傜偣閰嶇疆</span>
                <ul className="plain-list">
                  {selectedLevel.hotspotItems.length > 0 ? (
                    selectedLevel.hotspotItems.map((item) => <li key={item}>{item}</li>)
                  ) : (
                    <li>褰撳墠鍏冲崱涓嶉渶瑕佸崟鐙厤缃儹鐐广€?/li>
                  )}
                </ul>
              </article>

              <article className="surface-card admin-preview-card">
                <span className="section-block__eyebrow">閬撳叿鍒楄〃</span>
                <ul className="plain-list">
                  {selectedLevel.propItems.length > 0 ? (
                    selectedLevel.propItems.map((item) => <li key={item}>{item}</li>)
                  ) : (
                    <li>褰撳墠鍏冲崱涓嶄娇鐢ㄦ嫋鎷介亾鍏枫€?/li>
                  )}
                </ul>
              </article>

              <article className="surface-card admin-preview-card">
                <span className="section-block__eyebrow">鐩爣鍖哄煙璇存槑</span>
                <ul className="plain-list">
                  {selectedLevel.targetAreaNotes.length > 0 ? (
                    selectedLevel.targetAreaNotes.map((item) => <li key={item}>{item}</li>)
                  ) : (
                    <li>褰撳墠鍏冲崱涓嶉渶瑕侀澶栫洰鏍囧尯鍩熻鏄庛€?/li>
                  )}
                </ul>
              </article>
            </section>
          </div>
        ) : (
          <article className="surface-card empty-state-card">
            <strong>璇烽€夋嫨涓€涓叧鍗?/strong>
            <p>宸︿晶閫変腑鍏冲崱鍚庯紝灏卞彲浠ョ淮鎶ゅ満鏅浘銆佷换鍔°€佺儹鐐广€侀亾鍏峰拰鍙嶉鏂囨銆?/p>
          </article>
        )}
      </section>
    </div>
  );
}


