/* 星音 · 故事流程配置层
 * 只放数据，不放逻辑。第一版段落闭环走纯合成音，不依赖任何原曲音频。
 * 所有叙事文本（note / failNote / onPass / reaction.text / kkt.preview）默认空串，
 * 空串在界面上直接不渲染，后面只填这里就能接内容。
 */
(function () {
  "use strict";

  // 一段的完整配置形状
  function section() {
    return {
      // 本段占多少步（默认取 round.sectionSteps，可单段写 16）
      steps: 8,

      // 本段允许选择的音色（空数组 / 缺省 = 不限制）
      instruments: {
        melody: ["piano", "bell", "guitar", "pulse"],
        bass: ["bass", "ebass", "upright"]
      },

      // 每轨至少放几颗音：free 完成度判定，不要求逐位吻合
      tracks: {
        melody: { minNotes: 1 },
        bass: { minNotes: 1 },
        drums: { minNotes: 1 }
      },

      // 可选锚点：本段必须点到的格子（step 为段内局部步位，从 0 开始）
      // 形状：{ track: "drums", row: 3, step: 0 }
      anchors: [],

      judge: {
        // 覆盖 tracks 里的每轨下限；留空则用 tracks
        minNotesPerTrack: {},
        // 覆盖外层 anchors；留空则用 anchors
        anchors: [],
        // 连续失败几次后改用 failNote
        failThreshold: 3,
        // 是否允许跳过本段（默认不允许）
        allowSkip: false
      },

      // 他给的反应：trigger 目前只有 "pass"
      reaction: { trigger: "pass", from: "", text: "" },

      // 触发 kkt 提示：通过本段后都会发通知；preview 留空时手机显示占位「（新消息）」
      kkt: { thread: "star", preview: "" },

      // 进入本段时自动写进备注栏的过往条目（剧情推进 / 两人交流用）
      // 形状：{ from: "", text: "" }，from 留空表示“我”，填“他”等就显示在侧栏
      notes: [],

      // 进入本段时的引导 / 多次失败后的特别备注 / 通过后的文字
      note: "",
      failNote: "",
      onPass: ""
    };
  }

  window.STORY_CONTENT = {
    round: {
      // 改版本号会让旧段落存档失效
      version: 1,

      // 默认每段步数
      sectionSteps: 8,

      // 玩家作品的初始调性（不依赖原曲，改成什么都能跑）
      root: 0,
      scale: "minorPent",
      bpm: 96,
      instrument: "piano",
      bassInstrument: "bass",

      // 第一版只跑通四段占位闭环
      sections: [section(), section(), section(), section()]
    },

    // 旧的音乐库/还原流程仍读这里；第一版不进入
    songs: {}
  };
})();
