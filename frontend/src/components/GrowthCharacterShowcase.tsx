import type { CSSProperties } from "react";
import type { StudentProfile } from "../types";
import { getGrowthSceneVisualClass } from "../utils/studentGrowth";

interface GrowthCharacterShowcaseProps {
  profile?: StudentProfile | null;
  nickname: string;
  appearance: string;
  scene: string;
  abilityTag: string;
  stageLabel: string;
  compact?: boolean;
}

const avatarThemes = {
  "sunny-guard": {
    primary: "#2f8dff",
    secondary: "#ffd166",
    hair: "#234a7f",
    skin: "#ffd8b4",
    tone: "sky",
  },
  "smart-scout": {
    primary: "#1da881",
    secondary: "#9ce6d2",
    hair: "#264653",
    skin: "#f5d0a9",
    tone: "mint",
  },
  "brave-captain": {
    primary: "#ff8b42",
    secondary: "#ffd08a",
    hair: "#6a3b1f",
    skin: "#f7caa1",
    tone: "orange",
  },
} as const;

function resolveAvatarTheme(avatarId?: string | null) {
  return avatarThemes[avatarId as keyof typeof avatarThemes] ?? avatarThemes["sunny-guard"];
}

function resolveStageBadge(stageLabel: string) {
  if (stageLabel.includes("守护")) {
    return "守护阶段";
  }

  if (stageLabel.includes("进阶")) {
    return "进阶阶段";
  }

  return "成长阶段";
}

function buildCharacterStyle(theme: ReturnType<typeof resolveAvatarTheme>) {
  return {
    "--growth-primary": theme.primary,
    "--growth-secondary": theme.secondary,
    "--growth-hair": theme.hair,
    "--growth-skin": theme.skin,
  } as CSSProperties;
}

function renderAccessory(
  avatarId: string | undefined,
  stageLabel: string,
  appearance: string,
) {
  if (avatarId === "smart-scout") {
    return (
      <>
        <rect x="85" y="66" width="18" height="12" rx="6" fill="#ffffff" stroke="#24425c" strokeWidth="4" />
        <rect x="117" y="66" width="18" height="12" rx="6" fill="#ffffff" stroke="#24425c" strokeWidth="4" />
        <rect x="103" y="70" width="14" height="4" rx="2" fill="#24425c" />
      </>
    );
  }

  if (avatarId === "brave-captain") {
    return (
      <>
        <path d="M72 108 L92 138 L92 176 L64 154 Z" fill="#ff8b42" opacity="0.92" />
        <path d="M148 108 L168 154 L140 176 L140 138 Z" fill="#ff8b42" opacity="0.92" />
        <path
          d="M110 102 L114 114 L127 114 L116 122 L120 134 L110 126 L100 134 L104 122 L93 114 L106 114 Z"
          fill="#ffd166"
        />
      </>
    );
  }

  return (
    <>
      <path d="M80 52 Q110 24 140 52 L134 70 Q110 54 86 70 Z" fill="#ffd166" opacity="0.95" />
      <circle cx="146" cy="52" r="10" fill="#ffd166" opacity="0.9" />
    </>
  );
}

function renderStageDecoration(stageLabel: string, appearance: string) {
  if (stageLabel.includes("守护") || appearance.includes("星")) {
    return (
      <div className="growth-character-card__corner-badge">
        <span>已点亮</span>
        <strong>{resolveStageBadge(stageLabel)}</strong>
      </div>
    );
  }

  if (stageLabel.includes("进阶")) {
    return (
      <div className="growth-character-card__corner-badge">
        <span>当前阶段</span>
        <strong>持续升级中</strong>
      </div>
    );
  }

  return (
    <div className="growth-character-card__corner-badge">
      <span>成长中</span>
      <strong>继续学习</strong>
    </div>
  );
}

export function GrowthCharacterShowcase({
  profile,
  nickname,
  appearance,
  scene,
  abilityTag,
  stageLabel,
  compact = false,
}: GrowthCharacterShowcaseProps) {
  const avatarTheme = resolveAvatarTheme(profile?.avatarId);
  const sceneVisualClass = getGrowthSceneVisualClass(scene);
  const avatarId = profile?.avatarId;

  return (
    <div
      className={
        compact ? "growth-character-card growth-character-card--compact" : "growth-character-card"
      }
    >
      <div
        className={`growth-character-card__scene ${sceneVisualClass} growth-character-card__scene--${avatarTheme.tone}`}
        style={buildCharacterStyle(avatarTheme)}
      >
        <div className="growth-character-card__sky" />
        <div className="growth-character-card__road" />
        <div className="growth-character-card__sign growth-character-card__sign--left" />
        <div className="growth-character-card__sign growth-character-card__sign--right" />
        {renderStageDecoration(stageLabel, appearance)}

        <svg
          className="growth-character-card__figure"
          viewBox="0 0 220 220"
          role="img"
          aria-label={`${nickname} 的成长形象`}
        >
          <ellipse cx="110" cy="196" rx="66" ry="12" fill="rgba(20, 50, 74, 0.10)" />
          <path d="M82 82 Q110 58 138 82 L134 108 H86 Z" fill="var(--growth-hair)" />
          <circle cx="110" cy="78" r="28" fill="var(--growth-skin)" />
          <circle cx="99" cy="78" r="3.5" fill="#24425c" />
          <circle cx="121" cy="78" r="3.5" fill="#24425c" />
          <path d="M101 92 Q110 98 119 92" fill="none" stroke="#d67961" strokeWidth="3" strokeLinecap="round" />
          <rect x="88" y="104" width="44" height="60" rx="20" fill="var(--growth-primary)" />
          <rect x="99" y="104" width="22" height="16" rx="8" fill="rgba(255,255,255,0.22)" />
          <rect x="98" y="120" width="24" height="18" rx="8" fill="var(--growth-secondary)" opacity="0.95" />
          <path d="M88 114 L68 154" stroke="var(--growth-primary)" strokeWidth="12" strokeLinecap="round" />
          <path d="M132 114 L152 154" stroke="var(--growth-primary)" strokeWidth="12" strokeLinecap="round" />
          <path d="M102 164 L92 202" stroke="#24425c" strokeWidth="12" strokeLinecap="round" />
          <path d="M118 164 L128 202" stroke="#24425c" strokeWidth="12" strokeLinecap="round" />
          <path d="M88 110 Q110 124 132 110" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="4" />
          {renderAccessory(avatarId, stageLabel, appearance)}
        </svg>
      </div>

      <div className="growth-character-card__meta">
        <span className="growth-character-card__eyebrow">
          {compact ? stageLabel : `${profile?.avatarLabel ?? "安全学员"} · ${stageLabel}`}
        </span>
        <strong>{compact ? appearance : `${nickname} 的成长形象`}</strong>
        <p>{compact ? scene : `${appearance} · ${abilityTag}`}</p>
        <div className="chip-row">
          <span className="surface-tag">{scene}</span>
          {!compact ? <span className="surface-tag">{abilityTag}</span> : null}
        </div>
      </div>
    </div>
  );
}
