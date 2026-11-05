/* 剧情运行时：按脚本顺序推进，玩家的每次点击/编曲事件都会触发下一步。
 * 剧本数据在 phone-script.js（window.PHONE_SCRIPT.flow），这里只放状态与执行逻辑。
 */
(function () {
  "use strict";

  const SAVE_KEY = "dreamphone.story.v1";

  const CAST = {
    ts: { name: "GIANT MOUNTAIN", avatar: "assets/story/ts-avatar.jpg", letter: "G", tone: "av-ts" },
    wn: { name: "金云鹤", avatar: "assets/story/wn-avatar.jpg", letter: "鹤", tone: "av-wn" },
    ys: { name: "允书", avatar: "assets/story/ys-avatar.jpg", letter: "允", tone: "av-ys" },
    myng: { name: "myng", avatar: "assets/story/myng-avatar.jpg", letter: "m", tone: "av-myng" },
    ppparksh: { name: "ppparksh", avatar: "assets/story/ppparksh-avatar.jpg", letter: "p", tone: "av-pp" },
    u: { name: "u livehouse", avatar: "", letter: "u", tone: "av-u" },
    me: { name: "我", avatar: "", letter: "我", tone: "av-me" }
  };

  const state = {
    name: "",
    pc: 0,
    flags: {},
    threads: { ts: [], wn: [], ys: [] },
    notes: [],
    feed: [],
    unread: { ts: 0, wn: 0, ys: 0 },
    request: null,
    pending: null,
    waiting: null,
    modal: null,
    open: "",
    done: false
  };

  function flow() {
    return (window.PHONE_SCRIPT && window.PHONE_SCRIPT.flow) || [];
  }

  function idxOf(id) {
    const list = flow();
    for (let i = 0; i < list.length; i += 1) {
      if (list[i].id === id) return i;
    }
    return -1;
  }

  function text(value) {
    return String(value == null ? "" : value).replace(/\{name\}/g, state.name || "你");
  }

  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (err) {
      /* 忽略存储失败 */
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || typeof data !== "object") return false;
      Object.keys(state).forEach(function (key) {
        if (key in data) state[key] = data[key];
      });
      if (!state.threads) state.threads = { ts: [], wn: [], ys: [] };
      if (!state.unread) state.unread = { ts: 0, wn: 0, ys: 0 };
      return true;
    } catch (err) {
      return false;
    }
  }

  let stepTimer = 0;
  const watchers = [];

  function emit(kind, info) {
    for (let i = 0; i < watchers.length; i += 1) {
      try {
        watchers[i](kind, info || {});
      } catch (err) {
        /* 忽略回调异常 */
      }
    }
  }

  function queueTick(delay) {
    window.clearTimeout(stepTimer);
    stepTimer = window.setTimeout(function () {
      stepTimer = 0;
      step();
    }, delay || 550);
  }

  function addMsg(key, who, body, img, quote) {
    const list = state.threads[key];
    if (!Array.isArray(list)) return;
    const item = { from: who === "me" ? "me" : "you", text: text(body), img: img || "" };
    if (quote) item.quote = text(quote);
    list.push(item);
    if (who !== "me" && state.open !== key) {
      state.unread[key] = (state.unread[key] || 0) + 1;
    }
    emit("msg", { thread: key, who: item.from, text: item.text, img: item.img, quote: item.quote || "" });
  }

  function addPost(node) {
    const who = node.w || "me";
    const post = {
      id: "p" + (state.feed.length + 1),
      who: who,
      img: node.img || "",
      caption: text(node.cap || ""),
      place: text(node.place || ""),
      story: Boolean(node.story),
      announce: Boolean(node.announce),
      likes: [],
      comments: [],
      time: node.time || "",
      mine: who === "me"
    };
    state.feed.unshift(post);
    emit("post", {
      who: who,
      caption: post.caption,
      story: post.story,
      announce: post.announce
    });
  }

  function lastPost() {
    return state.feed[0] || null;
  }

  function addLike(node) {
    const post = node.on && node.on !== "latest" ? findPost(node.on) : lastPost();
    if (!post) return;
    if (post.likes.indexOf(node.w) < 0) post.likes.push(node.w);
  }

  function addComment(node) {
    const post = node.on && node.on !== "latest" ? findPost(node.on) : lastPost();
    if (!post) return;
    post.comments.push({ who: node.w, text: text(node.x) });
  }

  function findPost(id) {
    for (let i = 0; i < state.feed.length; i += 1) {
      if (state.feed[i].id === id) return state.feed[i];
    }
    return null;
  }

  function addNote(body) {
    state.notes.unshift({
      id: "n" + (state.notes.length + 1),
      text: text(body),
      at: Date.now()
    });
  }

  function step() {
    window.clearTimeout(stepTimer);
    stepTimer = 0;
    const list = flow();
    let guard = 0;
    while (!state.done && !state.pending && guard < 4000) {
      guard += 1;
      const node = list[state.pc];
      if (!node) {
        state.done = true;
        break;
      }
      switch (node.t) {
        case "gate":
          if (!state.flags["gate:" + node.name]) {
            state.waiting = node.name;
            save();
            return;
          }
          state.pc += 1;
          break;
        case "act":
          if (!state.flags["act:" + node.id]) {
            state.pending = {
              kind: "action",
              id: node.id,
              label: text(node.label || "继续"),
              hint: text(node.hint || "")
            };
            save();
            emit("act", { id: node.id });
            return;
          }
          state.pc += 1;
          break;
        case "m": {
          const key = node.th || (node.w === "me" ? state.open : node.w);
          /* 玩家进入聊天界面后，人物才开始发消息 */
          if (node.w !== "me" && state.open !== key) {
            if (state.waiting !== "open:" + key) {
              state.waiting = "open:" + key;
              emit("wait-open", { thread: key, text: text(node.x) });
            }
            save();
            return;
          }
          addMsg(key, node.w, node.x, node.img, node.q);
          state.pc += 1;
          save();
          queueTick(node.w === "me" ? 800 : 1100);
          return;
        }
        case "post":
          addPost(node);
          state.pc += 1;
          save();
          queueTick(node.w === "me" ? 700 : 1700);
          return;
        case "like":
          addLike(node);
          state.pc += 1;
          break;
        case "c":
          addComment(node);
          state.pc += 1;
          break;
        case "n":
          addNote(node.x);
          state.pc += 1;
          break;
        case "flag":
          state.flags[node.k] = node.v === undefined ? true : node.v;
          state.pc += 1;
          break;
        case "modal":
          state.modal = text(node.x);
          emit("modal", { text: state.modal });
          state.pc += 1;
          break;
        case "req":
          state.request = { from: node.w, text: text(node.x) };
          emit("request", { from: node.w, text: state.request.text });
          state.pc += 1;
          break;
        case "goto":
          state.pc = idxOf(node.to);
          break;
        case "if":
          if (!node.k || state.flags[node.k]) {
            state.pc = idxOf(node.to);
          } else {
            state.pc += 1;
          }
          break;
        case "a": {
          const options = (node.o || []).map(function (opt) {
            return {
              text: text(opt.x),
              label: text(opt.label || opt.x),
              silent: Boolean(opt.silent),
              img: opt.img || ""
            };
          });
          if (!options.length) {
            state.pc += 1;
            break;
          }
          state.pending = {
            kind: "ask",
            friend: node.kind === "friend",
            thread: node.th || state.open,
            options: options
          };
          save();
          emit("ask", { thread: state.pending.thread });
          return;
        }
        case "end":
          state.done = true;
          emit("end", {});
          break;
        default:
          state.pc += 1;
      }
    }
    save();
  }

  function answer(index) {
    if (!state.pending || state.pending.kind !== "ask") return false;
    const node = flow()[state.pc];
    const opt = node && node.o && node.o[index];
    if (!opt) return false;
    state.pending = null;
    if (!opt.silent) addMsg(node.th || state.open, "me", opt.x || opt.label || "", opt.img);
    if (node.kind === "friend") {
      state.request = null;
    }
    state.pc = opt.j ? idxOf(opt.j) : state.pc + 1;
    step();
    return true;
  }

  function action(id) {
    if (!state.pending || state.pending.kind !== "action") return false;
    if (id && state.pending.id !== id) return false;
    const key = "act:" + state.pending.id;
    state.pending = null;
    state.flags[key] = true;
    state.pc += 1;
    step();
    return true;
  }

  function event(name, payload) {
    state.flags["gate:" + name] = true;
    if (payload && typeof payload === "object") {
      Object.keys(payload).forEach(function (key) {
        if (key !== "event") state.flags[key] = payload[key];
      });
    }
    if (state.flags.bass >= 16) state.flags.bass16 = true;
    if (state.waiting === name) {
      state.waiting = null;
      step();
    } else {
      save();
    }
  }

  function markRead(key) {
    if (key && state.unread[key]) {
      state.unread[key] = 0;
      save();
    }
  }

  function setOpen(key) {
    state.open = key || "";
    if (key) markRead(key);
    if (key && state.waiting === "open:" + key) {
      state.waiting = "";
      window.setTimeout(step, 320);
    }
  }

  function setName(name) {
    const clean = String(name || "").trim().slice(0, 12);
    if (!clean) return false;
    state.name = clean;
    save();
    return true;
  }

  function reset() {
    window.clearTimeout(stepTimer);
    stepTimer = 0;
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (err) {
      /* 忽略 */
    }
    state.name = "";
    state.pc = 0;
    state.flags = {};
    state.threads = { ts: [], wn: [], ys: [] };
    state.notes = [];
    state.feed = [];
    state.unread = { ts: 0, wn: 0, ys: 0 };
    state.request = null;
    state.pending = null;
    state.waiting = null;
    state.modal = null;
    state.open = "";
    state.done = false;
  }

  window.Drama = {
    state: state,
    cast: CAST,
    load: load,
    save: save,
    step: step,
    answer: answer,
    action: action,
    event: event,
    markRead: markRead,
    setOpen: setOpen,
    setName: setName,
    reset: reset,
    text: text,
    onChange: function (fn) {
      if (typeof fn === "function") watchers.push(fn);
    }
  };

  load();
})();
