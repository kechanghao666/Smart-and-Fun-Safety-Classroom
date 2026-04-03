import type { AvatarOption, StudentProfile, StudentStage } from "../types";

interface StageGuide {
  title: string;
  description: string;
  checklist: string[];
  starterRoute: string;
}

interface AvatarGuide {
  title: string;
  motto: string;
}

export function buildStageGuide(stage?: StudentStage | ""): StageGuide {
  if (stage === "小学低段") {
    return {
      title: "先把“停下来、看清楚、再行动”练熟",
      description: "低段学生先把过马路和看信号灯的基础动作做稳，后面的路线判断会更轻松。",
      checklist: [
        "优先观察斑马线、信号灯和车辆方向",
        "先完成第一关，再逐步进入路线判断",
        "如果不确定，先去 AI 问答页问基础规则",
      ],
      starterRoute: "建议先从第一关的交通观察任务开始。",
    };
  }

  if (stage === "小学中段") {
    return {
      title: "把观察和路线判断连起来",
      description: "中段学生更适合把“看见什么”与“该怎么选路线”结合起来，形成完整判断。",
      checklist: [
        "先确认最近未完成的关卡位置",
        "重点练习路口判断和公交车盲区",
        "考试前把第二关和第三关的规则再回想一遍",
      ],
      starterRoute: "建议先继续当前未完成的主题任务。",
    };
  }

  if (stage === "小学高段") {
    return {
      title: "把规则真正用到完整场景里",
      description: "高段学生可以更快进入完整闭环，把三关、考试和成长反馈串在一起看。",
      checklist: [
        "优先补齐三关和考试的完整闭环",
        "做完一关就回看结算页中的提醒",
        "在 AI 问答页主动提问盲区、安全带和头盔相关问题",
      ],
      starterRoute: "建议尽快完成主题学习闭环并查看结果卡片。",
    };
  }

  return {
    title: "先完成基础档案，再进入学习首页",
    description: "选好头像和学段后，系统才能把首页欢迎区、成长档案和学习建议正确对应起来。",
    checklist: [
      "先选一个喜欢的头像",
      "再确认自己的学段",
      "保存后进入首页开始道路安全学习",
    ],
    starterRoute: "完成资料后会直接进入学生首页。",
  };
}

export function buildAvatarGuide(avatar?: AvatarOption): AvatarGuide {
  if (!avatar) {
    return {
      title: "等待你选择一个守护形象",
      motto: "选好头像后，首页、成长档案和结果卡片都会使用这个形象。",
    };
  }

  if (avatar.id === "sunny-guard") {
    return {
      title: "阳光小卫士",
      motto: "先认真观察，再自信行动。",
    };
  }

  if (avatar.id === "smart-scout") {
    return {
      title: "机智观察员",
      motto: "看清环境，再做最稳的判断。",
    };
  }

  return {
    title: "勇敢守护队长",
    motto: "把安全规则真正落实到每一步。",
  };
}

export function buildNicknameSuggestions(account?: string | null) {
  const suffix = account?.replace(/[^0-9a-z]/gi, "").slice(-3) ?? "";
  const seed = suffix ? `0${suffix}`.slice(-3) : "001";

  return [
    `小安${seed}`,
    `守护员${seed}`,
    `观察星${seed}`,
  ];
}

export function buildProfilePreview(
  draft: Pick<StudentProfile, "nickname" | "avatarId" | "avatarLabel" | "stage">,
) {
  return {
    heading: draft.nickname ? `${draft.nickname} 的学习档案` : "你的学习档案预览",
    summary:
      draft.nickname && draft.stage
        ? `${draft.nickname} 将以 ${draft.stage} 学习视角进入道路安全主题。`
        : "完成昵称、头像和学段后，这里会生成你的首页欢迎和成长档案预览。",
  };
}
