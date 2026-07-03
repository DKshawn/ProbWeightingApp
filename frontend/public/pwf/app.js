const SWITCH_B_TO_A = "B_TO_A";
const SWITCH_A_TO_B = "A_TO_B";
const ASSIGNMENT_MODULUS = 3;
const TIME_PRESSURE_SECONDS = 20;
const NUMBER_MEMORY_SECONDS = 5;
const NUMBER_MEMORY_DIGITS = 5;
const MODE_NORMAL = "normal";
const MODE_TIME_PRESSURE = "time_pressure";
const MODE_NUMBER_MEMORY = "number_memory";
const DESIGN_VERSION = "2026-07-04-ci-amount-level";
const URL_PARAMS = new URLSearchParams(window.location.search);
const EMBEDDED_MODE = URL_PARAMS.get("embedded") === "1";
const PILOT_MODE = URL_PARAMS.get("mode") === "pilot" || URL_PARAMS.get("study_mode") === "pilot" || URL_PARAMS.get("pilot") === "1";
const ABDELLAOUI_PWF_BASELINE = 1000;

const BASE_BLOCKS = createBlocks(1);

function createBlocks(amountMultiplier = 1) {
  const m = amountMultiplier;
  return [
  {
    id: "choi-2022-study2",
    title: "Choi et al. (2022) Study 2",
    label: "12リスト",
    method: "power utility alpha estimated in ML2",
    intro:
      "このブロックでは、くじと確実な金額を比べる12個のリストに回答します。",
    assumptions:
      "31行のリストで、切り替える行を1回クリックすると、上下の行が自動入力されます。",
    tasks: [
      createMplTask(lotteryText(50, 2000, 50, 0, m), "確実な金額", "JPY", range(2000 * m, 0, 31), "JPY", { taskId: "choi-risk-1" }),
      createMplTask(lotteryText(25, 4000, 75, 0, m), "確実な金額", "JPY", range(4000 * m, 0, 31), "JPY", { taskId: "choi-risk-2" }),
      createMplTask(lotteryText(75, 2000, 25, 0, m), "確実な金額", "JPY", range(2000 * m, 0, 31), "JPY", { taskId: "choi-risk-3" }),
      createMplTask(lotteryText(50, 4000, 50, 1000, m), "確実な金額", "JPY", range(4000 * m, 1000 * m, 31), "JPY", { taskId: "choi-risk-4" }),
      createMplTask(lotteryText(10, 10000, 90, 0, m), "確実な金額", "JPY", range(10000 * m, 0, 31), "JPY", { taskId: "choi-risk-5" }),
      createMplTask(lotteryText(90, 1500, 10, 0, m), "確実な金額", "JPY", range(1500 * m, 0, 31), "JPY", { taskId: "choi-risk-6" }),
      createMplTask(lotteryText(33, 6000, 67, 0, m), "確実な金額", "JPY", range(6000 * m, 0, 31), "JPY", { taskId: "choi-risk-7" }),
      createMplTask(lotteryText(67, 3000, 33, 500, m), "確実な金額", "JPY", range(3000 * m, 500 * m, 31), "JPY", { taskId: "choi-risk-8" }),
      createMplTask(lotteryText(40, 5000, 60, 0, m), "確実な金額", "JPY", range(5000 * m, 0, 31), "JPY", { taskId: "choi-risk-9" }),
      createMplTask(lotteryText(60, 2500, 40, 0, m), "確実な金額", "JPY", range(2500 * m, 0, 31), "JPY", { taskId: "choi-risk-10" }),
      createMplTask(lotteryText(20, 12000, 80, 0, m), "確実な金額", "JPY", range(12000 * m, 0, 31), "JPY", { taskId: "choi-risk-11" }),
      createMplTask(lotteryText(80, 1800, 20, 0, m), "確実な金額", "JPY", range(1800 * m, 0, 31), "JPY", { taskId: "choi-risk-12" }),
    ],
  },
  {
    id: "abdellaoui-2000",
    title: "Abdellaoui (2000)",
    label: "8問 + PWF 4問",
    method: "utility bisection + gain-domain probability bisection",
    intro:
      "このブロックでは、段階的な比較によって、2つのくじが同じくらい魅力的になる金額を探します。その後、利得領域の確率加重を測るための確率比較を行います。",
    assumptions:
      "金額比較は5回、確率比較は6回の比較で終了します。金額はすべて日本円表示です。",
    tasks: [
      createBisectionTask("abdellaoui-1", "2/3", "1/3", 1000, 500, 0, 1000, 6000, m),
      createBisectionTask("abdellaoui-2", "2/3", "1/3", 2000, 1000, 0, 2000, 8000, m),
      createBisectionTask("abdellaoui-3", "1/2", "1/2", 3000, 1000, 0, 3000, 9000, m),
      createBisectionTask("abdellaoui-4", "1/2", "1/2", 4000, 2000, 0, 4000, 12000, m),
      createBisectionTask("abdellaoui-5", "1/3", "2/3", 6000, 1000, 0, 6000, 16000, m),
      createBisectionTask("abdellaoui-6", "1/3", "2/3", 8000, 2000, 0, 8000, 20000, m),
      createBisectionTask("abdellaoui-7", "3/4", "1/4", 3000, 1000, 0, 3000, 9000, m),
      createBisectionTask("abdellaoui-8", "1/4", "3/4", 10000, 2000, 0, 10000, 26000, m),
      createProbabilityBisectionTask("abdellaoui-p1", "abdellaoui-1", "abdellaoui-6", 1 / 6, m),
      createProbabilityBisectionTask("abdellaoui-p2", "abdellaoui-2", "abdellaoui-6", 2 / 6, m),
      createProbabilityBisectionTask("abdellaoui-p3", "abdellaoui-3", "abdellaoui-6", 3 / 6, m),
      createProbabilityBisectionTask("abdellaoui-p4", "abdellaoui-4", "abdellaoui-6", 4 / 6, m),
    ],
  },
  {
    id: "bruhin-2010",
    title: "Bruhin et al. (2010)",
    label: "12表",
    method: "finite mixture structural estimation",
    intro:
      "このブロックでは、くじと確実な金額を比べる12枚の表に回答します。",
    assumptions:
      "各表は20行です。切り替える行を1回クリックすると、上下の行が自動入力されます。",
    tasks: [
      createMplTask(lotteryText(75, 2000, 25, 0, m), "確実な金額", "JPY", range(2000 * m, 0, 20), "JPY", { taskId: "bruhin-sheet-1" }),
      createMplTask(lotteryText(25, 4000, 75, 0, m), "確実な金額", "JPY", range(4000 * m, 0, 20), "JPY", { taskId: "bruhin-sheet-2" }),
      createMplTask(lotteryText(50, 3000, 50, 0, m), "確実な金額", "JPY", range(3000 * m, 0, 20), "JPY", { taskId: "bruhin-sheet-3" }),
      createMplTask(lotteryText(10, 10000, 90, 0, m), "確実な金額", "JPY", range(10000 * m, 0, 20), "JPY", { taskId: "bruhin-sheet-4" }),
      createMplTask(lotteryText(90, 1500, 10, 0, m), "確実な金額", "JPY", range(1500 * m, 0, 20), "JPY", { taskId: "bruhin-sheet-5" }),
      createMplTask(lotteryText(50, 5000, 50, 1000, m), "確実な金額", "JPY", range(5000 * m, 1000 * m, 20), "JPY", { taskId: "bruhin-sheet-6" }),
      createMplTask(lotteryText(20, 8000, 80, 500, m), "確実な金額", "JPY", range(8000 * m, 500 * m, 20), "JPY", { taskId: "bruhin-sheet-7" }),
      createMplTask(lotteryText(33, 6000, 67, 0, m), "確実な金額", "JPY", range(6000 * m, 0, 20), "JPY", { taskId: "bruhin-sheet-9" }),
      createMplTask(lotteryText(67, 2500, 33, 0, m), "確実な金額", "JPY", range(2500 * m, 0, 20), "JPY", { taskId: "bruhin-sheet-10" }),
      createMplTask(lotteryText(40, 5000, 60, 0, m), "確実な金額", "JPY", range(5000 * m, 0, 20), "JPY", { taskId: "bruhin-sheet-11" }),
      createMplTask(lotteryText(60, 2500, 40, 500, m), "確実な金額", "JPY", range(2500 * m, 500 * m, 20), "JPY", { taskId: "bruhin-sheet-12" }),
      createMplTask(lotteryText(15, 12000, 85, 0, m), "確実な金額", "JPY", range(12000 * m, 0, 20), "JPY", { taskId: "bruhin-sheet-13" }),
    ],
  },
  ];
}

const STORAGE_KEY = "pwf-research-app";

const state = {
  phase: "setup",
  participant: "",
  assignment: null,
  blockIndex: 0,
  taskIndex: 0,
  runtime: null,
  records: [],
  blockStartedAt: null,
  taskStartedAt: null,
  taskModes: [],
  taskTimedOut: false,
  memoryChallenge: null,
  csvDownloaded: false,
  error: "",
};

const app = document.getElementById("app");
let taskTimerId = null;
let memoryTimerId = null;

function range(max, min, count) {
  if (count === 1) return [roundYen(max)];
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, index) => roundYen(max - step * index));
}

function pct(value) {
  return `${Math.round(value * 100)}%`;
}

function createMplTask(risky, certainLabel, unit, amounts, amountSuffix, meta = {}) {
  return {
    taskId: meta.taskId ?? "",
    isAnchor: Boolean(meta.isAnchor),
    type: "mpl",
    prompt: meta.prompt ?? "各行でくじと確実な金額のどちらを選ぶか、切り替える行をクリックしてください。",
    risky,
    certainLabel,
    unit,
    switchDirection: SWITCH_B_TO_A,
    rows: amounts.map((amount, index) => ({
      row: index + 1,
      amount,
      optionA: risky,
      optionB: `${formatAmount(amount, amountSuffix)} を確実に受け取る`,
    })),
  };
}

function createBisectionTask(taskId, pHigh, pLow, aHigh, aLow, bLow, low, high, amountMultiplier = 1) {
  const m = amountMultiplier;
  return {
    taskId,
    isAnchor: false,
    type: "bisection",
    prompt: "より好ましい選択肢を選んでください。選択に応じて次の候補金額が自動で変わります。",
    optionA: `${pHigh}の確率で ${formatYen(aHigh * m)}、${pLow}の確率で ${formatYen(aLow * m)}`,
    optionBPrefix: `${pHigh}の確率で`,
    optionBSuffix: `${pLow}の確率で ${formatYen(bLow * m)}`,
    unit: "JPY",
    low: low * m,
    high: high * m,
    rounds: 5,
    chooseAImplication: "candidate_too_low",
  };
}

function createInputMatchTask(taskId, unknown, prompt, optionA, optionB, min, max) {
  return {
    taskId,
    isAnchor: false,
    type: "inputMatch",
    prompt,
    optionA,
    optionB,
    unknown,
    unit: "JPY",
    min,
    max,
  };
}

function createProbabilityMatchTask(taskId, unknown, sureSymbol, highSymbol, baselineAmount, nominalWeightTarget) {
  return {
    taskId,
    isAnchor: false,
    type: "probabilityMatch",
    prompt: `${unknown} を入力して、確実な金額とくじが同じくらい魅力的になるようにしてください。`,
    unknown,
    sureSymbol,
    highSymbol,
    baselineAmount,
    nominalWeightTarget,
    unit: "%",
    min: 1,
    max: 99,
  };
}

function createProbabilityBisectionTask(taskId, sureTaskId, highTaskId, nominalWeightTarget, amountMultiplier = 1) {
  return {
    taskId,
    isAnchor: false,
    type: "probabilityBisection",
    prompt: "確実な金額とくじを比べて、より好ましい選択肢を選んでください。選択に応じて次の候補確率が自動で変わります。",
    sureTaskId,
    highTaskId,
    baselineAmount: ABDELLAOUI_PWF_BASELINE * amountMultiplier,
    nominalWeightTarget,
    unit: "%",
    low: 0.01,
    high: 0.99,
    rounds: 6,
  };
}

function lotteryText(firstProbability, firstAmount, secondProbability, secondAmount, amountMultiplier = 1) {
  return `${firstProbability}%の確率で ${formatYen(firstAmount * amountMultiplier)}、${secondProbability}%の確率で ${formatYen(secondAmount * amountMultiplier)}`;
}

function formatYen(value) {
  const rounded = roundYen(value);
  const sign = rounded < 0 ? "-" : "";
  return `${sign}¥${Math.abs(rounded).toLocaleString("ja-JP")}`;
}

function formatAmount(value, unit = "") {
  const rounded = Number.isInteger(value) ? value : Math.round(value * 100) / 100;
  if (!unit) return `${rounded}`;
  if (unit === "JPY" || unit === "¥") return formatYen(value);
  if (unit === "$") return `$${rounded}`;
  return `${unit}${unit === "years" ? "" : " "}${rounded}${unit === "years" ? " years" : ""}`;
}

function roundYen(value) {
  return Math.round(Number(value));
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    designVersion: DESIGN_VERSION,
    phase: state.phase,
    participant: state.participant,
    assignment: state.assignment,
    blockIndex: state.blockIndex,
    taskIndex: state.taskIndex,
    records: state.records,
    taskModes: state.taskModes,
    taskTimedOut: state.taskTimedOut,
    memoryChallenge: state.memoryChallenge,
    csvDownloaded: state.csvDownloaded,
  }));
}

function restoreState(expectedParticipant = "") {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch (_error) {
    return false;
  }
  if (!saved || typeof saved !== "object") return false;
  if (saved.designVersion !== DESIGN_VERSION) return false;
  if (!saved.participant || !saved.assignment) return false;
  const savedParticipant = String(saved.participant);
  if (expectedParticipant && savedParticipant !== String(expectedParticipant)) return false;

  const blockIndex = Number(saved.blockIndex);
  const taskIndex = Number(saved.taskIndex);
  if (!Number.isInteger(blockIndex) || blockIndex < 0 || blockIndex >= BASE_BLOCKS.length) return false;

  const assignment = normalizeAssignment(savedParticipant, saved.assignment);
  const block = BASE_BLOCKS[blockIndex];
  const boundedTaskIndex = Number.isInteger(taskIndex)
    ? Math.max(0, Math.min(taskIndex, block.tasks.length - 1))
    : 0;
  const records = Array.isArray(saved.records) ? saved.records : [];
  const savedPhase = [
    "setup",
    "blockIntro",
    "practice",
    "practiceSummary",
    "memoryDisplay",
    "memoryPreRecall",
    "task",
    "memoryPostRecall",
    "finish",
  ].includes(saved.phase)
    ? saved.phase
    : records.length >= block.tasks.length
    ? "finish"
    : "task";

  Object.assign(state, {
    phase: savedPhase,
    participant: savedParticipant,
    assignment,
    blockIndex,
    taskIndex: boundedTaskIndex,
    runtime: null,
    records,
    blockStartedAt: Date.now(),
    taskStartedAt: Date.now(),
    taskModes: Array.isArray(saved.taskModes) ? saved.taskModes : [],
    taskTimedOut: Boolean(saved.taskTimedOut),
    memoryChallenge: normalizeMemoryChallenge(saved.memoryChallenge, boundedTaskIndex, savedPhase),
    csvDownloaded: Boolean(saved.csvDownloaded),
    error: "",
  });
  if (currentTaskMode() === MODE_NUMBER_MEMORY && !state.memoryChallenge && ["memoryDisplay", "memoryPreRecall", "task", "memoryPostRecall"].includes(state.phase)) {
    state.phase = "memoryDisplay";
    state.memoryChallenge = createMemoryChallenge(state.taskIndex);
  }
  return true;
}

function postEmbeddedMessage(message) {
  if (!EMBEDDED_MODE || !window.parent || window.parent === window) return;
  window.parent.postMessage(message, window.location.origin);
}

function render() {
  clearTaskTimer();
  clearMemoryTimer();
  if (state.phase === "setup") return renderSetup();
  if (state.phase === "blockIntro") return renderBlockIntro();
  if (state.phase === "practice") return renderPractice();
  if (state.phase === "practiceSummary") return renderPracticeSummary();
  if (state.phase === "memoryDisplay") return renderMemoryDisplay();
  if (state.phase === "memoryPreRecall") return renderMemoryRecall("pre");
  if (state.phase === "task") return renderTask();
  if (state.phase === "memoryPostRecall") return renderMemoryRecall("post");
  return renderFinish();
}

function initializeNavigationHistory() {
  if (!window.history?.replaceState || !window.addEventListener) return;
  window.history.replaceState({ pwfScreen: "setup" }, "", window.location.href);
  window.addEventListener("popstate", (event) => {
    if (!event.state?.pwfScreen) return;
    returnToSetupScreen();
  });
}

function pushRunningHistory() {
  if (!window.history?.pushState) return;
  if (window.history.state?.pwfScreen === "running") return;
  window.history.pushState({ pwfScreen: "running" }, "", window.location.href);
}

function returnToSetupScreen() {
  clearTaskTimer();
  clearMemoryTimer();
  Object.assign(state, {
    phase: "setup",
    participant: "",
    assignment: null,
    runtime: null,
    taskTimedOut: false,
    memoryChallenge: null,
    error: "",
  });
  render();
  scrollToTopAfterRender();
}

function scrollToTopAfterRender() {
  const scroll = () => {
    if (typeof window.scrollTo === "function") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return;
    }
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  };
  if (typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(scroll);
    return;
  }
  scroll();
}

function renderSetup() {
  document.title = PILOT_MODE ? "PWF実験(パイロット)" : "PWF実験";
  app.innerHTML = `
    <main class="screen narrow-screen">
      <section class="center-card">
        ${PILOT_MODE ? `<div class="step-label">パイロット</div>` : ""}
        <h1 class="app-title">${PILOT_MODE ? "PWF実験(パイロット)" : "PWF実験"}</h1>
        <form class="setup-form" id="setupForm">
          <div class="field">
            <label for="participant">学籍番号（7桁）</label>
            <input id="participant" type="text" inputmode="numeric" maxlength="7" pattern="[0-9]{7}" value="${escapeHtml(state.participant)}" placeholder="例: 1234567" autofocus />
          </div>
          ${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ""}
          <button class="btn-primary" type="submit">割り当てて開始</button>
        </form>
      </section>
    </main>
  `;
  document.getElementById("setupForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const value = document.getElementById("participant").value.trim();
    const assignment = assignBlockFromStudentId(value);
    if (assignment.error) {
      state.error = assignment.error;
      render();
      return;
    }
    if (restoreState(value)) {
      postEmbeddedMessage({
        type: "pwf-start",
        participant: state.participant,
        assignment: state.assignment,
      });
      pushRunningHistory();
      render();
      scrollToTopAfterRender();
      return;
    }
    state.participant = value;
    state.assignment = assignment;
    state.phase = "blockIntro";
    state.blockIndex = assignment.blockIndex;
    state.taskIndex = 0;
    state.records = [];
    state.taskModes = [];
    state.taskTimedOut = false;
    state.memoryChallenge = null;
    state.csvDownloaded = false;
    state.error = "";
    saveState();
    postEmbeddedMessage({
      type: "pwf-start",
      participant: state.participant,
      assignment: state.assignment,
    });
    pushRunningHistory();
    render();
  });
}

function renderBlockIntro() {
  const block = currentBlock();
  const assignment = state.assignment;
  app.innerHTML = `
    <main class="screen narrow-screen">
      <section class="center-card">
        <div class="step-label">グループ ${assignment?.groupNumber ?? "-"} / ${ASSIGNMENT_MODULUS}</div>
        <h2>${escapeHtml(block.title)}</h2>
        <p>${escapeHtml(block.intro)}</p>
        <div class="btn-row">
          <button class="btn-primary" id="startBlock">このブロックを始める</button>
        </div>
      </section>
    </main>
  `;
  document.getElementById("startBlock").addEventListener("click", () => {
    state.phase = "practice";
    state.taskIndex = 0;
    state.runtime = null;
    state.taskModes = createTaskModes(block.tasks);
    state.taskTimedOut = false;
    state.memoryChallenge = null;
    state.blockStartedAt = Date.now();
    state.taskStartedAt = Date.now();
    state.error = "";
    render();
  });
}

function renderPractice() {
  const block = currentBlock();
  const task = currentPracticeTask();
  ensureRuntime(task);
  app.innerHTML = `
    <main class="screen">
      <section class="mode-panel practice-mode">
        <strong>練習問題</strong>
        <span>この回答は保存されません。何度でもやり直せます。</span>
      </section>
      <div class="progress-bar-wrapper">
        <div class="progress-info">
          <span>練習</span>
          <span class="block-label">${escapeHtml(block.title)}</span>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:0%"></div></div>
      </div>
      ${renderTaskBody(block, task)}
      <div class="practice-actions">
        <button class="btn-secondary" id="redoPractice" type="button">練習をもう一度</button>
      </div>
    </main>
  `;
  bindTaskHandlers(block, task, { practice: true });
  document.getElementById("redoPractice").addEventListener("click", resetPractice);
}

function renderPracticeSummary() {
  const block = currentBlock();
  app.innerHTML = `
    <main class="screen narrow-screen">
      <section class="center-card">
        <div class="step-label">練習完了</div>
        <h2>${escapeHtml(block.title)}</h2>
        <p>練習問題が終わりました。次から正式な課題です。</p>
        <div class="btn-row">
          <button class="btn-primary" id="startFormalTasks" type="button">正式な課題を始める</button>
          <button class="btn-secondary" id="redoPractice" type="button">練習をもう一度</button>
        </div>
      </section>
    </main>
  `;
  document.getElementById("startFormalTasks").addEventListener("click", startFormalTasks);
  document.getElementById("redoPractice").addEventListener("click", resetPractice);
}

function resetPractice() {
  state.phase = "practice";
  state.runtime = null;
  state.taskTimedOut = false;
  state.memoryChallenge = null;
  state.taskStartedAt = Date.now();
  state.error = "";
  render();
}

function startFormalTasks() {
  state.taskIndex = 0;
  state.error = "";
  startCurrentTaskFlow();
}

function createTaskModes(tasks) {
  const taskCount = tasks.length;
  const modes = Array.from({ length: taskCount }, () => MODE_NORMAL);
  const randomizedIndexes = shuffle(Array.from({ length: Math.max(0, taskCount - 1) }, (_, index) => index + 1));
  randomizedIndexes.slice(0, 3).forEach((index) => {
    modes[index] = MODE_TIME_PRESSURE;
  });
  randomizedIndexes.slice(3, 6).forEach((index) => {
    modes[index] = MODE_NUMBER_MEMORY;
  });
  return modes;
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function taskModeAt(index) {
  return state.taskModes[index] ?? MODE_NORMAL;
}

function currentTaskMode() {
  if (!["memoryDisplay", "memoryPreRecall", "task", "memoryPostRecall"].includes(state.phase)) return MODE_NORMAL;
  return taskModeAt(state.taskIndex);
}

function isTimePressureTask() {
  return state.phase === "task" && currentTaskMode() === MODE_TIME_PRESSURE;
}

function clearTaskTimer() {
  if (!taskTimerId) return;
  clearInterval(taskTimerId);
  taskTimerId = null;
}

function clearMemoryTimer() {
  if (!memoryTimerId) return;
  clearTimeout(memoryTimerId);
  clearInterval(memoryTimerId);
  memoryTimerId = null;
}

function remainingTaskSeconds() {
  if (!state.taskStartedAt) return TIME_PRESSURE_SECONDS;
  const elapsedSeconds = Math.floor((Date.now() - state.taskStartedAt) / 1000);
  return Math.max(0, TIME_PRESSURE_SECONDS - elapsedSeconds);
}

function exceededTaskSeconds() {
  if (!state.taskStartedAt) return 0;
  const elapsedSeconds = Math.floor((Date.now() - state.taskStartedAt) / 1000);
  return Math.max(0, elapsedSeconds - TIME_PRESSURE_SECONDS);
}

function startTaskTimerIfNeeded() {
  if (!isTimePressureTask()) return;
  const tick = () => {
    const remaining = remainingTaskSeconds();
    const exceeded = exceededTaskSeconds();
    const timer = document.getElementById("timerRemaining");
    const panel = document.getElementById("timerPanel");
    const progress = document.getElementById("timerProgressFill");
    if (timer) timer.textContent = timerText(remaining, exceeded);
    if (panel) panel.classList.toggle("expired", exceeded > 0 || state.taskTimedOut);
    if (progress) progress.style.width = `${timerProgressPercent(remaining, exceeded)}%`;
    if (remaining <= 0) handleTimeExpired();
  };
  tick();
  taskTimerId = setInterval(tick, 250);
}

function handleTimeExpired() {
  if (!isTimePressureTask() || state.taskTimedOut) return;
  state.taskTimedOut = true;
}

function timerText(remaining, exceeded) {
  if (exceeded > 0) return `制限時間を ${exceeded} 秒超過しています`;
  return `${remaining}s / ${TIME_PRESSURE_SECONDS}s`;
}

function timerProgressPercent(remaining, exceeded) {
  if (exceeded > 0) return 100;
  return Math.max(0, Math.min(100, Math.round((remaining / TIME_PRESSURE_SECONDS) * 100)));
}

function currentPracticeTask() {
  const block = currentBlock();
  const m = 1;
  if (block.id === "abdellaoui-2000") {
    const task = createBisectionTask("practice-abdellaoui", "1/2", "1/2", 1000, 500, 0, 0, 3000, m);
    task.prompt = "練習問題です。より好ましい選択肢を選ぶと、次の候補金額が自動で変わります。";
    task.rounds = 3;
    return task;
  }
  return createMplTask(lotteryText(50, 1000, 50, 0, m), "確実な金額", "JPY", range(1000 * m, 0, 6), "JPY", {
    taskId: `practice-${block.id}`,
    prompt: "練習問題です。くじと確実な金額のどちらを選ぶか、切り替える行をクリックしてください。",
  });
}

function completePractice() {
  state.phase = "practiceSummary";
  state.runtime = null;
  state.taskTimedOut = false;
  state.memoryChallenge = null;
  state.taskStartedAt = Date.now();
  state.error = "";
  render();
  scrollToTopAfterRender();
}

function startCurrentTaskFlow() {
  state.runtime = null;
  state.taskTimedOut = false;
  state.memoryChallenge = null;
  state.error = "";
  if (taskModeAt(state.taskIndex) === MODE_NUMBER_MEMORY) {
    state.phase = "memoryDisplay";
    state.memoryChallenge = createMemoryChallenge(state.taskIndex);
    state.taskStartedAt = null;
  } else {
    state.phase = "task";
    state.taskStartedAt = Date.now();
  }
  saveState();
  render();
  scrollToTopAfterRender();
}

function createMemoryChallenge(taskIndex) {
  return {
    taskIndex,
    number: randomDigitString(NUMBER_MEMORY_DIGITS),
    digits: NUMBER_MEMORY_DIGITS,
    seconds: NUMBER_MEMORY_SECONDS,
    displayStartedAt: Date.now(),
    displayEndedAt: null,
    preStartedAt: null,
    preInput: "",
    preCorrect: null,
    preResponseTimeMs: null,
    postStartedAt: null,
    postInput: "",
    postCorrect: null,
    postResponseTimeMs: null,
    postCompleted: false,
  };
}

function normalizeMemoryChallenge(value, taskIndex, phase) {
  if (!value || typeof value !== "object") return null;
  if (!["memoryDisplay", "memoryPreRecall", "task", "memoryPostRecall"].includes(phase)) return null;
  const number = String(value.number ?? "");
  if (!isValidMemoryNumber(number)) return null;
  return {
    taskIndex: Number.isInteger(Number(value.taskIndex)) ? Number(value.taskIndex) : taskIndex,
    number,
    digits: Number(value.digits) || NUMBER_MEMORY_DIGITS,
    seconds: Number(value.seconds) || NUMBER_MEMORY_SECONDS,
    displayStartedAt: Number(value.displayStartedAt) || Date.now(),
    displayEndedAt: Number(value.displayEndedAt) || null,
    preStartedAt: Number(value.preStartedAt) || null,
    preInput: String(value.preInput ?? ""),
    preCorrect: typeof value.preCorrect === "boolean" ? value.preCorrect : null,
    preResponseTimeMs: Number.isFinite(Number(value.preResponseTimeMs)) ? Number(value.preResponseTimeMs) : null,
    postStartedAt: Number(value.postStartedAt) || null,
    postInput: String(value.postInput ?? ""),
    postCorrect: typeof value.postCorrect === "boolean" ? value.postCorrect : null,
    postResponseTimeMs: Number.isFinite(Number(value.postResponseTimeMs)) ? Number(value.postResponseTimeMs) : null,
    postCompleted: Boolean(value.postCompleted),
  };
}

function ensureMemoryChallenge() {
  if (state.memoryChallenge?.taskIndex === state.taskIndex && isValidMemoryNumber(state.memoryChallenge.number)) {
    return state.memoryChallenge;
  }
  state.memoryChallenge = createMemoryChallenge(state.taskIndex);
  return state.memoryChallenge;
}

function randomDigitString(length) {
  const safeLength = Math.max(1, Math.min(10, Number(length) || NUMBER_MEMORY_DIGITS));
  const first = String(Math.floor(Math.random() * 9) + 1);
  const remainingDigits = shuffle(Array.from({ length: 10 }, (_, index) => String(index)).filter((digit) => digit !== first));
  const rest = remainingDigits.slice(0, safeLength - 1).join("");
  return `${first}${rest}`;
}

function isValidMemoryNumber(value) {
  const text = String(value ?? "");
  return /^\d{5}$/.test(text) && text[0] !== "0" && new Set(text).size === text.length;
}

function renderMemoryDisplay() {
  const challenge = ensureMemoryChallenge();
  const remainingMs = memoryDisplayRemainingMs(challenge);
  app.innerHTML = `
    <main class="screen narrow-screen">
      <section class="center-card memory-card">
        <div class="step-label">数字記憶</div>
        <h2>この数字を覚えてください</h2>
        <div class="memory-number" aria-label="記憶する5桁の数字">${escapeHtml(challenge.number)}</div>
        <div class="memory-countdown" aria-live="polite">
          <span id="memoryCountdownText">${memoryCountdownText(remainingMs)}</span>
          <div class="memory-progress-track" aria-hidden="true">
            <div class="memory-progress-fill" id="memoryProgressFill" style="width:${memoryProgressPercent(remainingMs)}%"></div>
          </div>
        </div>
        <p class="muted">時間が終わると入力画面へ進みます。</p>
      </section>
    </main>
  `;
  const finishDisplay = () => {
    clearMemoryTimer();
    challenge.displayEndedAt = Date.now();
    challenge.preStartedAt = Date.now();
    state.phase = "memoryPreRecall";
    state.error = "";
    saveState();
    render();
  };
  const tick = () => {
    const currentRemainingMs = memoryDisplayRemainingMs(challenge);
    const countdown = document.getElementById("memoryCountdownText");
    const progress = document.getElementById("memoryProgressFill");
    if (countdown) countdown.textContent = memoryCountdownText(currentRemainingMs);
    if (progress) progress.style.width = `${memoryProgressPercent(currentRemainingMs)}%`;
    if (currentRemainingMs <= 0) finishDisplay();
  };
  tick();
  memoryTimerId = setInterval(tick, 100);
}

function memoryDisplayRemainingMs(challenge) {
  const elapsedMs = Math.max(0, Date.now() - (challenge.displayStartedAt || Date.now()));
  return Math.max(0, NUMBER_MEMORY_SECONDS * 1000 - elapsedMs);
}

function memoryCountdownText(remainingMs) {
  const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  return `${remainingSeconds}s / ${NUMBER_MEMORY_SECONDS}s`;
}

function memoryProgressPercent(remainingMs) {
  return Math.max(0, Math.min(100, Math.round((remainingMs / (NUMBER_MEMORY_SECONDS * 1000)) * 100)));
}

function renderMemoryRecall(stage) {
  const challenge = ensureMemoryChallenge();
  const isPost = stage === "post";
  const task = currentTask();
  app.innerHTML = `
    <main class="screen narrow-screen">
      <section class="center-card">
        <div class="step-label">数字記憶</div>
        <h2>${isPost ? "先ほどの数字をもう一度入力してください" : "いま表示された数字を入力してください"}</h2>
        <form class="setup-form" id="memoryRecallForm">
          <div class="field memory-digit-field">
            <label>5桁の数字</label>
            <div class="memory-digit-row" role="group" aria-label="5桁の数字">
              ${Array.from({ length: NUMBER_MEMORY_DIGITS }, (_, index) => `
                <input
                  class="memory-digit-input"
                  type="text"
                  inputmode="numeric"
                  maxlength="1"
                  pattern="[0-9]"
                  autocomplete="off"
                  aria-label="${index + 1}桁目"
                  data-memory-digit="${index}"
                  ${index === 0 ? "autofocus" : ""}
                />
              `).join("")}
            </div>
          </div>
          ${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ""}
          <button class="btn-primary" type="submit">${isPost ? "次へ進む" : "課題へ進む"}</button>
        </form>
        ${isPost ? `<p class="muted">課題 ${state.taskIndex + 1}: ${escapeHtml(taskTypeLabel(task.type))}</p>` : ""}
      </section>
    </main>
  `;
  document.getElementById("memoryRecallForm").addEventListener("submit", (event) => {
    event.preventDefault();
    submitMemoryRecall(stage);
  });
  bindMemoryDigitInputs();
}

function submitMemoryRecall(stage) {
  const value = currentMemoryInputValue();
  if (!/^\d{5}$/.test(value)) {
    state.error = "5桁の数字を半角数字で入力してください。";
    render();
    return;
  }
  const challenge = ensureMemoryChallenge();
  const now = Date.now();
  if (stage === "post") {
    challenge.postInput = value;
    challenge.postCorrect = value === challenge.number;
    challenge.postResponseTimeMs = challenge.postStartedAt ? now - challenge.postStartedAt : null;
    challenge.postCompleted = true;
    updateCurrentMemoryRecord();
    advanceToNextTask();
    return;
  }
  challenge.preInput = value;
  challenge.preCorrect = value === challenge.number;
  challenge.preResponseTimeMs = challenge.preStartedAt ? now - challenge.preStartedAt : null;
  state.phase = "task";
  state.runtime = null;
  state.taskStartedAt = Date.now();
  state.taskTimedOut = false;
  state.error = "";
  saveState();
  render();
  scrollToTopAfterRender();
}

function bindMemoryDigitInputs() {
  const inputs = memoryDigitInputs();
  inputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      const digits = normalizeDigitInput(input.value);
      if (digits.length > 1) {
        fillMemoryDigits(digits, index);
        return;
      }
      input.value = digits;
      if (digits && index < inputs.length - 1) inputs[index + 1].focus();
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Backspace" && !input.value && index > 0) {
        inputs[index - 1].focus();
        inputs[index - 1].value = "";
        event.preventDefault();
      }
      if (event.key === "ArrowLeft" && index > 0) {
        inputs[index - 1].focus();
        event.preventDefault();
      }
      if (event.key === "ArrowRight" && index < inputs.length - 1) {
        inputs[index + 1].focus();
        event.preventDefault();
      }
    });
    input.addEventListener("paste", (event) => {
      const text = event.clipboardData?.getData("text") ?? "";
      const digits = normalizeDigitInput(text);
      if (!digits) return;
      event.preventDefault();
      fillMemoryDigits(digits, index);
    });
  });
  inputs[0]?.focus();
}

function memoryDigitInputs() {
  return Array.from(document.querySelectorAll("[data-memory-digit]"));
}

function currentMemoryInputValue() {
  return normalizeDigitInput(memoryDigitInputs().map((input) => input.value).join(""));
}

function fillMemoryDigits(digits, startIndex = 0) {
  const inputs = memoryDigitInputs();
  const normalized = normalizeDigitInput(digits).slice(0, Math.max(0, inputs.length - startIndex));
  normalized.split("").forEach((digit, offset) => {
    const input = inputs[startIndex + offset];
    if (input) input.value = digit;
  });
  const nextIndex = Math.min(startIndex + normalized.length, inputs.length - 1);
  inputs[nextIndex]?.focus();
}

function normalizeDigitInput(value) {
  return String(value ?? "")
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/\D/g, "");
}

function renderTask() {
  const block = currentBlock();
  const task = currentTask();
  ensureRuntime(task);
  const totalTasks = block.tasks.length;
  const progress = Math.round(((state.taskIndex + 1) / totalTasks) * 100);
  app.innerHTML = `
    <main class="screen">
      ${renderModePanel()}
      <div class="progress-bar-wrapper">
        <div class="progress-info">
          <span>課題 ${state.taskIndex + 1} / ${totalTasks}</span>
          <span class="block-label">${escapeHtml(block.title)} | ${escapeHtml(block.label)}</span>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div>
      </div>
      ${renderTaskBody(block, task)}
    </main>
  `;
  bindTaskHandlers(block, task, { practice: false });
  startTaskTimerIfNeeded();
}

function renderModePanel() {
  if (currentTaskMode() === MODE_TIME_PRESSURE) return renderTimer();
  if (currentTaskMode() === MODE_NUMBER_MEMORY) {
    return `
      <section class="mode-panel memory-mode">
        <strong>数字記憶モード</strong>
        <span>数字を記憶したまま課題に回答してください。</span>
      </section>
    `;
  }
  return `
    <section class="mode-panel normal-mode">
      <strong>通常モード</strong>
      <span>時間制限はありません。</span>
    </section>
  `;
}

function renderTimer() {
  const remaining = remainingTaskSeconds();
  const exceeded = exceededTaskSeconds();
  const expired = state.taskTimedOut || exceeded > 0;
  return `
    <section class="timer-panel ${expired ? "expired" : ""}" id="timerPanel">
      <div class="timer-panel-row">
        <span>時間制限モード</span>
        <span class="timer-countdown" id="timerRemaining">${timerText(remaining, exceeded)}</span>
      </div>
      <div class="timer-progress-track" aria-hidden="true">
        <div class="timer-progress-fill" id="timerProgressFill" style="width:${timerProgressPercent(remaining, exceeded)}%"></div>
      </div>
    </section>
  `;
}

function renderTaskBody(block, task) {
  if (task.type === "ceMenu") return renderCeMenu(task);
  if (task.type === "bisection") return renderBisection(task);
  if (task.type === "inputMatch") return renderInputMatch(task);
  if (task.type === "probabilityMatch") return renderProbabilityMatch(task);
  if (task.type === "probabilityBisection") return renderProbabilityBisection(task);
  return renderMpl(task);
}

function renderCeMenu(task) {
  const runtime = state.runtime;
  const amounts = runtime.stage === "coarse" ? task.coarse : runtime.fineAmounts;
  return `
    <section class="question-box">
      <div class="step-label">${runtime.stage === "coarse" ? "おおまかなリスト" : "細かいリスト"}</div>
      <h3 class="question-title">${escapeHtml(task.prompt)}</h3>
      <div class="lottery-compare">
        <div class="lottery-box lottery-a">
          <div class="lottery-label">くじ</div>
          <div class="lottery-detail">${escapeHtml(task.lottery)}</div>
        </div>
        <div class="vs-label">vs</div>
        <div class="lottery-box lottery-b">
          <div class="lottery-label">確実な金額のリスト</div>
          <div class="lottery-detail">各行で、くじまたは確実な金額を選んでください。</div>
        </div>
      </div>
      <p class="muted">切り替える行を1つクリックしてください。上下の行は自動で入力されます。</p>
      ${renderChoiceTable(amounts.map((amount, index) => ({
        row: index + 1,
        optionA: task.lottery,
        optionB: `${formatAmount(amount, task.unit)} を確実に受け取る`,
      })), runtime.choices)}
      ${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ""}
      <button class="btn-primary" id="submitTask">${runtime.stage === "coarse" ? "細かいリストへ進む" : "回答を保存"}</button>
    </section>
  `;
}

function renderBisection(task) {
  const runtime = state.runtime;
  return `
    <section class="question-box">
      <div class="step-label">比較 ${runtime.round} / ${task.rounds}</div>
      <h3 class="question-title">${escapeHtml(task.prompt)}</h3>
      <div class="lottery-compare">
        <div class="lottery-box lottery-a">
          <div class="lottery-label">選択肢A</div>
          <div class="lottery-detail">${escapeHtml(task.optionA)}</div>
        </div>
        <div class="vs-label">vs</div>
        <div class="lottery-box lottery-b">
          <div class="lottery-label">選択肢B</div>
          <div class="lottery-detail">${escapeHtml(task.optionBPrefix)} <strong class="changing-amount">${escapeHtml(formatAmount(runtime.candidate, task.unit))}</strong>${task.optionBSuffix ? `、${escapeHtml(task.optionBSuffix)}` : ""}</div>
        </div>
      </div>
      <p class="muted">現在の探索範囲: ${escapeHtml(formatAmount(runtime.low, task.unit))} から ${escapeHtml(formatAmount(runtime.high, task.unit))}</p>
      ${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ""}
      <div class="btn-row">
        <button class="btn-choice" id="chooseA">選択肢Aを選ぶ</button>
        <button class="btn-choice" id="chooseB">選択肢Bを選ぶ</button>
      </div>
    </section>
  `;
}

function renderInputMatch(task) {
  const optionA = resolveInputMatchText(task.optionA, task);
  const optionB = resolveInputMatchText(task.optionB, task);
  const prev = inputMatchReferenceHint(task);
  return `
    <section class="question-box">
      <div class="step-label">金額入力</div>
      <h3 class="question-title">${escapeHtml(task.prompt)}</h3>
      ${prev ? `<p class="muted">${escapeHtml(prev)}</p>` : ""}
      <div class="lottery-compare">
        <div class="lottery-box lottery-a">
          <div class="lottery-label">くじL</div>
          <div class="lottery-detail">${escapeHtml(optionA)}</div>
        </div>
        <div class="vs-label">~</div>
        <div class="lottery-box lottery-b">
          <div class="lottery-label">くじR</div>
          <div class="lottery-detail">${escapeHtml(optionB)}</div>
        </div>
      </div>
      <form class="input-inline" id="inputMatchForm">
        <div class="field">
          <label for="matchValue">${escapeHtml(task.unknown)} ${task.unit ? `(${escapeHtml(task.unit)})` : ""}</label>
          <input id="matchValue" type="number" min="${task.min}" max="${task.max}" step="1" placeholder="整数で入力" autofocus />
        </div>
        <button class="btn-primary" type="submit">回答を保存</button>
      </form>
      ${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ""}
    </section>
  `;
}

function renderProbabilityMatch(task) {
  const amounts = probabilityMatchAmounts(task);
  const prev = probabilityReferenceHint([
    [task.sureSymbol, amounts.sure],
    [task.highSymbol, amounts.high],
  ]);
  return `
    <section class="question-box">
      <div class="step-label">確率入力</div>
      <h3 class="question-title">${escapeHtml(task.prompt)}</h3>
      ${prev ? `<p class="muted">${escapeHtml(prev)}</p>` : ""}
      <div class="lottery-compare">
        <div class="lottery-box lottery-a">
          <div class="lottery-label">選択肢A</div>
          <div class="lottery-detail">${escapeHtml(amountLabel(amounts.sure, task.sureSymbol))} を確実に受け取る</div>
        </div>
        <div class="vs-label">~</div>
        <div class="lottery-box lottery-b">
          <div class="lottery-label">選択肢B</div>
          <div class="lottery-detail">${escapeHtml(task.unknown)}% の確率で ${escapeHtml(amountLabel(amounts.high, task.highSymbol))}、それ以外は ${escapeHtml(formatYen(task.baselineAmount))}</div>
        </div>
      </div>
      <form class="input-inline" id="probabilityMatchForm">
        <div class="field">
          <label for="probabilityValue">${escapeHtml(task.unknown)} (%)</label>
          <input id="probabilityValue" type="number" min="${task.min}" max="${task.max}" step="1" placeholder="0〜100 の整数" autofocus />
        </div>
        <button class="btn-primary" type="submit">回答を保存</button>
      </form>
      ${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ""}
    </section>
  `;
}

function renderProbabilityBisection(task) {
  const runtime = state.runtime;
  const amounts = probabilityBisectionAmounts(task);
  const prev = probabilityReferenceHint([
    [task.sureTaskId, amounts.sure],
    [task.highTaskId, amounts.high],
  ]);
  return `
    <section class="question-box">
      <div class="step-label">確率比較 ${runtime.round} / ${task.rounds}</div>
      <h3 class="question-title">${escapeHtml(task.prompt)}</h3>
      ${prev ? `<p class="muted">${escapeHtml(prev)}</p>` : ""}
      <div class="lottery-compare">
        <div class="lottery-box lottery-a">
          <div class="lottery-label">選択肢A</div>
          <div class="lottery-detail">${escapeHtml(amountLabel(amounts.sure, task.sureTaskId))} を確実に受け取る</div>
        </div>
        <div class="vs-label">vs</div>
        <div class="lottery-box lottery-b">
          <div class="lottery-label">選択肢B</div>
          <div class="lottery-detail"><strong class="changing-amount">${formatProbability(runtime.candidate)}</strong> の確率で ${escapeHtml(amountLabel(amounts.high, task.highTaskId))}、それ以外は ${escapeHtml(formatYen(task.baselineAmount))}</div>
        </div>
      </div>
      <p class="muted">現在の探索範囲: ${formatProbability(runtime.low)} から ${formatProbability(runtime.high)}</p>
      ${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ""}
      <div class="btn-row">
        <button class="btn-choice" id="chooseA">選択肢Aを選ぶ</button>
        <button class="btn-choice" id="chooseB">選択肢Bを選ぶ</button>
      </div>
    </section>
  `;
}

function renderMpl(task) {
  const useCompact = shouldUseCompactTable(task.rows);
  const compactClass = useCompact ? "compact-question" : "";
  return `
    <section class="question-box ${compactClass}">
      <div class="step-label">選択リスト</div>
      <h3 class="question-title">${escapeHtml(task.prompt)}</h3>
      <p><strong>くじ:</strong> ${escapeHtml(task.risky)}</p>
      ${task.note ? `<p class="muted">${escapeHtml(task.note)}</p>` : ""}
      <p class="muted">切り替える行を1つクリックしてください。上下の行は自動で一貫した選択として入力されます。</p>
      ${renderChoiceTable(task.rows, state.runtime.choices, { compact: useCompact })}
      ${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ""}
      <button class="btn-primary" id="submitTask">回答を保存</button>
    </section>
  `;
}

function renderChoiceTable(rows, choices, options = {}) {
  const compact = options.compact ?? shouldUseCompactTable(rows);
  const compactClass = compact ? "compact-table" : "";
  return `
    <div class="table ${compactClass}">
      <div class="table-row table-head">
        <div>行</div>
        <div>選択肢A</div>
        <div>選択肢B</div>
      </div>
      ${rows.map((row) => `
        <div class="table-row">
          <div>${row.row}</div>
          <button class="table-option-cell choice-a ${choices[row.row] === "A" ? "selected" : ""}" data-row="${row.row}" data-choice="A" type="button">${escapeHtml(row.optionA)}</button>
          <button class="table-option-cell choice-b ${choices[row.row] === "B" ? "selected" : ""}" data-row="${row.row}" data-choice="B" type="button">${escapeHtml(row.optionB)}</button>
        </div>
      `).join("")}
    </div>
  `;
}

function shouldUseCompactTable(rows) {
  return state.phase === "task" && rows.length >= 18;
}

function bindTaskHandlers(block, task, options = {}) {
  if (task.type === "bisection") {
    document.getElementById("chooseA").addEventListener("click", () => submitBisection(block, task, "A", options));
    document.getElementById("chooseB").addEventListener("click", () => submitBisection(block, task, "B", options));
    return;
  }
  if (task.type === "inputMatch") {
    document.getElementById("inputMatchForm").addEventListener("submit", (event) => {
      event.preventDefault();
      submitInputMatch(block, task, options);
    });
    return;
  }
  if (task.type === "probabilityMatch") {
    document.getElementById("probabilityMatchForm").addEventListener("submit", (event) => {
      event.preventDefault();
      submitProbabilityMatch(block, task, options);
    });
    return;
  }
  if (task.type === "probabilityBisection") {
    document.getElementById("chooseA").addEventListener("click", () => submitProbabilityBisection(block, task, "A", options));
    document.getElementById("chooseB").addEventListener("click", () => submitProbabilityBisection(block, task, "B", options));
    return;
  }
  document.querySelectorAll("[data-row][data-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      const rows = currentSwitchRows(task);
      applySwitchPoint(rows, Number(button.dataset.row), button.dataset.choice, task.switchDirection);
      state.error = "";
      render();
    });
  });
  document.getElementById("submitTask").addEventListener("click", () => {
    if (task.type === "ceMenu") return submitCeMenu(block, task, options);
    return submitMpl(block, task, options);
  });
}

function ensureRuntime(task) {
  const taskKey = `${state.phase}-${state.blockIndex}-${state.taskIndex}-${task.taskId ?? ""}`;
  if (state.runtime && state.runtime.taskKey === taskKey) return;
  const base = { taskKey, choices: {} };
  if (task.type === "ceMenu") {
    state.runtime = { ...base, stage: "coarse", fineAmounts: [] };
  } else if (task.type === "bisection") {
    state.runtime = {
      ...base,
      low: task.low,
      high: task.high,
      candidate: midpoint(task.low, task.high),
      round: 1,
      history: [],
    };
  } else if (task.type === "probabilityBisection") {
    state.runtime = {
      ...base,
      low: task.low,
      high: task.high,
      candidate: midpointProbability(task.low, task.high),
      round: 1,
      history: [],
    };
  } else {
    state.runtime = base;
  }
}

function submitCeMenu(block, task, options = {}) {
  const runtime = state.runtime;
  const amounts = runtime.stage === "coarse" ? task.coarse : runtime.fineAmounts;
  const missing = amounts.find((_, index) => !runtime.choices[index + 1]);
  if (missing !== undefined) {
    state.error = "先に切り替える行を1つ選んでください。";
    render();
    return;
  }
  const summary = summarizeSwitch(amounts.map((amount, index) => ({
    row: index + 1,
    amount,
  })), runtime.choices, task.switchDirection);
  if (!summary.monotonic) {
    state.error = "切り替える行は1つだけ選んでください。";
    render();
    return;
  }
  if (runtime.stage === "coarse") {
    const low = summary.lower ?? task.min;
    const high = summary.upper ?? task.max;
    runtime.stage = "fine";
    runtime.choices = {};
    runtime.fineAmounts = buildFineAmounts(low, high, task.fineStep);
    runtime.coarseSummary = summary;
    state.error = "";
    render();
    return;
  }
  if (options.practice) {
    completePractice();
    return;
  }
  recordTask(block, task, {
    response_type: "ce_menu",
    ce_estimate: summary.estimate,
    switch_lower: summary.lower,
    switch_upper: summary.upper,
    switch_status: summary.status,
    switch_row: summary.switch_row,
    switch_direction: task.switchDirection ?? SWITCH_B_TO_A,
    monotonic: summary.monotonic,
    choices: runtime.choices,
  });
  nextTask();
}

function submitBisection(block, task, choice, options = {}) {
  const runtime = state.runtime;
  const candidate = runtime.candidate;
  const candidateTooLow = choice === "A";
  runtime.history.push({
    round: runtime.round,
    candidate,
    choice,
    low: runtime.low,
    high: runtime.high,
  });
  if (candidateTooLow) {
    runtime.low = candidate;
  } else {
    runtime.high = candidate;
  }
  if (runtime.round >= task.rounds) {
    const estimate = midpoint(runtime.low, runtime.high);
    if (options.practice) {
      completePractice();
      return;
    }
    recordTask(block, task, {
      response_type: "bisection",
      estimate,
      final_low: runtime.low,
      final_high: runtime.high,
      history: runtime.history,
    });
    nextTask();
    return;
  }
  runtime.round += 1;
  runtime.candidate = midpoint(runtime.low, runtime.high);
  render();
}

function submitInputMatch(block, task, options = {}) {
  const input = document.getElementById("matchValue");
  const rawValue = Number(input.value);
  const value = task.unit === "JPY" ? roundYen(rawValue) : rawValue;
  if (!Number.isFinite(value) || value < task.min || value > task.max) {
    state.error = `${formatAmount(task.min, task.unit)} から ${formatAmount(task.max, task.unit)} の範囲で数値を入力してください。`;
    render();
    return;
  }
  if (options.practice) {
    completePractice();
    return;
  }
  recordTask(block, task, {
    response_type: "outcome_matching",
    unknown: task.unknown,
    value,
  });
  nextTask();
}

function submitProbabilityMatch(block, task, options = {}) {
  const amounts = probabilityMatchAmounts(task);
  if (!Number.isFinite(amounts.sure) || !Number.isFinite(amounts.high)) {
    state.error = "前の金額回答が見つかりません。ページを更新せず、順番に回答してください。";
    render();
    return;
  }
  if (amounts.high <= task.baselineAmount || amounts.sure <= task.baselineAmount || amounts.sure >= amounts.high) {
    state.error = "前の金額回答から有効な確率比較を作れません。";
    render();
    return;
  }
  const input = document.getElementById("probabilityValue");
  const percent = Number(input.value);
  if (!Number.isFinite(percent) || percent < task.min || percent > task.max) {
    state.error = `${task.min}% から ${task.max}% の範囲で数値を入力してください。`;
    render();
    return;
  }
  if (options.practice) {
    completePractice();
    return;
  }
  recordTask(block, task, {
    response_type: "probability_matching",
    unknown: task.unknown,
    value: percent / 100,
    entered_percent: percent,
    sure_symbol: task.sureSymbol,
    high_symbol: task.highSymbol,
    sure_amount: amounts.sure,
    high_amount: amounts.high,
    baseline_amount: task.baselineAmount,
    nominal_weight_target: task.nominalWeightTarget,
  });
  nextTask();
}

function submitProbabilityBisection(block, task, choice, options = {}) {
  const runtime = state.runtime;
  const amounts = probabilityBisectionAmounts(task);
  if (!Number.isFinite(amounts.sure) || !Number.isFinite(amounts.high)) {
    state.error = "前の金額回答が見つかりません。ページを更新せず、順番に回答してください。";
    render();
    return;
  }
  if (amounts.high <= task.baselineAmount || amounts.sure <= task.baselineAmount || amounts.sure >= amounts.high) {
    state.error = "前の金額回答から有効な確率比較を作れません。";
    render();
    return;
  }
  const candidate = runtime.candidate;
  const candidateTooLow = choice === "A";
  runtime.history.push({
    round: runtime.round,
    candidate,
    choice,
    low: runtime.low,
    high: runtime.high,
    sure_amount: amounts.sure,
    high_amount: amounts.high,
    baseline_amount: task.baselineAmount,
  });
  if (candidateTooLow) {
    runtime.low = candidate;
  } else {
    runtime.high = candidate;
  }
  if (runtime.round >= task.rounds) {
    const estimate = midpointProbability(runtime.low, runtime.high);
    if (options.practice) {
      completePractice();
      return;
    }
    recordTask(block, task, {
      response_type: "probability_bisection",
      estimate,
      final_low: runtime.low,
      final_high: runtime.high,
      sure_task_id: task.sureTaskId,
      high_task_id: task.highTaskId,
      sure_amount: amounts.sure,
      high_amount: amounts.high,
      baseline_amount: task.baselineAmount,
      nominal_weight_target: task.nominalWeightTarget,
      history: runtime.history,
    });
    nextTask();
    return;
  }
  runtime.round += 1;
  runtime.candidate = midpointProbability(runtime.low, runtime.high);
  render();
}

function submitMpl(block, task, options = {}) {
  const missing = task.rows.find((row) => !state.runtime.choices[row.row]);
  if (missing) {
    state.error = "先に切り替える行を1つ選んでください。";
    render();
    return;
  }
  const summary = summarizeSwitch(task.rows, state.runtime.choices, task.switchDirection);
  if (!summary.monotonic) {
    state.error = "切り替える行は1つだけ選んでください。";
    render();
    return;
  }
  if (options.practice) {
    completePractice();
    return;
  }
  recordTask(block, task, {
    response_type: "mpl",
    ce_estimate: summary.estimate,
    switch_lower: summary.lower,
    switch_upper: summary.upper,
    switch_status: summary.status,
    switch_row: summary.switch_row,
    switch_direction: task.switchDirection ?? SWITCH_B_TO_A,
    monotonic: summary.monotonic,
    choices: state.runtime.choices,
  });
  nextTask();
}

function currentSwitchRows(task) {
  if (task.type !== "ceMenu") return task.rows;
  const runtime = state.runtime;
  const amounts = runtime.stage === "coarse" ? task.coarse : runtime.fineAmounts;
  return amounts.map((amount, index) => ({
    row: index + 1,
    amount,
  }));
}

function applySwitchPoint(rows, clickedRow, clickedChoice, direction = SWITCH_B_TO_A) {
  const clickedIndex = rows.findIndex((row) => Number(row.row) === Number(clickedRow));
  if (clickedIndex < 0) return;
  const choices = {};
  rows.forEach((row, index) => {
    if (direction === SWITCH_A_TO_B) {
      choices[row.row] = clickedChoice === "B"
        ? (index < clickedIndex ? "A" : "B")
        : (index <= clickedIndex ? "A" : "B");
      return;
    }
    choices[row.row] = clickedChoice === "A"
      ? (index < clickedIndex ? "B" : "A")
      : (index <= clickedIndex ? "B" : "A");
  });
  state.runtime.choices = choices;
  state.runtime.switchAnchor = { row: clickedRow, choice: clickedChoice, direction };
}

function summarizeSwitch(rows, choices, direction = SWITCH_B_TO_A) {
  if (direction === SWITCH_A_TO_B) return summarizeAToB(rows, choices);
  return summarizeBToA(rows, choices);
}

function summarizeBToA(rows, choices) {
  const firstAIndex = rows.findIndex((row) => choices[row.row] === "A");
  const hasBAfterA = firstAIndex >= 0 && rows.slice(firstAIndex + 1).some((row) => choices[row.row] === "B");
  if (firstAIndex === -1) {
    const lowest = rows[rows.length - 1].amount;
    return { status: "below_range", estimate: lowest, lower: null, upper: lowest, monotonic: !hasBAfterA, switch_row: null };
  }
  if (firstAIndex === 0) {
    const highest = rows[0].amount;
    return { status: "above_range", estimate: highest, lower: highest, upper: null, monotonic: !hasBAfterA, switch_row: rows[0].row };
  }
  const lower = rows[firstAIndex].amount;
  const upper = rows[firstAIndex - 1].amount;
  return {
    status: hasBAfterA ? "multiple_switch" : "bracketed",
    estimate: midpoint(lower, upper),
    lower,
    upper,
    monotonic: !hasBAfterA,
    switch_row: rows[firstAIndex].row,
  };
}

function summarizeAToB(rows, choices) {
  const firstBIndex = rows.findIndex((row) => choices[row.row] === "B");
  const hasAAfterB = firstBIndex >= 0 && rows.slice(firstBIndex + 1).some((row) => choices[row.row] === "A");
  if (firstBIndex === -1) {
    const last = rows[rows.length - 1].amount;
    return { status: "never_switch", estimate: last, lower: last, upper: null, monotonic: !hasAAfterB, switch_row: null };
  }
  if (firstBIndex === 0) {
    const first = rows[0].amount;
    return { status: "switch_first", estimate: first, lower: null, upper: first, monotonic: !hasAAfterB, switch_row: rows[0].row };
  }
  const lower = rows[firstBIndex - 1].amount;
  const upper = rows[firstBIndex].amount;
  return {
    status: hasAAfterB ? "multiple_switch" : "switched_at_row",
    estimate: rows[firstBIndex].amount,
    lower,
    upper,
    monotonic: !hasAAfterB,
    switch_row: rows[firstBIndex].row,
  };
}

function buildFineAmounts(low, high, stepCount) {
  const sortedHigh = Math.max(low, high);
  const sortedLow = Math.min(low, high);
  return range(sortedHigh, sortedLow, stepCount + 1);
}

function midpoint(a, b) {
  return roundYen((a + b) / 2);
}

function midpointProbability(a, b) {
  const lowPercent = probabilityToPercent(a);
  const highPercent = probabilityToPercent(b);
  return Math.floor((lowPercent + highPercent) / 2) / 100;
}

function formatProbability(value) {
  return `${probabilityToPercent(value)}%`;
}

function probabilityToPercent(value) {
  return Math.round(Number(value) * 100);
}

function probabilityMatchAmounts(task) {
  return {
    sure: previousInputValue(task.sureSymbol),
    high: previousInputValue(task.highSymbol),
  };
}

function probabilityBisectionAmounts(task) {
  return {
    sure: previousEstimateByTaskId(task.sureTaskId),
    high: previousEstimateByTaskId(task.highTaskId),
  };
}

function probabilityReferenceHint(entries) {
  const resolved = entries
    .filter(([, value]) => Number.isFinite(value))
    .map(([label, value]) => `${label} = ${formatYen(value)}`);
  if (!resolved.length) return "";
  return `前の回答を代入済み: ${resolved.join(", ")}`;
}

function amountLabel(value, fallback) {
  return Number.isFinite(value) ? formatYen(value) : fallback;
}

function recordTask(block, task, payload) {
  const taskMode = currentTaskMode();
  const timeOverSeconds = taskMode === MODE_TIME_PRESSURE ? exceededTaskSeconds() : "";
  const memoryFields = memoryRecordFields();
  const record = {
    pwf_trial: state.records.length + 1,
    participant: state.participant,
    assignment_group: state.assignment?.groupNumber ?? "",
    assignment_modulus: state.assignment?.modulus ?? "",
    student_id_last3: state.assignment?.lastThreeText ?? "",
    student_id_last_digit: "",
    amount_level: "standard",
    amount_multiplier: 1,
    assigned_block_id: state.assignment?.blockId ?? block.id,
    task_id: task.taskId ?? "",
    is_anchor: Boolean(task.isAnchor),
    block_id: block.id,
    block_title: block.title,
    task_index: state.taskIndex + 1,
    task_type: task.type,
    task_mode: taskMode,
    time_limit_seconds: taskMode === MODE_TIME_PRESSURE ? TIME_PRESSURE_SECONDS : "",
    timed_out: taskMode === MODE_TIME_PRESSURE && (state.taskTimedOut || timeOverSeconds > 0),
    time_over_seconds: timeOverSeconds,
    ...memoryFields,
    prompt: task.prompt,
    payload: {
      ...payload,
      memory: memoryPayloadFields(memoryFields),
    },
    response_time_ms: state.taskStartedAt ? Date.now() - state.taskStartedAt : null,
    timestamp: new Date().toISOString(),
  };
  state.records.push(record);
  state.error = "";
  saveState();
  postEmbeddedMessage({
    type: "pwf-record",
    participant: state.participant,
    assignment: state.assignment,
    record,
  });
}

function nextTask() {
  if (currentTaskMode() === MODE_NUMBER_MEMORY && state.memoryChallenge && !state.memoryChallenge.postCompleted) {
    state.phase = "memoryPostRecall";
    state.memoryChallenge.postStartedAt = Date.now();
    state.error = "";
    saveState();
    render();
    scrollToTopAfterRender();
    return;
  }
  advanceToNextTask();
}

function advanceToNextTask() {
  const block = currentBlock();
  if (state.taskIndex + 1 < block.tasks.length) {
    state.taskIndex += 1;
    startCurrentTaskFlow();
    return;
  }
  state.phase = "finish";
  state.runtime = null;
  state.taskTimedOut = false;
  state.memoryChallenge = null;
  state.csvDownloaded = false;
  saveState();
  render();
  scrollToTopAfterRender();
}

function memoryRecordFields() {
  const challenge = state.memoryChallenge;
  const isMemoryTask = currentTaskMode() === MODE_NUMBER_MEMORY && challenge?.taskIndex === state.taskIndex;
  if (!isMemoryTask) {
    return {
      has_memory_task: false,
      memory_digits: "",
      memory_seconds: "",
      memory_number: "",
      memory_input_pre: "",
      memory_pre_correct: "",
      memory_input_post: "",
      memory_post_correct: "",
      memory_display_duration_ms: "",
      memory_pre_response_time_ms: "",
      memory_post_response_time_ms: "",
    };
  }
  return {
    has_memory_task: true,
    memory_digits: challenge.digits ?? NUMBER_MEMORY_DIGITS,
    memory_seconds: challenge.seconds ?? NUMBER_MEMORY_SECONDS,
    memory_number: challenge.number ?? "",
    memory_input_pre: challenge.preInput ?? "",
    memory_pre_correct: challenge.preCorrect,
    memory_input_post: challenge.postInput ?? "",
    memory_post_correct: challenge.postCorrect,
    memory_display_duration_ms: challenge.displayStartedAt && challenge.displayEndedAt ? challenge.displayEndedAt - challenge.displayStartedAt : "",
    memory_pre_response_time_ms: challenge.preResponseTimeMs ?? "",
    memory_post_response_time_ms: challenge.postResponseTimeMs ?? "",
  };
}

function memoryPayloadFields(fields) {
  if (!fields.has_memory_task) return null;
  return {
    digits: fields.memory_digits,
    seconds: fields.memory_seconds,
    number: fields.memory_number,
    input_pre: fields.memory_input_pre,
    pre_correct: fields.memory_pre_correct,
    input_post: fields.memory_input_post,
    post_correct: fields.memory_post_correct,
    display_duration_ms: fields.memory_display_duration_ms,
    pre_response_time_ms: fields.memory_pre_response_time_ms,
    post_response_time_ms: fields.memory_post_response_time_ms,
  };
}

function updateCurrentMemoryRecord() {
  const record = state.records[state.records.length - 1];
  if (!record || record.task_index !== state.taskIndex + 1) return;
  const fields = memoryRecordFields();
  Object.assign(record, fields, {
    payload: {
      ...record.payload,
      memory: memoryPayloadFields(fields),
    },
  });
  record.timestamp = new Date().toISOString();
  state.error = "";
  saveState();
  postEmbeddedMessage({
    type: "pwf-record",
    participant: state.participant,
    assignment: state.assignment,
    record,
  });
}

function renderFinish() {
  app.innerHTML = `
    <main class="screen narrow-screen">
      <section class="center-card">
        <div class="step-label">終了</div>
        <h2>終了しました</h2>
        <p>${state.records.length} 件の課題単位の記録を保存しました。${EMBEDDED_MODE ? "次の課題へ進みます。" : "CSV ファイルを保存しました。"}</p>
      </section>
    </main>
  `;
  if (EMBEDDED_MODE) {
    postEmbeddedMessage({
      type: "pwf-complete",
      participant: state.participant,
      assignment: state.assignment,
      record_count: state.records.length,
    });
  }
  if (!state.csvDownloaded) {
    state.csvDownloaded = true;
    saveState();
    if (!EMBEDDED_MODE) {
      downloadCsv(csvFilename(), state.records);
    }
  }
}

function summaryText(payload) {
  if (payload.response_type === "bisection") return `推定値=${payload.estimate}`;
  if (payload.response_type === "outcome_matching") return `${payload.unknown}=${payload.value}`;
  if (payload.response_type === "probability_matching") return `${payload.unknown}=${formatProbability(payload.value)}`;
  if (payload.response_type === "probability_bisection") return `推定確率=${formatProbability(payload.estimate)}`;
  return `推定値=${payload.ce_estimate}, 状態=${switchStatusLabel(payload.switch_status)}`;
}

function taskTypeLabel(type) {
  if (type === "bisection") return "段階比較";
  if (type === "inputMatch") return "金額入力";
  if (type === "probabilityMatch") return "確率入力";
  if (type === "probabilityBisection") return "確率段階比較";
  if (type === "mpl") return "選択リスト";
  if (type === "ceMenu") return "確実同等額リスト";
  return type;
}

function switchStatusLabel(status) {
  const labels = {
    below_range: "範囲下限以下",
    above_range: "範囲上限以上",
    bracketed: "範囲内",
    multiple_switch: "複数切り替え",
    never_switch: "切り替えなし",
    switch_first: "最初の行で切り替え",
    switched_at_row: "切り替え済み",
  };
  return labels[status] ?? status;
}

function currentBlock() {
  return BASE_BLOCKS[state.blockIndex];
}

function currentTask() {
  return currentBlock().tasks[state.taskIndex];
}

function assignBlockFromStudentId(studentId) {
  const normalized = String(studentId ?? "").trim();
  if (!/^\d{7}$/.test(normalized)) {
    return { error: "7桁の学籍番号を半角数字で入力してください。" };
  }
  const lastThreeText = normalized.slice(-3);
  const lastThree = Number(lastThreeText);
  const blockIndex = lastThree % ASSIGNMENT_MODULUS;
  const block = BASE_BLOCKS[blockIndex];
  return {
    studentId: normalized,
    lastThree,
    lastThreeText,
    modulus: ASSIGNMENT_MODULUS,
    groupNumber: blockIndex + 1,
    blockIndex,
    blockId: block.id,
    blockTitle: block.title,
  };
}

function normalizeAssignment(studentId, assignment) {
  const fresh = assignBlockFromStudentId(studentId);
  if (!fresh.error) return fresh;
  return {
    ...(assignment && typeof assignment === "object" ? assignment : {}),
  };
}

function inputMatchReferenceHint(task) {
  const references = inputMatchReferenceSymbols(`${task.optionA} ${task.optionB}`)
    .filter((symbol) => symbol !== task.unknown)
    .map((symbol) => [symbol, previousInputValue(symbol)])
    .filter(([, value]) => value !== null);
  if (!references.length) return "";
  return `前の回答を代入済み: ${references.map(([symbol, value]) => `${symbol} = ${formatAmount(value, task.unit)}`).join(", ")}`;
}

function resolveInputMatchText(text, task) {
  return text.replace(/\b[xy]\d+\b/g, (symbol) => {
    if (symbol === task.unknown) return symbol;
    const value = previousInputValue(symbol);
    return value === null ? symbol : formatAmount(value, task.unit);
  });
}

function inputMatchReferenceSymbols(text) {
  return [...new Set(text.match(/\b[xy]\d+\b/g) ?? [])];
}

function previousInputValue(symbol) {
  const previous = [...state.records].reverse().find((record) =>
    record.payload?.response_type === "outcome_matching" && record.payload?.unknown === symbol
  );
  return previous ? previous.payload.value : null;
}

function previousEstimateByTaskId(taskId) {
  const previous = [...state.records].reverse().find((record) =>
    record.task_id === taskId && Number.isFinite(Number(record.payload?.estimate ?? record.payload?.ce_estimate ?? record.payload?.value))
  );
  if (!previous) return null;
  return Number(previous.payload.estimate ?? previous.payload.ce_estimate ?? previous.payload.value);
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  triggerDownload(filename, blob);
}

function csvFilename() {
  const participant = state.participant ? `-${state.participant}` : "";
  return `pwf-results${participant}.csv`;
}

function downloadCsv(filename, data) {
  const columns = [
    "participant",
    "assignment_group",
    "assignment_modulus",
    "student_id_last3",
    "student_id_last_digit",
    "amount_level",
    "amount_multiplier",
    "assigned_block_id",
    "block_id",
    "block_title",
    "task_id",
    "is_anchor",
    "task_index",
    "task_type",
    "task_mode",
    "time_limit_seconds",
    "timed_out",
    "time_over_seconds",
    "has_memory_task",
    "memory_digits",
    "memory_seconds",
    "memory_number",
    "memory_input_pre",
    "memory_pre_correct",
    "memory_input_post",
    "memory_post_correct",
    "memory_display_duration_ms",
    "memory_pre_response_time_ms",
    "memory_post_response_time_ms",
    "response_type",
    "estimate",
    "switch_lower",
    "switch_upper",
    "switch_row",
    "switch_direction",
    "switch_status",
    "monotonic",
    "response_time_ms",
    "timestamp",
  ];
  const rows = data.map((record) => ({
    participant: record.participant,
    assignment_group: record.assignment_group,
    assignment_modulus: record.assignment_modulus,
    student_id_last3: record.student_id_last3,
    student_id_last_digit: record.student_id_last_digit,
    amount_level: record.amount_level,
    amount_multiplier: record.amount_multiplier,
    assigned_block_id: record.assigned_block_id,
    block_id: record.block_id,
    block_title: record.block_title,
    task_id: record.task_id,
    is_anchor: record.is_anchor,
    task_index: record.task_index,
    task_type: record.task_type,
    task_mode: record.task_mode,
    time_limit_seconds: record.time_limit_seconds,
    timed_out: record.timed_out,
    time_over_seconds: record.time_over_seconds,
    has_memory_task: record.has_memory_task,
    memory_digits: record.memory_digits,
    memory_seconds: record.memory_seconds,
    memory_number: record.memory_number,
    memory_input_pre: record.memory_input_pre,
    memory_pre_correct: record.memory_pre_correct,
    memory_input_post: record.memory_input_post,
    memory_post_correct: record.memory_post_correct,
    memory_display_duration_ms: record.memory_display_duration_ms,
    memory_pre_response_time_ms: record.memory_pre_response_time_ms,
    memory_post_response_time_ms: record.memory_post_response_time_ms,
    response_type: record.payload.response_type,
    estimate: record.payload.ce_estimate ?? record.payload.estimate ?? record.payload.value ?? "",
    switch_lower: record.payload.switch_lower ?? record.payload.final_low ?? "",
    switch_upper: record.payload.switch_upper ?? record.payload.final_high ?? "",
    switch_row: record.payload.switch_row ?? "",
    switch_direction: record.payload.switch_direction ?? "",
    switch_status: record.payload.switch_status ?? "",
    monotonic: record.payload.monotonic ?? "",
    response_time_ms: record.response_time_ms,
    timestamp: record.timestamp,
  }));
  const csv = [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(",")),
  ].join("\n");
  triggerDownload(filename, new Blob([csv], { type: "text/csv" }));
}

function triggerDownload(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function runSmokeTest() {
  Object.assign(state, {
    phase: "finish",
    participant: "9999000",
    assignment: assignBlockFromStudentId("9999000"),
    blockIndex: 0,
    taskIndex: 0,
    runtime: null,
    records: [],
    blockStartedAt: Date.now(),
    taskStartedAt: Date.now(),
    taskModes: [],
    taskTimedOut: false,
    memoryChallenge: null,
    csvDownloaded: false,
    error: "",
  });

  const failures = [];
  const expectedRecords = BASE_BLOCKS.reduce((sum, block) => sum + block.tasks.length, 0);

  BASE_BLOCKS.forEach((_baseBlock, blockIndex) => {
    state.phase = "task";
    state.blockIndex = blockIndex;
    state.participant = String(9999000 + blockIndex);
    state.assignment = assignBlockFromStudentId(state.participant);
    const block = currentBlock();
    state.taskModes = createTaskModes(block.tasks);
    const modeCounts = countModes(state.taskModes);
    if (block.tasks.length !== 12) {
      failures.push(`${block.title} task count ${block.tasks.length}, expected 12`);
    }
    if (modeCounts[MODE_NORMAL] !== 6 || modeCounts[MODE_TIME_PRESSURE] !== 3 || modeCounts[MODE_NUMBER_MEMORY] !== 3) {
      failures.push(`${block.title} mode counts normal=${modeCounts[MODE_NORMAL] ?? 0}, time_pressure=${modeCounts[MODE_TIME_PRESSURE] ?? 0}, number_memory=${modeCounts[MODE_NUMBER_MEMORY] ?? 0}`);
    }
    if (state.taskModes[0] !== MODE_NORMAL) {
      failures.push(`${block.title} first task mode ${state.taskModes[0]}, expected normal`);
    }
    block.tasks.forEach((task, taskIndex) => {
      state.taskIndex = taskIndex;
      state.taskStartedAt = Date.now();
      state.taskTimedOut = false;
      state.memoryChallenge = smokeMemoryChallengeIfNeeded(taskIndex);
      try {
        recordSmokeTask(block, task);
      } catch (error) {
        failures.push(`${block.title} task ${taskIndex + 1}: ${error.message}`);
      }
    });
  });

  const taskTypes = new Set(state.records.map((record) => record.task_type));
  ["bisection", "probabilityBisection", "mpl"].forEach((type) => {
    if (!taskTypes.has(type)) failures.push(`missing task type: ${type}`);
  });
  if (state.records.length !== expectedRecords) {
    failures.push(`record count ${state.records.length}, expected ${expectedRecords}`);
  }
  BASE_BLOCKS.forEach((block) => {
    const blockRecords = state.records.filter((record) => record.block_id === block.id);
    const modeCounts = countModes(blockRecords.map((record) => record.task_mode));
    if (modeCounts[MODE_NORMAL] !== 6 || modeCounts[MODE_TIME_PRESSURE] !== 3 || modeCounts[MODE_NUMBER_MEMORY] !== 3) {
      failures.push(`${block.title} exported mode counts normal=${modeCounts[MODE_NORMAL] ?? 0}, time_pressure=${modeCounts[MODE_TIME_PRESSURE] ?? 0}, number_memory=${modeCounts[MODE_NUMBER_MEMORY] ?? 0}`);
    }
    if (blockRecords[0]?.task_mode !== MODE_NORMAL) {
      failures.push(`${block.title} first exported task mode ${blockRecords[0]?.task_mode}, expected normal`);
    }
    if (blockRecords.some((record) => record.task_mode === MODE_TIME_PRESSURE && record.time_limit_seconds !== TIME_PRESSURE_SECONDS)) {
      failures.push(`${block.title} time pressure limit is not ${TIME_PRESSURE_SECONDS}`);
    }
    const memoryRecords = blockRecords.filter((record) => record.task_mode === MODE_NUMBER_MEMORY);
    if (memoryRecords.length !== 3) failures.push(`${block.title} memory record count ${memoryRecords.length}, expected 3`);
    if (memoryRecords.some((record) => !record.has_memory_task || !/^\d{5}$/.test(String(record.memory_number)))) {
      failures.push(`${block.title} memory record missing 5-digit number`);
    }
    if (blockRecords.some((record) => record.task_id.startsWith("practice-"))) {
      failures.push(`${block.title} practice task leaked into exported records`);
    }
  });

  state.blockIndex = BASE_BLOCKS.length - 1;
  state.taskIndex = currentBlock().tasks.length - 1;
  saveState();
  renderSmokeResult(failures, expectedRecords);
}

function countModes(modes) {
  return modes.reduce((counts, mode) => {
    counts[mode] = (counts[mode] ?? 0) + 1;
    return counts;
  }, {});
}

function smokeMemoryChallengeIfNeeded(taskIndex) {
  if (currentTaskMode() !== MODE_NUMBER_MEMORY) return null;
  const now = Date.now();
  const number = "12345";
  return {
    taskIndex,
    number,
    digits: NUMBER_MEMORY_DIGITS,
    seconds: NUMBER_MEMORY_SECONDS,
    displayStartedAt: now - NUMBER_MEMORY_SECONDS * 1000,
    displayEndedAt: now,
    preStartedAt: now - 1200,
    preInput: number,
    preCorrect: true,
    preResponseTimeMs: 1200,
    postStartedAt: now - 900,
    postInput: number,
    postCorrect: true,
    postResponseTimeMs: 900,
    postCompleted: true,
  };
}

function recordSmokeTask(block, task) {
  if (task.type === "ceMenu") {
    const coarseChoices = smokeChoices(task.coarse.map((amount, index) => ({ row: index + 1, amount })), task.switchDirection);
    const coarseSummary = summarizeSwitch(task.coarse.map((amount, index) => ({
      row: index + 1,
      amount,
    })), coarseChoices, task.switchDirection);
    const fineAmounts = buildFineAmounts(coarseSummary.lower ?? task.min, coarseSummary.upper ?? task.max, task.fineStep);
    const fineRows = fineAmounts.map((amount, index) => ({ row: index + 1, amount }));
    const fineChoices = smokeChoices(fineRows, task.switchDirection);
    const fineSummary = summarizeSwitch(fineRows, fineChoices, task.switchDirection);
    recordTask(block, task, {
      response_type: "ce_menu",
      ce_estimate: fineSummary.estimate,
      switch_lower: fineSummary.lower,
      switch_upper: fineSummary.upper,
      switch_status: fineSummary.status,
      switch_row: fineSummary.switch_row,
      switch_direction: task.switchDirection ?? SWITCH_B_TO_A,
      monotonic: fineSummary.monotonic,
      choices: fineChoices,
      smoke_coarse: coarseSummary,
    });
    return;
  }

  if (task.type === "bisection") {
    let low = task.low;
    let high = task.high;
    const history = [];
    for (let round = 1; round <= task.rounds; round += 1) {
      const candidate = midpoint(low, high);
      const choice = round % 2 === 1 ? "A" : "B";
      history.push({ round, candidate, choice, low, high });
      if (choice === "A") low = candidate;
      else high = candidate;
    }
    recordTask(block, task, {
      response_type: "bisection",
      estimate: midpoint(low, high),
      final_low: low,
      final_high: high,
      history,
    });
    return;
  }

  if (task.type === "inputMatch") {
    recordTask(block, task, {
      response_type: "outcome_matching",
      unknown: task.unknown,
      value: midpoint(task.min, task.max),
    });
    return;
  }

  if (task.type === "probabilityMatch") {
    const amounts = probabilityMatchAmounts(task);
    recordTask(block, task, {
      response_type: "probability_matching",
      unknown: task.unknown,
      value: 0.5,
      entered_percent: 50,
      sure_symbol: task.sureSymbol,
      high_symbol: task.highSymbol,
      sure_amount: amounts.sure,
      high_amount: amounts.high,
      baseline_amount: task.baselineAmount,
      nominal_weight_target: task.nominalWeightTarget,
    });
    return;
  }

  if (task.type === "probabilityBisection") {
    const amounts = probabilityBisectionAmounts(task);
    let low = task.low;
    let high = task.high;
    const history = [];
    for (let round = 1; round <= task.rounds; round += 1) {
      const candidate = midpointProbability(low, high);
      const choice = round % 2 === 1 ? "A" : "B";
      history.push({
        round,
        candidate,
        choice,
        low,
        high,
        sure_amount: amounts.sure,
        high_amount: amounts.high,
        baseline_amount: task.baselineAmount,
      });
      if (choice === "A") low = candidate;
      else high = candidate;
    }
    recordTask(block, task, {
      response_type: "probability_bisection",
      estimate: midpointProbability(low, high),
      final_low: low,
      final_high: high,
      sure_task_id: task.sureTaskId,
      high_task_id: task.highTaskId,
      sure_amount: amounts.sure,
      high_amount: amounts.high,
      baseline_amount: task.baselineAmount,
      nominal_weight_target: task.nominalWeightTarget,
      history,
    });
    return;
  }

  const choices = smokeChoices(task.rows, task.switchDirection);
  const summary = summarizeSwitch(task.rows, choices, task.switchDirection);
  recordTask(block, task, {
    response_type: "mpl",
    ce_estimate: summary.estimate,
    switch_lower: summary.lower,
    switch_upper: summary.upper,
    switch_status: summary.status,
    switch_row: summary.switch_row,
    switch_direction: task.switchDirection ?? SWITCH_B_TO_A,
    monotonic: summary.monotonic,
    choices,
  });
}

function smokeChoices(rows, direction = SWITCH_B_TO_A) {
  const pivot = Math.max(1, Math.floor(rows.length / 2));
  return rows.reduce((choices, row, index) => {
    choices[row.row] = direction === SWITCH_A_TO_B
      ? (index < pivot ? "A" : "B")
      : (index < pivot ? "B" : "A");
    return choices;
  }, {});
}

function renderSmokeResult(failures, expectedRecords) {
  const passed = failures.length === 0;
  const counts = state.records.reduce((acc, record) => {
    acc[record.task_type] = (acc[record.task_type] ?? 0) + 1;
    return acc;
  }, {});
  app.innerHTML = `
    <main class="screen narrow-screen">
      <section class="center-card">
        <div class="step-label">Smoke test</div>
        <h1>${passed ? "Smoke test passed" : "Smoke test failed"}</h1>
        <p data-smoke-status="${passed ? "passed" : "failed"}">
          ${passed
            ? `生成了 ${state.records.length} / ${expectedRecords} 条 task-level 记录，覆盖 bisection、probability bisection、MPL。`
            : `发现 ${failures.length} 个问题。`}
        </p>
        <div class="result-list">
          ${Object.entries(counts).map(([type, count]) => `
            <div class="result-item"><strong>${escapeHtml(type)}</strong> | ${count}</div>
          `).join("")}
          ${failures.map((failure) => `<div class="result-item error">${escapeHtml(failure)}</div>`).join("")}
        </div>
        <div class="btn-row">
          <a class="btn-primary link-button" href="./">打开正常模式</a>
          <button class="btn-secondary" id="downloadSmoke">下载 smoke JSON</button>
        </div>
      </section>
    </main>
  `;
  document.getElementById("downloadSmoke").addEventListener("click", () => downloadJson("pwf-smoke-results.json", state.records));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

if (new URLSearchParams(window.location.search).get("smoke") === "1") {
  runSmokeTest();
} else {
  initializeNavigationHistory();
  render();
}
