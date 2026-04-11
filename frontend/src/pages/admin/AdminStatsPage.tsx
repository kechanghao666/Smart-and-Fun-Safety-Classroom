import { useState } from "react";
import { AdminEditorStatusBar } from "../../components/AdminEditorStatusBar";
import {
  adminGrowthConfigFallback,
  fetchAdminGrowthConfig,
  fetchAdminStats,
  updateAdminGrowthConfig,
} from "../../services/admin";
import { useAppState } from "../../state/AppState";
import type {
  GrowthAwardConfigItem,
  GrowthConfigItem,
  GrowthThresholdItem,
} from "../../types";
import { useEditableAdminResource } from "../../utils/useEditableAdminResource";
import { useApiResource } from "../../utils/useApiResource";

const fallbackStats = {
  metrics: [],
  classSummaries: [],
};

function toNumber(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function updateAwardField(
  current: GrowthAwardConfigItem,
  field: keyof GrowthAwardConfigItem,
  value: number,
) {
  return {
    ...current,
    [field]: value,
  };
}

function updateThresholdItem<T extends GrowthThresholdItem>(
  items: T[],
  index: number,
  field: keyof T,
  value: string | number,
) {
  return items.map((item, itemIndex) =>
    itemIndex === index ? { ...item, [field]: value } : item,
  );
}

export function AdminStatsPage() {
  const { state } = useAppState();
  const canUseApi = state.authSource === "api" && Boolean(state.authToken);
  const [activeTab, setActiveTab] = useState<"dashboard" | "growth">("dashboard");
  const { data, error, isLoading } = useApiResource({
    enabled: canUseApi,
    fallbackData: fallbackStats,
    fetcher: () => fetchAdminStats(state.authToken ?? ""),
    dependencies: [state.authToken],
  });
  const growthEditor = useEditableAdminResource<GrowthConfigItem>({
    storageKey: "admin-growth-config",
    fallbackData: adminGrowthConfigFallback,
    enabled: canUseApi,
    fetcher: () => fetchAdminGrowthConfig(state.authToken ?? ""),
    saveHandler: (draftData) => updateAdminGrowthConfig(state.authToken ?? "", draftData),
    dependencies: [state.authToken],
    fallbackMessage: "暂时无法获取成长规则配置，当前继续使用预置规则。",
  });

  const trackedClassCount = data.classSummaries.length;
  const topClass =
    data.classSummaries
      .slice()
      .sort((left, right) => right.completedRate - left.completedRate)[0] ?? null;
  const watchClass =
    data.classSummaries
      .slice()
      .sort((left, right) => left.examCompletionRate - right.examCompletionRate)[0] ?? null;
  const growthConfig = growthEditor.draftData;
  const thresholdGroups: Array<{
    field: "appearanceThresholds" | "safetyThresholds" | "sceneThresholds";
    label: string;
  }> = [
    { field: "appearanceThresholds", label: "外观线" },
    { field: "safetyThresholds", label: "安全线" },
    { field: "sceneThresholds", label: "场景线" },
  ];

  function patchGrowthConfig(updater: (current: GrowthConfigItem) => GrowthConfigItem) {
    growthEditor.updateDraft((current) => updater(current));
  }

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--admin">
        <div>
          <span className="hero-banner__eyebrow">数据统计</span>
          <h1>把数据看板和成长规则拆开管理</h1>
          <p>统计页现在分成“数据看板”和“成长规则”两个标签，先看趋势，再进入配置，阅读路径更清楚。</p>
        </div>
      </section>

      <article className="feedback-box feedback-box--compact">
        <strong>{error ? "统计数据同步失败" : "统计数据已从后端加载"}</strong>
        <p>
          {isLoading
            ? "正在同步统计数据..."
            : error || "统计页会根据当前数据源自动刷新指标、班级趋势和成长规则配置。"}
        </p>
      </article>

      <section className="surface-card surface-card--compact-section">
        <div className="admin-tab-row">
          <button
            type="button"
            className={activeTab === "dashboard" ? "admin-tab admin-tab--active" : "admin-tab"}
            onClick={() => setActiveTab("dashboard")}
          >
            数据看板
          </button>
          <button
            type="button"
            className={activeTab === "growth" ? "admin-tab admin-tab--active" : "admin-tab"}
            onClick={() => setActiveTab("growth")}
          >
            成长规则
          </button>
        </div>
      </section>

      {activeTab === "dashboard" ? (
        <>
          <section className="card-grid card-grid--four">
            {data.metrics.map((metric) => (
              <article
                key={metric.id}
                className={`surface-card report-card report-card--${metric.accent} report-card--compact`}
              >
                <span className="section-block__eyebrow">{metric.label}</span>
                <h2>{metric.value}</h2>
                <p>{metric.trend}</p>
              </article>
            ))}
            <article className="surface-card stat-card stat-card--compact admin-summary-card">
              <span>跟踪班级</span>
              <strong>{trackedClassCount}</strong>
              <p>当前统计看板纳入对比的班级数量。</p>
            </article>
          </section>

          <section className="card-grid card-grid--two">
            <article className="surface-card admin-preview-card admin-preview-card--compact">
              <span className="section-block__eyebrow">运营观察</span>
              <h2>当前最值得跟进的两个点</h2>
              <div className="page-stack page-stack--compact">
                <article className="feedback-box feedback-box--compact">
                  <strong>完成率最高班级</strong>
                  <p>
                    {topClass
                      ? `${topClass.name}，三关完成率 ${topClass.completedRate}%。`
                      : "当前暂无班级统计数据。"}
                  </p>
                </article>
                <article className="feedback-box feedback-box--compact">
                  <strong>考试完成率偏低班级</strong>
                  <p>
                    {watchClass
                      ? `${watchClass.name}，考试完成率 ${watchClass.examCompletionRate}%，建议优先跟进。`
                      : "当前暂无班级统计数据。"}
                  </p>
                </article>
              </div>
            </article>

            <article className="surface-card admin-preview-card admin-preview-card--compact">
              <span className="section-block__eyebrow">指标说明</span>
              <h2>当前统计页展示口径</h2>
              <ul className="plain-list">
                <li>主题访问量：反映学生进入主题页的整体热度。</li>
                <li>三关完成率：反映学生端主链路推进情况。</li>
                <li>考试平均分：反映主题考试的整体学习效果。</li>
                <li>班级对比：帮助教师和管理员快速识别需要优先支持的班级。</li>
              </ul>
            </article>
          </section>

          <section className="surface-card">
            <div className="section-block__header">
              <div>
                <span className="section-block__eyebrow">班级趋势</span>
                <h2>按班级对比三关完成率和考试完成率</h2>
              </div>
            </div>

            {data.classSummaries.length > 0 ? (
              <div className="trend-bars">
                {data.classSummaries.map((classroom) => (
                  <article key={classroom.id} className="trend-bars__item trend-bars__item--compact">
                    <div className="row-between">
                      <div>
                        <strong>{classroom.name}</strong>
                        <p className="teacher-analysis-card__meta">{classroom.focusLabel}</p>
                      </div>
                      <span className="surface-tag">{classroom.studentCount} 人</span>
                    </div>

                    <div className="bar-item__track">
                      <span className="bar-item__fill" style={{ width: `${classroom.completedRate}%` }} />
                    </div>
                    <div className="row-between">
                      <span className="data-table__muted">三关完成率</span>
                      <strong>{classroom.completedRate}%</strong>
                    </div>

                    <div className="bar-item__track">
                      <span
                        className="bar-item__fill bar-item__fill--exam"
                        style={{ width: `${classroom.examCompletionRate}%` }}
                      />
                    </div>
                    <div className="row-between">
                      <span className="data-table__muted">考试完成率</span>
                      <strong>{classroom.examCompletionRate}%</strong>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <article className="feedback-box empty-state-card">
                <strong>当前没有班级统计</strong>
                <p>等待统计数据更新后再继续查看；当前也可以先参考已有指标结构。</p>
              </article>
            )}
          </section>
        </>
      ) : null}

      {activeTab === "growth" ? (
        <>
          <AdminEditorStatusBar
            source={growthEditor.source}
            status={growthEditor.status}
            isHydrating={growthEditor.isHydrating}
            syncError={growthEditor.syncError}
            hasUnsavedChanges={growthEditor.hasUnsavedChanges}
            canRestoreBaseline={growthEditor.canRestoreBaseline}
            lastSavedAt={growthEditor.lastSavedAt}
            onSave={() => {
              void growthEditor.saveChanges();
            }}
            onResetChanges={growthEditor.resetChanges}
            onRestoreBaseline={growthEditor.restoreBaseline}
          />

          <section className="surface-card editor-panel editor-panel--compact">
            <span className="section-block__eyebrow">成长规则配置</span>
            <h2>{growthConfig.title}</h2>
            <div className="editor-grid">
              <label className="form-field form-field--wide">
                <span>规则名称</span>
                <input
                  value={growthConfig.title}
                  onChange={(event) =>
                    patchGrowthConfig((current) => ({ ...current, title: event.target.value }))
                  }
                />
              </label>

              <label className="form-field">
                <span>三星加成系数</span>
                <input
                  type="number"
                  step="0.01"
                  value={growthConfig.levelThreeStarBonusRate}
                  onChange={(event) =>
                    patchGrowthConfig((current) => ({
                      ...current,
                      levelThreeStarBonusRate: toNumber(event.target.value, current.levelThreeStarBonusRate),
                    }))
                  }
                />
              </label>

              <label className="form-field">
                <span>考试基础分</span>
                <input
                  type="number"
                  value={growthConfig.examBasePoints}
                  onChange={(event) =>
                    patchGrowthConfig((current) => ({
                      ...current,
                      examBasePoints: toNumber(event.target.value, current.examBasePoints),
                    }))
                  }
                />
              </label>

              <label className="form-field">
                <span>80 分奖励</span>
                <input
                  type="number"
                  value={growthConfig.examBonus80}
                  onChange={(event) =>
                    patchGrowthConfig((current) => ({
                      ...current,
                      examBonus80: toNumber(event.target.value, current.examBonus80),
                    }))
                  }
                />
              </label>

              <label className="form-field">
                <span>90 分奖励</span>
                <input
                  type="number"
                  value={growthConfig.examBonus90}
                  onChange={(event) =>
                    patchGrowthConfig((current) => ({
                      ...current,
                      examBonus90: toNumber(event.target.value, current.examBonus90),
                    }))
                  }
                />
              </label>

              <label className="form-field">
                <span>考试外观分配比</span>
                <input
                  type="number"
                  step="0.01"
                  value={growthConfig.examAppearanceRatio}
                  onChange={(event) =>
                    patchGrowthConfig((current) => ({
                      ...current,
                      examAppearanceRatio: toNumber(event.target.value, current.examAppearanceRatio),
                    }))
                  }
                />
              </label>

              <label className="form-field">
                <span>考试安全分配比</span>
                <input
                  type="number"
                  step="0.01"
                  value={growthConfig.examSafetyRatio}
                  onChange={(event) =>
                    patchGrowthConfig((current) => ({
                      ...current,
                      examSafetyRatio: toNumber(event.target.value, current.examSafetyRatio),
                    }))
                  }
                />
              </label>
            </div>
          </section>

          <section className="card-grid card-grid--three">
            {(["level-1", "level-2", "level-3"] as const).map((levelId) => {
              const levelAward = growthConfig.levelAwards[levelId];
              return (
                <article key={levelId} className="surface-card editor-panel editor-panel--compact">
                  <span className="section-block__eyebrow">{levelId.toUpperCase()} 奖励</span>
                  <h3>{levelId === "level-1" ? "第一关" : levelId === "level-2" ? "第二关" : "第三关"}</h3>
                  <div className="editor-grid">
                    <label className="form-field">
                      <span>外观值</span>
                      <input
                        type="number"
                        value={levelAward.appearancePoints}
                        onChange={(event) =>
                          patchGrowthConfig((current) => ({
                            ...current,
                            levelAwards: {
                              ...current.levelAwards,
                              [levelId]: updateAwardField(
                                current.levelAwards[levelId],
                                "appearancePoints",
                                toNumber(event.target.value, current.levelAwards[levelId].appearancePoints),
                              ),
                            },
                          }))
                        }
                      />
                    </label>
                    <label className="form-field">
                      <span>安全值</span>
                      <input
                        type="number"
                        value={levelAward.safetyPoints}
                        onChange={(event) =>
                          patchGrowthConfig((current) => ({
                            ...current,
                            levelAwards: {
                              ...current.levelAwards,
                              [levelId]: updateAwardField(
                                current.levelAwards[levelId],
                                "safetyPoints",
                                toNumber(event.target.value, current.levelAwards[levelId].safetyPoints),
                              ),
                            },
                          }))
                        }
                      />
                    </label>
                    <label className="form-field">
                      <span>场景值</span>
                      <input
                        type="number"
                        value={levelAward.scenePoints}
                        onChange={(event) =>
                          patchGrowthConfig((current) => ({
                            ...current,
                            levelAwards: {
                              ...current.levelAwards,
                              [levelId]: updateAwardField(
                                current.levelAwards[levelId],
                                "scenePoints",
                                toNumber(event.target.value, current.levelAwards[levelId].scenePoints),
                              ),
                            },
                          }))
                        }
                      />
                    </label>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="card-grid card-grid--two">
            <article className="surface-card editor-panel editor-panel--compact">
              <span className="section-block__eyebrow">成长阶段阈值</span>
              <h3>按阶段定义成长说明</h3>
              <div className="page-stack page-stack--compact">
                {growthConfig.stageThresholds.map((item, index) => (
                  <div key={`${item.label}-${index}`} className="editor-grid">
                    <label className="form-field">
                      <span>阈值</span>
                      <input
                        type="number"
                        value={item.threshold}
                        onChange={(event) =>
                          patchGrowthConfig((current) => ({
                            ...current,
                            stageThresholds: updateThresholdItem(
                              current.stageThresholds,
                              index,
                              "threshold",
                              toNumber(event.target.value, item.threshold),
                            ),
                          }))
                        }
                      />
                    </label>
                    <label className="form-field">
                      <span>阶段名称</span>
                      <input
                        value={item.label}
                        onChange={(event) =>
                          patchGrowthConfig((current) => ({
                            ...current,
                            stageThresholds: updateThresholdItem(
                              current.stageThresholds,
                              index,
                              "label",
                              event.target.value,
                            ),
                          }))
                        }
                      />
                    </label>
                    <label className="form-field form-field--wide">
                      <span>阶段说明</span>
                      <input
                        value={item.summary}
                        onChange={(event) =>
                          patchGrowthConfig((current) => ({
                            ...current,
                            stageThresholds: updateThresholdItem(
                              current.stageThresholds,
                              index,
                              "summary",
                              event.target.value,
                            ),
                          }))
                        }
                      />
                    </label>
                  </div>
                ))}
              </div>
            </article>

            <article className="surface-card editor-panel editor-panel--compact">
              <span className="section-block__eyebrow">维度解锁阈值</span>
              <h3>统一维护外观 / 安全 / 场景三条成长线</h3>
              <div className="page-stack page-stack--compact">
                {thresholdGroups.map(({ field, label }) => (
                  <div key={field} className="surface-card admin-threshold-group">
                    <strong>{label}</strong>
                    <div className="page-stack page-stack--compact">
                      {growthConfig[field].map((item, index) => (
                        <div key={`${field}-${index}`} className="editor-grid">
                          <label className="form-field">
                            <span>阈值</span>
                            <input
                              type="number"
                              value={item.threshold}
                              onChange={(event) =>
                                patchGrowthConfig((current) => ({
                                  ...current,
                                  [field]: updateThresholdItem(
                                    current[field],
                                    index,
                                    "threshold",
                                    toNumber(event.target.value, item.threshold),
                                  ),
                                }))
                              }
                            />
                          </label>
                          <label className="form-field form-field--wide">
                            <span>解锁标签</span>
                            <input
                              value={item.label}
                              onChange={(event) =>
                                patchGrowthConfig((current) => ({
                                  ...current,
                                  [field]: updateThresholdItem(
                                    current[field],
                                    index,
                                    "label",
                                    event.target.value,
                                  ),
                                }))
                              }
                            />
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </>
      ) : null}
    </div>
  );
}
