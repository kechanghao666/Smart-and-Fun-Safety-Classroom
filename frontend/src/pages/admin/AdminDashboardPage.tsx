import { Link } from "react-router-dom";
import { adminModules } from "../../data/mockData";
import { fetchAdminModules } from "../../services/admin";
import { useAppState } from "../../state/AppState";
import { useApiResource } from "../../utils/useApiResource";

const routeByModule: Record<string, string> = {
  theme: "/admin/themes",
  levels: "/admin/levels",
  "question-bank": "/admin/question-bank",
  "ai-copy": "/admin/ai-copy",
  users: "/admin/users",
  stats: "/admin/stats",
};

export function AdminDashboardPage() {
  const { state } = useAppState();
  const canUseApi = state.authSource === "api" && Boolean(state.authToken);
  const { data, error, isLoading, source } = useApiResource({
    enabled: canUseApi,
    fallbackData: adminModules,
    fetcher: () => fetchAdminModules(state.authToken ?? ""),
    dependencies: [state.authToken],
  });
  const startedCount = data.filter((module) => module.status !== "寰呮帴鍙?).length;
  const pendingCount = data.length - startedCount;
  const topPriorityModule =
    data.find((module) => module.id === "levels") ?? data[0] ?? null;
  const localEditableCount = data.filter((module) =>
    ["theme", "levels", "question-bank", "ai-copy"].includes(module.id),
  ).length;

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--admin">
        <div>
          <span className="hero-banner__eyebrow">绠＄悊鍛樺悗鍙?/span>
          <h1>鍐呭缁存姢銆佺敤鎴风鐞嗕笌鏁版嵁缁熻鍏ュ彛</h1>
          <p>鍚庡彴棣栭〉鍏堢敤妯″潡鍏ュ彛涓茶捣涓婚绠＄悊銆佸叧鍗＄鐞嗐€侀搴撱€丄I 鏂囨銆佺敤鎴峰拰缁熻銆?/p>
        </div>
      </section>

      <article className="feedback-box">
        <strong>{source === "api" ? "鍚庡彴妯″潡鍒楄〃宸叉帴鍏ユ湇鍔℃暟鎹? : "鍚庡彴妯″潡鍒楄〃褰撳墠浣跨敤棰勭疆鏁版嵁"}</strong>
        <p>
          {isLoading
            ? "姝ｅ湪鍚屾鍚庡彴妯″潡..."
            : error || "鍚庡彴棣栭〉浼氭牴鎹綋鍓嶆暟鎹潵婧愯嚜鍔ㄦ洿鏂版ā鍧楃姸鎬併€?}
        </p>
      </article>

      <section className="card-grid card-grid--four">
        <article className="surface-card stat-card admin-summary-card">
          <span>妯″潡鎬绘暟</span>
          <strong>{data.length}</strong>
          <p>褰撳墠鍚庡彴缁熶竴鎵挎帴涓婚銆佸叧鍗°€侀搴撱€丄I 鏂囨銆佺敤鎴峰拰缁熻鍏釜妯″潡銆?/p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>宸茶繘鍏ュ疄鏂?/span>
          <strong>{startedCount}</strong>
          <p>杩欎簺妯″潡宸茬粡鍏峰姝ｅ紡椤甸潰缁撴瀯锛岄€傚悎缁х画鍋氬瓧娈靛喕缁撳拰鏁版嵁鎺ュ叆銆?/p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>鏈湴鍙紪杈?/span>
          <strong>{localEditableCount}</strong>
          <p>涓婚銆佸叧鍗°€侀搴撳拰 AI 鏂囨宸插叿澶囨樉寮忎繚瀛樹笌棰勮娴佺▼銆?/p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>寰呮帴鍏ユ暟鎹?/span>
          <strong>{pendingCount}</strong>
          <p>鐢ㄦ埛绠＄悊鍜岀粺璁￠〉宸茬暀濂借鍙栨帴鍙ｏ紝鍚庣画鍙洿鎺ュ垏鐪熷疄鏁版嵁婧愩€?/p>
        </article>
      </section>

      <section className="card-grid card-grid--three">
        {data.map((module) => (
          <article key={module.id} className="surface-card module-link-card">
            <span className="surface-tag">{module.status}</span>
            <h2>{module.title}</h2>
            <p>{module.description}</p>
            <p className="muted-copy">寤鸿 owner锛歿module.ownerSuggestion}</p>
            <Link className="ghost-button link-button" to={routeByModule[module.id]}>
              杩涘叆妯″潡
            </Link>
          </article>
        ))}
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card admin-preview-card">
          <span className="section-block__eyebrow">褰撳墠浼樺厛绾?/span>
          <h2>鍏堟妸鏈€褰卞搷瀛︾敓闂幆鐨勫悗鍙版ā鍧楁敹绋?/h2>
          <div className="page-stack page-stack--compact">
            <article className="feedback-box">
              <strong>褰撳墠鏈€楂樹紭鍏堬細{topPriorityModule?.title ?? "--"}</strong>
              <p>
                {topPriorityModule
                  ? `${topPriorityModule.description}锛屽缓璁礋璐ｄ汉锛?{topPriorityModule.ownerSuggestion}銆俙
                  : "褰撳墠鏆傛棤妯″潡鏁版嵁銆?}
              </p>
            </article>
            <article className="inline-summary-card">
              <strong>宸ヤ綔鍙扮姸鎬?/strong>
              <p>
                鍚庡彴棣栭〉鐜板湪涓嶄粎鏄叆鍙ｉ〉锛屼篃鎵挎媴鈥滅湅娓呭綋鍓嶆ā鍧楁垚鐔熷害銆佽皝鏉ユ帴鎵嬨€佷笅涓€姝ュ厛鍋氫粈涔堚€濈殑鎸囨尌鏉夸綔鐢ㄣ€?
              </p>
            </article>
          </div>
        </article>

        <article className="surface-card">
          <span className="section-block__eyebrow">棣栫増寤鸿椤哄簭</span>
          <ul className="plain-list">
            <li>鍏堝畬鎴愪富棰樸€佸叧鍗″拰棰樺簱褰曞叆鐣岄潰銆?/li>
            <li>鍐嶈ˉ AI 鏂囨妯℃澘閰嶇疆鍜岄瑙堛€?/li>
            <li>鏈€鍚庢帴鍏ョ敤鎴风鐞嗕笌鏁版嵁缁熻鎺ュ彛銆?/li>
          </ul>
        </article>

        <article className="surface-card">
          <span className="section-block__eyebrow">鏁版嵁璇存槑</span>
          <ul className="plain-list">
            <li>瀛楁鍛藉悕浼樺厛鍜?`docs/v1-contracts.md` 淇濇寔涓€鑷淬€?/li>
            <li>鍚庡彴鍘熷瀷鍏佽鍏堢敤 localStorage 鎸佷箙鍖栵紝鍚庣画鍐嶆崲鐪熷疄鎺ュ彛銆?/li>
            <li>AI 鏂囨绠＄悊椤典腑鐨勬ā鏉跨粨鏋勫簲鍜屽悗绔唬鐞嗘帴鍙ｄ繚鎸佸彲鏄犲皠鍏崇郴銆?/li>
          </ul>
        </article>
      </section>

      <section className="surface-card">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">妯″潡鎴愮啛搴?/span>
            <h2>鎶婃ā鍧楃姸鎬併€佽亴璐ｅ拰涓嬩竴姝ュ姩浣滄斁杩涘悓涓€寮犲伐浣滆〃</h2>
          </div>
        </div>

        <div className="module-status-grid">
          {data.map((module, index) => (
            <article key={`${module.id}-status`} className="module-status-card">
              <div className="row-between">
                <strong>{module.title}</strong>
                <span className="surface-tag">姝ラ {index + 1}</span>
              </div>
              <p>{module.description}</p>
              <div className="chip-row">
                <span className="surface-tag">{module.status}</span>
                <span className="surface-tag">{module.ownerSuggestion}</span>
              </div>
              <Link className="ghost-button link-button" to={routeByModule[module.id]}>
                杩涘叆璇ユā鍧?
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

