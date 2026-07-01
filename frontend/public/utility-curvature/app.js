const SWITCH_B_TO_A = "B_TO_A";
const SWITCH_A_TO_B = "A_TO_B";
const ASSIGNMENT_MODULUS = 5;
const TIME_PRESSURE_SECONDS = 20;
const MODE_NORMAL = "normal";
const MODE_TIME_PRESSURE = "time_pressure";
const EMBEDDED_MODE = new URLSearchParams(window.location.search).get("embedded") === "1";
const TANAKA_SERIES_3_GAIN_OFFSET = 21;

const BLOCKS = [
  {
    id: "tanaka-camerer-nguyen-2010",
    title: "Tanaka, Camerer & Nguyen (2010)",
    label: "3系列 + 共通2問",
    method: "switching-point estimation with gain-only Tanaka-style series",
    intro:
      "各くじでは、1から10までの数字が書かれた10個の玉から1個を無作為に引きます。引いた玉の数字に対応する金額が、そのくじの結果になります。最後に全員共通の2問があります。",
    assumptions:
      "Table 2 の構造を日本円表示に置き換えています。1つの系列につき、切り替える行を1回クリックして回答します。",
    tasks: withCommonAnchors([
      createTanakaSeriesTask(
        "tanaka-series-1",
        "シリーズ 1",
        "選択肢Aは固定です。選択肢Bの高い支払いが行ごとに大きくなります。",
        [68, 75, 83, 93, 106, 125, 150, 185, 220, 300, 400, 600, 1000, 1700].map((bHigh) => ({
          optionA: `①②③: ${formatYen(tanakaYen(40))}、④⑤⑥⑦⑧⑨⑩: ${formatYen(tanakaYen(10))}`,
          optionB: `①: ${formatYen(tanakaYen(bHigh))}、②③④⑤⑥⑦⑧⑨⑩: ${formatYen(tanakaYen(5))}`,
        }))
      ),
      createTanakaSeriesTask(
        "tanaka-series-2",
        "シリーズ 2",
        "選択肢Aは固定です。選択肢Bの高い支払いが行ごとに大きくなります。",
        [54, 56, 58, 60, 62, 65, 68, 72, 77, 83, 90, 100, 110, 130].map((bHigh) => ({
          optionA: `①②③④⑤⑥⑦⑧⑨: ${formatYen(tanakaYen(40))}、⑩: ${formatYen(tanakaYen(30))}`,
          optionB: `①②③④⑤⑥⑦: ${formatYen(tanakaYen(bHigh))}、⑧⑨⑩: ${formatYen(tanakaYen(5))}`,
        }))
      ),
      createTanakaSeriesTask(
        "tanaka-series-3",
        "シリーズ 3",
        "すべての結果が0円以上になるように調整したくじです。どの行からBを選ぶかをクリックしてください。",
        [
          [25, -4, 30, -21],
          [4, -4, 30, -21],
          [1, -4, 30, -21],
          [1, -4, 30, -16],
          [1, -8, 30, -16],
          [1, -8, 30, -14],
          [1, -8, 30, -11],
        ].map(([aHigh, aLow, bHigh, bLow]) => ({
          optionA: `①②③④⑤: ${formatYen(tanakaYen(aHigh + TANAKA_SERIES_3_GAIN_OFFSET))}、⑥⑦⑧⑨⑩: ${formatYen(tanakaYen(aLow + TANAKA_SERIES_3_GAIN_OFFSET))}`,
          optionB: `①②③④⑤: ${formatYen(tanakaYen(bHigh + TANAKA_SERIES_3_GAIN_OFFSET))}、⑥⑦⑧⑨⑩: ${formatYen(tanakaYen(bLow + TANAKA_SERIES_3_GAIN_OFFSET))}`,
        }))
      ),
    ]),
  },
  {
    id: "choi-2022-study2",
    title: "Choi et al. (2022) Study 2",
    label: "8リスト + 共通2問",
    method: "power utility alpha estimated in ML2",
    intro:
      "このブロックでは、くじと確実な金額を比べる8つのリストに回答します。最後に全員共通の2問があります。",
    assumptions:
      "31行のリストで、切り替える行を1回クリックすると、上下の行が自動入力されます。",
    tasks: withCommonAnchors([
      createMplTask(lotteryText(50, 2000, 50, 0), "確実な金額", "JPY", range(2000, 0, 31), "JPY", { taskId: "choi-risk-1" }),
      createMplTask(lotteryText(25, 4000, 75, 0), "確実な金額", "JPY", range(4000, 0, 31), "JPY", { taskId: "choi-risk-2" }),
      createMplTask(lotteryText(75, 2000, 25, 0), "確実な金額", "JPY", range(2000, 0, 31), "JPY", { taskId: "choi-risk-3" }),
      createMplTask(lotteryText(50, 4000, 50, 1000), "確実な金額", "JPY", range(4000, 1000, 31), "JPY", { taskId: "choi-risk-4" }),
      createMplTask(lotteryText(10, 10000, 90, 0), "確実な金額", "JPY", range(10000, 0, 31), "JPY", { taskId: "choi-risk-5" }),
      createMplTask(lotteryText(90, 1500, 10, 0), "確実な金額", "JPY", range(1500, 0, 31), "JPY", { taskId: "choi-risk-6" }),
      createMplTask(lotteryText(33, 6000, 67, 0), "確実な金額", "JPY", range(6000, 0, 31), "JPY", { taskId: "choi-risk-7" }),
      createMplTask(lotteryText(67, 3000, 33, 500), "確実な金額", "JPY", range(3000, 500, 31), "JPY", { taskId: "choi-risk-8" }),
    ]),
  },
  {
    id: "abdellaoui-2000",
    title: "Abdellaoui (2000)",
    label: "8問 + 共通2問",
    method: "parameter-free utility standard sequence",
    intro:
      "このブロックでは、段階的な比較によって、2つのくじが同じくらい魅力的になる金額を探します。最後に全員共通の2問があります。",
    assumptions:
      "各問題は5回の比較で終了します。金額はすべて日本円表示です。",
    tasks: withCommonAnchors([
      createBisectionTask("abdellaoui-1", "2/3", "1/3", 1000, 500, 0, 1000, 6000),
      createBisectionTask("abdellaoui-2", "2/3", "1/3", 2000, 1000, 0, 2000, 8000),
      createBisectionTask("abdellaoui-3", "1/2", "1/2", 3000, 1000, 0, 3000, 9000),
      createBisectionTask("abdellaoui-4", "1/2", "1/2", 4000, 2000, 0, 4000, 12000),
      createBisectionTask("abdellaoui-5", "1/3", "2/3", 6000, 1000, 0, 6000, 16000),
      createBisectionTask("abdellaoui-6", "1/3", "2/3", 8000, 2000, 0, 8000, 20000),
      createBisectionTask("abdellaoui-7", "3/4", "1/4", 3000, 1000, 0, 3000, 9000),
      createBisectionTask("abdellaoui-8", "1/4", "3/4", 10000, 2000, 0, 10000, 26000),
    ]),
  },
  {
    id: "booij-2010",
    title: "Booij et al. (2010)",
    label: "10問 + 共通2問",
    method: "chained outcome matching + parametric utility",
    intro:
      "このブロックでは、2つのくじが同じくらい魅力的になるように、欠けている金額を入力します。最後に全員共通の2問があります。",
    assumptions:
      "一部の問題では、前の問題で入力した値を次の問題に代入します。金額はすべて日本円表示です。",
    tasks: withCommonAnchors([
      createInputMatchTask("booij-x1", "x1", "x1 を入力して、2つのくじが同じくらい魅力的になるようにしてください。", `50%の確率で x1、50%の確率で ${formatYen(1200)}`, `50%の確率で ${formatYen(10000)}、50%の確率で ${formatYen(6400)}`, 0, 30000),
      createInputMatchTask("booij-x2", "x2", "x2 を入力して、2つのくじが同じくらい魅力的になるようにしてください。", "50%の確率で x2、50%の確率で x1", `50%の確率で ${formatYen(10000)}、50%の確率で ${formatYen(6400)}`, 0, 50000),
      createInputMatchTask("booij-x3", "x3", "x3 を入力して、2つのくじが同じくらい魅力的になるようにしてください。", "50%の確率で x3、50%の確率で x2", `50%の確率で ${formatYen(10000)}、50%の確率で ${formatYen(6400)}`, 0, 70000),
      createInputMatchTask("booij-x4", "x4", "x4 を入力して、2つのくじが同じくらい魅力的になるようにしてください。", "50%の確率で x4、50%の確率で x3", `50%の確率で ${formatYen(10000)}、50%の確率で ${formatYen(6400)}`, 0, 90000),
      createInputMatchTask("booij-x5", "x5", "x5 を入力して、低確率の利得を含む2つのくじが同じくらい魅力的になるようにしてください。", `25%の確率で x5、75%の確率で ${formatYen(0)}`, `25%の確率で ${formatYen(12000)}、75%の確率で ${formatYen(3000)}`, 0, 50000),
      createInputMatchTask("booij-x6", "x6", "x6 を入力して、2つのくじが同じくらい魅力的になるようにしてください。", "25%の確率で x6、75%の確率で x5", `25%の確率で ${formatYen(12000)}、75%の確率で ${formatYen(3000)}`, 0, 70000),
      createInputMatchTask("booij-x7", "x7", "x7 を入力して、高確率の利得を含む2つのくじが同じくらい魅力的になるようにしてください。", `75%の確率で x7、25%の確率で ${formatYen(1000)}`, `75%の確率で ${formatYen(8000)}、25%の確率で ${formatYen(4000)}`, 0, 50000),
      createInputMatchTask("booij-x8", "x8", "x8 を入力して、2つのくじが同じくらい魅力的になるようにしてください。", "75%の確率で x8、25%の確率で x7", `75%の確率で ${formatYen(8000)}、25%の確率で ${formatYen(4000)}`, 0, 70000),
      createInputMatchTask("booij-x9", "x9", "x9 を入力して、2つのくじが同じくらい魅力的になるようにしてください。", `50%の確率で x9、50%の確率で ${formatYen(2000)}`, `50%の確率で ${formatYen(16000)}、50%の確率で ${formatYen(8000)}`, 0, 80000),
      createInputMatchTask("booij-x10", "x10", "x10 を入力して、2つのくじが同じくらい魅力的になるようにしてください。", "50%の確率で x10、50%の確率で x9", `50%の確率で ${formatYen(16000)}、50%の確率で ${formatYen(8000)}`, 0, 100000),
    ]),
  },
  {
    id: "bruhin-2010",
    title: "Bruhin et al. (2010)",
    label: "10表 + 共通2問",
    method: "finite mixture structural estimation",
    intro:
      "このブロックでは、くじと確実な金額を比べる10枚の表に回答します。最後に全員共通の2問があります。",
    assumptions:
      "各表は20行です。切り替える行を1回クリックすると、上下の行が自動入力されます。",
    tasks: withCommonAnchors([
      createMplTask(lotteryText(75, 2000, 25, 0), "確実な金額", "JPY", range(2000, 0, 20), "JPY", { taskId: "bruhin-sheet-1" }),
      createMplTask(lotteryText(25, 4000, 75, 0), "確実な金額", "JPY", range(4000, 0, 20), "JPY", { taskId: "bruhin-sheet-2" }),
      createMplTask(lotteryText(50, 3000, 50, 0), "確実な金額", "JPY", range(3000, 0, 20), "JPY", { taskId: "bruhin-sheet-3" }),
      createMplTask(lotteryText(10, 10000, 90, 0), "確実な金額", "JPY", range(10000, 0, 20), "JPY", { taskId: "bruhin-sheet-4" }),
      createMplTask(lotteryText(90, 1500, 10, 0), "確実な金額", "JPY", range(1500, 0, 20), "JPY", { taskId: "bruhin-sheet-5" }),
      createMplTask(lotteryText(50, 5000, 50, 1000), "確実な金額", "JPY", range(5000, 1000, 20), "JPY", { taskId: "bruhin-sheet-6" }),
      createMplTask(lotteryText(20, 8000, 80, 500), "確実な金額", "JPY", range(8000, 500, 20), "JPY", { taskId: "bruhin-sheet-7" }),
      createMplTask(lotteryText(80, 3000, 20, -1000), "確実な金額", "JPY", range(3000, -1000, 20), "JPY", { taskId: "bruhin-sheet-8" }),
      createMplTask(lotteryText(33, 6000, 67, 0), "確実な金額", "JPY", range(6000, 0, 20), "JPY", { taskId: "bruhin-sheet-9" }),
      createMplTask(lotteryText(67, 2500, 33, 0), "確実な金額", "JPY", range(2500, 0, 20), "JPY", { taskId: "bruhin-sheet-10" }),
    ]),
  },
];

const STORAGE_KEY = "utility-curvature-research-app";

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
  csvDownloaded: false,
  error: "",
};

const app = document.getElementById("app");
let taskTimerId = null;

function range(max, min, count) {
  if (count === 1) return [roundYen(max)];
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, index) => roundYen(max - step * index));
}

function pct(value) {
  return `${Math.round(value * 100)}%`;
}

function withCommonAnchors(tasks) {
  return [...tasks, ...createCommonAnchorTasks()];
}

function createCommonAnchorTasks() {
  return [
    createMplTask(lotteryText(50, 2000, 50, 0), "確実な金額", "JPY", range(2000, 0, 11), "JPY", {
      taskId: "common-anchor-1",
      isAnchor: true,
      prompt: "共通問題1: くじと確実な金額のどちらを選ぶか、切り替える行をクリックしてください。",
    }),
    createMplTask(lotteryText(10, 5000, 90, 0), "確実な金額", "JPY", range(1500, 0, 11), "JPY", {
      taskId: "common-anchor-2",
      isAnchor: true,
      prompt: "共通問題2: 低確率のくじと確実な金額のどちらを選ぶか、切り替える行をクリックしてください。",
    }),
  ];
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

function createTanakaSeriesTask(taskId, seriesLabel, prompt, options) {
  return {
    taskId,
    isAnchor: false,
    type: "mpl",
    prompt: `${seriesLabel}: ${prompt}`,
    risky: "各行で選択肢Aまたは選択肢Bを選んでください。",
    note: "このくじでは、1から10までの数字が書かれた10個の玉から1個を無作為に引きます。引いた玉の数字に対応する金額が支払われます。",
    unit: "switch row",
    switchDirection: SWITCH_A_TO_B,
    rows: options.map((row, index) => ({
      row: index + 1,
      amount: index + 1,
      optionA: row.optionA,
      optionB: row.optionB,
    })),
  };
}

function createBisectionTask(taskId, pHigh, pLow, aHigh, aLow, bLow, low, high) {
  return {
    taskId,
    isAnchor: false,
    type: "bisection",
    prompt: "より好ましい選択肢を選んでください。選択に応じて次の候補金額が自動で変わります。",
    optionA: `${pHigh}の確率で ${formatYen(aHigh)}、${pLow}の確率で ${formatYen(aLow)}`,
    optionBPrefix: `${pHigh}の確率で`,
    optionBSuffix: `${pLow}の確率で ${formatYen(bLow)}`,
    unit: "JPY",
    low,
    high,
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

function lotteryText(firstProbability, firstAmount, secondProbability, secondAmount) {
  return `${firstProbability}%の確率で ${formatYen(firstAmount)}、${secondProbability}%の確率で ${formatYen(secondAmount)}`;
}

function tanakaYen(value) {
  return value * 10;
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
    participant: state.participant,
    assignment: state.assignment,
    blockIndex: state.blockIndex,
    taskIndex: state.taskIndex,
    records: state.records,
    taskModes: state.taskModes,
    taskTimedOut: state.taskTimedOut,
    csvDownloaded: state.csvDownloaded,
  }));
}

function postEmbeddedMessage(message) {
  if (!EMBEDDED_MODE || !window.parent || window.parent === window) return;
  window.parent.postMessage(message, window.location.origin);
}

function render() {
  clearTaskTimer();
  if (state.phase === "setup") return renderSetup();
  if (state.phase === "blockIntro") return renderBlockIntro();
  if (state.phase === "practice") return renderPractice();
  if (state.phase === "practiceSummary") return renderPracticeSummary();
  if (state.phase === "task") return renderTask();
  return renderFinish();
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
  app.innerHTML = `
    <main class="screen narrow-screen">
      <section class="center-card">
        <div class="step-label">パイロット</div>
        <h1 class="app-title">PWF実験(パイロット)</h1>
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
    state.participant = value;
    state.assignment = assignment;
    state.phase = "blockIntro";
    state.blockIndex = assignment.blockIndex;
    state.taskIndex = 0;
    state.records = [];
    state.taskModes = [];
    state.taskTimedOut = false;
    state.csvDownloaded = false;
    state.error = "";
    saveState();
    postEmbeddedMessage({
      type: "utility-curvature-start",
      participant: state.participant,
      assignment: state.assignment,
    });
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
  state.taskStartedAt = Date.now();
  state.error = "";
  render();
}

function startFormalTasks() {
  state.phase = "task";
  state.taskIndex = 0;
  state.runtime = null;
  state.taskTimedOut = false;
  state.taskStartedAt = Date.now();
  state.error = "";
  saveState();
  render();
}

function createTaskModes(tasks) {
  const taskCount = tasks.length;
  const modes = Array.from({ length: taskCount }, () => MODE_NORMAL);
  const eligibleIndexes = tasks
    .map((task, index) => ({ task, index }))
    .filter(({ task, index }) => index > 0 && !task.isAnchor)
    .map(({ index }) => index);
  if (!eligibleIndexes.length) return modes;
  const timePressureIndexes = [];
  eligibleIndexes.forEach((index) => {
    if (Math.random() < 0.5) {
      modes[index] = MODE_TIME_PRESSURE;
      timePressureIndexes.push(index);
    }
  });
  if (!timePressureIndexes.length) {
    const fallbackIndex = eligibleIndexes[Math.floor(Math.random() * eligibleIndexes.length)];
    modes[fallbackIndex] = MODE_TIME_PRESSURE;
  }
  return modes;
}

function currentTaskMode() {
  if (state.phase !== "task") return MODE_NORMAL;
  if (currentTask()?.isAnchor) return MODE_NORMAL;
  return state.taskModes[state.taskIndex] ?? MODE_NORMAL;
}

function isTimePressureTask() {
  return state.phase === "task" && currentTaskMode() === MODE_TIME_PRESSURE;
}

function clearTaskTimer() {
  if (!taskTimerId) return;
  clearInterval(taskTimerId);
  taskTimerId = null;
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
  if (block.id === "tanaka-camerer-nguyen-2010") {
    return createTanakaSeriesTask(
      "practice-tanaka",
      "練習",
      "1から10までの数字が書かれた玉を1個引く場合を想像してください。切り替える行を1回クリックしてください。",
      [
        { optionA: `①②③④⑤: ${formatYen(500)}、⑥⑦⑧⑨⑩: ${formatYen(0)}`, optionB: `①②③: ${formatYen(900)}、④⑤⑥⑦⑧⑨⑩: ${formatYen(100)}` },
        { optionA: `①②③④⑤: ${formatYen(500)}、⑥⑦⑧⑨⑩: ${formatYen(0)}`, optionB: `①②③④: ${formatYen(900)}、⑤⑥⑦⑧⑨⑩: ${formatYen(100)}` },
        { optionA: `①②③④⑤: ${formatYen(500)}、⑥⑦⑧⑨⑩: ${formatYen(0)}`, optionB: `①②③④⑤: ${formatYen(900)}、⑥⑦⑧⑨⑩: ${formatYen(100)}` },
        { optionA: `①②③④⑤: ${formatYen(500)}、⑥⑦⑧⑨⑩: ${formatYen(0)}`, optionB: `①②③④⑤⑥: ${formatYen(900)}、⑦⑧⑨⑩: ${formatYen(100)}` },
      ]
    );
  }
  if (block.id === "abdellaoui-2000") {
    const task = createBisectionTask("practice-abdellaoui", "1/2", "1/2", 1000, 500, 0, 0, 3000);
    task.prompt = "練習問題です。より好ましい選択肢を選ぶと、次の候補金額が自動で変わります。";
    task.rounds = 3;
    return task;
  }
  if (block.id === "booij-2010") {
    return createInputMatchTask(
      "practice-booij",
      "x",
      "練習問題です。2つのくじが同じくらい魅力的になるように、x を整数で入力してください。",
      `50%の確率で x、50%の確率で ${formatYen(0)}`,
      `50%の確率で ${formatYen(1000)}、50%の確率で ${formatYen(500)}`,
      0,
      5000
    );
  }
  return createMplTask(lotteryText(50, 1000, 50, 0), "確実な金額", "JPY", range(1000, 0, 6), "JPY", {
    taskId: `practice-${block.id}`,
    prompt: "練習問題です。くじと確実な金額のどちらを選ぶか、切り替える行をクリックしてください。",
  });
}

function completePractice() {
  state.phase = "practiceSummary";
  state.runtime = null;
  state.taskTimedOut = false;
  state.taskStartedAt = Date.now();
  state.error = "";
  render();
  scrollToTopAfterRender();
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

function recordTask(block, task, payload) {
  const taskMode = currentTaskMode();
  const timeOverSeconds = taskMode === MODE_TIME_PRESSURE ? exceededTaskSeconds() : "";
  const record = {
    curvature_trial: state.records.length + 1,
    participant: state.participant,
    assignment_group: state.assignment?.groupNumber ?? "",
    assignment_modulus: state.assignment?.modulus ?? "",
    student_id_last3: state.assignment?.lastThreeText ?? "",
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
    prompt: task.prompt,
    payload,
    response_time_ms: state.taskStartedAt ? Date.now() - state.taskStartedAt : null,
    timestamp: new Date().toISOString(),
  };
  state.records.push(record);
  state.error = "";
  saveState();
  postEmbeddedMessage({
    type: "utility-curvature-record",
    participant: state.participant,
    assignment: state.assignment,
    record,
  });
}

function nextTask() {
  const block = currentBlock();
  if (state.taskIndex + 1 < block.tasks.length) {
    state.taskIndex += 1;
    state.runtime = null;
    state.taskTimedOut = false;
    state.taskStartedAt = Date.now();
    render();
    scrollToTopAfterRender();
    return;
  }
  state.phase = "finish";
  state.runtime = null;
  state.taskTimedOut = false;
  state.csvDownloaded = false;
  saveState();
  render();
  scrollToTopAfterRender();
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
  if (!state.csvDownloaded) {
    state.csvDownloaded = true;
    saveState();
    if (EMBEDDED_MODE) {
      postEmbeddedMessage({
        type: "utility-curvature-complete",
        participant: state.participant,
        assignment: state.assignment,
        record_count: state.records.length,
      });
    } else {
      downloadCsv(csvFilename(), state.records);
    }
  }
}

function summaryText(payload) {
  if (payload.response_type === "bisection") return `推定値=${payload.estimate}`;
  if (payload.response_type === "outcome_matching") return `${payload.unknown}=${payload.value}`;
  return `推定値=${payload.ce_estimate}, 状態=${switchStatusLabel(payload.switch_status)}`;
}

function taskTypeLabel(type) {
  if (type === "bisection") return "段階比較";
  if (type === "inputMatch") return "金額入力";
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
  return BLOCKS[state.blockIndex];
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
  const block = BLOCKS[blockIndex];
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

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  triggerDownload(filename, blob);
}

function csvFilename() {
  const participant = state.participant ? `-${state.participant}` : "";
  return `utility-curvature-results${participant}.csv`;
}

function downloadCsv(filename, data) {
  const columns = [
    "participant",
    "assignment_group",
    "assignment_modulus",
    "student_id_last3",
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
    csvDownloaded: false,
    error: "",
  });

  const failures = [];
  const expectedRecords = BLOCKS.reduce((sum, block) => sum + block.tasks.length, 0);

  BLOCKS.forEach((block, blockIndex) => {
    state.phase = "task";
    state.blockIndex = blockIndex;
    state.participant = String(9999000 + blockIndex);
    state.assignment = assignBlockFromStudentId(state.participant);
    state.taskModes = createTaskModes(block.tasks);
    block.tasks.forEach((task, taskIndex) => {
      state.taskIndex = taskIndex;
      state.taskStartedAt = Date.now();
      state.taskTimedOut = false;
      try {
        recordSmokeTask(block, task);
      } catch (error) {
        failures.push(`${block.title} task ${taskIndex + 1}: ${error.message}`);
      }
    });
  });

  const taskTypes = new Set(state.records.map((record) => record.task_type));
  ["bisection", "inputMatch", "mpl"].forEach((type) => {
    if (!taskTypes.has(type)) failures.push(`missing task type: ${type}`);
  });
  if (state.records.length !== expectedRecords) {
    failures.push(`record count ${state.records.length}, expected ${expectedRecords}`);
  }
  BLOCKS.forEach((block) => {
    const anchorCount = block.tasks.filter((task) => task.isAnchor).length;
    if (anchorCount !== 2) failures.push(`${block.title} anchor count ${anchorCount}, expected 2`);
  });
  BLOCKS.forEach((block) => {
    const blockRecords = state.records.filter((record) => record.block_id === block.id);
    const nonAnchorRecords = blockRecords.filter((record) => !record.is_anchor);
    const anchorRecords = blockRecords.filter((record) => record.is_anchor);
    const firstRecord = blockRecords[0];
    if (firstRecord?.task_mode !== MODE_NORMAL) failures.push(`${block.title} first task mode should be normal`);
    if (!nonAnchorRecords.some((record) => record.task_mode === MODE_TIME_PRESSURE)) {
      failures.push(`${block.title} missing time pressure task`);
    }
    if (anchorRecords.some((record) => record.task_mode !== MODE_NORMAL)) {
      failures.push(`${block.title} anchor task should be normal`);
    }
    if (blockRecords.some((record) => record.task_mode === MODE_TIME_PRESSURE && record.time_limit_seconds !== TIME_PRESSURE_SECONDS)) {
      failures.push(`${block.title} time pressure limit is not ${TIME_PRESSURE_SECONDS}`);
    }
    if (blockRecords.some((record) => record.task_id.startsWith("practice-"))) {
      failures.push(`${block.title} practice task leaked into exported records`);
    }
  });

  state.blockIndex = BLOCKS.length - 1;
  state.taskIndex = currentBlock().tasks.length - 1;
  saveState();
  renderSmokeResult(failures, expectedRecords);
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
            ? `生成了 ${state.records.length} / ${expectedRecords} 条 task-level 记录，覆盖 bisection、outcome matching、MPL。`
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
  document.getElementById("downloadSmoke").addEventListener("click", () => downloadJson("utility-curvature-smoke-results.json", state.records));
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
  render();
}
