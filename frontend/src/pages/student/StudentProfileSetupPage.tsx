import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StudentAdventureHero } from "../../components/student/StudentAdventureHero";
import { studentAvatarOptions, studentStageOptions } from "../../data/mockData";
import {
  fetchStudentProgress,
  saveStudentProfile as saveStudentProfileToApi,
} from "../../services/student";
import { useAppState } from "../../state/AppState";
import type { StudentStage } from "../../types";
import {
  buildAvatarGuide,
  buildNicknameSuggestions,
  buildProfilePreview,
  buildStageGuide,
} from "../../utils/studentOnboarding";

export function StudentProfileSetupPage() {
  const navigate = useNavigate();
  const { replaceProgress, saveStudentProfile, state } = useAppState();
  const [nickname, setNickname] = useState(state.studentProfile?.nickname ?? "");
  const [avatarId, setAvatarId] = useState(state.studentProfile?.avatarId ?? "");
  const [stage, setStage] = useState<StudentStage | "">(state.studentProfile?.stage ?? "");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedAvatar =
    studentAvatarOptions.find((item) => item.id === avatarId) ?? undefined;
  const nicknameSuggestions = buildNicknameSuggestions(state.sessionAccount);
  const stageGuide = buildStageGuide(stage);
  const avatarGuide = buildAvatarGuide(selectedAvatar);
  const preview = buildProfilePreview({
    nickname: nickname.trim(),
    avatarId: selectedAvatar?.id ?? "",
    avatarLabel: selectedAvatar?.label ?? "",
    stage: stage || "小学低段",
  });
  const canSubmit = Boolean(nickname.trim() && selectedAvatar && stage) && !isSubmitting;
  const profileAccent = selectedAvatar?.accent ?? "sky";
  const previewTags = useMemo(
    () => [
      nickname.trim() || "待填写昵称",
      selectedAvatar?.label ?? "待选择头像",
      stage || "待选择学段",
    ],
    [nickname, selectedAvatar?.label, stage],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const matchedAvatar = studentAvatarOptions.find((item) => item.id === avatarId);

    if (!nickname.trim() || !matchedAvatar || !stage) {
      setError("请完整填写昵称、头像和学段后再进入首页。");
      return;
    }

    const profile = {
      nickname: nickname.trim(),
      avatarId: matchedAvatar.id,
      avatarLabel: matchedAvatar.label,
      stage,
    };

    setError("");
    setIsSubmitting(true);

    try {
      if (state.authSource === "api" && state.authToken) {
        const savedProfile = await saveStudentProfileToApi(state.authToken, profile);
        const progress = await fetchStudentProgress(state.authToken);
        saveStudentProfile(savedProfile);
        replaceProgress(progress);
      } else {
        saveStudentProfile(profile);
      }

      navigate("/student/home");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "资料保存失败，请稍后重试。",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-stack student-page student-page--setup">
      <StudentAdventureHero
        eyebrow="角色准备"
        title="先选一个小伙伴，再出发"
        description="填好名字、头像和学段，就能拿到你的安全冒险身份卡。"
        bubbleTitle="出发提示"
        bubbleText={selectedAvatar ? `${selectedAvatar.label} 已经准备好了` : "先挑一个你喜欢的小伙伴"}
        mascotLabel={selectedAvatar?.shortLabel ?? "GO"}
        mascotHint={selectedAvatar ? avatarGuide.motto : "选好角色后，首页会出现你的专属冒险形象。"}
        accent={profileAccent}
        variant="profile"
        stats={[
          { label: "昵称", value: nickname.trim() || "待设置", accent: "sky" },
          { label: "形象", value: selectedAvatar?.label ?? "待选择", accent: profileAccent },
          { label: "学段", value: stage || "待选择", accent: "orange" },
        ]}
      />

      <section className="student-setup-grid">
        <article className="surface-card student-choice-panel">
          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="student-setup-route">
              <article className="student-setup-route__stop student-setup-route__stop--current">
                <span>1</span>
                <strong>起名字</strong>
              </article>
              <article className="student-setup-route__stop">
                <span>2</span>
                <strong>选角色</strong>
              </article>
              <article className="student-setup-route__stop">
                <span>3</span>
                <strong>去冒险</strong>
              </article>
            </div>

            <div className="student-section-heading">
              <span className="section-block__eyebrow">第一步</span>
              <h2>给自己取个冒险名字</h2>
            </div>

            <label className="field-group">
              <span className="field-label">我的昵称</span>
              <input
                className="text-input text-input--playful"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="输入你的名字"
              />
            </label>

            <div className="field-group">
              <span className="field-label">一键选择</span>
              <div className="chip-row">
                {nicknameSuggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="quick-chip quick-chip--playful"
                    onClick={() => setNickname(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="student-section-heading">
              <span className="section-block__eyebrow">第二步</span>
              <h2>挑一个角色形象</h2>
            </div>

            <div className="student-choice-grid">
              {studentAvatarOptions.map((option) => {
                const selected = avatarId === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    className={selected ? "student-choice-card student-choice-card--selected" : "student-choice-card"}
                    onClick={() => setAvatarId(option.id)}
                  >
                    <span className={`student-choice-card__avatar student-choice-card__avatar--${option.accent}`}>
                      {option.shortLabel}
                    </span>
                    <strong>{option.label}</strong>
                    <span>{selected ? "已选中" : "点击选择"}</span>
                  </button>
                );
              })}
            </div>

            <div className="student-section-heading">
              <span className="section-block__eyebrow">第三步</span>
              <h2>选择你的学习学段</h2>
            </div>

            <div className="student-choice-grid student-choice-grid--stage">
              {studentStageOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={stage === option ? "student-choice-card student-choice-card--selected" : "student-choice-card"}
                  onClick={() => setStage(option)}
                >
                  <strong>{option}</strong>
                  <span>{stage === option ? "已准备" : "点击选择"}</span>
                </button>
              ))}
            </div>

            {error ? <p className="form-error">{error}</p> : null}

            <button type="submit" className="primary-button primary-button--wide primary-button--playful" disabled={!canSubmit}>
              {isSubmitting ? "正在保存..." : "完成准备，进入首页"}
            </button>
          </form>
        </article>

        <div className="page-stack">
          <article className="surface-card student-preview-panel">
            <span className="section-block__eyebrow">我的冒险身份卡</span>
            <div className="student-profile-preview">
              <div className={`student-profile-preview__avatar student-profile-preview__avatar--${profileAccent}`}>
                {selectedAvatar?.shortLabel ?? "冒"}
              </div>
              <div>
                <h2>{preview.heading}</h2>
                <p>{preview.summary}</p>
              </div>
            </div>

            <div className="student-preview-tags">
              {previewTags.map((item) => (
                <span key={item} className="surface-tag">
                  {item}
                </span>
              ))}
            </div>

            <div className="student-mini-card-grid">
              <article className="student-mini-card student-mini-card--sky">
                <span>角色技能</span>
                <strong>{avatarGuide.title}</strong>
              </article>
              <article className="student-mini-card student-mini-card--mint">
                <span>出发路线</span>
                <strong>{stageGuide.title}</strong>
              </article>
              <article className="student-mini-card student-mini-card--orange">
                <span>下一站</span>
                <strong>学生首页</strong>
              </article>
            </div>
          </article>

          <article className="surface-card student-preview-panel">
            <span className="section-block__eyebrow">今天会怎么学</span>
            <h3>{stageGuide.title}</h3>
            <div className="student-checklist">
              {stageGuide.checklist.map((item) => (
                <div key={item} className="student-checklist__item">
                  <span className="student-checklist__dot" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <p className="inline-note">{stageGuide.starterRoute}</p>

            <div className="student-setup-launchpad">
              <article className="student-setup-launchpad__card">
                <span>今天的主任务</span>
                <strong>完成道路安全主题冒险</strong>
              </article>
              <article className="student-setup-launchpad__card student-setup-launchpad__card--mint">
                <span>进入首页后</span>
                <strong>直接点“继续学习”就能出发</strong>
              </article>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
