import type { ObservationTaskChoice } from "../types";

function buildCommonsPhotoUrl(fileName: string) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}`;
}

export interface LevelTwoRoutePhotoStep {
  id: string;
  title: string;
  scenario: string;
  hint: string;
  helperText: string;
  imageUrl: string;
  sourcePageUrl: string;
  options: ObservationTaskChoice[];
}

export const levelTwoRouteSteps: LevelTwoRoutePhotoStep[] = [
  {
    id: "school-gate-crosswalk",
    title: "校门口起点",
    scenario: "走出校门后，第一步应该往哪里靠近，才是更安全的出发方式？",
    hint: "先朝能看清来车和信号的过街区域靠近。",
    helperText: "离开校门先别急着冲，先站到能看清路口的位置，再准备过街。",
    imageUrl: buildCommonsPhotoUrl("Pedestrians using crosswalk (Unsplash).jpg"),
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Pedestrians_using_crosswalk_(Unsplash).jpg",
    options: [
      {
        id: "school-gate-crosswalk-risk",
        label: "贴着路边直接往前跑，先抢时间",
        safe: false,
        feedback: "校门口人多车多，先抢时间最容易忽略拐弯车和来车方向。",
      },
      {
        id: "school-gate-crosswalk-safe",
        label: "先靠近过街区，停一下再看灯和来车",
        safe: true,
        feedback: "做得对，放学起点最重要的是先停一步，再看清楚路口情况。",
      },
    ],
  },
  {
    id: "median-island",
    title: "路中安全岛",
    scenario: "走到安全岛附近时，下一步最稳妥的做法是什么？",
    hint: "安全岛不是终点，到第二段路前还要再看一次车。",
    helperText: "路中安全岛能帮你分段过街，但每一段都要重新观察，不是一路直冲。",
    imageUrl: buildCommonsPhotoUrl("Median island and crosswalk 2.jpg"),
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Median_island_and_crosswalk_2.jpg",
    options: [
      {
        id: "median-island-risk",
        label: "已经到安全岛了，马上继续冲到对面",
        safe: false,
        feedback: "到安全岛后还要重新看一遍左右来车，不能把两段路当成一次通过。",
      },
      {
        id: "median-island-safe",
        label: "停在安全岛边，重新观察再走第二段",
        safe: true,
        feedback: "很好，分段过街时每一段都要重新确认车辆动态。",
      },
    ],
  },
  {
    id: "bus-stop-zone",
    title: "公交站前",
    scenario: "经过公交站附近时，应该怎么避开视线盲区？",
    hint: "大车附近最怕贴得太近，先绕开车前和车侧盲区。",
    helperText: "公交站附近常有大车进出，别贴着车头和车侧走，先让自己站在看得见、也能被看见的位置。",
    imageUrl: buildCommonsPhotoUrl(
      "Bus stop and pedestrian crossing on Main Street, Dundrum - geograph.org.uk - 8018928.jpg",
    ),
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Bus_stop_and_pedestrian_crossing_on_Main_Street,_Dundrum_-_geograph.org.uk_-_8018928.jpg",
    options: [
      {
        id: "bus-stop-zone-risk",
        label: "从公交车前面快速穿过去",
        safe: false,
        feedback: "公交车前面是最容易被忽略的盲区，司机和其他车辆都可能看不到你。",
      },
      {
        id: "bus-stop-zone-safe",
        label: "先绕开公交车盲区，再找清楚的过街位置",
        safe: true,
        feedback: "对，经过公交站时要先远离盲区，再决定往哪里走。",
      },
    ],
  },
  {
    id: "parked-cars",
    title: "停放车辆旁",
    scenario: "路边停着很多车时，下面哪种做法更安全？",
    hint: "停放车辆会挡住视线，不能从车缝里突然钻出。",
    helperText: "住宅路段经常有停放车辆挡住视线，这时更要选择看得见来车、也能被司机看到的路线。",
    imageUrl: buildCommonsPhotoUrl("Cars on a residential street.jpg"),
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Cars_on_a_residential_street.jpg",
    options: [
      {
        id: "parked-cars-risk",
        label: "看路上没车，就从两辆车中间钻出去",
        safe: false,
        feedback: "车缝里冲出去时，司机和你都来不及看清对方，非常危险。",
      },
      {
        id: "parked-cars-safe",
        label: "绕到开阔位置，再找正式过街点通过",
        safe: true,
        feedback: "很好，遇到停放车辆挡视线时，要先绕到开阔位置。",
      },
    ],
  },
  {
    id: "traffic-light-crossing",
    title: "信号灯路口",
    scenario: "现在准备通过这个路口，应该先选哪种做法？",
    hint: "绿灯只是开始，还要确认右转车和直行车已经礼让。",
    helperText: "到信号灯路口时，先看灯，再看车，尤其要留意还在移动的转弯车。",
    imageUrl: buildCommonsPhotoUrl("NYC Pedestrian crossing Stop.JPG"),
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:NYC_Pedestrian_crossing_Stop.JPG",
    options: [
      {
        id: "traffic-light-crossing-risk",
        label: "只要看到灯变了，就马上快跑冲过去",
        safe: false,
        feedback: "只看信号灯还不够，转弯车没有完全停稳时，马上冲过去会很危险。",
      },
      {
        id: "traffic-light-crossing-safe",
        label: "先看车停稳，再沿过街区域稳稳通过",
        safe: true,
        feedback: "对，信号灯和车辆状态都确认后，再沿正式过街区域通过。",
      },
    ],
  },
  {
    id: "home-last-check",
    title: "到家前最后一站",
    scenario: "快到家了，最后一个路口你应该怎么收尾？",
    hint: "越接近终点越不能放松，最后一段也要按规则来。",
    helperText: "很多危险都发生在“快到了”的时候，最后一站也要继续停一下、看一看、再行动。",
    imageUrl: buildCommonsPhotoUrl("Pedestrian crossing and bus stop signs in Hanoi.jpg"),
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Pedestrian_crossing_and_bus_stop_signs_in_Hanoi.jpg",
    options: [
      {
        id: "home-last-check-risk",
        label: "反正快到了，直接沿最近路线穿过去",
        safe: false,
        feedback: "越到终点越不能松懈，最后一小段也要按正式过街规则来。",
      },
      {
        id: "home-last-check-safe",
        label: "继续走清楚的过街点，把最后一段也走稳",
        safe: true,
        feedback: "很棒，最后一站也坚持按规则完成，整条放学路线才算真正安全。",
      },
    ],
  },
];
