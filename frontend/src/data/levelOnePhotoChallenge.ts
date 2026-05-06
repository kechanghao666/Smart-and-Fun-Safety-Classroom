import type { ObservationSceneTarget } from "../types";

export interface LevelOnePhotoCard {
  id: string;
  taskId: string;
  label: string;
  shortHint: string;
  imageUrl: string;
  sourcePageUrl: string;
}

export interface LevelOneDecisionScene {
  title: string;
  prompt: string;
  helperText: string;
  imageUrl: string;
  sourcePageUrl: string;
}

export interface LevelOneStickerScene {
  title: string;
  helperText: string;
  imageUrl: string;
  sourcePageUrl: string;
  targets: ObservationSceneTarget[];
}

export const levelOnePhotoCards: LevelOnePhotoCard[] = [
  {
    id: "photo-crosswalk",
    taskId: "step-crosswalk",
    label: "斑马线路口",
    shortHint: "先找白色条纹的人行横道。",
    imageUrl: "/learning-images/level1-zebra-crossing.jpg",
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Zebra_crossing11.jpg",
  },
  {
    id: "photo-sign",
    taskId: "step-sign",
    label: "人行横道标志",
    shortHint: "注意蓝色行人过街标志。",
    imageUrl: "/learning-images/level1-pedestrian-sign.jpg",
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Pedestrian_crossing_sign,_Pristina.JPG",
  },
  {
    id: "photo-rail",
    taskId: "step-danger-rail",
    label: "护栏危险区",
    shortHint: "靠近护栏的穿行区域最容易发生危险。",
    imageUrl: "/learning-images/level1-road-barrier.jpg",
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Road_barrier_on_William_Street_Perth_2026-01-26.jpg",
  },
  {
    id: "photo-red-light",
    taskId: "step-danger-red",
    label: "红灯警示位",
    shortHint: "红色行人灯亮起时不能冲跑。",
    imageUrl: "/learning-images/level1-traffic-lights.jpg",
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Norwegian_traffic_lights.jpg",
  },
];

export const levelOneDecisionScene: LevelOneDecisionScene = {
  title: "先看灯，再看车",
  prompt: "观察真实路口照片，再从下面选出最稳妥的做法。",
  helperText: "绿灯亮起也不能马上冲，要先确认车辆已经礼让并停稳。",
  imageUrl: "/learning-images/level1-controlled-crossing.jpg",
  sourcePageUrl:
    "https://commons.wikimedia.org/wiki/File:Traffic_light_controlled_pedestrian_crossing,_Redditch_Road,_Stoke_Heath,_Worcs_-_geograph.org.uk_-_6604608.jpg",
};

export const levelOneStickerScene: LevelOneStickerScene = {
  title: "把贴纸放到等待观察区",
  helperText: "安全贴纸要贴在准备过街、还没有进入车道的等待区，不能贴到车道中间。",
  imageUrl: "/learning-images/level1-waiting-zone.jpg",
  sourcePageUrl:
    "https://commons.wikimedia.org/wiki/File:Pedestrian_crossing,_High_Street,_Omagh_-_geograph.org.uk_-_4949553.jpg",
  targets: [
    {
      id: "sticker-drop-zone",
      label: "等待观察区",
      hint: "准备过街时先停在路边等待区，先停、先看、再出发。",
      top: 57,
      left: 11,
      width: 20,
      height: 18,
      shape: "rect",
      accent: "mint",
    },
    {
      id: "sticker-wrong-road",
      label: "车道中间",
      hint: "不能把提示贴纸放到车辆通行的地方。",
      top: 56,
      left: 43,
      width: 19,
      height: 18,
      shape: "rect",
      accent: "danger",
    },
    {
      id: "sticker-wrong-light",
      label: "信号灯旁",
      hint: "贴纸不是贴在灯杆上，而是贴在孩子站立观察的位置。",
      top: 14,
      left: 7,
      width: 16,
      height: 24,
      shape: "pill",
      accent: "orange",
    },
    {
      id: "sticker-wrong-sign",
      label: "路牌旁",
      hint: "路牌可以帮助观察，但贴纸更适合贴在等待区地面附近。",
      top: 20,
      left: 74,
      width: 16,
      height: 22,
      shape: "pill",
      accent: "sky",
    },
  ],
};
