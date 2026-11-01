/* 星音 · 歌曲数据层
 * 第一版闭环使用纯合成音（audio.js 的 Synth），不挂任何原曲音源。
 * 版权音源后续可在这里接入；app.js 不出现歌名、秒数、调性。
 *
 * window.SONG_DATA = { version, intro, arrange, patterns, songs }
 *
 * version : 存档版本号。改动它会让旧的本地存档自动作废。
 * intro   : 他留下的残稿区间（秒）。
 * arrange : 玩家能编曲的区间（秒）。
 * patterns: 目标音型库。
 */
(function () {
  "use strict";

  const INTRO = { start: 0, end: 8 };
  const ARRANGE = { start: 8, end: 16 };

  /* 第一版不接原曲：留空数组，音乐库入口已隐藏 */
  const patterns = [];
  const songs = [];

  window.SONG_DATA = {
    version: 1,
    intro: INTRO,
    arrange: ARRANGE,
    patterns: patterns,
    songs: songs
  };
})();
