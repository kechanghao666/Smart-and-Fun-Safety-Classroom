import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  studentAvatarOptions,
  studentStageOptions,
} from "../../data/mockData";
import { useAppState } from "../../state/AppState";
import type { StudentStage } from "../../types";

export function StudentProfileSetupPage() {
  const navigate = useNavigate();
  const { saveStudentProfile, state } = useAppState();
  const [nickname, setNickname] = useState(state.studentProfile?.nickname ?? "");
  const [avatarId, setAvatarId] = useState(state.studentProfile?.avatarId ?? "");
  const [stage, setStage] = useState<StudentStage | "">(state.studentProfile?.stage ?? "");
  const [error, setError] = useState("");

  return (
    <div className="page-shell">
      <div className="page-shell__inner">
        <section className="hero-panel">
          <div className="hero-panel__content">
            <span className="hero-panel__eyebrow">首次登录信息补充</span>
            <h1>先完善你的学习档案</h1>
            <p>
              请先填写昵称、选择头像和学段。完成后系统会将资料与你的学习记录、考试结果和成长激励关联起来。
            </p>
            <div className="hero-panel__tags">
              <span>昵称</span>
              <span>预设头像</span>
              <span>学段选择</span>
            </div>
          </div>
        </section>

        <section className="profile-card-grid">
          <article className="surface-card form-card">
            <div>
              <span className="section-block__eyebrow">基础信息</span>
              <h2>保存并进入首页</h2>
              <p>首版只保留最基础的信息项，确保页面展示和后续成长激励都能正确关联。</p>
            </div>

            <form
              className="profile-form"
              onSubmit={(event) => {
                event.preventDefault();
                const selectedAvatar = studentAvatarOptions.find((item) => item.id === avatarId);

                if (!nickname.trim() || !selectedAvatar || !stage) {
                  setError("请完整填写昵称、头像和学段后再进入首页。");
                  return;
                }

                setError("");
                saveStudentProfile({
                  nickname: nickname.trim(),
                  avatarId: selectedAvatar.id,
                  avatarLabel: selectedAvatar.label,
                  stage,
                });
                navigate("/student/home");
              }}
            >
              <label className="field-group">
                <span className="field-label">昵称</span>
                <input
                  className="text-input"
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  placeholder="请输入昵称"
                />
              </label>

              <div className="field-group">
                <span className="field-label">头像</span>
                <div className="avatar-grid">
                  {studentAvatarOptions.map((option) => {
                    const selected = avatarId === option.id;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        className={selected ? "avatar-option avatar-option--selected" : "avatar-option"}
                        onClick={() => setAvatarId(option.id)}
                      >
                        <span className={`avatar-option__swatch avatar-option__swatch--${option.accent}`}>
                          {option.shortLabel}
                        </span>
                        <strong>{option.label}</strong>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="field-group">
                <span className="field-label">学段</span>
                <div className="stage-grid">
                  {studentStageOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={stage === option ? "stage-option stage-option--selected" : "stage-option"}
                      onClick={() => setStage(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {error ? <p className="form-error">{error}</p> : null}

              <button type="submit" className="primary-button primary-button--wide">
                保存并进入首页
              </button>
            </form>
          </article>

          <article className="surface-card form-card">
            <div>
              <span className="section-block__eyebrow">填写说明</span>
              <h2>为什么要先补充资料？</h2>
            </div>
            <ul className="plain-list">
              <li>昵称和头像会用于首页欢迎区、学习记录和成长反馈展示。</li>
              <li>学段信息会为后续内容适配和教师查看提供基础参考。</li>
              <li>当前步骤完成后，你将直接进入学生首页并开始主题学习。</li>
            </ul>
          </article>
        </section>
      </div>
    </div>
  );
}
