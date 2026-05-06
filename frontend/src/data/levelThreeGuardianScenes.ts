export interface LevelThreeGuardianVisual {
  sceneImageUrl: string;
  sceneSourcePageUrl: string;
  sceneCaption: string;
  toolImageUrl: string;
  toolSourcePageUrl: string;
  toolCaption: string;
  actionHint: string;
  targetZone: {
    top: number;
    left: number;
    width: number;
    height: number;
    label: string;
  };
}

export const guardianSceneVisuals: Record<string, LevelThreeGuardianVisual> = {
  "bus-line": {
    sceneImageUrl: "/learning-images/level3-bus-line.jpg",
    sceneSourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:People_waiting_at_bus_stop.jpg",
    sceneCaption: "候车时要站在安全区域里，不要贴着车门和车道边缘等车。",
    toolImageUrl: "/learning-images/level3-bus-marking.jpg",
    toolSourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Sidewalk_and_bus_stop_pavement_marking_(43966547644).jpg",
    toolCaption: "把候车站位卡放到安全候车区，提醒自己先站稳再等车。",
    actionHint: "先看照片里哪里更适合等车，再把候车站位卡拖过去。",
    targetZone: { top: 63, left: 22, width: 24, height: 18, label: "安全候车区" },
  },
  seatbelt: {
    sceneImageUrl: "/learning-images/level3-seatbelt-scene.jpg",
    sceneSourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Fastening_belt.jpg",
    sceneCaption: "上车后第一步先系好安全带，确认坐稳再出发。",
    toolImageUrl: "/learning-images/level3-seatbelt-tool.jpg",
    toolSourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Car_seat_belt.jpg",
    toolCaption: "安全带卡放到车内正确位置，表示出发前已经完成基础保护。",
    actionHint: "观察座位附近的区域，把安全带卡拖到最适合的地方。",
    targetZone: { top: 34, left: 42, width: 26, height: 24, label: "座位安全带位" },
  },
  helmet: {
    sceneImageUrl: "/learning-images/level3-helmet-scene.jpg",
    sceneSourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:A_some_people_is_waiting_for_bus_in_bus_stop.jpg",
    sceneCaption: "出发前先把头盔戴好，头部保护永远排在第一位。",
    toolImageUrl: "/learning-images/level3-helmet-tool.jpg",
    toolSourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Helmet_bike.jpg",
    toolCaption: "把头盔守护卡放到正确位置，提醒自己戴好头盔再上路。",
    actionHint: "先看清乘车人的头部位置，再把头盔卡拖到正确区域。",
    targetZone: { top: 18, left: 39, width: 20, height: 18, label: "头盔佩戴位" },
  },
};
