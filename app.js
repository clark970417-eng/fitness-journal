function attachStaticExercise(host, exercise, large=false) { const canvas=window.FitnessDemos?.attach(host,exercise,large); if(canvas)canvas.dataset.static="1"; }
const STORE_KEY = 'fitness.journal.v3';
const STORE_KEY_V4 = 'fitness.journal.v4';
const STORE_KEY_V5 = 'fitness.journal.v5';
const STORE_KEY_V6 = 'fitness.journal.v6';
const STORE_KEY_V7 = 'fitness.journal.v7';
const STORE_KEY_V8 = 'fitness.journal.v8';
let exercises = [
  { name: '槓鈴深蹲', group: '腿', equipment: '槓鈴', previous: '80 kg × 5 · RPE 8', weight: 80, reps: 5, setCount: 4 },
  { name: '羅馬尼亞硬舉', group: '腿', equipment: '槓鈴', previous: '60 kg × 8 · RPE 7', weight: 60, reps: 8, setCount: 3 },
  { name: '保加利亞分腿蹲', group: '腿', equipment: '啞鈴', previous: '14 kg × 10 · RPE 8', weight: 14, reps: 10, setCount: 3 },
  { name: '槓鈴臥推', group: '胸', equipment: '槓鈴', previous: '62.5 kg × 6 · RPE 8', weight: 62.5, reps: 6, setCount: 4 },
  { name: '上斜啞鈴臥推', group: '胸', equipment: '啞鈴', previous: '22 kg × 10 · RPE 8', weight: 22, reps: 10, setCount: 4 },
  { name: '滑輪下拉', group: '背', equipment: '滑輪', previous: '50 kg × 10 · RPE 7', weight: 50, reps: 10, setCount: 4 },
  { name: '坐姿划船', group: '背', equipment: '滑輪', previous: '45 kg × 10 · RPE 8', weight: 45, reps: 10, setCount: 4 },
];
exercises = window.FitnessCore.catalog(exercises);
const defaultRoutines = [
  { id: 'lower', name: '下肢力量', minutes: 48, exerciseNames: ['槓鈴深蹲', '羅馬尼亞硬舉', '保加利亞分腿蹲'], current: true },
  { id: 'push', name: '上肢推', minutes: 52, exerciseNames: ['槓鈴臥推', '上斜啞鈴臥推'] },
  { id: 'back', name: '背部與二頭', minutes: 55, exerciseNames: ['滑輪下拉', '坐姿划船'] },
];
const sampleHistory = [
  { id: 'sample-push', date: '2026-09-22T10:20:00.000Z', name: '上肢推', duration: 52, feeling: '剛剛好', note: '', volume: 6240, prs: 2, exercises: [
    { name: '槓鈴臥推', group: '胸', sets: [{ weight: 62.5, reps: 6, rpe: 8, done: true }], bestE1rm: 75, isPr: true },
    { name: '上斜啞鈴臥推', group: '胸', sets: [{ weight: 22, reps: 10, rpe: 8, done: true }], bestE1rm: 29.3, isPr: true },
  ] },
  { id: 'sample-lower', date: '2026-09-19T10:20:00.000Z', name: '下肢力量', duration: 47, feeling: '剛剛好', note: '', volume: 7920, prs: 0, exercises: [
    { name: '槓鈴深蹲', group: '腿', sets: [{ weight: 80, reps: 5, rpe: 8, done: true }], bestE1rm: 93.3, isPr: false },
    { name: '羅馬尼亞硬舉', group: '腿', sets: [{ weight: 60, reps: 8, rpe: 7, done: true }], bestE1rm: 76, isPr: false },
  ] },
  { id: 'sample-back', date: '2026-09-17T10:20:00.000Z', name: '背部與二頭', duration: 55, feeling: '有點累', note: '', volume: 5680, prs: 0, exercises: [
    { name: '滑輪下拉', group: '背', sets: [{ weight: 50, reps: 10, rpe: 8, done: true }], bestE1rm: 66.7, isPr: false },
  ] },
];

function makeWorkout() {
  return exercises.slice(0, 3).map((exercise, index) => ({
    ...exercise,
    sets: Array.from({ length: 4 }, (_, setIndex) => ({
      weight: exercise.weight,
      reps: 8,
      done: false,
      type: setIndex === 0 ? '熱身' : '正式',
      rpe: 8,
    })),
  }));
}

const saved = (() => {
  try { return JSON.parse(localStorage.getItem(STORE_KEY_V8) || localStorage.getItem(STORE_KEY_V7) || localStorage.getItem(STORE_KEY_V6) || localStorage.getItem(STORE_KEY_V5) || localStorage.getItem(STORE_KEY_V4) || localStorage.getItem(STORE_KEY) || 'null'); } catch { return null; }
})();
const state = {
  exerciseUsage: saved?.exerciseUsage || {},
  defaultRule: saved?.defaultRule || 0,
  workout: saved?.workout || makeWorkout(),
  workoutName: saved?.workoutName || '下肢力量',
  activeExercise: saved?.activeExercise || 0,
  startedAt: saved?.startedAt || null,
  restSeconds: 90,
  timerRunning: true,
  numberTarget: null,
  replaceMode: false,
  routines: saved?.routines || JSON.parse(JSON.stringify(defaultRoutines)),
  editingRoutineId: null,
  setOptionsTarget: null,
  history: Array.isArray(saved?.history) ? saved.history.filter(entry => !String(entry.id).startsWith('sample-')) : [],
  historyQuery: '',
  historyFilter: 'all',
  schedule: saved?.schedule || ['lower', null, 'push', null, 'back', null, null],
  bodyMetrics: saved?.bodyMetrics || [],
  profile: saved?.profile || { onboarded: false, goal: '力量', frequency: 3, unit: 'kg', trainingReminders: false, restReminders: true },
  selectedHistoryId: null,
  checkin: saved?.checkin || { sleep: 4, soreness: 2, energy: 4, pain: false, updatedAt: null },
  coachApplied: saved?.coachApplied || null,
  statsPeriod: 'week',
  statsAnchor: new Date(),
};
if (Array.isArray(saved?.exercises)) exercises = window.FitnessCore.catalog(saved.exercises);

const views = [...document.querySelectorAll('.view')];
const tabs = [...document.querySelectorAll('.tabbar button')];
const toast = document.getElementById('toast');
const exerciseDialog = document.getElementById('exercise-dialog');
const numberDialog = document.getElementById('number-dialog');
let timerId;
let exerciseFilter = '全部';
let equipmentFilter = '全部';
let libraryAddsToWorkout = false;

function snapshot() {
  return { version: 8, workout: state.workout, workoutName: state.workoutName, activeExercise: state.activeExercise, startedAt: state.startedAt, defaultRule: state.defaultRule, exerciseUsage: state.exerciseUsage, routines: state.routines, exercises, history: state.history, schedule: state.schedule, bodyMetrics: state.bodyMetrics, profile: state.profile, checkin: state.checkin, coachApplied: state.coachApplied };
}

function saveDraft() {
  window.renderFitnessDashboard?.();
  const value = snapshot();
  localStorage.setItem(STORE_KEY_V8, JSON.stringify(value));
  localStorage.setItem(STORE_KEY_V7, JSON.stringify(value));
  localStorage.setItem(STORE_KEY_V6, JSON.stringify(value));
  localStorage.setItem(STORE_KEY_V5, JSON.stringify(value));
  localStorage.setItem(STORE_KEY_V4, JSON.stringify(value));
  localStorage.setItem(STORE_KEY, JSON.stringify({ ...value, version: 3 }));
  window.FitnessStore?.saveState(value).catch(() => {});
}

function displayWeight(value) {
  const converted = state.profile.unit === 'lb' ? Number(value) * 2.20462 : Number(value);
  return Math.round(converted * 10) / 10;
}

function storedWeight(value) {
  const converted = state.profile.unit === 'lb' ? Number(value) / 2.20462 : Number(value);
  return Math.round(converted * 100) / 100;
}

function weightUnit() {
  return state.profile.unit === 'lb' ? 'lb' : 'kg';
}

function weightAriaUnit() {
  return state.profile.unit === 'lb' ? '磅' : '公斤';
}

function readinessScore(checkin = state.checkin) {
  const score = Number(checkin.sleep) * 8 + Number(checkin.energy) * 8 + (6 - Number(checkin.soreness)) * 6 - (checkin.pain ? 35 : 0);
  return Math.max(10, Math.min(100, Math.round(score)));
}

function detectPlateau() {
  const series = new Map();
  [...state.history].sort((a, b) => a.date.localeCompare(b.date)).forEach(entry => (entry.exercises || []).forEach(exercise => {
    if (!series.has(exercise.name)) series.set(exercise.name, []);
    series.get(exercise.name).push(Number(exercise.bestE1rm || 0));
  }));
  return [...series.entries()].flatMap(([name, values]) => {
    const recent = values.slice(-3);
    if (recent.length < 3 || !recent[0]) return [];
    return (Math.max(...recent) - Math.min(...recent)) / recent[0] < .01 ? [name] : [];
  });
}

function coachRecommendation() {
  const score = readinessScore();
  const plateaus = detectPlateau();
  if (state.checkin.pain) return { mode: 'recovery', title: '今天改為恢復訓練', reason: '你回報了疼痛，建議移除高負荷動作並降低總量。', score, plateaus };
  if (score < 55) return { mode: 'deload', title: '今天進行減量訓練', reason: '睡眠、精神與痠痛綜合偏低，重量降低 15%，每個動作少一組。', score, plateaus };
  if (plateaus.length) return { mode: 'variation', title: '調整刺激，突破停滯', reason: `${plateaus[0]}連續三次進步低於 1%，今天降低 5% 並增加次數。`, score, plateaus };
  if (score >= 85) return { mode: 'progress', title: '今天可以小幅推進', reason: '恢復狀態良好，主要動作正式組可增加 2.5 kg。', score, plateaus };
  return { mode: 'maintain', title: '今天維持原計畫', reason: '恢復狀態正常，近期完成度穩定。', score, plateaus };
}

function estimateOneRepMax(weight, reps) {
  return window.FitnessCore.estimateOneRepMax(weight, reps);
}

function completedVolume(workout) {
  return window.FitnessCore.volume(workout);
}

function historyBest(name) {
  return Math.max(0, ...state.history.flatMap(entry => entry.exercises || [])
    .filter(exercise => exercise.name === name)
    .map(exercise => window.FitnessCore.exerciseBest(exercise)));
}

function buildHistoryEntry() {
  const exercisesWithResults = state.workout.map(exercise => {
    const completed = exercise.sets.filter(set => set.done && window.FitnessCore.validSet(set));
    const bestE1rm = Math.max(0, ...completed.map(set => estimateOneRepMax(set.weight, set.reps)));
    return { name: exercise.name, group: exercise.group, equipment: exercise.equipment, sets: completed, bestE1rm, isPr: historyBest(exercise.name) > 0 && bestE1rm > historyBest(exercise.name) };
  }).filter(exercise => exercise.sets.length);
  return {
    id: `workout-${Date.now()}`,
    date: new Date().toISOString(),
    name: state.workoutName,
    duration: Math.max(1, Math.round((Date.now() - (state.startedAt || Date.now() - 48 * 60000)) / 60000)),
    feeling: document.querySelector('.feeling-options .selected')?.textContent || '剛剛好',
    note: document.querySelector('#summary-dialog textarea').value.trim(),
    volume: completedVolume(state.workout),
    prs: exercisesWithResults.filter(exercise => exercise.isPr).length,
    exercises: exercisesWithResults,
  };
}

function showView(name) {
  views.forEach(view => view.classList.toggle('is-active', view.dataset.view === name));
  tabs.forEach(tab => tab.classList.toggle('is-active', tab.dataset.target === name));
  document.querySelector('.tabbar').hidden = name === 'workout';
  const hint = document.getElementById('swipe-page-hint');
  hint.hidden = true;
  hint.textContent = name === 'history' ? '紀錄 · 向右滑回今天' : '今天 · 向左滑看紀錄';
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function completedSets() {
  return state.workout.flatMap(exercise => exercise.sets).filter(set => set.done).length;
}

function totalSets() {
  return state.workout.reduce((total, exercise) => total + exercise.sets.length, 0);
}

function updateProgress() {
  const completed = completedSets();
  const progress = document.querySelector('.rhythm-rail');
  const count = totalSets();
  if (progress.children.length !== count) {
    progress.replaceChildren(...Array.from({ length: count }, () => document.createElement('span')));
  }
  [...progress.children].forEach((step, index) => step.classList.toggle('done', index < completed));
  progress.setAttribute('aria-label', `訓練進度 ${completed} / ${count} 組`);
}

function renderExerciseSwitcher() {
  const switcher = document.getElementById('exercise-switcher');
  switcher.replaceChildren(...state.workout.map((exercise, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    attachStaticExercise(button, exercise);
    const copy = document.createElement('span');
    const name = document.createElement('strong'); name.textContent = exercise.displayName || exercise.name;
    const detail = document.createElement('small'); detail.textContent = `${exercise.sets.filter(set => set.done).length}/${exercise.sets.length} 組 · ${exercise.equipment}`;
    const dots = document.createElement('span'); dots.className = 'set-dots';
    exercise.sets.forEach(set => { const dot = document.createElement('i'); if (set.done) dot.className = 'done'; dots.append(dot); });
    copy.append(name, detail, dots);
    const volume = document.createElement('b'); volume.textContent = `${formatNumber(displayWeight(completedVolume([exercise])))} ${weightUnit()}`;
    button.append(copy, volume);
    button.classList.toggle('is-active', index === state.activeExercise);
    button.classList.toggle('is-done', exercise.sets.every(set => set.done));
    button.addEventListener('click', () => {
      state.activeExercise = index;
      renderWorkout();
      saveDraft();
    });
    return button;
  }));
}

function createSetRow(set, setIndex) {
  const row = document.createElement('div');
  row.className = `set-row${set.done ? ' is-complete' : ''}`;
  row.setAttribute('role', 'row');
  const index = document.createElement('button');
  index.type = 'button';
  index.className = 'set-index-button';
  index.innerHTML = `<span>${setIndex + 1}</span><small>${set.type || '正式'}</small>`;
  index.setAttribute('aria-label', `第 ${setIndex + 1} 組`);
  index.tabIndex = -1;
  const makeInput = (field) => {
    const input = document.createElement('input');
    input.type = 'number'; input.className = 'set-inline-input';
    input.inputMode = field === 'weight' ? 'decimal' : 'numeric';
    input.min = field === 'weight' ? '0' : '1';
    input.max = field === 'weight' ? (state.profile.unit === 'lb' ? '3300' : '1500') : '999';
    input.step = field === 'weight' ? 'any' : '1'; input.required = true;
    input.value = String(field === 'weight' ? displayWeight(set.weight) : set.reps);
    input.setAttribute('aria-label', `第 ${setIndex + 1} 組${field === 'weight' ? `重量（${weightUnit()}）` : '次數'}`);
    input.addEventListener('focus', () => input.select());
    input.addEventListener('input', () => {
      if (!input.validity.valid || input.value === '') return;
      set[field] = field === 'weight' ? storedWeight(Number(input.value)) : Number(input.value);
      saveDraft(); renderTodayPlan();
      document.getElementById('workout-volume-total').textContent = `${formatNumber(displayWeight(completedVolume(state.workout)))} ${weightUnit()}`;
    });
    input.addEventListener('blur', () => { if (!input.validity.valid || input.value === '') input.value = String(field === 'weight' ? displayWeight(set.weight) : set.reps); });
    return input;
  };
  const weight = makeInput('weight');
  const reps = makeInput('reps');
  const check = document.createElement('button');
  check.type = 'button';
  check.className = `check-button${set.done ? ' is-checked' : ''}`;
  check.setAttribute('aria-label', set.done ? `取消完成第 ${setIndex + 1} 組` : `完成第 ${setIndex + 1} 組`);
  check.textContent = set.done ? '✓' : '完成';
  check.setAttribute('aria-pressed', String(set.done));
  check.addEventListener('click', () => toggleSet(setIndex));
  row.append(index, weight, reps, check);
  return row;
}

function renderWorkout() {
  renderTodayPlan();
  const exercise = state.workout[state.activeExercise];
  if (!exercise) return;
  document.querySelector('.workout-topbar h1').textContent = state.workoutName;
  document.getElementById('workout-set-total').textContent = `${completedSets()} / ${totalSets()} 組`;
  document.getElementById('workout-volume-total').textContent = `${formatNumber(displayWeight(completedVolume(state.workout)))} ${weightUnit()}`;
  const demoHost = document.getElementById('active-exercise-demo');
  demoHost.replaceChildren(); attachStaticExercise(demoHost, exercise, true);
  document.getElementById('active-muscle').textContent = exercise.group;
  document.getElementById('exercise-position').textContent = `動作 ${state.activeExercise + 1} / ${state.workout.length}`;
  document.getElementById('active-exercise-name').textContent = exercise.displayName || exercise.name;
  const previous = window.FitnessCore.latest(exercise, state.history);
  document.getElementById('last-performance').textContent = previous
    ? `上次：${displayWeight(previous.sets.at(-1).weight)} ${weightUnit()} × ${previous.sets.at(-1).reps}` : '尚無歷史紀錄 · 本次設定會留給下一次';
  const table = document.getElementById('set-table');
  const head = document.createElement('div');
  head.className = 'set-row set-head';
  head.setAttribute('role', 'row');
  head.innerHTML = `<span>組</span><span>重量 ${weightUnit()}</span><span>次數</span><span>完成</span>`;
  table.replaceChildren(head, ...exercise.sets.map(createSetRow));
  table.setAttribute('aria-label', `${exercise.name}組數`);
  document.getElementById('next-exercise').textContent = state.activeExercise === state.workout.length - 1 ? '回到第一個動作' : '下一個動作';
  renderExerciseSwitcher();
  updateProgress();
}

function renderTodayPlan() {
  document.getElementById('today-plan-title').textContent = state.workoutName;
  document.getElementById('today-plan-detail').textContent = `${state.workout.length} 個動作 · ${totalSets()} 組`;
  document.getElementById('today-exercises').replaceChildren(...state.workout.map((exercise, index) => {
    const row = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'today-exercise';
    button.setAttribute('aria-label', `編輯${exercise.name}`);
    attachStaticExercise(button, exercise);
    const copy = document.createElement('div');
    const name = document.createElement('strong'); name.textContent = exercise.displayName || exercise.name;
    const detail = document.createElement('small');
    const first = exercise.sets[0];
    detail.textContent = `${exercise.equipment} · ${exercise.sets.map(set => set.durationMin ? `${set.durationMin} 分鐘` : `${displayWeight(set.weight)} ${weightUnit()} × ${set.reps}`).join('，')}`;
    copy.append(name, detail);
    const weight = document.createElement('b'); weight.textContent = first ? `${displayWeight(first.weight)} ${weightUnit()}` : '—';
    button.append(copy, weight);
    button.addEventListener('click', () => openTodayExerciseEditor(index));
    row.append(button); return row;
  }));
}

function toggleSet(setIndex) {
  const set = state.workout[state.activeExercise].sets[setIndex];
  set.done = !set.done;
  if (set.done) {
    state.restSeconds = 90;
    state.timerRunning = true;
    document.getElementById('timer-toggle').textContent = '暫停';
    showToast(`第 ${setIndex + 1} 組完成`);
  }
  updateTimer();
  renderWorkout();
  saveDraft();
}

function openSetOptions(setIndex) {
  const set = state.workout[state.activeExercise].sets[setIndex];
  state.setOptionsTarget = { setIndex, type: set.type || '正式', rpe: set.rpe || 8 };
  document.getElementById('set-options-title').textContent = `第 ${setIndex + 1} 組`;
  document.querySelectorAll('.type-options button').forEach(button => button.classList.toggle('selected', button.dataset.type === state.setOptionsTarget.type));
  document.getElementById('rpe-input').value = String(state.setOptionsTarget.rpe);
  document.getElementById('rpe-output').textContent = String(state.setOptionsTarget.rpe);
  document.getElementById('set-options-dialog').showModal();
}

function openNumberEditor(setIndex, field) {
  const set = state.workout[state.activeExercise].sets[setIndex];
  const shownValue = field === 'weight' ? displayWeight(set[field]) : set[field];
  state.numberTarget = { setIndex, field, value: shownValue };
  document.getElementById('number-dialog-title').textContent = field === 'weight' ? `重量（${weightUnit()}）` : '次數';
  document.getElementById('number-output').textContent = String(shownValue);
  const direct = document.getElementById('number-direct'); direct.value = String(shownValue);
  direct.step = field === 'reps' ? '1' : 'any'; direct.min = field === 'reps' ? '1' : '0';
  direct.max = field === 'reps' ? '999' : state.profile.unit === 'lb' ? '3300' : '1500';
  const step = state.profile.unit === 'lb' ? 5 : 2.5;
  const values = field === 'weight' ? [shownValue - step * 2, shownValue - step, shownValue + step, shownValue + step * 2] : [5, 8, 10, 12];
  document.getElementById('quick-values').replaceChildren(...values.filter(value => value >= 0).map(value => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = String(value);
    button.addEventListener('click', () => setNumberValue(value));
    return button;
  }));
  numberDialog.showModal();
}

function setNumberValue(value) {
  state.numberTarget.value = Math.max(0, value);
  document.getElementById('number-output').textContent = String(state.numberTarget.value);
  document.getElementById('number-direct').value = String(state.numberTarget.value);
}

function renderExerciseResults() {
  const query = document.getElementById('exercise-search').value.trim().toLowerCase();
  const active = state.workout[state.activeExercise];
  const results = window.FitnessCore.recentExercises(exercises,state.history,state.exerciseUsage).filter(exercise => (exerciseFilter === '全部' || exercise.group === exerciseFilter)
    && (!document.getElementById('zhubei-filter').checked || exercise.venue)
    && (equipmentFilter === '全部' || exercise.equipment === equipmentFilter)
    && `${exercise.name}${exercise.group}${exercise.equipment}${exercise.aliases || ""}`.toLowerCase().includes(query));
  if (state.replaceMode) results.sort((a, b) => Number(b.group === active.group && b.name !== active.name) - Number(a.group === active.group && a.name !== active.name));
  document.getElementById('exercise-result-count').textContent = `${results.length} 個動作`;
  const container = document.getElementById('exercise-results');
  if (!results.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-results';
    empty.textContent = '找不到符合的動作，換個名稱或肌群試試。';
    container.replaceChildren(empty);
    return;
  }
  container.replaceChildren(...results.map(exercise => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'exercise-result';
    window.FitnessDemos?.attach(button, exercise);
    const name = document.createElement('strong'); name.textContent = exercise.displayName || exercise.name;
    const detail = document.createElement('small'); detail.textContent = exercise.equipment;
    const priorEntry = [...state.history].sort((a,b)=>new Date(b.date)-new Date(a.date)).find(entry=>entry.exercises?.some(item=>item.name===exercise.name&&item.sets?.some(set=>set.done!==false&&window.FitnessCore.validSet(set))));
    const last = document.createElement('small'); last.textContent = priorEntry ? new Date(priorEntry.date).toLocaleDateString('zh-TW',{month:'numeric',day:'numeric'})+' 紀錄' : '尚無紀錄';
    const tags=document.createElement('span');tags.className='library-tags';tags.append(detail,last);
    button.append(name, tags);
    if (state.replaceMode && exercise.group === active.group && exercise.name !== active.name) {
      button.classList.add('is-recommended');
      const recommendation = document.createElement('em'); recommendation.textContent = '相同肌群替代'; button.append(recommendation);
    }
    button.addEventListener('click', () => chooseExercise(exercise));
    return button;
  }));
}

function openExerciseLibrary(replaceMode = false, addToWorkout = false) {
  state.replaceMode = replaceMode;
  libraryAddsToWorkout = addToWorkout;
  document.getElementById('exercise-dialog-title').textContent = replaceMode ? '替換動作' : '動作庫';
  document.getElementById('exercise-search').value = '';
  exerciseFilter = replaceMode ? state.workout[state.activeExercise].group : '全部';
  equipmentFilter = '全部';
  document.querySelectorAll('[data-filter]').forEach(button => button.classList.toggle('selected', button.dataset.filter === exerciseFilter));
  document.querySelectorAll('[data-equipment]').forEach(button => button.classList.toggle('selected', button.dataset.equipment === '全部'));
  renderExerciseResults();
  exerciseDialog.showModal();
}

function chooseExercise(exercise) {
  if (exercise.timed) { openExercisePreview(exercise); return; }
  state.exerciseUsage[exercise.name]=Date.now();saveDraft();
  if (state.replaceMode) {
    const replacement = window.FitnessCore.replace(state.workout, state.activeExercise, exercise, state.history);
    state.workout = replacement.workout; state.activeExercise = replacement.activeExercise;
    renderWorkout();
    saveDraft();
    showToast(`已替換為${exercise.name}`);
  } else if (libraryAddsToWorkout) {
    state.workout.push(window.FitnessCore.prescription(exercise, state.history));
    state.activeExercise = state.workout.length - 1;
    renderWorkout(); saveDraft(); showToast(`已加入${exercise.name}`);
  } else {
    openExercisePreview(exercise); return;
  }
  exerciseDialog.close();
}

function openExercisePreview(exercise, workoutIndex) {
  document.getElementById('exercise-preview-title').textContent = exercise.displayName || exercise.name;
  const host = document.getElementById('exercise-preview-demo'); host.replaceChildren();
  const canvas = window.FitnessDemos?.attach(host, exercise, true);
  const toggle = document.getElementById('exercise-demo-toggle');
  toggle.hidden = !canvas || canvas.tagName !== 'CANVAS';
  toggle.textContent = '暫停示範'; toggle.setAttribute('aria-pressed', 'false');
  if (canvas) canvas.dataset.animate = '1';
  toggle.onclick = () => {
    const stopped = canvas.dataset.paused !== '1';
    canvas.dataset.paused = stopped ? '1' : '0';
    toggle.textContent = stopped ? '播放示範' : '暫停示範';
    toggle.setAttribute('aria-pressed', String(stopped));
  };
  const label = document.getElementById('exercise-preview-muscle'); label.replaceChildren();
  const mark = document.createElement('i'); label.append(mark, `${exercise.group} · ${exercise.equipment}`);
  const previous = window.FitnessCore.latest(exercise, state.history)?.sets.at(-1);
  document.getElementById('exercise-preview-history').textContent = previous?.durationMin ? `上次 ${previous.durationMin} 分鐘` : previous ? `上次 ${displayWeight(previous.weight)} ${weightUnit()} × ${previous.reps}` : '尚無訓練紀錄';
  const action = document.getElementById('exercise-preview-add');
  const durationField = document.getElementById('exercise-duration-field');
  durationField.hidden = !exercise.timed;
  document.getElementById('exercise-duration').value = previous?.durationMin || 10;
  document.getElementById('exercise-duration-error').textContent = '';
  action.textContent = exercise.timed ? '儲存完成時間' : Number.isInteger(workoutIndex) ? '開始這個動作' : '加入本次訓練';
  action.onclick = async () => {
    if (exercise.timed) {
      const duration = Number(document.getElementById('exercise-duration').value);
      if (!Number.isFinite(duration) || duration <= 0 || duration > 1440) { document.getElementById('exercise-duration-error').textContent = '請輸入 0 至 1440 分鐘之間的有效時間'; return; }
      const entry = {id: 'timed-' + crypto.randomUUID(), date: new Date().toISOString(), name: exercise.displayName || exercise.name, duration, volume: 0, prs: 0, exercises: [{ name: exercise.name, group: exercise.group, equipment: exercise.equipment, bestE1rm: 0, sets: [{ durationMin: duration, weight: 0, reps: 0, done: true }] }]};
      action.disabled = true;
      try {
        await window.FitnessStore?.addHistory(entry); state.history.unshift(entry); saveDraft(); renderHistory(); renderTrends();
        document.getElementById('exercise-preview-dialog').close(); showToast('完成時間已保存');
      } catch { document.getElementById('exercise-duration-error').textContent = '儲存失敗，請重試'; }
      finally { action.disabled = false; }
      return;
    }
    if (Number.isInteger(workoutIndex)) state.activeExercise = workoutIndex;
    else { libraryAddsToWorkout = true; chooseExercise(exercise); }
    document.getElementById('exercise-preview-dialog').close(); openWorkout();
  };
  if (exerciseDialog.open) exerciseDialog.close();
  document.getElementById('exercise-preview-dialog').showModal();
}

function renderRoutines() {
  document.getElementById('routine-count').textContent = `${state.routines.length} 份`;
  const container = document.getElementById('routine-items');
  container.replaceChildren(...state.routines.map(routine => {
    const row = document.createElement('div');
    row.className = `routine-item${routine.current ? ' is-current' : ''}`;
    const summary = document.createElement('span');
    summary.innerHTML = `<strong>${routine.name}</strong><small>${routine.exerciseNames.length} 個動作 · 約 ${routine.minutes} 分鐘</small>`;
    const actions = document.createElement('span');
    actions.className = 'routine-item-actions';
    if (routine.current) {
      const current = document.createElement('span');
      current.className = 'routine-current';
      current.textContent = '今天';
      actions.append(current);
    }
    const start = document.createElement('button');
    start.type = 'button';
    start.textContent = '開始';
    start.setAttribute('aria-label', `開始${routine.name}`);
    start.addEventListener('click', () => startRoutine(routine));
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.textContent = '編輯';
    edit.setAttribute('aria-label', `編輯${routine.name}`);
    edit.addEventListener('click', () => openRoutineEditor(routine.id));
    const duplicate = document.createElement('button');
    duplicate.type = 'button';
    duplicate.textContent = '複製';
    duplicate.setAttribute('aria-label', `複製${routine.name}`);
    duplicate.addEventListener('click', () => duplicateRoutine(routine.id));
    actions.append(start, edit, duplicate);
    row.append(summary, actions);
    return row;
  }));
}

function renderWeeklyPlan() {
  const labels = ['一', '二', '三', '四', '五', '六', '日'];
  const container = document.getElementById('weekly-plan-days');
  container.replaceChildren(...labels.map((label, index) => {
    const routine = state.routines.find(item => item.id === state.schedule[index]);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = routine ? 'is-training' : '';
    button.setAttribute('aria-label', `星期${label}，${routine?.name || '休息'}，點選切換`);
    button.innerHTML = `<small>${label}</small><strong>${routine ? routine.name.slice(0, 2) : '休'}</strong>`;
    button.addEventListener('click', () => {
      const options = [null, ...state.routines.map(item => item.id)];
      state.schedule[index] = options[(options.indexOf(state.schedule[index]) + 1) % options.length];
      renderWeeklyPlan();
      saveDraft();
    });
    return button;
  }));
  document.getElementById('weekly-plan-count').textContent = `${state.schedule.filter(Boolean).length} 天`;
}

function recommendedIncrease(exerciseName) {
  const latest = [...state.history].sort((a, b) => b.date.localeCompare(a.date)).flatMap(entry => entry.exercises || []).find(exercise => exercise.name === exerciseName);
  if (!latest?.sets?.length) return 0;
  const averageRpe = latest.sets.reduce((sum, set) => sum + Number(set.rpe || 8), 0) / latest.sets.length;
  return averageRpe <= 8 ? 2.5 : averageRpe >= 9.5 ? -2.5 : 0;
}

function applyPrescription() {
  if (state.coachApplied?.startsWith(new Date().toDateString())) {
    showToast('今天的重量調整已套用');
    return;
  }
  const exercise = state.workout.find(item => item.name === '槓鈴深蹲') || state.workout[0];
  const change = recommendedIncrease(exercise.name);
  exercise.sets.forEach(set => { if (set.type !== '熱身') set.weight = Math.max(0, set.weight + change); });
  exercise.weight = Math.max(0, exercise.weight + change);
  renderWorkout();
  state.coachApplied = `${new Date().toDateString()}-prescription`;
  saveDraft();
  showToast(change ? `已為${exercise.name}${change > 0 ? '增加' : '減少'} ${Math.abs(change)} kg` : '今天維持上次重量');
}

function renderCoach() {
  if (!document.getElementById('coach-brief-title')) return;
  const recommendation = coachRecommendation();
  document.getElementById('coach-brief-title').textContent = recommendation.title;
  document.getElementById('coach-reason').textContent = recommendation.reason;
  document.getElementById('readiness-score').textContent = String(recommendation.score);
  document.getElementById('coach-signals').replaceChildren(...[
    `睡眠 ${state.checkin.sleep}/5`,
    `痠痛 ${state.checkin.soreness}/5`,
    recommendation.plateaus.length ? `${recommendation.plateaus.length} 個停滯` : '趨勢穩定',
  ].map(value => {
    const signal = document.createElement('span');
    signal.textContent = value;
    return signal;
  }));
  const action = document.getElementById('coach-apply');
  action.textContent = recommendation.mode === 'maintain' ? '確認今日計畫' : '套用教練調整';
  action.dataset.mode = recommendation.mode;
  const alreadyApplied = state.coachApplied?.startsWith(new Date().toDateString());
  action.disabled = alreadyApplied;
  if (alreadyApplied) action.textContent = '今日調整已套用';
  document.getElementById('apply-prescription').disabled = alreadyApplied;
  document.getElementById('checkin-preview-score').textContent = String(recommendation.score);
  document.getElementById('checkin-preview-label').textContent = recommendation.title;
  if (!state.checkin.updatedAt) {
    document.getElementById('coach-brief-title').textContent = '先留下今天的狀態';
    document.getElementById('coach-reason').textContent = '今日尚未回報，課表維持你設定的重量與次數。';
    document.getElementById('readiness-score').textContent = '—';
    document.getElementById('coach-signals').replaceChildren();
    action.disabled = true; document.getElementById('apply-prescription').disabled = true;
  }
}

function applyCoachPlan() {
  const recommendation = coachRecommendation();
  if (state.coachApplied === `${new Date().toDateString()}-${recommendation.mode}`) {
    showToast('今天的教練調整已套用');
    return;
  }
  state.workout.forEach((exercise, exerciseIndex) => {
    if (recommendation.mode === 'deload') {
      exercise.sets.forEach(set => { set.weight = Math.round(set.weight * .85 * 2) / 2; });
      if (exercise.sets.length > 2) exercise.sets.pop();
    } else if (recommendation.mode === 'recovery') {
      exercise.sets.forEach(set => { set.weight = Math.round(set.weight * .65 * 2) / 2; set.rpe = 6; });
      exercise.sets = exercise.sets.slice(0, 2);
    } else if (recommendation.mode === 'variation' && recommendation.plateaus.includes(exercise.name)) {
      exercise.sets.forEach(set => { set.weight = Math.round(set.weight * .95 * 2) / 2; set.reps += 2; });
    } else if (recommendation.mode === 'progress' && exerciseIndex === 0) {
      exercise.sets.forEach(set => { if (set.type !== '熱身') set.weight += 2.5; });
    }
  });
  state.coachApplied = `${new Date().toDateString()}-${recommendation.mode}`;
  renderWorkout();
  saveDraft();
  renderCoach();
  showToast(recommendation.mode === 'maintain' ? '今日計畫已確認' : '教練調整已套用');
}

function startRoutine(routine) {
  const selected = routine.exerciseNames.map(name => exercises.find(exercise => exercise.name === name)).filter(Boolean);
  if (!selected.length) {
    showToast('這份課表還沒有可用動作');
    return;
  }
  state.routines.forEach(item => { item.current = item.id === routine.id; });
  state.workoutName = routine.name;
  state.workout = selected.map(exercise => window.FitnessCore.prescription(exercise, state.history));
  state.activeExercise = 0;
  state.startedAt = Date.now();
  renderRoutines();
  openWorkout(`${routine.name}已開始`);
}

function renderRoutineExerciseOptions(selected = []) {
  const container = document.getElementById('routine-exercises');
  container.replaceChildren(...exercises.filter(exercise => !exercise.timed).map(exercise => {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = exercise.name;
    input.checked = selected.includes(exercise.name);
    const name = document.createElement('span');
    name.textContent = exercise.displayName || exercise.name;
    const group = document.createElement('small');
    group.textContent = exercise.group;
    label.append(input, name, group);
    return label;
  }));
}

function openRoutineEditor(id = null) {
  const routine = state.routines.find(item => item.id === id);
  state.editingRoutineId = routine?.id || null;
  document.getElementById('routine-dialog-title').textContent = routine ? '編輯課表' : '建立課表';
  document.getElementById('routine-name').value = routine?.name || '';
  document.getElementById('routine-minutes').value = String(routine?.minutes || 45);
  document.getElementById('routine-error').textContent = '';
  document.getElementById('routine-delete').hidden = !routine;
  renderRoutineExerciseOptions(routine?.exerciseNames || []);
  document.getElementById('routine-dialog').showModal();
}

function duplicateRoutine(id) {
  const routine = state.routines.find(item => item.id === id);
  state.routines.push({ ...routine, id: `routine-${Date.now()}`, name: `${routine.name}副本`, current: false });
  renderRoutines();
  saveDraft();
  showToast('課表已複製');
}

function formatNumber(value) {
  return new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 0 }).format(value);
}

function openHistoryEntry(entry) {
  state.selectedHistoryId = entry.id;
  document.getElementById('history-delete').dataset.confirmed = 'false';
  document.getElementById('history-delete').textContent = '刪除此筆訓練';
  const date = new Date(entry.date);
  document.querySelector('#history-dialog .eyebrow').textContent = `${date.getMonth() + 1} 月 ${date.getDate()} 日 · 已完成`;
  document.getElementById('history-dialog-title').textContent = entry.name;
  const stats = document.querySelectorAll('#history-dialog .summary-stats strong');
  stats[0].textContent = String(entry.duration);
  stats[1].textContent = String((entry.exercises || []).reduce((sum, exercise) => sum + exercise.sets.length, 0));
  stats[2].textContent = String(entry.prs || 0);
  const details = document.querySelector('.history-detail-list');
  details.replaceChildren(...(entry.exercises || []).map(exercise => {
    const row = document.createElement('div');
    const best = exercise.sets.reduce((current, set) => !current || estimateOneRepMax(set.weight, set.reps) > estimateOneRepMax(current.weight, current.reps) ? set : current, null);
    const copy = document.createElement('span');
    copy.innerHTML = `<strong>${exercise.name}</strong><small>${exercise.sets.some(set => set.durationMin) ? exercise.sets.reduce((sum,set)=>sum+(set.durationMin||0),0) + ' 分鐘' : exercise.sets.length + ' 組'} · ${best?.durationMin ? '時間紀錄' : best ? `最佳 ${displayWeight(best.weight)} ${weightUnit()} × ${best.reps}` : '未完成組數'}</small>`;
    row.append(copy);
    if (exercise.isPr) {
      const mark = document.createElement('b');
      mark.textContent = 'PR';
      row.append(mark);
    }
    return row;
  }));
  if (entry.videoId) {
    const replay = document.createElement('button'); replay.type = 'button'; replay.className = 'secondary-button';
    replay.textContent = '查看原訓練影片';
    replay.addEventListener('click', () => window.FitnessJournal.open(entry.videoId));
    details.append(replay);
  }
  document.getElementById('history-dialog').showModal();
}

function historyMatches(entry) {
  const searchable = `${entry.name} ${(entry.exercises || []).map(exercise => exercise.name).join(' ')}`.toLowerCase();
  if (state.historyQuery && !searchable.includes(state.historyQuery.toLowerCase())) return false;
  if (state.historyFilter === 'pr') return entry.prs > 0;
  const groups = (entry.exercises || []).map(exercise => exercise.group);
  if (state.historyFilter === 'lower') return groups.includes('腿');
  if (state.historyFilter === 'upper') return groups.some(group => ['胸', '背', '肩', '手臂'].includes(group));
  return true;
}

function renderCalendar() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  const leading = (new Date(year, month, 1).getDay() + 6) % 7;
  const entriesByDay = new Map();
  state.history.forEach(entry => {
    const date = new Date(entry.date);
    if (date.getFullYear() === year && date.getMonth() === month) entriesByDay.set(date.getDate(), entry);
  });
  document.getElementById('calendar-title').textContent = `${year} 年 ${month + 1} 月`;
  document.querySelector('#view-history .topbar .eyebrow').textContent = `${year} 年 ${month + 1} 月`;
  document.getElementById('calendar-summary').textContent = `${entriesByDay.size} 天`;
  const cells = Array.from({ length: leading }, () => {
    const blank = document.createElement('span');
    blank.className = 'calendar-day is-empty';
    return blank;
  });
  for (let day = 1; day <= days; day += 1) {
    const entry = entriesByDay.get(day);
    const cell = document.createElement(entry ? 'button' : 'span');
    if (entry) cell.type = 'button';
    cell.className = `calendar-day${entry ? ' has-workout' : ''}${day === now.getDate() ? ' is-today' : ''}`;
    cell.textContent = String(day);
    if (entry) {
      cell.setAttribute('aria-label', `${month + 1} 月 ${day} 日，${entry.name}`);
      cell.style.setProperty('--calendar-intensity', String(Math.min(1, Math.max(.35, window.FitnessCore.historyVolume(entry) / 8000))));
      cell.addEventListener('click', () => openHistoryEntry(entry));
    }
    cells.push(cell);
  }
  document.getElementById('training-calendar').replaceChildren(...cells);
}

function renderHistory() {
  state.history = window.FitnessCore.recordStats(state.history);
  const sorted = [...state.history].sort((a, b) => b.date.localeCompare(a.date)).filter(historyMatches);
  const now = new Date();
  document.getElementById('history-count').textContent = `共 ${sorted.length} 次`;
  const container = document.getElementById('history-items');
  container.replaceChildren(...sorted.map(entry => {
    const date = new Date(entry.date);
    const sets = (entry.exercises || []).reduce((sum, exercise) => sum + exercise.sets.length, 0);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'history-item';
    button.dataset.historyId = entry.id;
    button.innerHTML = `<span class="history-date"><b>${date.getDate()}</b><small>${date.getMonth() + 1} 月</small></span><span><strong>${entry.name}</strong><small>${entry.duration} 分鐘 · ${sets} 組 · ${formatNumber(displayWeight(window.FitnessCore.historyVolume(entry)))} ${weightUnit()}</small></span>`;
    if (entry.prs) {
      const mark = document.createElement('span');
      mark.className = 'record-mark';
      mark.textContent = `${entry.prs} PR`;
      button.append(mark);
    } else {
      const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      arrow.innerHTML = '<use href="./module-icons.svg#RightOutlined" />';
      button.append(arrow);
    }
    button.addEventListener('click', () => openHistoryEntry(entry));
    return button;
  }));
  if (!sorted.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-results';
    empty.textContent = '找不到符合條件的訓練紀錄。';
    container.append(empty);
  }
  renderCalendar();
}

function renderExerciseProgress() {
  state.history = window.FitnessCore.recordStats(state.history);
  const select = document.getElementById('progress-exercise');
  const names = [...new Set(state.history.flatMap(entry => (entry.exercises || []).map(exercise => exercise.name)))];
  const previousSelection = select.value;
  select.replaceChildren(...names.map(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    return option;
  }));
  if (names.includes(previousSelection)) select.value = previousSelection;
  const name = select.value || names[0];
  const points = [...state.history].sort((a, b) => a.date.localeCompare(b.date)).flatMap(entry => {
    const exercise = (entry.exercises || []).find(item => item.name === name);
    return exercise && window.FitnessCore.exerciseBest(exercise) > 0 ? [{ value: window.FitnessCore.exerciseBest(exercise), date: entry.date }] : [];
  });
  const chart = document.getElementById('progress-chart');
  const labels = document.getElementById('progress-labels');
  chart.replaceChildren();
  labels.replaceChildren();
  if (!points.length) {
    document.getElementById('progress-value').textContent = '—';
    document.getElementById('progress-delta').textContent = '尚無資料';
    return;
  }
  const values = points.map(point => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 5);
  const coordinates = points.map((point, index) => ({
    x: points.length === 1 ? 160 : 18 + index * (284 / (points.length - 1)),
    y: 104 - ((point.value - min) / range) * 78,
    ...point,
  }));
  const ns = 'http://www.w3.org/2000/svg';
  const baseline = document.createElementNS(ns, 'line');
  baseline.setAttribute('x1', '12'); baseline.setAttribute('x2', '308'); baseline.setAttribute('y1', '105'); baseline.setAttribute('y2', '105'); baseline.setAttribute('class', 'progress-baseline');
  const line = document.createElementNS(ns, 'polyline');
  line.setAttribute('points', coordinates.map(point => `${point.x},${point.y}`).join(' '));
  line.setAttribute('class', 'progress-line');
  chart.append(baseline, line);
  coordinates.forEach(point => {
    const dot = document.createElementNS(ns, 'circle');
    dot.setAttribute('cx', String(point.x)); dot.setAttribute('cy', String(point.y)); dot.setAttribute('r', '5'); dot.setAttribute('class', 'progress-dot');
    chart.append(dot);
    const label = document.createElement('span');
    const date = new Date(point.date);
    label.textContent = `${date.getMonth() + 1}/${date.getDate()}`;
    labels.append(label);
  });
  const delta = values.at(-1) - values[0];
  document.getElementById('progress-value').textContent = String(displayWeight(max));
  document.getElementById('progress-delta').textContent = points.length > 1 ? `${delta >= 0 ? '+' : ''}${displayWeight(delta).toFixed(1)} ${weightUnit()}` : '第一筆紀錄';
}

function renderBodyProgress() {
  const metrics = [...state.bodyMetrics].sort((a, b) => a.date.localeCompare(b.date));
  const latest = metrics.at(-1);
  const oldest = metrics[0];
  document.getElementById('current-weight').textContent = latest ? displayWeight(latest.weight).toFixed(1) : '—';
  document.getElementById('current-bodyfat').textContent = Number.isFinite(latest?.bodyFat) ? latest.bodyFat.toFixed(1) : '—';
  document.getElementById('weight-change').textContent = latest && oldest ? `${latest.weight - oldest.weight > 0 ? '+' : ''}${displayWeight(latest.weight - oldest.weight).toFixed(1)}` : '—';
  document.getElementById('body-history').replaceChildren(...metrics.slice(-4).map(metric => {
    const row = document.createElement('div');
    const date = new Date(metric.date);
    row.innerHTML = `<span>${date.getMonth() + 1}/${date.getDate()}</span><strong>${displayWeight(metric.weight).toFixed(1)} ${weightUnit()}</strong><small>${Number.isFinite(metric.bodyFat) ? `${metric.bodyFat.toFixed(1)}%` : '未記錄體脂'}</small><button type="button" aria-label="刪除 ${date.getMonth() + 1} 月 ${date.getDate()} 日身體數據" data-delete-metric="${metric.id}">刪除</button>`;
    return row;
  }));
}

function renderGoalProgress() {
  const now = new Date();
  const day = (now.getDay() + 6) % 7;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
  const completed = window.FitnessCore.stats(state.history, 'week', now).count;
  const target = Math.max(1, Number(state.profile.frequency) || 3);
  const percent = Math.min(100, Math.round(completed / target * 100));
  document.getElementById('goal-progress-title').textContent = `每週訓練 ${target} 次`;
  document.getElementById('goal-percent').textContent = `${percent}%`;
  document.getElementById('goal-fill').style.width = `${percent}%`;
  document.getElementById('goal-copy').textContent = completed >= target ? '本週目標已完成，接下來把恢復放在第一位。' : `已完成 ${completed} 次，還差 ${target - completed} 次。`;
}

function renderTrends() {
  const history = [...state.history].sort((a, b) => a.date.localeCompare(b.date));
  const current = window.FitnessCore.stats(history, state.statsPeriod, state.statsAnchor);
  const previousStats = window.FitnessCore.stats(history, state.statsPeriod, window.FitnessCore.shift(state.statsPeriod, state.statsAnchor, -1));
  document.getElementById('trend-period-label').textContent = state.statsPeriod === 'year' ? `${current.start.getFullYear()} 年` : state.statsPeriod === 'month'
    ? `${current.start.getFullYear()} 年 ${current.start.getMonth() + 1} 月`
    : `${current.start.getMonth() + 1}/${current.start.getDate()} — ${new Date(current.end - 1).getMonth() + 1}/${new Date(current.end - 1).getDate()}`;
  document.getElementById('trend-count').textContent = String(current.count);
  document.getElementById('trend-count-detail').textContent = `次訓練 · ${current.sets} 組 · ${current.reps} 次`;
  document.getElementById('trend-volume').textContent = `${formatNumber(displayWeight(current.volume))} ${weightUnit()}`;
  document.getElementById('trend-message').textContent = current.count ? '每一組，都留下了進步' : '這個期間還沒有紀錄';
  const max = Math.max(...current.buckets.map(bucket => bucket.value), 1);
  const chart = document.getElementById('volume-chart'); chart.classList.toggle('month-chart', state.statsPeriod === 'month');
  chart.style.setProperty('--buckets', current.buckets.length);
  chart.setAttribute('aria-label', `${current.count} 次訓練，容量 ${current.volume} 公斤`);
  chart.replaceChildren(...current.buckets.map(({ value, label: bucketLabel }) => {
    const column = document.createElement('div');
    if (value) column.className = 'current';
    const bar = document.createElement('i');
    bar.style.height = `${Math.max(value ? 12 : 3, value / max * 100)}%`;
    bar.title = `${bucketLabel}：${formatNumber(displayWeight(value))} ${weightUnit()}`;
    const label = document.createElement('span');
    label.textContent = bucketLabel;
    column.append(bar, label);
    return column;
  }));
  const change = previousStats.volume ? Math.round((current.volume - previousStats.volume) / previousStats.volume * 100) : null;
  document.getElementById('trend-change').textContent = change === null ? '尚無前期比較' : `較前期 ${change >= 0 ? '+' : ''}${change}%`;
  document.getElementById('distribution-total').textContent = `${current.sets} 組`;
  document.getElementById('muscle-distribution').replaceChildren(...Object.entries(current.muscles).map(([muscle, count]) => {
    const row = document.createElement('span'); const percent = Math.round(count / Math.max(1, current.sets) * 100);
    row.style.setProperty('--size', `${percent}%`); row.textContent = `${muscle} ${count} 組 · ${percent}%`; return row;
  }));
  if (!current.sets) document.getElementById('muscle-distribution').textContent = '完成訓練後顯示肌群分布';

  const latestSquat = [...history].reverse().flatMap(entry => entry.exercises || []).find(exercise => exercise.name === '槓鈴深蹲');
  const averageRpe = latestSquat?.sets.length ? latestSquat.sets.reduce((sum, set) => sum + Number(set.rpe || 8), 0) / latestSquat.sets.length : 8;
  const guidance = averageRpe <= 8 ? '上次深蹲完成度穩定，今天可以嘗試增加 2.5 kg。' : averageRpe >= 9.5 ? '上次深蹲接近極限，今天先維持重量，把動作品質做好。' : '今天延續上次重量，完成後再看 RPE 決定下一次進度。';
  if (document.getElementById('today-guidance')) document.getElementById('today-guidance').textContent = latestSquat ? guidance : '先記錄一場訓練，下次就能沿用自己的重量與次數。';
  document.getElementById('trend-guidance').textContent = guidance;
  renderExerciseProgress();
  renderBodyProgress();
  renderGoalProgress();
}

function historyToCsv() {
  const rows = [['date', 'workout', 'exercise', 'set', 'weight', 'reps', 'rpe', 'type', 'durationMin']];
  state.history.forEach(entry => (entry.exercises || []).forEach(exercise => exercise.sets.forEach((set, index) => {
    rows.push([entry.date.slice(0, 10), entry.name, exercise.name, index + 1, set.weight, set.reps, set.rpe || '', set.type || '正式', set.durationMin || '']);
  })));
  return rows.map(row => row.map(value => String(value).replaceAll(',', ' ')).join(',')).join('\n');
}

function renderProfile() {
  document.getElementById('settings-goal').value = state.profile.goal;
  document.getElementById('settings-frequency').value = String(state.profile.frequency);
  document.getElementById('training-reminders').checked = Boolean(state.profile.trainingReminders);
  document.getElementById('rest-reminders').checked = Boolean(state.profile.restReminders);
  document.querySelectorAll('[data-settings-unit]').forEach(button => button.classList.toggle('selected', button.dataset.settingsUnit === state.profile.unit));
  document.getElementById('body-weight-label').textContent = `體重（${weightUnit()}）`;
  document.querySelectorAll('.body-metric-grid small').forEach((small, index) => { if (index !== 1) small.textContent = weightUnit(); });
}

function parseCsv(text) {
  const rows = text.trim().split(/\r?\n/).filter(Boolean).map(row => row.split(',').map(cell => cell.trim()));
  const expected = ['date', 'workout', 'exercise', 'set', 'weight', 'reps', 'rpe', 'type'];
  if (!rows.length || expected.some((name, index) => rows[0][index]?.toLowerCase() !== name)) throw new Error('CSV 欄位需為 date, workout, exercise, set, weight, reps, rpe, type');
  const grouped = new Map();
  rows.slice(1).forEach((cells, index) => {
    const [date, workout, exerciseName, setNumber, weight, reps, rpe, type, durationMin] = cells;
    if (!date || !workout || !exerciseName || !Number.isFinite(Number(weight)) || !Number.isFinite(Number(reps))) throw new Error(`CSV 第 ${index + 2} 列資料不完整`);
    const key = `${date}|${workout}`;
    if (!grouped.has(key)) grouped.set(key, { id: `csv-${date}-${workout}-${index}`, date: new Date(date).toISOString(), name: workout, duration: 0, feeling: '', note: 'CSV 匯入', volume: 0, prs: 0, exercises: [] });
    const entry = grouped.get(key);
    let exercise = entry.exercises.find(item => item.name === exerciseName);
    if (!exercise) {
      exercise = { name: exerciseName, group: exercises.find(item => item.name === exerciseName)?.group || '其他', sets: [], bestE1rm: 0, isPr: false };
      entry.exercises.push(exercise);
    }
    const set = { set: Number(setNumber), weight: Number(weight), reps: Number(reps), rpe: Number(rpe) || 8, type: type || '正式', done: true };
    if (durationMin !== undefined && durationMin !== '') { set.durationMin=Number(durationMin); if (!window.FitnessCore.validSet(set)) throw new Error('CSV 時間資料不正確'); set.weight=0;set.reps=0;entry.duration+=set.durationMin; }
    exercise.sets.push(set);
    exercise.bestE1rm = Math.max(exercise.bestE1rm, estimateOneRepMax(set.weight, set.reps));
    entry.volume += set.weight * set.reps;
  });
  return [...grouped.values()];
}

function validateImport(value) {
  if (!value || ![3, 4, 5, 6, 7, 8].includes(value.version) || !Array.isArray(value.routines) || !Array.isArray(value.exercises) || !Array.isArray(value.workout)) {
    throw new Error('格式不符合昔漣健身 Tracker V3–V8');
  }
  return value;
}

function updateTimer() {
  const minutes = Math.floor(state.restSeconds / 60);
  const seconds = state.restSeconds % 60;
  document.getElementById('rest-time').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const elapsed = state.startedAt ? Math.max(0, Math.floor((Date.now() - state.startedAt) / 1000)) : 0;
  document.getElementById('workout-elapsed').textContent = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
}

function startTimer() {
  clearInterval(timerId);
  timerId = setInterval(() => {
    if (state.timerRunning && state.restSeconds > 0) state.restSeconds -= 1;
    updateTimer();
  }, 1000);
}

function openWorkout(message) {
  state.startedAt ||= Date.now();
  state.timerRunning = true;
  renderWorkout();
  updateTimer();
  startTimer();
  showView('workout');
  saveDraft();
  if (message) showToast(message);
}

document.querySelectorAll('[data-target]').forEach(control => control.addEventListener('click', () => showView(control.dataset.target)));
document.getElementById('history-search-toggle').addEventListener('click', () => {
  const panel = document.getElementById('history-search-panel');
  panel.hidden = !panel.hidden;
  if (!panel.hidden) document.getElementById('history-search').focus();
});
document.getElementById('history-search').addEventListener('input', event => {
  state.historyQuery = event.currentTarget.value.trim();
  renderHistory();
});
document.querySelectorAll('[data-history-filter]').forEach(button => button.addEventListener('click', () => {
  state.historyFilter = button.dataset.historyFilter;
  document.querySelectorAll('[data-history-filter]').forEach(option => option.classList.toggle('selected', option === button));
  renderHistory();
}));
document.getElementById('progress-exercise').addEventListener('change', renderExerciseProgress);
document.getElementById('start-workout').addEventListener('click', () => {
 if (!completedSets()) { showToast('點擊動作編輯，勾選已完成的組，再上傳'); return; }
 document.getElementById('finish-workout').click();
});
document.getElementById('apply-prescription')?.addEventListener('click', applyPrescription);
document.getElementById('coach-apply')?.addEventListener('click', applyCoachPlan);
document.getElementById('checkin-open')?.addEventListener('click', () => {
  document.getElementById('sleep-input').value = String(state.checkin.sleep);
  document.getElementById('soreness-input').value = String(state.checkin.soreness);
  document.getElementById('energy-input').value = String(state.checkin.energy);
  document.querySelectorAll('[data-pain]').forEach(button => button.classList.toggle('selected', button.dataset.pain === String(state.checkin.pain)));
  ['sleep', 'soreness', 'energy'].forEach(name => { document.getElementById(`${name}-output`).textContent = `${state.checkin[name]} / 5`; });
  renderCoach();
  document.getElementById('checkin-dialog').showModal();
});
document.getElementById('settings-open').addEventListener('click', () => {
  renderProfile();
  document.getElementById('settings-error').textContent = '';
  document.getElementById('settings-dialog').showModal();
});
document.getElementById('free-workout').addEventListener('click', () => { state.workoutName = '自由訓練'; openWorkout('已開啟自由訓練'); });
document.getElementById('number-direct').addEventListener('input', event => {
  if (!state.numberTarget || !event.currentTarget.validity.valid) return;
  state.numberTarget.value = Number(event.currentTarget.value);
  document.getElementById('number-output').textContent = event.currentTarget.value;
});
document.getElementById('close-workout').addEventListener('click', () => { clearInterval(timerId); showView('today'); });
document.getElementById('theme-toggle').addEventListener('click', event => {
  const dark = document.body.classList.toggle('dark');
  event.currentTarget.setAttribute('aria-label', dark ? '切換淺色外觀' : '切換深色外觀');
  document.querySelector('meta[name="theme-color"]').content = dark ? '#151A1C' : '#F8FAF9';
});

document.getElementById('add-set').addEventListener('click', () => {
  const current = state.workout[state.activeExercise];
  const previous = current.sets.at(-1);
  current.sets.push({ weight: previous.weight, reps: previous.reps, done: false, type: '正式', rpe: previous.rpe || 8 });
  renderWorkout();
  saveDraft();
  showToast('已新增一組');
});
document.getElementById('next-exercise').addEventListener('click', () => {
  state.activeExercise = (state.activeExercise + 1) % state.workout.length;
  renderWorkout();
  saveDraft();
});
document.getElementById('replace-exercise').addEventListener('click', () => openExerciseLibrary(true));
document.getElementById('add-workout-exercise').addEventListener('click', () => openExerciseLibrary(false, true));
document.getElementById('demo-toggle').addEventListener('click', event => {
  const paused = event.currentTarget.getAttribute('aria-pressed') !== 'true';
  event.currentTarget.setAttribute('aria-pressed', String(paused)); event.currentTarget.textContent = paused ? '播放示範' : '暫停示範';
  window.FitnessDemos?.setPaused(paused);
});
document.querySelectorAll('[data-equipment]').forEach(button => button.addEventListener('click', () => {
  equipmentFilter = button.dataset.equipment;
  document.querySelectorAll('[data-equipment]').forEach(option => option.classList.toggle('selected', option === button));
  renderExerciseResults();
}));
document.querySelectorAll('[data-period]').forEach(button => button.addEventListener('click', () => {
  state.statsPeriod = button.dataset.period;
  document.querySelectorAll('[data-period]').forEach(option => option.setAttribute('aria-pressed', String(option === button)));
  renderTrends();
}));
for (const [id, direction] of [['stats-prev', -1], ['stats-next', 1]]) document.getElementById(id).addEventListener('click', () => {
  state.statsAnchor = window.FitnessCore.shift(state.statsPeriod, state.statsAnchor, direction); renderTrends();
});
document.getElementById('browse-exercises').addEventListener('click', () => openExerciseLibrary(false));
document.querySelectorAll('[data-browse-exercises]').forEach(button => button.addEventListener('click', () => openExerciseLibrary(false)));
document.getElementById('new-routine').addEventListener('click', () => openRoutineEditor());
document.getElementById('exercise-search').addEventListener('input', renderExerciseResults);
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  exerciseFilter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(option => option.classList.toggle('selected', option === button));
  renderExerciseResults();
}));

document.getElementById('routine-save').addEventListener('click', () => {
  const name = document.getElementById('routine-name').value.trim();
  const minutes = Number(document.getElementById('routine-minutes').value);
  const exerciseNames = [...document.querySelectorAll('#routine-exercises input:checked')].map(input => input.value);
  const error = document.getElementById('routine-error');
  if (!name || !exerciseNames.length || !Number.isFinite(minutes)) {
    error.textContent = '請填寫名稱，並至少選擇一個動作。';
    return;
  }
  if (state.editingRoutineId) {
    const routine = state.routines.find(item => item.id === state.editingRoutineId);
    Object.assign(routine, { name, minutes, exerciseNames });
  } else state.routines.push({ id: `routine-${Date.now()}`, name, minutes, exerciseNames, current: false });
  document.getElementById('routine-dialog').close();
  renderRoutines();
  saveDraft();
  showToast('課表已保存');
});
document.getElementById('routine-delete').addEventListener('click', () => {
  const routine = state.routines.find(item => item.id === state.editingRoutineId);
  if (routine?.current) {
    document.getElementById('routine-error').textContent = '今日使用中的課表不能刪除。';
    return;
  }
  state.routines = state.routines.filter(item => item.id !== state.editingRoutineId);
  document.getElementById('routine-dialog').close();
  renderRoutines();
  saveDraft();
  showToast('課表已刪除');
});

document.getElementById('custom-exercise').addEventListener('click', () => {
  exerciseDialog.close();
  document.getElementById('custom-exercise-name').value = '';
  document.getElementById('custom-exercise-error').textContent = '';
  document.getElementById('custom-exercise-dialog').showModal();
});
document.getElementById('custom-exercise-save').addEventListener('click', () => {
  const name = document.getElementById('custom-exercise-name').value.trim();
  const group = document.getElementById('custom-exercise-group').value;
  const error = document.getElementById('custom-exercise-error');
  if (!name || exercises.some(exercise => exercise.name === name)) {
    error.textContent = name ? '動作庫中已有相同名稱。' : '請輸入動作名稱。';
    return;
  }
  exercises.push({ name, group, equipment: '自訂', previous: '尚無紀錄', weight: 0, reps: 10, setCount: 3, custom: true });
  document.getElementById('custom-exercise-dialog').close();
  renderRoutineExerciseOptions();
  saveDraft();
  showToast(`${name}已加入動作庫`);
});

document.getElementById('export-data').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(snapshot(), null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'cyrene-fitness-v8.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 0);
  showToast('資料已匯出');
});
document.getElementById('export-csv').addEventListener('click', () => {
  const blob = new Blob([historyToCsv()], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'cyrene-fitness-history.csv';
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 0);
  showToast('CSV 已匯出');
});
document.getElementById('import-data').addEventListener('click', () => {
  document.getElementById('import-content').value = '';
  document.getElementById('import-error').textContent = '';
  document.getElementById('import-dialog').showModal();
});
document.getElementById('import-save').addEventListener('click', () => {
  try {
    const content = document.getElementById('import-content').value.trim();
    if (!content.startsWith('{')) {
      const importedHistory = parseCsv(content);
      state.history = [...importedHistory, ...state.history];
      window.FitnessStore?.replaceHistory(state.history).catch(() => {});
      saveDraft();
      renderHistory();
      renderTrends();
      document.getElementById('import-dialog').close();
      showToast(`已匯入 ${importedHistory.length} 次訓練`);
      return;
    }
    const value = validateImport(JSON.parse(content));
    state.workout = value.workout;
    state.routines = value.routines;
    state.activeExercise = Math.min(value.activeExercise || 0, state.workout.length - 1);
    state.startedAt = value.startedAt || null;
    exercises = value.exercises;
    if (Array.isArray(value.history)) state.history = value.history;
    if (Array.isArray(value.schedule)) state.schedule = value.schedule;
    if (Array.isArray(value.bodyMetrics)) state.bodyMetrics = value.bodyMetrics;
    if (value.profile) state.profile = { ...state.profile, ...value.profile };
    if (value.checkin) state.checkin = { ...state.checkin, ...value.checkin };
    state.coachApplied = value.coachApplied || null;
    state.exerciseUsage = value.exerciseUsage || {};
    state.defaultRule = value.defaultRule || 0;
    state.workout = state.workout.map(exercise => exercise.defaultRule === 4081 ? exercise : window.FitnessCore.prescription(exercise, state.history)); state.defaultRule = 4081;
    saveDraft();
    renderWorkout();
    renderRoutines();
    renderWeeklyPlan();
    renderHistory();
    renderTrends();
    document.getElementById('import-dialog').close();
    showToast('資料已匯入');
  } catch (cause) {
    document.getElementById('import-error').textContent = cause.message || 'JSON 無法解析。';
  }
});

document.getElementById('number-minus').addEventListener('click', () => setNumberValue(state.numberTarget.value - (state.numberTarget.field === 'weight' ? (state.profile.unit === 'lb' ? 5 : 2.5) : 1)));
document.getElementById('number-plus').addEventListener('click', () => setNumberValue(state.numberTarget.value + (state.numberTarget.field === 'weight' ? (state.profile.unit === 'lb' ? 5 : 2.5) : 1)));
document.getElementById('number-save').addEventListener('click', () => {
  const input = document.getElementById('number-direct');
  if (!input.reportValidity()) return;
  const { setIndex, field, value } = state.numberTarget;
  state.workout[state.activeExercise].sets[setIndex][field] = field === 'weight' ? storedWeight(value) : value;
  numberDialog.close();
  renderWorkout();
  saveDraft();
  showToast(field === 'weight' ? `重量已改為 ${value} ${weightUnit()}` : `次數已改為 ${value}`);
});

document.querySelectorAll('.type-options button').forEach(button => button.addEventListener('click', () => {
  state.setOptionsTarget.type = button.dataset.type;
  document.querySelectorAll('.type-options button').forEach(option => option.classList.toggle('selected', option === button));
}));
document.getElementById('rpe-input').addEventListener('input', event => {
  state.setOptionsTarget.rpe = Number(event.currentTarget.value);
  document.getElementById('rpe-output').textContent = event.currentTarget.value;
});
document.getElementById('set-options-save').addEventListener('click', () => {
  const set = state.workout[state.activeExercise].sets[state.setOptionsTarget.setIndex];
  set.type = state.setOptionsTarget.type;
  set.rpe = state.setOptionsTarget.rpe;
  document.getElementById('set-options-dialog').close();
  renderWorkout();
  saveDraft();
  showToast(`已設為${set.type} · RPE ${set.rpe}`);
});

document.querySelectorAll('[data-time]').forEach(button => button.addEventListener('click', () => {
  state.restSeconds = Math.max(0, state.restSeconds + Number(button.dataset.time));
  updateTimer();
}));
document.getElementById('timer-toggle').addEventListener('click', event => {
  state.timerRunning = !state.timerRunning;
  event.currentTarget.textContent = state.timerRunning ? '暫停' : '繼續';
});

const summaryDialog = document.getElementById('summary-dialog');
document.getElementById('finish-workout').addEventListener('click', () => {
  const preview = buildHistoryEntry();
  if (!completedSets()) { showToast('請先完成至少一組訓練'); return; }
  summaryDialog.querySelector('h2').textContent = preview.name;
  summaryDialog.querySelector('.summary-stats div:first-child strong').textContent = String(preview.duration);
  summaryDialog.querySelector('.summary-stats div:nth-child(2) strong').textContent = String(completedSets());
  summaryDialog.querySelector('.summary-stats div:nth-child(3) strong').textContent = String(preview.prs);
  summaryDialog.showModal();
});
document.querySelectorAll('.feeling-options button').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.feeling-options button').forEach(option => option.classList.toggle('selected', option === button));
}));
document.getElementById('save-summary').addEventListener('click', async () => {
  clearInterval(timerId);
  const entry = buildHistoryEntry();
  state.history.unshift(entry);
  state.startedAt = null;
  state.workout = state.workout.map(exercise => window.FitnessCore.prescription(exercise, state.history));
  state.activeExercise = 0;
  await window.FitnessStore?.addHistory(entry).catch(() => {});
  saveDraft();
  renderWorkout();
  renderHistory();
  renderTrends();
  summaryDialog.close();
  showView('history');
  showToast('訓練已保存');
});

document.getElementById('add-body-metric').addEventListener('click', () => {
  document.getElementById('body-weight-label').textContent = `體重（${weightUnit()}）`;
  document.getElementById('body-weight').value = '';
  document.getElementById('body-fat').value = '';
  document.getElementById('body-waist').value = '';
  document.getElementById('body-metric-error').textContent = '';
  document.getElementById('body-metric-dialog').showModal();
});
document.getElementById('body-metric-save').addEventListener('click', () => {
  const enteredWeight = Number(document.getElementById('body-weight').value);
  const weight = storedWeight(enteredWeight);
  const bodyFat = Number(document.getElementById('body-fat').value);
  const waist = Number(document.getElementById('body-waist').value);
  if (!Number.isFinite(weight) || weight < 20 || weight > 300) {
    document.getElementById('body-metric-error').textContent = `請輸入有效的${weightUnit()}體重。`;
    return;
  }
  state.bodyMetrics.push({ id: `metric-${Date.now()}`, date: new Date().toISOString(), weight, bodyFat: bodyFat || null, waist: waist || null });
  saveDraft();
  renderBodyProgress();
  document.getElementById('body-metric-dialog').close();
  showToast('身體數據已保存');
});

document.getElementById('body-history').addEventListener('click', event => {
  const button = event.target.closest('[data-delete-metric]');
  if (!button) return;
  if (button.dataset.confirmed !== 'true') {
    button.dataset.confirmed = 'true';
    button.textContent = '確認';
    return;
  }
  state.bodyMetrics = state.bodyMetrics.filter(metric => metric.id !== button.dataset.deleteMetric);
  saveDraft();
  renderBodyProgress();
  showToast('身體數據已刪除');
});

document.getElementById('history-delete').addEventListener('click', event => {
  if (event.currentTarget.dataset.confirmed !== 'true') {
    event.currentTarget.dataset.confirmed = 'true';
    event.currentTarget.textContent = '再按一次確認刪除';
    return;
  }
  state.history = state.history.filter(entry => entry.id !== state.selectedHistoryId);
  event.currentTarget.dataset.confirmed = 'false';
  event.currentTarget.textContent = '刪除此筆訓練';
  window.FitnessStore?.replaceHistory(state.history).catch(() => {});
  saveDraft();
  renderHistory();
  renderTrends();
  document.getElementById('history-dialog').close();
  showToast('訓練紀錄已刪除');
});

document.querySelectorAll('[data-goal]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-goal]').forEach(option => option.classList.toggle('selected', option === button));
}));
document.querySelectorAll('[data-unit]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-unit]').forEach(option => option.classList.toggle('selected', option === button));
}));
document.getElementById('onboarding-frequency').addEventListener('input', event => {
  document.getElementById('onboarding-frequency-output').textContent = `${event.currentTarget.value} 天`;
});
document.getElementById('onboarding-save').addEventListener('click', () => {
  state.profile = {
    ...state.profile,
    onboarded: true,
    goal: document.querySelector('[data-goal].selected').dataset.goal,
    frequency: Number(document.getElementById('onboarding-frequency').value),
    unit: document.querySelector('[data-unit].selected').dataset.unit,
  };
  saveDraft();
  renderProfile();
  renderWorkout();
  renderHistory();
  renderTrends();
  document.getElementById('onboarding-dialog').close();
  showToast('設定已完成');
});

document.querySelectorAll('[data-settings-unit]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-settings-unit]').forEach(option => option.classList.toggle('selected', option === button));
}));
document.getElementById('settings-save').addEventListener('click', () => {
  const frequency = Number(document.getElementById('settings-frequency').value);
  if (!Number.isInteger(frequency) || frequency < 1 || frequency > 7) {
    document.getElementById('settings-error').textContent = '每週目標需介於 1–7 次。';
    return;
  }
  state.profile = {
    ...state.profile,
    goal: document.getElementById('settings-goal').value,
    frequency,
    unit: document.querySelector('[data-settings-unit].selected').dataset.settingsUnit,
    trainingReminders: document.getElementById('training-reminders').checked,
    restReminders: document.getElementById('rest-reminders').checked,
  };
  saveDraft();
  renderProfile();
  renderWorkout();
  renderHistory();
  renderTrends();
  document.getElementById('settings-dialog').close();
  showToast('設定已保存');
});

document.querySelectorAll('#checkin-dialog input[type="range"]').forEach(input => input.addEventListener('input', event => {
  const key = event.currentTarget.id.replace('-input', '');
  document.getElementById(`${key}-output`).textContent = `${event.currentTarget.value} / 5`;
  const preview = {
    sleep: Number(document.getElementById('sleep-input').value),
    soreness: Number(document.getElementById('soreness-input').value),
    energy: Number(document.getElementById('energy-input').value),
    pain: document.querySelector('[data-pain].selected').dataset.pain === 'true',
  };
  const score = readinessScore(preview);
  document.getElementById('checkin-preview-score').textContent = String(score);
  document.getElementById('checkin-preview-label').textContent = score < 55 ? '建議減量或恢復' : score >= 85 ? '適合小幅推進' : '適合正常訓練';
}));
document.querySelectorAll('[data-pain]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-pain]').forEach(option => option.classList.toggle('selected', option === button));
  document.getElementById('sleep-input').dispatchEvent(new Event('input'));
}));
document.getElementById('checkin-save').addEventListener('click', () => {
  state.checkin = {
    sleep: Number(document.getElementById('sleep-input').value),
    soreness: Number(document.getElementById('soreness-input').value),
    energy: Number(document.getElementById('energy-input').value),
    pain: document.querySelector('[data-pain].selected').dataset.pain === 'true',
    updatedAt: new Date().toISOString(),
  };
  state.coachApplied = null;
  saveDraft();
  renderCoach();
  document.getElementById('checkin-dialog').close();
  showToast('教練建議已更新');
});

async function initializePersistence() {
  if (!window.FitnessStore) return;
  try {
    const [storedState, storedHistory] = await Promise.all([window.FitnessStore.loadState(), window.FitnessStore.listHistory()]);
    if ([4, 5, 6, 7, 8].includes(storedState?.version)) {
      state.workout = storedState.workout || state.workout;
      state.workoutName = storedState.workoutName || state.workoutName;
      state.routines = storedState.routines || state.routines;
      state.activeExercise = Math.min(storedState.activeExercise || 0, state.workout.length - 1);
      state.startedAt = storedState.startedAt || null;
      exercises = window.FitnessCore.catalog(storedState.exercises || exercises);
      state.schedule = storedState.schedule || state.schedule;
      state.bodyMetrics = storedState.bodyMetrics || state.bodyMetrics;
      state.profile = storedState.profile ? { ...state.profile, ...storedState.profile } : state.profile;
      state.checkin = storedState.checkin ? { ...state.checkin, ...storedState.checkin } : state.checkin;
      state.coachApplied = storedState.coachApplied || state.coachApplied;
      state.exerciseUsage = {...(storedState.exerciseUsage || {}),...state.exerciseUsage};
    }
    if (storedHistory.length) state.history = storedHistory.filter(entry => !String(entry.id).startsWith('sample-'));
    else await window.FitnessStore.replaceHistory(state.history);
    state.defaultRule = storedState?.defaultRule || 0;
    state.workout = state.workout.map(exercise => exercise.defaultRule === 4081 ? exercise : window.FitnessCore.prescription(exercise, state.history)); state.defaultRule = 4081;
    saveDraft();
    renderWorkout();
    renderRoutines();
    renderWeeklyPlan();
    renderHistory();
    renderTrends();
    renderProfile();
    renderCoach();
    if (!state.profile.onboarded && !document.getElementById('onboarding-dialog').open) document.getElementById('onboarding-dialog').showModal();
  } catch {
    showToast('目前使用瀏覽器備援儲存');
  }
}

state.workout = state.workout.map(exercise => exercise.defaultRule === 4081 ? exercise : window.FitnessCore.prescription(exercise, state.history)); state.defaultRule = 4081;
renderWorkout();
renderRoutines();
renderWeeklyPlan();
renderHistory();
renderTrends();
renderProfile();
renderCoach();
updateTimer();
initializePersistence();
if (!state.profile.onboarded) document.getElementById('onboarding-dialog').showModal();

window.addEventListener('offline', () => showToast('目前離線，訓練仍會保存在此裝置'));
window.addEventListener('online', () => showToast('已恢復連線'));

document.getElementById('fitness-today-date').textContent = new Intl.DateTimeFormat(window.CyreneI18n?.getLocale()||'zh-TW', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date());
window.FitnessJournal.init({
  getCatalog: () => exercises, getHistory: () => state.history, notify: showToast,
  unit: weightUnit, fromKg: displayWeight, toKg: storedWeight,
  async saveEntry(entry) {
    await window.FitnessStore?.addHistory(entry);
    state.history.unshift(entry); saveDraft(); renderHistory(); renderTrends();
  },
});
window.FitnessV4 = { estimateOneRepMax, completedVolume, parseCsv, buildHistoryEntry, snapshot, historyMatches, recommendedIncrease, historyToCsv, readinessScore, detectPlateau, coachRecommendation, applyCoachPlan };

if (new URLSearchParams(location.search).get('settings') === '1') document.getElementById('settings-open')?.click();

async function refreshAssistantRoutines(){try{const stored=await window.FitnessStore.loadState();if(stored?.routines){state.routines=stored.routines;renderRoutines();renderWeeklyPlan();}}catch{showToast('健身計畫暫時無法更新');}}
window.addEventListener('storage',event=>{if(event.key==='fitness.journal.v8')void refreshAssistantRoutines();});
window.addEventListener('fitness-journal-updated',()=>void refreshAssistantRoutines());
if(window.BroadcastChannel){const assistantChannel=new BroadcastChannel('fitness-journal-updated');assistantChannel.onmessage=()=>void refreshAssistantRoutines();}


function openTodayExerciseEditor(index) {
 const exercise=state.workout[index],dialog=document.getElementById('today-exercise-editor');
 document.getElementById('today-edit-title').textContent=exercise.name;
 const equipment=document.getElementById('today-edit-equipment');equipment.replaceChildren();
 [...new Set(['槓鈴','啞鈴','滑輪','機械','徒手',exercise.equipment])].forEach(value=>{const option=document.createElement('option');option.value=value;option.textContent=value;equipment.append(option);});equipment.value=exercise.equipment;
 let draft=exercise.sets.map(s=>({...s}));const rows=document.getElementById('today-edit-sets'),count=document.getElementById('today-edit-count');count.value=draft.length;
 function renderSets(){rows.replaceChildren(...draft.map((set,i)=>{const row=document.createElement('div');row.className='today-edit-set';const label=document.createElement('span');label.textContent=i+1;
 const weight=document.createElement('input');weight.type='number';weight.min=0;weight.max=1500;weight.step=.5;weight.value=displayWeight(set.weight);weight.setAttribute('aria-label',`第${i+1}組重量`);weight.oninput=()=>{set.weight=storedWeight(Number(weight.value));};
 if(i===0)weight.onchange=()=>{if(!window.FitnessCore.validSet({weight:set.weight,reps:8}))return;
 const parameters=window.FitnessCore.parametersAtWeight(exercise,state.history,set.weight);
 draft=Array.from({length:parameters.count},()=>({weight:set.weight,reps:parameters.reps,done:true,type:'正式',rpe:8}));count.value=draft.length;renderSets();};
 const reps=document.createElement('input');reps.type='number';reps.min=1;reps.max=999;reps.step=1;reps.value=set.reps;reps.setAttribute('aria-label',`第${i+1}組次數`);reps.oninput=()=>{set.reps=Number(reps.value);};
 const done=document.createElement('input');done.type='checkbox';done.checked=!!set.done;done.setAttribute('aria-label',`第${i+1}組完成`);done.onchange=()=>{set.done=done.checked;};row.append(label,weight,reps,done);return row;}));}
 count.onchange=()=>{const n=Number(count.value);if(!Number.isInteger(n)||n<1||n>30){count.value=draft.length;return;}draft=Array.from({length:n},(_,i)=>draft[i]||{...draft.at(-1),done:true});renderSets();};renderSets();
 document.getElementById('today-edit-save').onclick=()=>{if(draft.some(set=>!window.FitnessCore.validSet(set))){showToast('請輸入有效重量與次數');return;}state.exerciseUsage[exercise.name]=Date.now();exercise.equipment=equipment.value;exercise.sets=draft;exercise.setCount=draft.length;saveDraft();renderWorkout();dialog.close();showToast('動作已更新');};
 document.getElementById('today-edit-delete').onclick=()=>{state.workout.splice(index,1);state.activeExercise=Math.max(0,Math.min(state.activeExercise,state.workout.length-1));saveDraft();renderTodayPlan();if(state.workout.length)renderWorkout();dialog.close();showToast('已從今日移除動作');};
 dialog.showModal();
}

window.addEventListener('cyrene:locale-change',()=>{document.getElementById('fitness-today-date').textContent=new Intl.DateTimeFormat(window.CyreneI18n.getLocale(),{month:'long',day:'numeric',weekday:'long'}).format(new Date());});

document.getElementById('zhubei-filter').addEventListener('change', renderExerciseResults);
