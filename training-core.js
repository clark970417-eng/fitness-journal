(function (root) {
  'use strict';
  const extraExercises = [
    ["槓鈴深蹲", "腿", "槓鈴", "squat", "背蹲 back squat"],
    ["羅馬尼亞硬舉", "腿", "槓鈴", "hinge", "RDL"],
    ["保加利亞分腿蹲", "腿", "啞鈴", "split", "保加利亞蹲"],
    ["槓鈴臥推", "胸", "槓鈴", "press", "bench press"],
    ["上斜啞鈴臥推", "胸", "啞鈴", "incline", "上胸"],
    ["滑輪下拉", "背", "滑輪", "pulldown", "高位下拉 lat pulldown"],
    ["坐姿划船", "背", "滑輪", "row", "低位划船"],
    ["啞鈴划船", "背", "啞鈴", "row", "俯身划船"],
    ["寬距下拉", "背", "滑輪", "pulldown", ""],
    ["V-bar 划船", "背", "滑輪", "row", "V把 窄握"],
    ["啞鈴彎舉", "手臂", "啞鈴", "curl", "二頭"],
    ["錘式彎舉", "手臂", "啞鈴", "curl", "槌式 hammer"],
    ["集中彎舉", "手臂", "啞鈴", "curl", ""],
    ["EZ 槓牧師彎舉", "手臂", "槓鈴", "curl", "曲槓 斜板"],
    ["滑輪三頭下壓", "手臂", "滑輪", "pushdown", "三頭肌"],
    ["啞鈴肩推", "肩", "啞鈴", "shoulder", "坐姿肩推"],
    ["啞鈴側平舉", "肩", "啞鈴", "lateral", ""],
    ["腿推", "腿", "機械", "legpress", "腿推機 leg press 45度"],
    ["腿屈伸", "腿", "機械", "extension", "腿伸展機 股四頭 踢腿機"],
    ["坐姿腿彎舉", "腿", "機械", "legcurl", "腿後勾 腿後腱"],
    ["機械胸推", "胸", "機械", "machinepress", "胸推機 坐姿推胸"],
    ["上斜槓鈴臥推", "胸", "槓鈴", "incline", ""],
    ["寬距槓鈴臥推", "胸", "槓鈴", "press", ""],
    ["滑輪夾胸", "胸", "滑輪", "fly", "龍門架 十字夾胸"],
    ["捲腹", "核心", "徒手", "crunch", "卷腹"],
    ["啞鈴臥推", "胸", "啞鈴", "press", ""],
    ["窄握槓鈴臥推", "手臂", "槓鈴", "press", "窄距"],
    ["史密斯臥推", "胸", "機械", "press", "Smith 史密斯機"],
    ["史密斯上斜臥推", "胸", "機械", "incline", "Smith 上胸"],
    ["上斜胸推機", "胸", "機械", "machinepress", "上胸推舉機"],
    ["蝴蝶機夾胸", "胸", "機械", "pecdeck", "飛鳥機 pec deck"],
    ["啞鈴飛鳥", "胸", "啞鈴", "lyingfly", "平板飛鳥"],
    ["上斜啞鈴飛鳥", "胸", "啞鈴", "inclinefly", ""],
    ["伏地挺身", "胸", "徒手", "pushup", "俯臥撐 push up"],
    ["跪姿伏地挺身", "胸", "徒手", "kneepushup", ""],
    ["槓鈴划船", "背", "槓鈴", "row", "俯身划船"],
    ["反握槓鈴划船", "背", "槓鈴", "row", ""],
    ["窄握下拉", "背", "滑輪", "pulldown", "窄距高位"],
    ["反握下拉", "背", "滑輪", "pulldown", ""],
    ["機械高位下拉", "背", "機械", "pulldown", "背部下拉機 高拉機"],
    ["胸靠式划船機", "背", "機械", "chestrow", "胸撐坐姿划船 胸撐划船 胸托划船 胸靠划船 坐姿划船訓練機 seated row chest supported row"],
    ["高位划船機", "背", "機械", "highrow", "高拉划船"],
    ["直臂下拉", "背", "滑輪", "straightpull", "直手下壓"],
    ["引體向上", "背", "徒手", "pullup", "正握 pull up"],
    ["反握引體向上", "背", "徒手", "pullup", "chin up"],
    ["輔助引體向上機", "背", "機械", "pullup", "助力引體"],
    ["背部伸展機", "背", "機械", "backextension", "下背機 豎脊肌"],
    ["羅馬椅背伸展", "背", "機械", "romanextension", "山羊挺身 羅馬椅"],
    ["傳統硬舉", "腿", "槓鈴", "deadlift", "deadlift"],
    ["相撲硬舉", "腿", "槓鈴", "sumodeadlift", "sumo"],
    ["啞鈴羅馬尼亞硬舉", "腿", "啞鈴", "hinge", "RDL"],
    ["史密斯深蹲", "腿", "機械", "squat", "Smith"],
    ["史密斯分腿蹲", "腿", "機械", "split", "Smith"],
    ["徒手深蹲", "腿", "徒手", "squat", "bodyweight"],
    ["啞鈴深蹲", "腿", "啞鈴", "squat", ""],
    ["前蹲", "腿", "槓鈴", "frontsquat", "槓鈴前蹲"],
    ["哈克深蹲機", "腿", "機械", "hacksquat", "Hack 哈克蹲"],
    ["鐘擺深蹲機", "腿", "機械", "hacksquat", "pendulum"],
    ["水平腿推機", "腿", "機械", "horizontalpress", "坐姿腿推"],
    ["俯臥腿彎舉", "腿", "機械", "pronecurl", "趴姿腿後勾"],
    ["站姿腿彎舉機", "腿", "機械", "standingcurl", "單腿腿後勾"],
    ["髖外展機", "腿", "機械", "abductor", "臀外展 外擴 外展機 臀中肌"],
    ["髖內收機", "腿", "機械", "adductor", "內夾 大腿內側 內收機"],
    ["臀推機", "腿", "機械", "hipthrust", "臀橋機 glute drive"],
    ["槓鈴臀推", "腿", "槓鈴", "hipthrust", "hip thrust"],
    ["臀橋", "腿", "徒手", "bridge", "glute bridge"],
    ["臀部後踢機", "腿", "機械", "kickback", "臀後踢 glute kickback"],
    ["滑輪臀後踢", "腿", "滑輪", "kickback", "後抬腿"],
    ["站姿提踵機", "腿", "機械", "calf", "小腿機 踮腳 calf raise"],
    ["坐姿提踵機", "腿", "機械", "seatedcalf", "小腿比目魚肌"],
    ["啞鈴提踵", "腿", "啞鈴", "calf", "小腿"],
    ["徒手提踵", "腿", "徒手", "calf", ""],
    ["徒手弓箭步", "腿", "徒手", "lunge", "弓步 lunge"],
    ["啞鈴弓箭步", "腿", "啞鈴", "lunge", ""],
    ["肩推機", "肩", "機械", "shoulder", "機械肩推 shoulder press"],
    ["史密斯肩推", "肩", "機械", "shoulder", "Smith"],
    ["站姿槓鈴肩推", "肩", "槓鈴", "shoulder", "軍事推舉 overhead press"],
    ["站姿啞鈴肩推", "肩", "啞鈴", "shoulder", ""],
    ["側平舉機", "肩", "機械", "machinelateral", "側肩機 側舉機"],
    ["滑輪側平舉", "肩", "滑輪", "lateral", ""],
    ["啞鈴前平舉", "肩", "啞鈴", "frontraise", "前舉"],
    ["滑輪前平舉", "肩", "滑輪", "frontraise", ""],
    ["反向蝴蝶機", "肩", "機械", "reversepecdeck", "後三角機 反向飛鳥機 後肩"],
    ["俯身啞鈴反向飛鳥", "肩", "啞鈴", "reversefly", "後三角"],
    ["滑輪面拉", "肩", "滑輪", "facepull", "face pull 後肩"],
    ["啞鈴聳肩", "肩", "啞鈴", "shrug", "斜方肌"],
    ["槓鈴聳肩", "肩", "槓鈴", "shrug", ""],
    ["槓鈴彎舉", "手臂", "槓鈴", "curl", "二頭"],
    ["EZ 槓彎舉", "手臂", "槓鈴", "curl", "曲槓"],
    ["滑輪彎舉", "手臂", "滑輪", "curl", "二頭滑輪"],
    ["二頭彎舉機", "手臂", "機械", "preachercurl", "二頭機 牧師彎舉機"],
    ["三頭伸展機", "手臂", "機械", "tricepsextension", "三頭機"],
    ["繩索三頭下壓", "手臂", "滑輪", "pushdown", "三頭繩索"],
    ["啞鈴過頭三頭伸展", "手臂", "啞鈴", "overheadextension", "法式推舉"],
    ["滑輪過頭三頭伸展", "手臂", "滑輪", "overheadextension", ""],
    ["仰臥 EZ 槓三頭伸展", "手臂", "槓鈴", "skullcrusher", "碎顱者 法式臥推"],
    ["雙槓撐體", "手臂", "徒手", "dip", "雙槓 dips"],
    ["輔助雙槓撐體機", "手臂", "機械", "dip", "助力雙槓"],
    ["捲腹機", "核心", "機械", "machinecrunch", "腹肌機 卷腹機"],
    ["跪姿滑輪捲腹", "核心", "滑輪", "cablecrunch", "繩索卷腹"],
    ["仰臥抬腿", "核心", "徒手", "legraise", "舉腿"],
    ["羅馬椅抬膝", "核心", "機械", "kneeraise", "船長椅 腹肌架"],
    ["懸垂抬膝", "核心", "徒手", "hangingknee", "吊單槓抬膝"],
    ["死蟲式", "核心", "徒手", "deadbug", "dead bug"],
    ["鳥狗式", "核心", "徒手", "birddog", "bird dog"],
    ["單臂胸撐划船機", "背", "機械", "chestrow", "單手划船 單邊划船 iso lateral row"],
    ["寬握胸撐划船機", "背", "機械", "chestrow", "寬把划船 寬距划船"],
    ["T 槓胸撐划船", "背", "機械", "inclinerow", "T bar 丁字槓 胸托T槓"],
    ["上斜啞鈴胸撐划船", "背", "啞鈴", "inclinerow", "斜板划船 趴姿划船 seal row"],
    ["坐姿低位划船機", "背", "機械", "chestrow", "低拉機 low row"],
    ["單臂高位划船機", "背", "機械", "highrow", "單邊高拉 iso lateral high row"],
    ["單臂滑輪划船", "背", "滑輪", "row", "單手低位划船"],
    ["單臂滑輪下拉", "背", "滑輪", "pulldown", "單手高位下拉"],
    ["下斜胸推機", "胸", "機械", "machinepress", "下胸推舉 decline press"],
    ["坐姿三頭下壓機", "手臂", "機械", "seateddip", "坐姿撐體機 seated dip"],
    ["反握二頭彎舉", "手臂", "槓鈴", "curl", "反向彎舉 前臂"],
    ["啞鈴腕彎舉", "手臂", "啞鈴", "wristcurl", "前臂腕屈曲 wrist curl"],
    ["旋轉軀幹機", "核心", "機械", "torsorotation", "轉腰機 rotary torso"],
    ["站姿髖外展機", "腿", "機械", "standingabduction", "臀部旋轉訓練機 multi hip rotary hip"],
    ["站姿髖內收機", "腿", "機械", "standingadduction", "臀部旋轉訓練機 multi hip"],
    ["站姿髖屈曲機", "腿", "機械", "hipflexion", "臀部旋轉訓練機 抬膝 multi hip"],
    ["站姿髖伸展機", "腿", "機械", "kickback", "臀部旋轉訓練機 後踢 multi hip"],
    ["滑輪髖外展", "腿", "滑輪", "standingabduction", "踝帶 側抬腿"],
    ["滑輪髖內收", "腿", "滑輪", "standingadduction", "踝帶 內夾腿"],
    ["伸展機坐姿伸展", "伸展", "機械", "seatedstretch", "伸展機 stretching"],
    ["跑步機快走", "有氧", "機械", "treadmill", "電腦跑步機 treadmill walking"],
    ["跑步機慢跑", "有氧", "機械", "treadmill", "專業用電腦跑步機 running"],
    ["橢圓交叉訓練機", "有氧", "機械", "elliptical", "橢圓機 滑步機 專業用交叉訓練機 elliptical"],
    ["有氧划船機", "有氧", "機械", "ergrow", "專業用划船機 測功儀 rowing ergometer"],
    ["直立式健身車", "有氧", "機械", "cycle", "專業用直立式腳踏車 upright bike"],
    ["靠背式健身車", "有氧", "機械", "recumbent", "專業用靠背式腳踏車 臥式腳踏車 recumbent"],
    ["斜 45 度健身車", "有氧", "機械", "recumbent", "斜45度健身車 斜躺健身車"],
    ["樓梯機", "有氧", "機械", "stair", "專業用樓梯機 登階機 stair climber"],
    ["飛輪有氧健身車", "有氧", "機械", "cycle", "飛輪車 spinning bike"],
  ].map(([name, group, equipment, motion, aliases]) => ({ name, group, equipment, motion, aliases, timed: ['有氧','伸展'].includes(group), displayName: name === '胸靠式划船機' ? '胸撐坐姿划船' : name, weight: 0, reps: 10, setCount: 3, previous: '尚無紀錄' }));
  const equipmentAliases = {"機械胸推": "坐姿胸部推舉機 胸部推舉機", "肩推機": "肩部推舉機", "滑輪下拉": "高拉滑輪機", "蝴蝶機夾胸": "坐姿蝴蝶機", "腿屈伸": "腿部伸張機 腿部伸展機", "坐姿腿彎舉": "坐姿腿部彎曲機", "捲腹機": "腹部前屈機", "側平舉機": "側肩推舉機", "二頭彎舉機": "二頭肌訓練機", "三頭伸展機": "三頭肌訓練機", "髖內收機": "大腿內收訓練機", "髖外展機": "大腿外展推蹬訓練機", "羅馬椅背伸展": "45度背部伸張架", "史密斯深蹲": "史密斯訓練機", "滑輪夾胸": "可調式滑輪交叉訓練機 全肢體多功能訓練機 無敵多功能訓練站 MR47", "EZ 槓牧師彎舉": "二頭肌彎舉架 舉重彎曲槓", "槓鈴臥推": "平臥推架 平臥推舉架 奧林匹克標準槓把", "上斜槓鈴臥推": "上斜推舉架", "啞鈴臥推": "可調式啞鈴訓練椅 平條訓練椅 包膠啞鈴", "捲腹": "腹部啞鈴訓練椅", "雙槓撐體": "單雙槓訓練機"};
  for (const e of extraExercises) e.aliases += " " + (equipmentAliases[e.name] || "");
  const zhubeiExercises = new Set(["機械胸推", "肩推機", "滑輪下拉", "胸靠式划船機", "蝴蝶機夾胸", "腿屈伸", "坐姿腿彎舉", "站姿髖外展機", "捲腹機", "伸展機坐姿伸展", "史密斯深蹲", "槓鈴臥推", "EZ 槓彎舉", "啞鈴臥推", "捲腹", "EZ 槓牧師彎舉", "啞鈴彎舉", "跑步機快走", "橢圓交叉訓練機", "靠背式健身車", "有氧划船機", "直立式健身車", "斜 45 度健身車", "樓梯機", "飛輪有氧健身車", "側平舉機", "二頭彎舉機", "三頭伸展機", "髖內收機", "髖外展機", "雙槓撐體", "滑輪夾胸", "羅馬椅背伸展", "上斜槓鈴臥推", "站姿髖內收機", "站姿髖屈曲機", "站姿髖伸展機", "跑步機慢跑", "引體向上"]);
  for (const e of extraExercises) e.venue = zhubeiExercises.has(e.name);
  const builtins = new Map(extraExercises.map(item => [item.name, item]));
  function motionFor(exercise) {
    const known = builtins.get(exercise.name);
    if (known) return known.motion;
    if (exercise.motion) return exercise.motion;
    const name = exercise.name;
    if (/下拉/.test(name)) return 'pulldown';
    if (/划船/.test(name)) return 'row';
    if (/硬舉/.test(name)) return 'hinge';
    if (/分腿/.test(name)) return 'split';
    if (/深蹲/.test(name)) return 'squat';
    if (/上斜.*臥推/.test(name)) return 'incline';
    if (/臥推|胸推/.test(name)) return 'press';
    if (/彎舉/.test(name)) return 'curl';
    return 'neutral';
  }
  function catalog(existing = []) {
    const names = new Set();
    return [...existing, ...extraExercises].filter(item => {
      if (names.has(item.name)) return false;
      names.add(item.name); return true;
    }).map(item => ({ ...builtins.get(item.name), ...item, motion: motionFor(item), aliases: [...new Set([builtins.get(item.name)?.aliases, item.aliases].filter(Boolean).join(' ').split(/\s+/))].join(' '), displayName: builtins.get(item.name)?.displayName || item.name, timed: builtins.get(item.name)?.timed || false, venue: builtins.get(item.name)?.venue || false }));
  }
  function validSet(set) {
    if (set && Object.hasOwn(set, 'durationMin')) return Number.isFinite(set.durationMin) && set.durationMin > 0 && set.durationMin <= 1440;
    return set && set.weight !== null && set.weight !== '' && Number.isFinite(Number(set.weight)) && Number(set.weight) >= 0 && Number(set.weight) <= 1500
      && Number.isInteger(Number(set.reps)) && Number(set.reps) > 0 && Number(set.reps) <= 999;
  }
  function volume(exercises) {
    return exercises.reduce((total, exercise) => total + (exercise.sets || []).filter(set => set.done && validSet(set))
      .reduce((sum, set) => sum + (set.durationMin ? 0 : Number(set.weight) * Number(set.reps)), 0), 0);
  }
  function historyVolume(entry) {
    return volume((entry.exercises || []).map(exercise => ({ ...exercise,
      sets: (exercise.sets || []).map(set => ({ ...set, done: set.done !== false })) })));
  }
  function estimateOneRepMax(weight, reps) {
    if (!validSet({weight, reps})) return 0;
    return Math.round(Number(weight) * (Number(reps) === 1 ? 1 : 1 + Number(reps) / 30) * 10) / 10;
  }
  function exerciseBest(exercise) {
    return Math.max(0, ...(exercise.sets || []).filter(set => set.done !== false && validSet(set))
      .map(set => estimateOneRepMax(set.weight, set.reps)));
  }
  function recordStats(history) {
    const previous = new Map();
    const results = new Map();
    const entries = history.filter(entry => !String(entry.id).startsWith('sample-'))
      .slice().sort((a,b) => new Date(a.date) - new Date(b.date));
    for (const entry of entries) {
      const current = new Map();
      for (const exercise of entry.exercises || []) current.set(exercise.name, Math.max(current.get(exercise.name) || 0, exerciseBest(exercise)));
      const exercises = (entry.exercises || []).map(exercise => ({...exercise, bestE1rm: exerciseBest(exercise),
        isPr: (previous.get(exercise.name) || 0) > 0 && exerciseBest(exercise) > previous.get(exercise.name)}));
      const prs = new Set(exercises.filter(exercise => exercise.isPr).map(exercise => exercise.name)).size;
      results.set(entry, {...entry, exercises, prs});
      for (const [name,best] of current) previous.set(name, Math.max(previous.get(name) || 0,best));
    }
    return history.map(entry => results.get(entry) || entry);
  }
  function latest(exercise, history) {
    return [...history].filter(entry => !String(entry.id).startsWith('sample-'))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .flatMap(entry => entry.exercises || []).find(item => item.name === exercise.name && item.sets?.some(set => set.done !== false && validSet(set)));
  }
  function recentExercises(exercises, history, usage = {}) {
    const recent = new Map();
    for (const [name, value] of Object.entries(usage)) {
      const time = Number(value); if (Number.isFinite(time) && time > 0) recent.set(name, time);
    }
    for (const entry of history.filter(entry => !String(entry.id).startsWith('sample-'))) {
      const time = new Date(entry.date).getTime(); if (!Number.isFinite(time)) continue;
      for (const exercise of entry.exercises || []) {
        if (exercise.sets?.some(set => set.done !== false && validSet(set))) recent.set(exercise.name, Math.max(recent.get(exercise.name) || 0, time));
      }
    }
    return exercises.map((exercise,index)=>({exercise,index})).sort((a,b)=>(recent.get(b.exercise.name)||0)-(recent.get(a.exercise.name)||0)||a.index-b.index).map(item=>item.exercise);
  }
  function parametersAtWeight(exercise, history, weight) {
    const records = new Map();
    for (const entry of history.filter(entry => !String(entry.id).startsWith('sample-'))) {
      const weights = new Map();
      for (const item of (entry.exercises || []).filter(item => item.name === exercise.name)) {
        for (const set of (item.sets || []).filter(set => set.done !== false && validSet(set))) {
          const kg = Number(set.weight); if (!weights.has(kg)) weights.set(kg, []);
          weights.get(kg).push(Number(set.reps));
        }
      }
      for (const [kg, reps] of weights) {
        const record = { count: reps.length, reps: Math.min(...reps), total: reps.reduce((a,b)=>a+b,0) };
        const prior = records.get(kg);
        if (!prior || record.total > prior.total || record.total === prior.total && record.count > prior.count) records.set(kg, record);
      }
    }
    const exact = records.get(Number(weight));
    if (exact) return { count: exact.count, reps: exact.reps };
    const lower = [...records.keys()].filter(kg => kg < Number(weight)).sort((a,b)=>b-a)[0];
    const prior = records.get(lower);
    return { count: Math.min(4, prior?.count ?? 4), reps: Math.min(8, prior?.reps ?? 8) };
  }
  function prescription(exercise, history, count) {
    const prior = latest(exercise, history);
    const priorSets = prior?.sets.filter(set => set.done !== false && validSet(set)) || [];
    const weight = Number(priorSets.at(-1)?.weight ?? exercise.weight ?? 0);
    const parameters = parametersAtWeight(exercise, history, weight);
    return { ...exercise, defaultRule: 4081, setCount: count ?? parameters.count,
      previous: priorSets.length ? `${weight} kg × ${priorSets.at(-1).reps}` : '尚無紀錄',
      sets: Array.from({ length: count ?? parameters.count }, () => ({ weight, reps: parameters.reps,
        done: true, type: '正式', rpe: 8 })) };
  }
  function replace(workout, index, exercise, history) {
    const current = workout[index];
    const completed = current.sets.filter(set => set.done);
    const pending = current.sets.length - completed.length;
    const replacement = prescription(exercise, history, pending || exercise.setCount || 3);
    const result = [...workout];
    if (completed.length) {
      result[index] = { ...current, sets: completed };
      result.splice(index + 1, 0, replacement);
      return { workout: result, activeExercise: index + 1 };
    }
    result[index] = replacement;
    return { workout: result, activeExercise: index };
  }
  function dateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  function bounds(period, anchor) {
    const start = new Date(anchor); start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    if (period === 'week') { start.setDate(start.getDate() - (start.getDay() + 6) % 7); end.setTime(start.getTime()); end.setDate(end.getDate() + 7); }
    if (period === 'month') { start.setDate(1); end.setFullYear(start.getFullYear(), start.getMonth() + 1, 1); }
    if (period === 'year') { start.setMonth(0, 1); end.setFullYear(start.getFullYear() + 1, 0, 1); }
    return { start, end };
  }
  function shift(period, anchor, direction) {
    const result = new Date(bounds(period, anchor).start);
    if (period === 'week') result.setDate(result.getDate() + direction * 7);
    if (period === 'month') result.setMonth(result.getMonth() + direction);
    if (period === 'year') result.setFullYear(result.getFullYear() + direction);
    return result;
  }
  function stats(history, period = 'week', anchor = new Date()) {
    const { start, end } = bounds(period, anchor);
    const entries = history.filter(entry => !String(entry.id).startsWith('sample-') && new Date(entry.date) >= start && new Date(entry.date) < end);
    const buckets = Array.from({ length: period === 'year' ? 12 : period === 'month' ? Math.ceil((end - start) / 86400000) : 7 }, (_, i) => ({ label: period === 'year' ? `${i + 1}月` : period === 'week' ? ['一', '二', '三', '四', '五', '六', '日'][i] : `${i + 1}`, value: 0 }));
    const muscles = {}; let sets = 0; let reps = 0; let total = 0;
    for (const entry of entries) {
      const date = new Date(entry.date);
      const index = period === 'year' ? date.getMonth() : period === 'month' ? date.getDate() - 1 : (date.getDay() + 6) % 7;
      const entryVolume = historyVolume(entry);
      total += entryVolume; buckets[index].value += entryVolume;
      for (const exercise of entry.exercises || []) {
        const count = (exercise.sets || []).filter(set => set.done !== false && !set.durationMin && validSet(set));
        sets += count.length; reps += count.reduce((sum, set) => sum + Number(set.reps), 0);
        muscles[exercise.group || '其他'] = (muscles[exercise.group || '其他'] || 0) + count.length;
      }
    }
    return { start, end, entries, count: entries.length, volume: total, sets, reps, muscles, buckets };
  }
  function mergeObservations(observations) {
    const sets = observations.flatMap(item => (item.sets || []).map(set => ({ ...set, chunkStart: item.startSec, chunkEnd: item.endSec }))).sort((a, b) => a.startSec - b.startSec);
    const merged = [];
    for (const set of sets) {
      const previous = merged.at(-1);
      if (previous && previous.exercise === set.exercise && Number.isFinite(set.chunkStart)
        && Math.abs(previous.chunkEnd - set.chunkStart) < .1
        && set.startSec - set.chunkStart < 1 && previous.chunkEnd - previous.endSec < 1
        && set.startSec >= previous.endSec - .5) {
        previous.endSec = set.endSec; previous.reps = previous.reps === null || set.reps === null ? null : previous.reps + set.reps;
        if (previous.weightKg !== set.weightKg) previous.weightKg = null;
        previous.confidence = Math.min(previous.confidence, set.confidence);
        previous.chunkEnd = set.chunkEnd;
      } else merged.push({ ...set });
    }
    return merged;
  }
  const api = { catalog, motionFor, volume, historyVolume, estimateOneRepMax, exerciseBest, recordStats, validSet, latest, recentExercises, parametersAtWeight, prescription, replace, stats, bounds, shift, dateKey, mergeObservations };
  root.FitnessCore = api;
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
