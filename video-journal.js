(function (root) {
  'use strict';
  const byId = id => document.getElementById(id);
  const MAX_FILE = 250 * 1024 * 1024;
  const SEGMENT = 30;
  let options;
  let current;
  let playbackUrl;
  let controller;
  let draftSets = [];
  let saving = false;
  let draftTimer;
  let draftWrite = Promise.resolve();
  function timestamp(value) { return `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`; }
  function status(message) { byId('training-analysis-status').textContent = message; }
  function persistDraft() {
    if (!current || current.historyId || controller) return;
    current.reviewDraft = draftSets.map(set => ({ ...set }));
    current.trainingDate = byId('video-training-date').value;
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => { void flushDraft().catch(() => status('草稿未能保存，請保留此頁並重試。')); }, 300);
  }
  async function flushDraft() {
    clearTimeout(draftTimer);
    if (!current || current.historyId) return draftWrite;
    const snapshot = { ...current, reviewDraft: draftSets.map(set => ({ ...set })), trainingDate: byId('video-training-date').value };
    draftWrite = draftWrite.catch(() => {}).then(() => root.FitnessStore.saveVideo(snapshot));
    await draftWrite;
  }
  function releaseVideo() {
    byId('training-video-player').pause();
    byId('training-video-player').removeAttribute('src');
    if (playbackUrl) URL.revokeObjectURL(playbackUrl);
    playbackUrl = null;
  }
  function waitEvent(target, name, signal) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => finish(new Error('影片讀取逾時，請改用 MP4 或 MOV')), 15000);
      const done = () => finish();
      const error = () => finish(new Error('此影片格式無法解碼，請改用 MP4 或 MOV'));
      const abort = () => finish(new DOMException('已取消', 'AbortError'));
      function finish(failure) {
        clearTimeout(timer); target.removeEventListener(name, done); target.removeEventListener('error', error);
        signal?.removeEventListener('abort', abort);
        failure ? reject(failure) : resolve();
      }
      target.addEventListener(name, done, { once: true }); target.addEventListener('error', error, { once: true });
      signal?.addEventListener('abort', abort, { once: true }); if (signal?.aborted) abort();
    });
  }
  async function readVideo(blob, signal) {
    const video = document.createElement('video'); video.muted = true; video.playsInline = true; video.preload = 'auto';
    const url = URL.createObjectURL(blob);
    const ready = waitEvent(video, 'loadeddata', signal); video.src = url;
    try { await ready; } catch (error) { URL.revokeObjectURL(url); throw error; }
    if (!Number.isFinite(video.duration) || video.duration < .5 || video.duration > 600) {
      URL.revokeObjectURL(url); throw new Error('請選擇 0.5 秒到 10 分鐘的訓練影片');
    }
    return { video, dispose() { video.pause(); video.removeAttribute('src'); video.load(); URL.revokeObjectURL(url); } };
  }
  async function frameAt(video, at, canvas, signal) {
    if (signal?.aborted) throw new DOMException('已取消', 'AbortError');
    if (Math.abs(video.currentTime - at) > .01) {
      const ready = waitEvent(video, 'seeked', signal); video.currentTime = at; await ready;
    }
    const scale = Math.min(1, 384 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale)); canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', .56);
  }
  async function listVideos() {
    const videos = await root.FitnessStore.listVideos();
    const host = byId('video-journal-list'); host.replaceChildren();
    for (const item of videos.slice(0, 6)) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'video-journal-item';
      const image = document.createElement('img'); image.src = item.thumbnail; image.alt = ''; image.loading = 'lazy';
      const copy = document.createElement('span'); const title = document.createElement('strong'); title.textContent = item.name;
      const detail = document.createElement('small'); detail.textContent = `${timestamp(item.duration)} · ${item.historyId ? '已保存訓練' : item.analyzedThrough >= item.duration ? '待確認紀錄' : '待辨識'}`;
      copy.append(title, detail); const arrow = document.createElement('span'); arrow.textContent = '›'; arrow.setAttribute('aria-hidden', 'true');
      button.append(image, copy, arrow); button.addEventListener('click', () => open(item.id)); host.append(button);
    }
  }
  async function open(id) {
    if (controller) { options.notify('請先停止目前的影片分析'); return; }
    await flushDraft();
    const entry = await root.FitnessStore.getVideo(id);
    if (!entry) { options.notify('原影片未保存在這個裝置'); return; }
    current = entry; draftSets = entry.reviewedSets || entry.reviewDraft || root.FitnessCore.mergeObservations(entry.observations || []);
    releaseVideo(); playbackUrl = URL.createObjectURL(entry.blob); byId('training-video-player').src = playbackUrl;
    byId('training-video-name').textContent = entry.name; byId('video-dialog-title').textContent = entry.historyId ? '訓練影片' : '辨識訓練';
    byId('training-video-duration').textContent = timestamp(entry.duration);
    byId('video-training-date').value = entry.trainingDate || root.FitnessCore.dateKey(new Date());
    byId('video-review-error').textContent = ''; byId('video-login-link').hidden = true;
    byId('training-analysis-progress').hidden = true; byId('cancel-training-analysis').hidden = true;
    byId('analyze-training-video').textContent = entry.analyzedThrough >= entry.duration ? '重新分析' : entry.analyzedThrough ? '繼續分析' : '開始辨識';
    byId('delete-training-video').textContent = '移除此裝置的影片'; delete byId('delete-training-video').dataset.confirm;
    byId('video-training-date').disabled = Boolean(entry.historyId);
    byId('analyze-training-video').disabled = Boolean(entry.historyId);
    byId('save-video-training').disabled = Boolean(entry.historyId);
    byId('add-video-set').disabled = Boolean(entry.historyId);
    status(entry.historyId ? '已保存訓練，可在紀錄與統計查看。' : draftSets.length ? '請確認辨識結果。未辨識的重量與次數需要補齊。' : '影片已保存，可以開始辨識或手動新增組別。');
    renderReview(); byId('video-dialog').showModal();
  }
  async function importVideo(file) {
    if (!file) return;
    if (controller) { options.notify('請先停止目前的分析'); return; }
    if (!file.size || file.size > MAX_FILE || (!file.type.startsWith('video/') && !/\.(mp4|mov|webm)$/i.test(file.name))) throw new Error('請選擇 250 MB 以下的訓練影片');
    const estimate = await navigator.storage?.estimate?.();
    if (estimate?.quota && estimate.quota - estimate.usage < file.size * 1.1) throw new Error('此裝置的空間不足，請移除舊影片後再匯入');
    const reader = await readVideo(file);
    try {
      const thumbnail = await frameAt(reader.video, Math.min(.2, reader.video.duration / 2), document.createElement('canvas'));
      const entry = { id: crypto.randomUUID(), name: file.name, blob: file, thumbnail, duration: reader.video.duration,
        createdAt: new Date().toISOString(), observations: [], analyzedThrough: 0, trainingDate: root.FitnessCore.dateKey(new Date()) };
      await root.FitnessStore.saveVideo(entry); await listVideos(); await open(entry.id);
    } finally { reader.dispose(); }
  }
  function updateVolume() {
    const valid = draftSets.filter(set => root.FitnessCore.validSet({ weight: set.weightKg, reps: set.reps }) && set.weightKg !== null);
    const volume = valid.reduce((sum, set) => sum + set.weightKg * set.reps, 0);
    byId('video-review-volume').textContent = `${options.fromKg(volume).toLocaleString()} ${options.unit()}`;
  }
  function renderReview() {
    const host = byId('video-review-sets'); host.replaceChildren();
    if (!draftSets.length) {
      const empty = document.createElement('p'); empty.className = 'video-privacy'; empty.textContent = '辨識結果會列在這裡，也可以手動新增。'; host.append(empty);
    }
    draftSets.forEach((set, index) => {
      const row = document.createElement('section'); row.className = 'video-set-row';
      const heading = document.createElement('div'); heading.className = 'video-set-heading';
      const select = document.createElement('select'); select.setAttribute('aria-label', `第 ${index + 1} 組動作`);
      const names = [...new Set([set.exercise, ...options.getCatalog().map(item => item.name)])];
      for (const name of names) { const option = document.createElement('option'); option.value = name; option.textContent = name; select.append(option); }
      select.value = set.exercise; select.disabled = Boolean(current.historyId || controller);
      select.addEventListener('change', () => { set.exercise = select.value; persistDraft(); renderReview(); });
      const seek = document.createElement('button'); seek.type = 'button'; seek.textContent = timestamp(set.startSec); seek.title = '查看這一組的影片';
      seek.addEventListener('click', () => { byId('training-video-player').currentTime = set.startSec; });
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '×'; remove.setAttribute('aria-label', `刪除第 ${index + 1} 組`); remove.disabled = Boolean(current.historyId || controller);
      remove.addEventListener('click', () => { draftSets.splice(index, 1); persistDraft(); renderReview(); });
      heading.append(select, seek, remove);
      const inputs = document.createElement('div'); inputs.className = 'video-set-inputs';
      for (const [field, label, step, max] of [['weightKg', `重量 ${options.unit()}`, '.1', 3300], ['reps', '次數', '1', 999]]) {
        const wrap = document.createElement('label'); wrap.textContent = label;
        const input = document.createElement('input'); input.type = 'number'; input.inputMode = field === 'reps' ? 'numeric' : 'decimal';
        input.min = field === 'reps' ? '1' : '0'; input.max = String(max); input.step = step; input.required = true;
        input.value = set[field] === null ? '' : String(field === 'weightKg' ? options.fromKg(set[field]) : set[field]);
        input.placeholder = '待確認'; input.disabled = Boolean(current.historyId || controller); input.setAttribute('aria-label', `第 ${index + 1} 組${label}`);
        input.addEventListener('input', () => { const value = input.value === '' ? null : Number(input.value); set[field] = value === null ? null : field === 'weightKg' ? options.toKg(value) : value; updateVolume(); persistDraft(); });
        wrap.append(input); inputs.append(wrap);
      }
      const evidence = document.createElement('p'); evidence.textContent = `${set.confidence >= .8 ? '辨識較明確' : '請核對此組'}${set.evidence ? ` · ${set.evidence}` : ''}`;
      row.append(heading, inputs, evidence);
      const exercise = options.getCatalog().find(item => item.name === set.exercise);
      const prior = exercise && root.FitnessCore.latest(exercise, options.getHistory())?.sets.at(-1);
      if (prior && set.weightKg === null && !current.historyId && !controller) {
        const useLast = document.createElement('button'); useLast.type = 'button'; useLast.className = 'use-last-weight';
        useLast.textContent = `沿用上次 ${options.fromKg(prior.weight)} ${options.unit()}`;
        useLast.addEventListener('click', () => { set.weightKg = prior.weight; persistDraft(); renderReview(); }); row.append(useLast);
      }
      host.append(row);
    });
    updateVolume();
  }
  async function analyze() { status('獨立版可播放影片並手動新增訓練組數；影片不會上傳。'); }
  async function save(event) {
    event.preventDefault(); if (saving || controller || current?.historyId) return;
    const error = byId('video-review-error'); error.textContent = '';
    if (!draftSets.length || draftSets.some(set => set.weightKg === null || set.reps === null || !root.FitnessCore.validSet({ weight: set.weightKg, reps: set.reps }))) {
      error.textContent = '請補齊每一組的重量與次數；徒手動作可填 0 公斤。'; return;
    }
    const date = byId('video-training-date').value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { error.textContent = '請選擇訓練日期'; return; }
    const grouped = new Map();
    for (const set of draftSets) {
      if (!grouped.has(set.exercise)) grouped.set(set.exercise, { name: set.exercise, group: options.getCatalog().find(item => item.name === set.exercise)?.group || '其他', sets: [], bestE1rm: 0, isPr: false });
      const exercise = grouped.get(set.exercise);
      exercise.sets.push({ weight: set.weightKg, reps: set.reps, done: true, type: '正式', rpe: null, source: 'video', startSec: set.startSec, endSec: set.endSec });
      exercise.bestE1rm = Math.max(exercise.bestE1rm, Math.round(set.weightKg * (1 + set.reps / 30) * 10) / 10);
    }
    const exercises = [...grouped.values()];
    const entry = { id: `video-${current.id}`, date: new Date(`${date}T12:00:00`).toISOString(), name: '影片訓練',
      exercises, volume: root.FitnessCore.volume(exercises), duration: Math.max(1, Math.round(current.duration / 60)),
      videoId: current.id, source: 'video', prs: 0, note: '影片辨識後確認保存', feeling: '' };
    saving = true; byId('save-video-training').disabled = true;
    try {
      await flushDraft();
      const existing = options.getHistory().some(item => item.id === entry.id);
      if (!existing) await options.saveEntry(entry);
      current.historyId = entry.id; current.trainingDate = date; current.reviewedSets = draftSets; delete current.reviewDraft;
      await root.FitnessStore.saveVideo(current); await listVideos();
      byId('video-dialog').close(); options.notify('影片訓練已保存，容量已更新');
    } catch { error.textContent = '訓練未能完整保存，請保留此頁並重試。'; byId('save-video-training').disabled = false; }
    finally { saving = false; }
  }
  root.FitnessJournal = {
    open,
    init(config) {
      options = config;
      document.querySelectorAll('[data-import-video]').forEach(button => button.addEventListener('click', () => byId('training-video-input').click()));
      byId('training-video-input').addEventListener('change', async event => {
        try { await importVideo(event.target.files[0]); } catch (error) { options.notify(error.name === 'QuotaExceededError' ? '儲存空間不足，影片未匯入' : error.message); }
        event.target.value = '';
      });
      byId('video-dialog-close').addEventListener('click', () => byId('video-dialog').close());
      byId('video-dialog').addEventListener('close', () => { controller?.abort(); releaseVideo(); if (!controller) void flushDraft().catch(() => options.notify('影片草稿未能保存')); });
      byId('video-dialog').addEventListener('cancel', () => controller?.abort());
      byId('analyze-training-video').addEventListener('click', () => {
        if (current.analyzedThrough >= current.duration) { current.observations = []; current.analyzedThrough = 0; }
        void analyze().catch(error => status(error.message || '辨識暫時無法開始，請重試。'));
      });
      byId('cancel-training-analysis').addEventListener('click', () => controller?.abort());
      byId('add-video-set').addEventListener('click', () => {
        draftSets.push({ exercise: options.getCatalog()[0].name, startSec: byId('training-video-player').currentTime || 0,
          endSec: current.duration, reps: null, weightKg: null, confidence: 0, evidence: '手動新增' }); persistDraft(); renderReview();
      });
      byId('video-training-date').addEventListener('change', persistDraft);
      byId('video-review-form').addEventListener('submit', save);
      byId('delete-training-video').addEventListener('click', async event => {
        const button = event.currentTarget;
        if (controller) { options.notify('請先停止分析'); return; }
        if (button.dataset.confirm !== current.id) {
          button.dataset.confirm = current.id; button.textContent = '再次點選移除原影片（保留訓練紀錄）'; return;
        }
        clearTimeout(draftTimer); await draftWrite.catch(() => {});
        await root.FitnessStore.removeVideo(current.id); current = null; byId('video-dialog').close(); await listVideos(); options.notify('原影片已移除，訓練紀錄保留');
        button.textContent = '移除此裝置的影片'; delete button.dataset.confirm;
      });
      listVideos().catch(() => options.notify('影片儲存目前不可用，文字訓練紀錄仍可使用'));
    },
    importVideo,
  };
})(window);
