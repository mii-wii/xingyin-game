/* ep000 感情线剧本。节点按顺序执行：
 *  m    = 一条聊天消息        th 会话  w 说话人（me 表示玩家）
 *  a    = 玩家选择            o 选项列表（x 文案，j 跳转 id，silent 不显示玩家气泡）
 *  act  = 等待玩家操作        id 操作标识
 *  gate = 等待编曲事件        name 事件名
 *  post = 发一条 IG 帖子/快拍  w 发帖人 cap 文案 img 图片 story 是否快拍
 *  like / c = 点赞 / 评论
 *  n    = 备忘录
 *  if   = 条件跳转            k 标志位 to 目标
 */
window.PHONE_SCRIPT = {
  flow: [
    /* ---------- 第一段编曲完成：好友申请 ---------- */
    { t: "gate", name: "section1" },
    { t: "req", w: "ts", x: "上次在 live 听到你的歌很感兴趣，后续可以一起交流吗？" },
    { t: "a", kind: "friend", th: "ts", o: [
      { x: "同意", silent: true, j: "ts-hello-1" },
      { x: "拒绝", silent: true, j: "reject" }
    ] },
    { id: "reject", t: "flag", k: "romance", v: false },
    { t: "modal", x: "你拒绝了韩泰山的好友申请。本局不再出现感情线内容，编曲器仍可继续游玩。" },
    { t: "end" },

    /* ---------- 和韩泰山的第一段 ---------- */
    { id: "ts-hello-1", t: "flag", k: "romance", v: true },
    { t: "m", th: "ts", w: "ts", x: "你好，我是 taesan，是 ep000 的乐手。" },
    { t: "m", th: "ts", w: "ts", x: "上次你在 u 表演的歌我真的很喜欢，想和你交流一下，所以找云鹤要来了你的联系方式。" },
    { t: "a", th: "ts", o: [
      { x: "你好，我是{name}，目前是独立音乐人。感谢你的喜欢，以后多多交流啊。", j: "ts-reply-1" },
      { x: "你好啊！叫我{name}就好。我看过你们的演出，很不错呢，很开心你喜欢我的歌，有机会我们多多交流啊，我有很多想问你的呢。", j: "ts-reply-2" }
    ] },
    { id: "ts-reply-1", t: "m", th: "ts", w: "ts", x: "🤝" },
    { t: "goto", to: "wn-start" },
    { id: "ts-reply-2", t: "m", th: "ts", w: "ts", x: "真荣幸啊。" },
    { t: "m", th: "ts", w: "me", img: "assets/story/emoji-cute.jpg" },
    { t: "goto", to: "wn-start" },

    /* ---------- 金云鹤来探口风 ---------- */
    { id: "wn-start", t: "m", th: "wn", w: "wn", x: "{name}姐！" },
    { t: "m", th: "wn", w: "me", x: "?" },
    { t: "m", th: "wn", w: "wn", x: "刚刚是不是有个人去加你了" },
    { t: "a", th: "wn", o: [
      { x: "没有啊，你想干什么？", j: "wn-a1" },
      { x: "对，叫 taesan", j: "wn-a2" }
    ] },
    { id: "wn-a1", t: "flag", k: "wn1", v: true },
    { t: "m", th: "wn", w: "wn", x: "啊？真的？" },
    { t: "m", th: "wn", w: "wn", x: "又被耍了啊" },
    { t: "m", th: "wn", w: "me", x: "吴娜啊，你长点心吧" },
    { t: "m", th: "wn", w: "wn", x: "ㅠㅠ" },
    { t: "goto", to: "to-logic" },
    { id: "wn-a2", t: "m", th: "wn", w: "wn", x: "哈哈！我是不是很厉害，这都猜到了。" },
    { t: "m", th: "wn", w: "me", x: "对呀，真厉害，不愧是我们云鹤啊。" },
    { t: "m", th: "wn", w: "wn", x: "哈哈" },
    { id: "to-logic", t: "modal", x: "和云鹤聊完啦。去编曲软件把第一首歌编完吧——完成第一段后，我们再回来继续。" },

    /* ---------- 第一轮编曲完成：发快拍 ---------- */
    { id: "story-1", t: "gate", name: "round1" },
    { t: "act", id: "post-story-1", label: "发布快拍", hint: "用编曲截图发一条快拍，文案写「又生了一胎」" },
    { t: "post", w: "me", img: "assets/story/beat-done.jpg", cap: "又生了一胎", story: true },
    { t: "like", w: "ts" },
    { t: "c", w: "wn", x: "是新歌吗？我好想听啊" },
    { t: "n", x: "新歌雏形已出，再定时间打磨。" },
    { t: "post", w: "u", cap: "本周六 20:00 · u livehouse · 阵容：ep000 / {name} / %1 / RERE", place: "u livehouse", announce: true },
    { t: "post", w: "ts", img: "assets/story/bass-outfit.jpg", cap: "今晚的贝斯有点重。#ep000", place: "练习室" },
    { t: "post", w: "wn", img: "assets/story/fries.jpg", cap: "刚刚炸出来的好好吃！推荐演出后吃！", place: "街角炸物店" },

    /* ---------- 摇滚话题 ---------- */
    { t: "m", th: "ts", w: "ts", x: "今天演出的最后一首是新歌吗？" },
    { t: "m", th: "ts", w: "me", x: "对的，还是初版，后续应该会改改。" },
    { t: "m", th: "ts", w: "ts", x: "有点摇滚的感觉呢" },
    { t: "m", th: "ts", w: "me", x: "🤘" },
    { t: "m", th: "ts", w: "me", x: "我很喜欢摇滚风，不过这是第一次尝试，感觉有很多要改进的地方。" },
    { t: "m", th: "ts", w: "ts", x: "我也很喜欢" },
    { t: "m", th: "ts", w: "ts", x: "摇滚" },
    { t: "m", th: "ts", w: "me", x: "有品味" },
    { t: "m", th: "ts", w: "me", x: "不过你们乐队是流行音乐吧？" },
    { t: "m", th: "ts", w: "ts", x: "嗯" },
    { t: "m", th: "ts", w: "ts", x: "不是 hiphop 乐队" },
    { t: "m", th: "ts", w: "me", x: "哈哈哈" },
    { t: "m", th: "ts", w: "me", x: "你最喜欢哪个摇滚乐队？" },
    { t: "m", th: "ts", w: "me", x: "我先说，我喜欢 Nirvana" },
    { t: "m", th: "ts", w: "ts", x: "🙀 这也是我最喜欢的乐队" },
    { t: "m", th: "ts", w: "me", x: "我去……你太有品味了！！！" },
    { t: "m", th: "ts", w: "ts", x: "我还喜欢 oasis" },
    { t: "a", th: "ts", o: [
      { x: "我也是！！特别是 morning glory 这张专辑！", j: "oasis-yes" },
      { x: "呃，我更喜欢 blur。", j: "oasis-no" }
    ] },
    { id: "oasis-yes", t: "m", th: "ts", w: "ts", x: "他们真的特别棒！我最喜欢 whatever" },
    { t: "goto", to: "after-oasis" },
    { id: "oasis-no", t: "m", th: "ts", w: "ts", x: "他们也挺好的。还是 Nirvana 最棒。" },
    { id: "after-oasis", t: "m", th: "ts", w: "me", x: "真好啊，我还以为你们乐队都是 hiphop 迷或者只听流行" },
    { t: "m", th: "ts", w: "me", x: "以后我们可以多聊聊~" },
    { t: "m", th: "ts", w: "me", x: "感觉音乐上我们应该会有很多话可以聊 嘿嘿" },
    { t: "m", th: "ts", w: "ts", x: "因为吴娜？", q: "真好啊，我还以为你们乐队都是 hiphop 迷或者只听流行" },
    { t: "m", th: "ts", w: "ts", x: "我和他不一样" },
    { t: "m", th: "ts", w: "me", x: "是夸奖吗...?" },
    { t: "m", th: "ts", w: "ts", x: "^^" },

    /* ---------- 只有耍过云鹤的玩家才会遇到的追问 ---------- */
    { t: "if", k: "wn1", to: "tease-1" },
    { t: "goto", to: "vinyl-1" },
    { id: "tease-1", t: "m", th: "wn", w: "wn", x: "{name}姐。" },
    { t: "m", th: "wn", w: "wn", x: "{name}姐！" },
    { t: "m", th: "wn", w: "me", x: "干嘛" },
    { t: "m", th: "wn", w: "wn", x: "其实我是被你耍了对吧" },
    /* 玩家连发两条，云鹤再依次回两条 */
    { t: "m", th: "wn", w: "me", x: "？你在说什么啊" },
    { t: "m", th: "wn", w: "me", x: "是不是想让我请你吃辣炒猪肉了" },
    { t: "m", th: "wn", w: "wn", x: "可以吃吗" },
    { t: "m", th: "wn", w: "wn", x: "泰山哥明明加了你 kkt 对吧！" },
    { t: "m", th: "wn", w: "me", x: "你猜" },
    { t: "m", th: "wn", w: "me", x: "^^" },
    { t: "goto", to: "vinyl-1" },

    /* ---------- 彩胶快拍 ---------- */
    { id: "vinyl-1", t: "flag", k: "vinyl", v: true },
    { t: "act", id: "post-story-2", label: "发布快拍", hint: "发一张 Nirvana 彩胶，文案写「~~！！」" },
    { t: "post", w: "me", img: "assets/story/nirvana-vinyl.jpg", cap: "~~！！", story: true },
    { t: "like", w: "wn" },
    { t: "c", w: "wn", x: "看着像泰山哥爱去的店子" },
    { t: "like", w: "ts" },
    { t: "c", w: "ts", x: "啊 我去的时候这张都没货" },
    /* 这是快拍评论区的回复，不走 KKT */
    { t: "a", th: "ig", o: [
      { x: "看来我今天运气很好啊", j: "vinyl-reply" },
      { x: "（不回复）", silent: true, j: "ys-1" }
    ] },
    { id: "vinyl-reply", t: "c", w: "ts", x: "^^" },

    /* ---------- 允书约甜品 ---------- */
    { id: "ys-1", t: "m", th: "ys", w: "ys", x: "噗嘶噗嘶" },
    { t: "m", th: "ys", w: "ys", x: "最近有空吗" },
    { t: "a", th: "ys", o: [
      { x: "你来找我我就有空", j: "ys-2" },
      { x: "好事就有空", j: "ys-2" }
    ] },
    { id: "ys-2", t: "m", th: "ys", w: "ys", x: "这个回复呀，那看来你新歌写的很顺利嘛" },
    { t: "m", th: "ys", w: "ys", x: "没什么" },
    { t: "m", th: "ys", w: "ys", x: "那家想吃很久的甜品店最近办活动，想让你陪我一起去" },
    { t: "a", th: "ys", o: [
      { x: "gogogo 刻不容缓，蛋糕冰淇淋巧克力美丽小饮料我来了", j: "ys-3a" },
      { x: "ok", j: "ys-3b" },
      { x: "能不去吗？", j: "ys-3c" }
    ] },
    { id: "ys-3a", t: "m", th: "ys", w: "ys", x: "就知道你喜欢！" },
    { t: "goto", to: "ys-4" },
    { id: "ys-3b", t: "m", th: "ys", w: "ys", x: "就知道你肯定会答应我~" },
    { t: "goto", to: "ys-4" },
    { id: "ys-3c", t: "m", th: "ys", w: "ys", x: "不接受反抗。" },
    { id: "ys-4", t: "m", th: "ys", w: "ys", x: "对了" },
    { t: "m", th: "ys", w: "ys", x: "你 ins 评论区那个新来的 ts 山是谁" },
    { t: "m", th: "ys", w: "ys", x: "难道" },
    { t: "m", th: "ys", w: "me", x: "没暧昧没表白没恋爱" },
    { t: "m", th: "ys", w: "ys", x: "。ok 你满心只有你的音乐" },
    { t: "m", th: "ys", w: "ys", x: "可是他很帅啊" },
    { t: "m", th: "ys", w: "me", x: "你怎么知道？" },
    { t: "m", th: "ys", w: "ys", x: "姐姐" },
    { t: "m", th: "ys", w: "ys", x: "他 ins 有照片" },
    { t: "m", th: "ys", w: "me", x: "我们只聊过音乐" },
    { t: "m", th: "ys", w: "ys", x: "只聊过" },
    { t: "m", th: "ys", w: "ys", x: "那你们聊过" },
    { t: "m", th: "ys", w: "me", x: "我和金云鹤也聊过" },
    { t: "m", th: "ys", w: "ys", x: "音乐和猪肉能一样吗" },
    { t: "m", th: "ys", w: "ys", x: "他真的很帅" },
    { t: "a", th: "ys", o: [
      { x: "我也觉得云鹤挺帅", j: "ys-5a" },
      { x: "他弹贝斯更帅", j: "ys-5b" },
      { x: "把他 kkt 发你？", j: "ys-5c" }
    ] },
    { id: "ys-5a", t: "m", th: "ys", w: "ys", x: "你别幽默了 你知道我在说什么" },
    { t: "goto", to: "ys-6" },
    { id: "ys-5b", t: "m", th: "ys", w: "ys", x: "姐妹下次我绝对去看你演出" },
    { t: "goto", to: "ys-6" },
    { id: "ys-5c", t: "m", th: "ys", w: "ys", x: "不爱爬山" },
    { id: "ys-6", t: "m", th: "ys", w: "ys", x: "所以说定了陪我去吃甜品 你别忘了！" },
    { t: "m", th: "ys", w: "me", x: "好" },

    /* ---------- 第二次编曲 ---------- */
    { t: "act", id: "start-round2", label: "开始第二次编曲", hint: "这次在第一轮的基础上修改，四段都要重新提交" },
    { t: "gate", name: "round2done" },
    { t: "act", id: "send-song", label: "发给韩泰山听", hint: "把改好的新歌发给他，否则剧情无法继续" },
    { t: "m", th: "ts", w: "me", x: "我的新歌" },
    { t: "m", th: "ts", w: "me", x: "你是我身边为数不多喜爱摇滚乐的人，所以能给点建议吗？" },
    { t: "m", th: "ts", w: "ts", x: "哇" },
    { t: "m", th: "ts", w: "ts", x: "是修改了吧？" },
    { t: "m", th: "ts", w: "ts", x: "和上次听不太一样" },
    { t: "m", th: "ts", w: "ts", x: "没什么建议" },
    { t: "m", th: "ts", w: "me", x: "啊？" },
    { t: "m", th: "ts", w: "ts", x: "我很喜欢" },
    { t: "m", th: "ts", w: "ts", x: "提不出任何建议啊" },
    { t: "m", th: "ts", w: "me", x: "嘿嘿 那也太好了" },
    { t: "if", k: "bass16", to: "bass-1" },
    { t: "goto", to: "ys-flake-1" },
    { id: "bass-1", t: "m", th: "ts", w: "ts", x: "嗯 你很喜欢贝斯吗？" },
    { t: "m", th: "ts", w: "me", x: "诶？" },
    { t: "m", th: "ts", w: "ts", x: "低音部分很多贝斯" },
    { t: "m", th: "ts", w: "me", x: "我很喜欢这部分呢" },
    { t: "m", th: "ts", w: "ts", x: "我会练习一下的" },
    { t: "m", th: "ts", w: "ts", x: "下次可以弹给你听" },
    { t: "m", th: "ts", w: "me", x: "我也很喜欢这部分" },

    /* ---------- 允书被放鸽子 ---------- */
    { id: "ys-flake-1", t: "m", th: "ys", w: "ys", x: "呵呵" },
    { t: "m", th: "ys", w: "ys", x: "呵呵！" },
    { t: "m", th: "ys", w: "me", x: "谁惹你了" },
    { t: "m", th: "ys", w: "me", x: "我去打他" },
    { t: "m", th: "ys", w: "ys", x: "你" },
    { t: "a", th: "ys", o: [
      { x: "米安内", j: "ys-f1" },
      { x: "我做错了神马", j: "ys-f2" },
      { x: "啊？", j: "ys-f3" },
      { x: "我狠狠地扇了自己一耳光", j: "ys-f4" }
    ] },
    { id: "ys-f1", t: "m", th: "ys", w: "ys", x: "知道错哪了吗" },
    { t: "m", th: "ys", w: "ys", x: "我猜你也不知道 呵呵" },
    { t: "goto", to: "ys-f5" },
    { id: "ys-f2", t: "m", th: "ys", w: "ys", x: "你神马都做错了" },
    { t: "goto", to: "ys-f5" },
    { id: "ys-f3", t: "m", th: "ys", w: "ys", x: "呵" },
    { t: "goto", to: "ys-f5" },
    { id: "ys-f4", t: "m", th: "ys", w: "ys", x: "录视频了吗" },
    { t: "m", th: "ys", w: "ys", x: "发来看看" },
    { id: "ys-f5", t: "m", th: "ys", w: "ys", x: "你。我们不是说好一起吃甜点吗。" },
    { t: "m", th: "ys", w: "ys", x: "你人呢？" },
    { t: "a", th: "ys", o: [
      { x: "哈哈。我在路上了你等等我 我马上到", j: "ys-f6a" },
      { x: "不是没约定日期吗", j: "ys-f6b" },
      { x: "公主大人臣来迟了", j: "ys-f6c" },
      { x: "对不起。", j: "ys-f6d" }
    ] },
    { id: "ys-f6a", t: "m", th: "ys", w: "ys", x: "你知道地址吗" },
    { t: "goto", to: "ys-f7" },
    { id: "ys-f6b", t: "m", th: "ys", w: "ys", x: "那我们上次见面结束说的是什么" },
    { t: "goto", to: "ys-f7" },
    { id: "ys-f6c", t: "m", th: "ys", w: "ys", x: "拖下去斩了" },
    { t: "goto", to: "ys-f7" },
    { id: "ys-f6d", t: "m", th: "ys", w: "ys", x: "不原谅" },
    { id: "ys-f7", t: "m", th: "ys", w: "ys", x: "算了" },
    { t: "m", th: "ys", w: "ys", x: "下周再约吧" },
    { t: "m", th: "ys", w: "ys", x: "你歌是不是做完了" },
    /* 玩家连发：就这么算了？ / 其实你也没出门吧 / bingo（引用「你歌是不是做完了」）/ 知我者允书也 */
    { t: "m", th: "ys", w: "me", x: "就这么算了？" },
    { t: "m", th: "ys", w: "me", x: "其实你也没出门吧" },
    { t: "m", th: "ys", w: "me", x: "bingo", q: "你歌是不是做完了" },
    { t: "m", th: "ys", w: "me", x: "知我者允书也" },
    { t: "m", th: "ys", w: "ys", x: "看你这个反应我就猜到了" },
    { t: "m", th: "ys", w: "me", x: "不过我觉得还要改一改" },
    { t: "m", th: "ys", w: "me", x: "总感觉怪怪的" },
    { t: "m", th: "ys", w: "me", x: "但是说不出来" },
    { t: "m", th: "ys", w: "ys", x: "吃个甜品就好了" },
    { t: "m", th: "ys", w: "me", x: "其实你也没出门吧" },
    { t: "m", th: "ys", w: "ys", x: "我有事先走了" },
    { t: "m", th: "ys", w: "me", x: "呵呵" },

    /* ---------- 云鹤的雨 ---------- */
    { t: "post", w: "wn", img: "assets/story/rain.jpg", cap: "这就是青春啊！", place: "排练室门口", rain: true },
    { t: "c", w: "ts", x: "露天洗澡？太不雅观了" },
    { t: "like", w: "myng" },
    { t: "c", w: "myng", x: "真可爱啊" },
    { t: "like", w: "ppparksh" },
    { t: "c", w: "ppparksh", x: "回去要马上洗澡，洗完澡要收拾卫生哦" },

    /* ---------- 鼓点讨论 ---------- */
    { t: "m", th: "ts", w: "ts", x: "方便吗？" },
    { t: "m", th: "ts", w: "ts", x: "先说句抱歉" },
    { t: "m", th: "ts", w: "me", x: "?" },
    { t: "m", th: "ts", w: "ts", x: "之前说没有任何建议 但是我刚刚突然想到一些点" },
    { t: "m", th: "ts", w: "me", x: "我的歌？" },
    { t: "m", th: "ts", w: "ts", x: "对" },
    { t: "m", th: "ts", w: "me", x: "没事没事 我本来也打算再改改的" },
    { t: "m", th: "ts", w: "me", x: "说不定你正好能帮到我" },
    { t: "m", th: "ts", w: "ts", x: "我觉得第四段鼓可以密一些" },
    { t: "m", th: "ts", w: "ts", x: "像雷声滚滚一样的感觉" },
    { t: "act", id: "send-fix", label: "改好后再发给他", hint: "回到编曲器，把第二段的鼓加密一点" },
    { t: "m", th: "ts", w: "me", x: "确实不一样了..." },
    { t: "m", th: "ts", w: "ts", x: "我觉得可以再松一点，这个鼓太重了" },
    { t: "m", th: "ts", w: "me", x: "太松了会不会少点味道？" },
    { t: "m", th: "ts", w: "me", x: "多松啊" },
    { t: "m", th: "ts", w: "ts", x: "嗯" },
    { t: "m", th: "ts", w: "ts", x: "就是" },
    { t: "m", th: "ts", w: "ts", x: "我想想" },
    { t: "m", th: "ts", w: "me", x: "要不我直接开个共创曲谱吧" },
    { t: "m", th: "ts", w: "me", x: "我拉你？我俩一起写" },
    { t: "m", th: "ts", w: "ts", x: "可以吗？" },
    { t: "m", th: "ts", w: "me", x: "我不是在问你吗" },
    { t: "m", th: "ts", w: "ts", x: "我马上进 你拉我" },
    { t: "end" }
  ]
};
