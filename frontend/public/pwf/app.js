const SWITCH_B_TO_A = "B_TO_A";
const SWITCH_A_TO_B = "A_TO_B";
// Keep every historical block definition in the source, but run only Bruhin (B).
// Do not derive the active block from a student's ID.
const ASSIGNMENT_MODULUS = 1;
const ACTIVE_BLOCK_IDS = ["bruhin-2010"];
const DEFAULT_TIME_PRESSURE_SECONDS = 12;
const ABDELLAOUI_TIME_PRESSURE_SECONDS = 18;
const TIME_PRESSURE_TASKS_PER_BLOCK = 5;
const NUMBER_MEMORY_SECONDS = 5;
const NUMBER_MEMORY_DIGITS = 5;
const NUMBER_MEMORY_TASKS_PER_BLOCK = 1;
const ABDELLAOUI_PWF_BASELINE = 1000;
const EXPERIMENT_G_CE_LIST_ROWS = 11;
const EXPERIMENT_G_AMOUNT_MULTIPLIER = 10;
const EXPERIMENT_G_MODE_STRATEGY = "half_by_category_no_memory";
const EXPERIMENT_G_TASK_SPECS = [
  ["binary", [[0.05, 25], [0.95, 0]]],
  ["binary", [[0.50, 50], [0.50, 0]]],
  ["binary", [[0.95, 75], [0.05, 0]]],
  ["binary", [[0.10, 100], [0.90, 0]]],
  ["binary", [[0.60, 150], [0.40, 0]]],
  ["binary", [[0.99, 200], [0.01, 0]]],
  ["binary", [[0.25, 400], [0.75, 0]]],
  ["binary", [[0.75, 800], [0.25, 0]]],
  ["binary", [[0.01, 50], [0.99, 25]]],
  ["binary", [[0.40, 75], [0.60, 50]]],
  ["binary", [[0.90, 100], [0.10, 50]]],
  ["binary", [[0.05, 150], [0.95, 50]]],
  ["binary", [[0.50, 150], [0.50, 100]]],
  ["binary", [[0.95, 200], [0.05, 100]]],
  ["binary", [[0.10, 200], [0.90, 150]]],
  ["binary", [[0.75, 100], [0.25, 0]]],
  ["ternary", [[0.05, 200], [0.45, 100], [0.50, 0]]],
  ["ternary", [[0.25, 800], [0.50, 400], [0.25, 0]]],
  ["ternary", [[0.40, 150], [0.50, 50], [0.10, 0]]],
  ["ternary", [[0.75, 200], [0.20, 150], [0.05, 50]]],
];
const MODE_NORMAL = "normal";
const MODE_TIME_PRESSURE = "time_pressure";
const MODE_NUMBER_MEMORY = "number_memory";
// Bump this frozen design identifier whenever a protocol change should create a new CP assignment.
const DESIGN_VERSION = "2026-07-13-pwf-b-only-library-abg-cp-seeded-first-task-no-tp";
const STORAGE_SCHEMA_VERSION = "2026-07-13-b-only-library-abg-v7";
const CP_ASSIGNMENT_ALGORITHM = "fnv1a-mulberry32-v1";
const CONSENT_VERSION = "2026-07-11-consent-form-v1";
const GENDER_OPTIONS = ["male", "female"];
const PRACTICE_PANEL_PRACTICE = "practice";
const PRACTICE_PANEL_COMPREHENSION = "comprehension";
const PRACTICE_STEP_MPL = 0;
const PRACTICE_STEP_1 = 1;
const PRACTICE_STEP_4 = 2;
const PRACTICE_STEP_COUNT = 3;
const COMPREHENSION_INITIAL_ATTEMPTS = 3;
const COMPREHENSION_RETRY_ATTEMPTS = 2;
const COMPREHENSION_UNLOCK_CODE = "0000000";
const COMPREHENSION_QUESTION_SET_VERSION = "2026-07-11-comprehension-v2";
const COMPREHENSION_INCOMPLETE_MESSAGE = "未回答の問題があります。すべての問題に回答してください。";
const COMPREHENSION_QUESTIONS = [
  {
    id: "probability_meaning",
    prompt: "「30%の確率で1,000円を獲得するくじ」とは、どのような意味ですか。",
    correctAnswer: "b",
    options: [
      { value: "a", label: "必ず300円を獲得する" },
      { value: "b", label: "30%の確率で1,000円を獲得し、70%の確率で0円になる" },
      { value: "c", label: "少なくとも1,000円を獲得する" },
      { value: "d", label: "同じくじを30回引く" },
    ],
  },
  {
    id: "lottery_tradeoff",
    prompt: "一方のくじは賞金が高い代わりに当選確率が低く、もう一方のくじは賞金が低い代わりに当選確率が高いとします。どのように回答すべきですか。",
    correctAnswer: "d",
    options: [
      { value: "a", label: "必ず賞金が高い方を選ぶ" },
      { value: "b", label: "必ず当選確率が高い方を選ぶ" },
      { value: "c", label: "二つのくじは必ず同じ価値だと回答する" },
      { value: "d", label: "賞金と確率の両方を考え、自分の本当の好みに基づいて回答する" },
    ],
  },
  {
    id: "standard_answer",
    prompt: "実験中のくじの選択には、すべての参加者が選ぶべき共通の「正解」がありますか。",
    correctAnswer: "no",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "indifference_input",
    prompt: "金額または確率を調整して、二つのくじを「ほとんど無差別」にするよう求められた場合、どのように回答すべきですか。",
    correctAnswer: "c",
    options: [
      { value: "a", label: "入力できる最大の値にする" },
      { value: "b", label: "入力できる最小の値にする" },
      { value: "c", label: "自分にとって二つのくじが最も同じくらい魅力的になる値にする" },
      { value: "d", label: "研究者が期待していると思う値にする" },
    ],
  },
  {
    id: "serious_answers",
    prompt: "正式実験で行う各意思決定は、最終的な追加報酬を決めるために無作為に選ばれる可能性があります。そのため、すべての意思決定に自分の本当の考えに基づいて回答する必要があります。",
    correctAnswer: "yes",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "indifferent_payment",
    prompt: "以下のStep 4の画面で「ほとんど無差別」を選び、この意思決定が最終的な追加報酬の対象に選ばれた場合、追加報酬はどのように決まりますか。",
    visual: "step4",
    correctAnswer: "d",
    options: [
      { value: "a", label: "二つの選択肢の両方について支払われる" },
      { value: "b", label: "その意思決定からは追加報酬が支払われない" },
      { value: "c", label: "二つの選択肢の平均額が支払われる" },
      { value: "d", label: "二つの選択肢から一つを無作為に選び、選ばれたくじの確率に従って抽選する" },
    ],
  },
];

function createComprehensionState() {
  return {
    answers: {},
    attemptsRemaining: COMPREHENSION_INITIAL_ATTEMPTS,
    passed: false,
    locked: false,
    message: "",
    messageType: "",
    confirmOpen: false,
    attemptNumber: 0,
    roundNumber: 1,
    attemptStartedAt: null,
    questionResponseTimesMs: {},
    events: [],
    acknowledgedEventIds: [],
  };
}
const CONSENT_SECTIONS = [
  {
    heading: "研究課題名",
    paragraphs: ["リスクおよび不確実性下における意思決定に関する研究"],
  },
  {
    heading: "研究責任者",
    paragraphs: [
      "氏名：下川 哲矢",
      "所属：経営学部 経営学研究科／東京理科大学",
      "メールアドレス：simokawa@rs.tus.ac.jp",
    ],
  },
  {
    heading: "研究担当者・問い合わせ先",
    paragraphs: [
      "氏名：肖 煜秦",
      "所属：経営学部 経営学研究科 下川研究室／東京理科大学",
      "メールアドレス：8622701@ed.tus.ac.jp",
    ],
  },
  {
    heading: "研究の目的",
    paragraphs: ["本研究は、リスクおよび不確実性のもとで、人がどのような意思決定を行うかを検討することを目的としています。"],
  },
  {
    heading: "研究の方法および手続き",
    paragraphs: [
      "本研究への参加に同意された場合、一連の実験的な意思決定課題に取り組んでいただきます。",
      "課題には、くじ、確率および金銭的報酬に関する選択課題、時間制限を伴う課題、記憶課題、ならびに簡単な質問票が含まれる場合があります。",
      "本研究への参加に要する時間は、約60分を予定しています。",
      "本研究への参加は、あなたの自由意思に基づくものです。参加しない場合、または参加途中で中止した場合でも、不利益を受けることはありません。",
    ],
  },
  {
    heading: "謝礼および追加報酬",
    paragraphs: [
      "本研究への参加謝礼として、1,000円をお支払いします。",
      "また、実験課題におけるあなたの選択内容および課題の結果に応じて、最大1,000円の追加報酬をお支払いする場合があります。",
    ],
  },
  {
    heading: "予想されるリスクおよび不快感",
    paragraphs: [
      "本研究への参加に伴うリスクは、軽微なものであると考えられます。",
      "意思決定課題に回答する際に、軽度の心理的負担、疲労、または時間的な圧迫感を覚える可能性があります。不快感や負担を感じた場合には、回答を中断し、研究への参加を中止することができます。",
      "現時点において、本研究への参加に関連する既知の身体的リスクはありません。",
    ],
  },
  {
    heading: "期待される利益",
    paragraphs: [
      "上記の謝礼および追加報酬を除き、本研究への参加によって、あなたに直接的な利益が生じることが保証されるものではありません。",
      "一方で、あなたの参加は、リスク、不確実性および曖昧性のもとでの意思決定に関する学術的知見の蓄積に貢献するものです。",
    ],
  },
  {
    heading: "収集するデータ",
    paragraphs: [
      "本研究では、実験課題におけるあなたの回答に関するデータを収集します。これには、選択内容、反応時間、課題の結果、実験条件、その他の関連する実験変数が含まれます。",
      "また、研究目的に必要な範囲で、性別、学年等の基本属性情報や、認知課題の得点等を収集する場合があります。",
      "氏名、学籍番号等、個人を直接識別できる情報は、分析または公表に用いる研究用データセットには含めません。",
      "謝礼の支払いその他の事務手続きのために、個人を直接識別できる情報を収集する場合には、当該情報を研究データとは分離して保管し、研究成果の分析または公表に使用することはありません。",
    ],
  },
  {
    heading: "個人情報の保護および機密性",
    paragraphs: [
      "研究データは、分析、共有または公表に先立ち、氏名等の個人を直接識別できる情報を削除し、ランダムに割り当てた参加者IDに置き換えるなど、個人を直接識別できない形に加工します。",
      "参加者IDと個人情報との対応表を作成する場合には、当該対応表を研究データとは分離し、厳重に管理します。",
      "本研究の結果は、個人が特定されない集計形式、または個人を特定できないよう加工した形式で報告されます。学術論文、報告書、学会発表資料、その他の研究成果、または公開されるデータセットにおいて、個々の参加者が特定できる形で情報が公表されることはありません。",
      "研究チームは、研究データおよび個人情報の機密性を保護するため、適切な安全管理措置を講じます。",
    ],
  },
  {
    heading: "データの保存および安全管理",
    paragraphs: [
      "研究データは、パスワードで保護されたコンピュータ、またはアクセス制限が施された安全なクラウドストレージに保存します。",
      "研究データにアクセスできる者は、研究チームのうち、適切な権限を付与された者に限られます。",
      "個人を特定できないよう加工した研究データは、将来の学術研究、追試・再現研究、および研究結果の検証を目的として保存される場合があります。",
    ],
  },
  {
    heading: "データの共有および公表",
    paragraphs: [
      "本研究で収集され、個人を特定できないよう加工されたデータは、Open Science Framework（OSF）、学術誌が指定するデータアーカイブ、またはその他の学術研究用データリポジトリにおいて公開される場合があります。",
      "公開されるデータセットには、氏名、学籍番号、メールアドレス、その他の個人を直接識別できる情報は含まれません。外部の第三者が個々の参加者を合理的に特定できないよう、公開前に必要な加工および確認を行います。",
      "公開されたデータは、学術論文、学会発表、追試・再現研究、および将来の関連研究に使用される場合があります。",
    ],
  },
  {
    heading: "質問および問い合わせ先",
    paragraphs: ["本研究の内容または実施方法について質問がある場合は、研究担当者までご連絡ください。"],
  },
];
const CONSENT_CONFIRMATIONS = [
  "上記の説明文書を読み、その内容を理解しました。",
  "本研究について質問する機会があり、必要に応じて説明を受けることができると理解しています。",
  "本研究への参加は任意であり、参加しないことによって不利益を受けることはないと理解しています。",
  "回答データを送信または提出する前であれば、いつでも、理由を述べることなく、不利益を受けずに研究への参加を中止できると理解しています。",
  "個人を特定できないよう加工された私の研究データが、学術研究、学会発表、論文その他の研究成果の公表、および将来の関連研究に使用される場合があると理解しています。",
  "個人を特定できないよう加工された私の研究データが、学術研究用データリポジトリにおいて公開される場合があると理解しています。",
  "学術論文、研究発表資料または公開データセットには、私を直接識別できる情報が含まれないと理解しています。",
];
const URL_PARAMS = new URLSearchParams(window.location.search);
const EMBEDDED_MODE = URL_PARAMS.get("embedded") === "1";
const SMOKE_MODE = URL_PARAMS.get("smoke") === "1";
const STANDALONE_MODE = URL_PARAMS.get("standalone") === "1";
const PILOT_MODE = URL_PARAMS.get("mode") === "pilot" || URL_PARAMS.get("study_mode") === "pilot" || URL_PARAMS.get("pilot") === "1";

if (!EMBEDDED_MODE && !SMOKE_MODE && !STANDALONE_MODE) {
  window.location.replace(`/${window.location.search}`);
}

const BLOCK_LIBRARY = createBlocks(1);
const BASE_BLOCKS = BLOCK_LIBRARY.filter((block) => ACTIVE_BLOCK_IDS.includes(block.id));
if (BASE_BLOCKS.length !== ASSIGNMENT_MODULUS) {
  throw new Error("Active PWF block configuration is inconsistent");
}

function createBlocks(amountMultiplier = 1) {
  const m = amountMultiplier;
  return [
  {
    id: "choi-2022-study2",
    title: "実験C",
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
    title: "実験A",
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
    title: "実験B",
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
  {
    id: "experiment-g",
    title: "実験G",
    label: "20リスト",
    method: "Gonzalez & Wu fractional CE lists",
    amountLevel: "x10",
    amountMultiplier: EXPERIMENT_G_AMOUNT_MULTIPLIER,
    modeStrategy: EXPERIMENT_G_MODE_STRATEGY,
    intro:
      "このブロックでは、2つまたは3つの結果をもつくじと確実な金額を比べる20個のリストに回答します。",
    assumptions:
      "各リストで切り替える行を1回クリックすると、上下の行が自動入力されます。",
    tasks: createExperimentGTasks(EXPERIMENT_G_AMOUNT_MULTIPLIER),
  },
  ];
}

const STORAGE_KEY = "pwf-research-app";

const state = {
  phase: "setup",
  participant: "",
  gender: "",
  consentChoice: "",
  consentAcceptedAt: "",
  assignment: null,
  blockIndex: 0,
  taskIndex: 0,
  runtime: null,
  records: [],
  blockStartedAt: null,
  taskStartedAt: null,
  taskOrder: [],
  taskModes: [],
  taskTimedOut: false,
  memoryChallenge: null,
  practiceFeedback: null,
  practicePanel: PRACTICE_PANEL_PRACTICE,
  practiceCompleted: false,
  practiceStepIndex: PRACTICE_STEP_MPL,
  comprehension: createComprehensionState(),
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
    category: meta.category ?? "",
    amountLevel: meta.amountLevel ?? "",
    amountMultiplier: meta.amountMultiplier ?? "",
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
    settlement: {
      optionA: [
        { probability: parseProbabilityValue(pHigh), amount: roundYen(aHigh * m), label: `${pHigh}: ${formatYen(aHigh * m)}` },
        { probability: parseProbabilityValue(pLow), amount: roundYen(aLow * m), label: `${pLow}: ${formatYen(aLow * m)}` },
      ],
      optionBHighProbability: parseProbabilityValue(pHigh),
      optionBLowProbability: parseProbabilityValue(pLow),
      optionBLowAmount: roundYen(bLow * m),
    },
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

function lotteryTextFromOutcomes(outcomes, amountMultiplier = 1) {
  return outcomes
    .map(([probability, amount]) => `${formatProbability(probability)}の確率で ${formatYen(amount * amountMultiplier)}`)
    .join("、");
}

function createExperimentGTasks(amountMultiplier = 1) {
  return EXPERIMENT_G_TASK_SPECS.map(([category, outcomes], index) => {
    const scaledAmounts = outcomes.map(([, amount]) => amount * amountMultiplier);
    const minAmount = Math.min(...scaledAmounts);
    const maxAmount = Math.max(...scaledAmounts);
    return createMplTask(
      lotteryTextFromOutcomes(outcomes, amountMultiplier),
      "確実な金額",
      "JPY",
      range(maxAmount, minAmount, EXPERIMENT_G_CE_LIST_ROWS),
      "JPY",
      {
        taskId: `experiment-g-${index + 1}`,
        category,
        amountLevel: "x10",
        amountMultiplier,
      },
    );
  });
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

function renderTextWithFractions(value) {
  return escapeHtml(value).replace(
    /\b(\d+)\/(\d+)\b/g,
    '<span class="math-fraction"><span class="fraction-top">$1</span><span class="fraction-bottom">$2</span></span>',
  );
}

function roundYen(value) {
  return Math.round(Number(value));
}

function normalizeComprehensionState(value) {
  const normalized = createComprehensionState();
  if (!value || typeof value !== "object") return normalized;

  const answers = value.answers && typeof value.answers === "object" ? value.answers : {};
  COMPREHENSION_QUESTIONS.forEach((question) => {
    const answer = answers[question.id];
    if (question.options.some((option) => option.value === answer)) {
      normalized.answers[question.id] = answer;
    }
  });

  const attemptsRemaining = Number(value.attemptsRemaining);
  if (Number.isInteger(attemptsRemaining)) {
    normalized.attemptsRemaining = Math.max(0, Math.min(COMPREHENSION_INITIAL_ATTEMPTS, attemptsRemaining));
  }
  normalized.passed = Boolean(value.passed);
  normalized.locked = !normalized.passed && (Boolean(value.locked) || normalized.attemptsRemaining === 0);
  normalized.message = typeof value.message === "string" ? value.message : "";
  normalized.messageType = ["error", "success", "info"].includes(value.messageType) ? value.messageType : "";
  const events = Array.isArray(value.events) ? value.events : [];
  normalized.events = events.filter((event) => (
    event
    && typeof event === "object"
    && typeof event.event_id === "string"
    && event.question_set_version === COMPREHENSION_QUESTION_SET_VERSION
    && ["submission", "unlock"].includes(event.event_type)
  ));
  const attemptNumber = Number(value.attemptNumber);
  normalized.attemptNumber = Number.isInteger(attemptNumber) && attemptNumber >= 0
    ? attemptNumber
    : normalized.events.filter((event) => event.event_type === "submission").length;
  const roundNumber = Number(value.roundNumber);
  normalized.roundNumber = Number.isInteger(roundNumber) && roundNumber >= 1
    ? roundNumber
    : Math.max(1, 1 + normalized.events.filter((event) => event.event_type === "unlock").length);
  const attemptStartedAt = Number(value.attemptStartedAt);
  normalized.attemptStartedAt = Number.isFinite(attemptStartedAt) && attemptStartedAt > 0
    ? attemptStartedAt
    : null;
  const questionResponseTimesMs = value.questionResponseTimesMs && typeof value.questionResponseTimesMs === "object"
    ? value.questionResponseTimesMs
    : {};
  COMPREHENSION_QUESTIONS.forEach((question) => {
    const duration = Number(questionResponseTimesMs[question.id]);
    if (Number.isInteger(duration) && duration >= 0) {
      normalized.questionResponseTimesMs[question.id] = duration;
    }
  });
  const eventIds = new Set(normalized.events.map((event) => event.event_id));
  normalized.acknowledgedEventIds = Array.isArray(value.acknowledgedEventIds)
    ? [...new Set(value.acknowledgedEventIds.filter((eventId) => eventIds.has(eventId)))]
    : [];
  return normalized;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    storageSchemaVersion: STORAGE_SCHEMA_VERSION,
    designVersion: DESIGN_VERSION,
    phase: state.phase,
    participant: state.participant,
    gender: state.gender,
    consentVersion: CONSENT_VERSION,
    consentChoice: state.consentChoice,
    consentAcceptedAt: state.consentAcceptedAt,
    assignment: state.assignment,
    blockIndex: state.blockIndex,
    taskIndex: state.taskIndex,
    taskOrder: state.taskOrder,
    records: state.records,
    taskModes: state.taskModes,
    taskTimedOut: state.taskTimedOut,
    memoryChallenge: state.memoryChallenge,
    practiceFeedback: state.practiceFeedback,
    practicePanel: state.practicePanel,
    practiceCompleted: state.practiceCompleted,
    practiceStepIndex: state.practiceStepIndex,
    comprehension: {
      answers: state.comprehension.answers,
      attemptsRemaining: state.comprehension.attemptsRemaining,
      passed: state.comprehension.passed,
      locked: state.comprehension.locked,
      message: state.comprehension.message,
      messageType: state.comprehension.messageType,
      attemptNumber: state.comprehension.attemptNumber,
      roundNumber: state.comprehension.roundNumber,
      attemptStartedAt: state.comprehension.attemptStartedAt,
      questionResponseTimesMs: state.comprehension.questionResponseTimesMs,
      events: state.comprehension.events,
      acknowledgedEventIds: state.comprehension.acknowledgedEventIds,
    },
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
  if (saved.storageSchemaVersion !== STORAGE_SCHEMA_VERSION) return false;
  if (saved.designVersion !== DESIGN_VERSION) return false;
  if (!saved.participant || !saved.assignment) return false;
  if (!GENDER_OPTIONS.includes(saved.gender)) return false;
  if (saved.consentVersion !== CONSENT_VERSION || saved.consentChoice !== "agree" || !saved.consentAcceptedAt) return false;
  const savedParticipant = String(saved.participant);
  if (expectedParticipant && savedParticipant !== String(expectedParticipant)) return false;

  const blockIndex = Number(saved.blockIndex);
  const taskIndex = Number(saved.taskIndex);
  if (!Number.isInteger(blockIndex) || blockIndex < 0 || blockIndex >= BASE_BLOCKS.length) return false;

  const block = BASE_BLOCKS[blockIndex];
  if (saved.assignment?.blockId && saved.assignment.blockId !== block.id) return false;
  const assignment = normalizeAssignment(savedParticipant, saved.assignment);
  const taskOrder = normalizeTaskOrder(block, saved.taskOrder, savedParticipant);
  const boundedTaskIndex = Number.isInteger(taskIndex)
    ? Math.max(0, Math.min(taskIndex, block.tasks.length - 1))
    : 0;
  const records = Array.isArray(saved.records) ? saved.records : [];
  const practiceFeedback = saved.practiceFeedback && typeof saved.practiceFeedback === "object"
    ? saved.practiceFeedback
    : null;
  const savedPhase = [
    "setup",
    "blockIntro",
    "practice",
    "practiceFeedback",
    "practiceSummary",
    "timePressureIntro",
    "memoryDisplay",
    "task",
    "memoryPostRecall",
    "feedback",
    "finish",
  ].includes(saved.phase)
    ? saved.phase
    : records.length >= block.tasks.length
    ? "finish"
    : "task";
  const normalizedPhase = saved.phase === "practiceFeedback" && !practiceFeedback
    ? "practice"
    : saved.phase === "memoryPreRecall"
    ? "task"
    : savedPhase;
  let practicePanel = [PRACTICE_PANEL_PRACTICE, PRACTICE_PANEL_COMPREHENSION].includes(saved.practicePanel)
    ? saved.practicePanel
    : PRACTICE_PANEL_PRACTICE;
  const practiceCompleted = Boolean(saved.practiceCompleted) || normalizedPhase === "practiceSummary";
  const savedPracticeStepIndex = Number(saved.practiceStepIndex);
  const practiceStepIndex = practiceCompleted
    ? PRACTICE_STEP_4
    : Number.isInteger(savedPracticeStepIndex)
      ? Math.max(PRACTICE_STEP_MPL, Math.min(PRACTICE_STEP_4, savedPracticeStepIndex))
      : PRACTICE_STEP_MPL;
  const comprehension = normalizeComprehensionState(saved.comprehension);
  if (comprehension.locked) practicePanel = PRACTICE_PANEL_COMPREHENSION;

  Object.assign(state, {
    phase: normalizedPhase,
    participant: savedParticipant,
    gender: saved.gender,
    consentChoice: saved.consentChoice,
    consentAcceptedAt: saved.consentAcceptedAt,
    assignment,
    blockIndex,
    taskIndex: boundedTaskIndex,
    runtime: null,
    records,
    blockStartedAt: Date.now(),
    taskStartedAt: normalizedPhase === "timePressureIntro" ? null : Date.now(),
    taskOrder,
    taskModes: Array.isArray(saved.taskModes) ? saved.taskModes : [],
    taskTimedOut: Boolean(saved.taskTimedOut),
    memoryChallenge: normalizeMemoryChallenge(saved.memoryChallenge, boundedTaskIndex, normalizedPhase),
    practiceFeedback: normalizedPhase === "practiceFeedback" ? practiceFeedback : null,
    practicePanel,
    practiceCompleted,
    practiceStepIndex,
    comprehension,
    csvDownloaded: Boolean(saved.csvDownloaded),
    error: "",
  });
  if (currentTaskMode() === MODE_NUMBER_MEMORY && !state.memoryChallenge && ["memoryDisplay", "task", "memoryPostRecall"].includes(state.phase)) {
    state.phase = "memoryDisplay";
    state.memoryChallenge = createMemoryChallenge(state.taskIndex);
  }
  return true;
}

function postEmbeddedMessage(message) {
  if (!EMBEDDED_MODE || !window.parent || window.parent === window) return;
  window.parent.postMessage(message, window.location.origin);
}

function createComprehensionEventId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}

function postComprehensionEvents() {
  if (!state.comprehension.events.length) return;
  postEmbeddedMessage({
    type: "pwf-comprehension-events",
    participant: state.participant,
    gender: state.gender,
    consent_version: CONSENT_VERSION,
    consent_accepted_at: state.consentAcceptedAt,
    assignment: state.assignment,
    events: state.comprehension.events,
  });
}

function recordComprehensionEvent(event) {
  state.comprehension.events.push(event);
  saveState();
  postComprehensionEvents();
}

function passedComprehensionEvent() {
  return [...state.comprehension.events]
    .reverse()
    .find((event) => event.event_type === "submission" && event.passed);
}

function isComprehensionPassSaved() {
  if (!EMBEDDED_MODE) return true;
  const passedEvent = passedComprehensionEvent();
  return Boolean(
    passedEvent?.event_id
    && state.comprehension.acknowledgedEventIds.includes(passedEvent.event_id),
  );
}

function retryComprehensionSave() {
  state.comprehension.message = "理解度確認の回答を保存しています。しばらくお待ちください。";
  state.comprehension.messageType = "info";
  saveState();
  postComprehensionEvents();
  render();
}

function initializeComprehensionSync() {
  if (!EMBEDDED_MODE || !window.addEventListener) return;
  window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin || event.source !== window.parent) return;
    const messageType = event.data?.type;
    if (!["pwf-comprehension-events-saved", "pwf-comprehension-events-error"].includes(messageType)) return;

    if (String(event.data?.participant ?? "") !== String(state.participant ?? "")) return;

    if (messageType === "pwf-comprehension-events-saved") {
      const currentEventIds = new Set(state.comprehension.events.map((comprehensionEvent) => comprehensionEvent.event_id));
      const confirmedEventIds = Array.isArray(event.data?.confirmed_event_ids)
        ? event.data.confirmed_event_ids.filter((eventId) => currentEventIds.has(eventId))
        : [];
      state.comprehension.acknowledgedEventIds = [
        ...new Set([...state.comprehension.acknowledgedEventIds, ...confirmedEventIds]),
      ];
      if (state.comprehension.passed && isComprehensionPassSaved()) {
        state.comprehension.message = "すべて正解です。理解度確認が完了しました。続けて、正式な実験を開始してください。";
        state.comprehension.messageType = "success";
        state.practicePanel = PRACTICE_PANEL_COMPREHENSION;
      }
      saveState();
      if (state.comprehension.passed && isComprehensionPassSaved() && state.phase === "practiceSummary") render();
      return;
    }

    const attemptedEventIds = Array.isArray(event.data?.attempted_event_ids)
      ? event.data.attempted_event_ids
      : [];
    const passedEvent = passedComprehensionEvent();
    if (state.comprehension.passed && attemptedEventIds.includes(passedEvent?.event_id)) {
      state.comprehension.message = "回答記録を保存できませんでした。通信を確認し、「保存を再試行」を押してください。";
      state.comprehension.messageType = "error";
      state.practicePanel = PRACTICE_PANEL_COMPREHENSION;
      saveState();
      if (state.phase === "practiceSummary") render();
    }
  });
}

function render() {
  clearTaskTimer();
  clearMemoryTimer();
  if (state.phase === "setup") return renderSetup();
  if (state.phase === "blockIntro") return renderBlockIntro();
  if (state.phase === "practice") return renderPractice();
  if (state.phase === "practiceFeedback") return renderPracticeFeedback();
  if (state.phase === "practiceSummary") return renderPracticeSummary();
  if (state.phase === "timePressureIntro") return renderTimePressureIntro();
  if (state.phase === "memoryDisplay") return renderMemoryDisplay();
  if (state.phase === "task") return renderTask();
  if (state.phase === "memoryPostRecall") return renderMemoryRecall("post");
  if (state.phase === "feedback") return renderFeedback();
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

function initializeKeyboardShortcuts() {
  window.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || event.repeat) return;
    if (event.key !== "Enter" && event.key !== "Return") return;
    const button = document.getElementById("continueBisection")
      || document.getElementById("startTimePressureTask");
    if (!button || button.disabled) return;
    const active = document.activeElement;
    const canSubmitFromKeyboard =
      !active ||
      active === document.body ||
      active === document.documentElement ||
      active === button;
    if (!canSubmitFromKeyboard) return;
    event.preventDefault();
    button.click();
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
    gender: "",
    consentChoice: "",
    consentAcceptedAt: "",
    assignment: null,
    runtime: null,
    taskOrder: [],
    taskTimedOut: false,
    memoryChallenge: null,
    practiceFeedback: null,
    practicePanel: PRACTICE_PANEL_PRACTICE,
    practiceCompleted: false,
    practiceStepIndex: PRACTICE_STEP_MPL,
    comprehension: createComprehensionState(),
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
  const canContinue = canContinueFromSetup(state.participant, state.gender, state.consentChoice);
  app.innerHTML = `
    <main class="screen consent-setup-screen">
      <section class="center-card consent-setup-card">
        ${PILOT_MODE ? `<div class="step-label">パイロット</div>` : ""}
        <h1 class="app-title">${PILOT_MODE ? "PWF実験(パイロット)" : "PWF実験"}</h1>
        <p class="consent-intro">実験を始める前に、以下の説明文書をお読みください。</p>
        ${renderConsentDocument()}
        <form class="setup-form" id="setupForm">
          <div class="field">
            <label for="participant">学籍番号（7桁）</label>
            <input id="participant" type="text" inputmode="numeric" maxlength="7" pattern="[0-9]{7}" value="${escapeHtml(state.participant)}" placeholder="例: 1234567" autofocus />
          </div>
          <fieldset class="choice-fieldset">
            <legend>性別</legend>
            <div class="choice-group" role="radiogroup" aria-label="性別">
              ${renderRadioChoice("gender", "male", "男性", state.gender)}
              ${renderRadioChoice("gender", "female", "女性", state.gender)}
            </div>
          </fieldset>
          <fieldset class="choice-fieldset consent-choice-fieldset">
            <legend>研究参加への同意</legend>
            <p class="field-help">説明文書を理解した上で、参加の意思を選択してください。</p>
            <div class="choice-group" role="radiogroup" aria-label="研究参加への同意">
              ${renderRadioChoice("consent", "agree", "本研究への参加に同意します", state.consentChoice)}
              ${renderRadioChoice("consent", "decline", "本研究への参加に同意しません", state.consentChoice)}
            </div>
            <p class="consent-declined" id="consentDeclined">同意いただけない場合は、実験を開始できません。</p>
          </fieldset>
          ${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ""}
          <button class="btn-primary setup-submit" id="setupSubmit" type="submit" ${canContinue ? "" : "disabled"}>割り当てて開始</button>
        </form>
      </section>
    </main>
  `;
  const participantInput = document.getElementById("participant");
  const genderInputs = document.querySelectorAll('input[name="gender"]');
  const consentInputs = document.querySelectorAll('input[name="consent"]');

  participantInput.addEventListener("input", () => {
    state.participant = participantInput.value;
    updateSetupSubmitState();
  });
  genderInputs.forEach((input) => {
    input.addEventListener("change", () => {
      state.gender = input.value;
      updateSetupSubmitState();
    });
  });
  consentInputs.forEach((input) => {
    input.addEventListener("change", () => {
      state.consentChoice = input.value;
      state.consentAcceptedAt = input.value === "agree" ? new Date().toISOString() : "";
      updateSetupSubmitState();
    });
  });

  document.getElementById("setupForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const value = participantInput.value.trim();
    const gender = state.gender;
    const consentChoice = state.consentChoice;
    if (!GENDER_OPTIONS.includes(gender)) {
      state.error = "性別を選択してください。";
      render();
      return;
    }
    if (consentChoice !== "agree") {
      state.error = "実験を始めるには、本研究への参加に同意する必要があります。";
      render();
      return;
    }
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
        gender: state.gender,
        consent_version: CONSENT_VERSION,
        consent_accepted_at: state.consentAcceptedAt,
        assignment: state.assignment,
      });
      postComprehensionEvents();
      pushRunningHistory();
      render();
      scrollToTopAfterRender();
      return;
    }
    state.participant = value;
    state.gender = gender;
    state.consentChoice = consentChoice;
    state.consentAcceptedAt = state.consentAcceptedAt || new Date().toISOString();
    state.assignment = assignment;
    state.phase = "blockIntro";
    state.blockIndex = assignment.blockIndex;
    state.taskIndex = 0;
    state.records = [];
    state.taskOrder = [];
    state.taskModes = [];
    state.taskTimedOut = false;
    state.memoryChallenge = null;
    state.practiceFeedback = null;
    state.practicePanel = PRACTICE_PANEL_PRACTICE;
    state.practiceCompleted = false;
    state.practiceStepIndex = PRACTICE_STEP_MPL;
    state.comprehension = createComprehensionState();
    state.csvDownloaded = false;
    state.error = "";
    saveState();
    postEmbeddedMessage({
      type: "pwf-start",
      participant: state.participant,
      gender: state.gender,
      consent_version: CONSENT_VERSION,
      consent_accepted_at: state.consentAcceptedAt,
      assignment: state.assignment,
    });
    pushRunningHistory();
    render();
  });
}

function renderConsentDocument() {
  const sections = CONSENT_SECTIONS.map(({ heading, paragraphs }) => `
    <section class="consent-section">
      <h2>${escapeHtml(heading)}</h2>
      ${paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
    </section>
  `).join("");
  const confirmations = CONSENT_CONFIRMATIONS.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  return `
    <section class="consent-document" aria-labelledby="consentDocumentTitle" tabindex="0">
      <h2 id="consentDocumentTitle">研究参加者への説明文書および同意書</h2>
      ${sections}
      <section class="consent-section">
        <h2>同意事項</h2>
        <p>以下の内容をよくお読みください。</p>
        <p>「本研究への参加に同意します」を選択することにより、私は、以下の事項を確認した上で、本研究への参加に同意します。</p>
        <ol>${confirmations}</ol>
        <p>上記の内容を理解した上で、本研究への参加に同意します。</p>
      </section>
    </section>
  `;
}

function renderRadioChoice(name, value, label, selectedValue) {
  return `
    <label class="choice-option">
      <input type="radio" name="${escapeHtml(name)}" value="${escapeHtml(value)}" ${selectedValue === value ? "checked" : ""} />
      <span>${escapeHtml(label)}</span>
    </label>
  `;
}

function canContinueFromSetup(participant, gender, consentChoice) {
  return /^\d{7}$/.test(String(participant ?? "").trim())
    && GENDER_OPTIONS.includes(gender)
    && consentChoice === "agree";
}

function updateSetupSubmitState() {
  const participant = document.getElementById("participant")?.value ?? state.participant;
  const submit = document.getElementById("setupSubmit");
  if (submit) submit.disabled = !canContinueFromSetup(participant, state.gender, state.consentChoice);
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
    state.taskOrder = createTaskOrder(BASE_BLOCKS[state.blockIndex], state.participant);
    const orderedBlock = currentBlock();
    state.phase = "practice";
    state.taskIndex = 0;
    state.runtime = null;
    state.taskModes = createTaskModes(orderedBlock, state.participant);
    state.taskTimedOut = false;
    state.memoryChallenge = null;
    state.practiceFeedback = null;
    state.practicePanel = PRACTICE_PANEL_PRACTICE;
    state.practiceCompleted = false;
    state.practiceStepIndex = PRACTICE_STEP_MPL;
    state.comprehension = createComprehensionState();
    state.blockStartedAt = Date.now();
    state.taskStartedAt = Date.now();
    state.error = "";
    saveState();
    render();
  });
}

function renderPracticeTabs(activePanel) {
  const practiceStatus = state.practiceCompleted ? '<span class="practice-tab-status">完了</span>' : "";
  const comprehensionStatus = state.comprehension.passed ? '<span class="practice-tab-status">完了</span>' : "";
  return `
    <div class="practice-tabs" role="tablist" aria-label="練習と理解度確認">
      <button
        class="practice-tab ${activePanel === PRACTICE_PANEL_PRACTICE ? "active" : ""}"
        id="practiceWindowTab"
        type="button"
        role="tab"
        aria-selected="${activePanel === PRACTICE_PANEL_PRACTICE}"
        aria-controls="practiceWindowPanel"
        data-practice-tab="${PRACTICE_PANEL_PRACTICE}"
      >練習問題${practiceStatus}</button>
      <button
        class="practice-tab ${activePanel === PRACTICE_PANEL_COMPREHENSION ? "active" : ""}"
        id="comprehensionWindowTab"
        type="button"
        role="tab"
        aria-selected="${activePanel === PRACTICE_PANEL_COMPREHENSION}"
        aria-controls="comprehensionWindowPanel"
        data-practice-tab="${PRACTICE_PANEL_COMPREHENSION}"
      >理解度確認${comprehensionStatus}</button>
    </div>
  `;
}

function switchPracticePanel(panel) {
  if (![PRACTICE_PANEL_PRACTICE, PRACTICE_PANEL_COMPREHENSION].includes(panel)) return;
  if (state.comprehension.locked && panel !== PRACTICE_PANEL_COMPREHENSION) return;
  state.practicePanel = panel;
  state.comprehension.confirmOpen = false;
  saveState();
  render();
  scrollToTopAfterRender();
}

function bindPracticeNavigation() {
  const tabs = Array.from(document.querySelectorAll("[data-practice-tab]"));
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => switchPracticePanel(tab.dataset.practiceTab));
    tab.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const panel = tab.dataset.practiceTab === PRACTICE_PANEL_PRACTICE
        ? PRACTICE_PANEL_COMPREHENSION
        : PRACTICE_PANEL_PRACTICE;
      switchPracticePanel(panel);
    });
  });
  document.getElementById("switchToComprehension")?.addEventListener("click", () => {
    switchPracticePanel(PRACTICE_PANEL_COMPREHENSION);
  });
  document.getElementById("switchToPractice")?.addEventListener("click", () => {
    switchPracticePanel(PRACTICE_PANEL_PRACTICE);
  });
}

function ensurePracticeStepRuntime() {
  const taskKey = `practice-step-${state.practiceStepIndex}`;
  if (state.runtime?.taskKey === taskKey) return;
  state.runtime = { taskKey, value: "" };
}

function renderFixedStep4Display({ interactive = false, selectedChoice = "", neutralLabels = false, compact = false, showStepLabel = true } = {}) {
  const leftLabel = neutralLabels ? "左の選択肢" : "選択肢A";
  const rightLabel = neutralLabels ? "右の選択肢" : "選択肢B";
  const choices = [
    { value: "X", label: neutralLabels ? "左を好む" : "Aを好む", className: "step4-choice-left" },
    { value: "Indifferent", label: "ほとんど無差別", className: "step4-choice-indifferent" },
    { value: "Y", label: neutralLabels ? "右を好む" : "Bを好む", className: "step4-choice-right" },
  ];
  const choiceMarkup = choices.map((choice) => {
    const selectedClass = selectedChoice === choice.value ? " selected" : "";
    if (interactive) {
      return `<button class="btn-choice practice-step4-choice ${choice.className}${selectedClass}" type="button" data-practice-step4-choice="${choice.value}">${choice.label}</button>`;
    }
    return `<div class="btn-choice practice-step4-choice static${selectedClass}" aria-hidden="true">${choice.label}</div>`;
  }).join("");
  return `
    <section class="practice-step4-display${compact ? " compact" : ""}" aria-label="Step 4の比較画面">
      ${showStepLabel ? '<div class="step-label">Step 4</div>' : ""}
      <p class="question-intro">以下の2つのくじを比べてください：</p>
      <div class="lottery-compare">
        <div class="lottery-box lottery-a">
          <div class="lottery-label">${leftLabel}</div>
          <div class="lottery-detail">確率 <strong>40%</strong> で</div>
          <div class="practice-lottery-amount">190円</div>
        </div>
        <div class="vs-label">vs</div>
        <div class="lottery-box lottery-b">
          <div class="lottery-label">${rightLabel}</div>
          <div class="lottery-detail">確率 <strong>80%</strong> で</div>
          <div class="practice-lottery-amount">95円</div>
        </div>
      </div>
      <div class="practice-step4-choices">${choiceMarkup}</div>
      ${selectedChoice ? `<p class="sr-only">選択：${escapeHtml(choices.find((choice) => choice.value === selectedChoice)?.label || "")}</p>` : ""}
    </section>
  `;
}

function renderPracticeStep1Body() {
  ensurePracticeStepRuntime();
  return `
    <section class="question-box practice-ci-step">
      <div class="step-label">Step 1</div>
      <div class="practice-ci-option-list">
        <p><span class="practice-ci-option-label">選択肢A</span><strong>確率 20% で 100円</strong></p>
        <p><span class="practice-ci-option-label">選択肢B</span><strong>確率 10% で <span class="practice-unknown">?円</span></strong></p>
      </div>
      <p>上の2つが無差別になるように、選択肢Bの金額を答えてください。</p>
      <form class="practice-step-form" id="practiceStep1Form" novalidate>
        <div class="field">
          <label for="practiceStep1Value">金額 x（円）</label>
          <input id="practiceStep1Value" type="number" min="100" max="100000000" step="1" value="${escapeHtml(state.runtime.value)}" placeholder="100以上の金額" autofocus />
        </div>
        ${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ""}
        <button class="btn-primary" type="submit">回答して次へ</button>
      </form>
    </section>
  `;
}

function renderPracticeStep4Body() {
  return `
    <section class="question-box practice-ci-step">
      ${renderFixedStep4Display({ interactive: true })}
      <p class="muted">正解はありません。自分の本当の好みに基づいて選んでください。</p>
    </section>
  `;
}

function renderCurrentPracticeBody(block) {
  if (state.practiceStepIndex === PRACTICE_STEP_1) return renderPracticeStep1Body();
  if (state.practiceStepIndex === PRACTICE_STEP_4) return renderPracticeStep4Body();
  const task = currentPracticeTask();
  ensureRuntime(task);
  return renderTaskBody(block, task);
}

function showCustomPracticeFeedback(feedback) {
  state.practiceFeedback = feedback;
  state.phase = "practiceFeedback";
  state.runtime = null;
  state.taskTimedOut = false;
  state.memoryChallenge = null;
  state.taskStartedAt = Date.now();
  state.error = "";
  saveState();
  render();
  scrollToTopAfterRender();
}

function settlePracticeCiDecision({ response, options, indifferenceSelectionMethod }) {
  const normalizedOptions = (options || []).map((option) => ({
    label: String(option.label || ""),
    probability: Number(option.probability),
    amount: roundYen(option.amount),
  })).filter((option) => (
    option.label
    && Number.isFinite(option.probability)
    && option.probability >= 0
    && option.probability <= 1
    && Number.isFinite(option.amount)
  ));

  let selectedOption;
  let selectionMethod = "participant_choice";
  if (response === "Indifferent") {
    selectedOption = normalizedOptions[Math.floor(Math.random() * normalizedOptions.length)];
    selectionMethod = indifferenceSelectionMethod;
  } else if (response === "X") {
    selectedOption = normalizedOptions[0];
  } else if (response === "Y") {
    selectedOption = normalizedOptions[1];
  }

  if (!selectedOption) return null;

  const randomDraw = Math.random();
  const rewardAmount = randomDraw < selectedOption.probability ? selectedOption.amount : 0;
  return {
    response,
    selectedOption: selectedOption.label,
    selectionMethod,
    probability: selectedOption.probability,
    optionAmount: selectedOption.amount,
    randomDraw: Math.round(randomDraw * 10000) / 10000,
    rewardAmount,
  };
}

function createPracticeStep1Payment(value) {
  return settlePracticeCiDecision({
    response: "Indifferent",
    indifferenceSelectionMethod: "random_indifference",
    options: [
      { label: "A", probability: 0.2, amount: 100 },
      { label: "B", probability: 0.1, amount: value },
    ],
  });
}

function createPracticeStep4Payment(choice) {
  return settlePracticeCiDecision({
    response: choice,
    indifferenceSelectionMethod: "random_indifferent_choice",
    options: [
      { label: "A", probability: 0.4, amount: 190 },
      { label: "B", probability: 0.8, amount: 95 },
    ],
  });
}

function bindCurrentPracticeHandlers(block) {
  if (state.practiceStepIndex === PRACTICE_STEP_1) {
    const input = document.getElementById("practiceStep1Value");
    input?.addEventListener("input", () => {
      state.runtime.value = input.value;
    });
    document.getElementById("practiceStep1Form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const rawValue = Number(input?.value);
      if (!Number.isFinite(rawValue) || rawValue < 100 || rawValue > 100_000_000) {
        state.error = "100〜100,000,000円の範囲で入力してください。";
        render();
        return;
      }
      const value = roundYen(rawValue);
      showCustomPracticeFeedback({
        kind: "step1",
        value,
        payment: createPracticeStep1Payment(value),
      });
    });
    return;
  }
  if (state.practiceStepIndex === PRACTICE_STEP_4) {
    document.querySelectorAll("[data-practice-step4-choice]").forEach((button) => {
      button.addEventListener("click", () => {
        const choice = button.dataset.practiceStep4Choice;
        showCustomPracticeFeedback({
          kind: "step4",
          choice,
          payment: createPracticeStep4Payment(choice),
        });
      });
    });
    return;
  }
  const task = currentPracticeTask();
  bindTaskHandlers(block, task, { practice: true });
}

function renderPractice() {
  const block = currentBlock();
  if (state.comprehension.locked) state.practicePanel = PRACTICE_PANEL_COMPREHENSION;
  if (state.practicePanel === PRACTICE_PANEL_COMPREHENSION) {
    renderComprehensionWindow();
    return;
  }

  const practiceNumber = state.practiceStepIndex + 1;
  app.innerHTML = `
    <main class="screen practice-hub-screen">
      ${renderPracticeTabs(PRACTICE_PANEL_PRACTICE)}
      <section id="practiceWindowPanel" role="tabpanel" aria-labelledby="practiceWindowTab">
        <section class="mode-panel practice-mode">
          <strong>練習問題</strong>
          <span>この回答は保存されません。何度でもやり直せます。</span>
        </section>
        <div class="progress-bar-wrapper practice-progress">
          <div class="progress-info">
            <span>練習 ${practiceNumber} / ${PRACTICE_STEP_COUNT}</span>
            <span class="block-label">${escapeHtml(block.title)}</span>
          </div>
          <div class="progress-track"><div class="progress-fill" style="width:${(practiceNumber / PRACTICE_STEP_COUNT) * 100}%"></div></div>
        </div>
        ${renderCurrentPracticeBody(block)}
      </section>
    </main>
  `;
  bindPracticeNavigation();
  bindCurrentPracticeHandlers(block);
}

function renderPracticeSummary() {
  const block = currentBlock();
  if (state.comprehension.locked) state.practicePanel = PRACTICE_PANEL_COMPREHENSION;
  if (state.practicePanel === PRACTICE_PANEL_COMPREHENSION) {
    renderComprehensionWindow();
    return;
  }

  app.innerHTML = `
    <main class="screen practice-hub-screen">
      ${renderPracticeTabs(PRACTICE_PANEL_PRACTICE)}
      <section class="practice-summary-panel" id="practiceWindowPanel" role="tabpanel" aria-labelledby="practiceWindowTab">
        <div class="step-label">練習完了</div>
        <h2>${escapeHtml(block.title)}</h2>
        <p>練習問題が終わりました。理解度確認に全問正解すると、正式な課題が始まります。</p>
        <div class="btn-row">
          ${state.comprehension.passed
            ? isComprehensionPassSaved()
              ? '<button class="btn-primary" id="startFormalTasks" type="button">正式な課題を始める</button>'
              : '<button class="btn-primary" id="retryComprehensionSave" type="button">回答記録の保存を再試行</button>'
            : '<button class="btn-primary" id="switchToComprehension" type="button">理解度確認へ</button>'}
          <button class="btn-secondary" id="redoPractice" type="button">練習をもう一度</button>
        </div>
      </section>
    </main>
  `;
  bindPracticeNavigation();
  document.getElementById("startFormalTasks")?.addEventListener("click", startFormalTasks);
  document.getElementById("retryComprehensionSave")?.addEventListener("click", retryComprehensionSave);
  document.getElementById("redoPractice").addEventListener("click", resetPractice);
}

function renderComprehensionQuestion(question, index) {
  const selectedAnswer = state.comprehension.answers[question.id] || "";
  const options = question.options.map((option) => {
    const prefix = /^[a-d]$/.test(option.value) ? `${option.value.toUpperCase()}. ` : "";
    return `
      <label class="choice-option comprehension-option">
        <input
          type="radio"
          name="comprehension-${escapeHtml(question.id)}"
          value="${escapeHtml(option.value)}"
          data-comprehension-question="${escapeHtml(question.id)}"
          ${selectedAnswer === option.value ? "checked" : ""}
          ${state.comprehension.locked || state.comprehension.passed ? "disabled" : ""}
        />
        <span><strong>${escapeHtml(prefix)}</strong>${escapeHtml(option.label)}</span>
      </label>
    `;
  }).join("");
  return `
    <fieldset class="comprehension-question" id="comprehension-question-${escapeHtml(question.id)}" tabindex="-1">
      <legend><span class="comprehension-question-number">${index + 1}</span>${escapeHtml(question.prompt)}</legend>
      ${question.visual === "step4"
        ? renderFixedStep4Display({ selectedChoice: "Indifferent", neutralLabels: true, compact: true })
        : ""}
      <div class="comprehension-options">${options}</div>
    </fieldset>
  `;
}

function renderComprehensionConfirmDialog() {
  if (!state.comprehension.confirmOpen) return "";
  return `
    <div class="comprehension-modal-backdrop" role="presentation">
      <section class="comprehension-modal" id="comprehensionConfirmDialog" role="dialog" aria-modal="true" aria-labelledby="comprehensionConfirmTitle">
        <h2 id="comprehensionConfirmTitle">回答を提出しますか？</h2>
        <p>6問すべての回答を確認します。</p>
        <div class="btn-row comprehension-modal-actions">
          <button class="btn-secondary" id="cancelComprehensionSubmit" type="button">回答を見直す</button>
          <button class="btn-primary" id="confirmComprehensionSubmit" type="button">回答を確認する</button>
        </div>
      </section>
    </div>
  `;
}

function renderComprehensionLockDialog() {
  if (!state.comprehension.locked) return "";
  return `
    <div class="comprehension-modal-backdrop" role="presentation">
      <section class="comprehension-modal comprehension-lock-dialog" id="comprehensionLockDialog" role="alertdialog" aria-modal="true" aria-labelledby="comprehensionLockTitle" aria-describedby="comprehensionLockDescription">
        <div class="step-label">回答を停止してください</div>
        <h2 id="comprehensionLockTitle">実験担当者をお呼びください</h2>
        <p id="comprehensionLockDescription">正しくない回答が続きました。これ以上回答せず、手を挙げて実験担当者に知らせてください。</p>
        <form class="comprehension-unlock-form" id="comprehensionUnlockForm">
          <label for="comprehensionUnlockCode">実験担当者用コード</label>
          <input id="comprehensionUnlockCode" type="password" inputmode="numeric" maxlength="7" autocomplete="off" placeholder="7桁のコード" />
          <p class="error comprehension-unlock-error" id="comprehensionUnlockError" aria-live="assertive"></p>
          <button class="btn-primary" type="submit">確認</button>
        </form>
      </section>
    </div>
  `;
}

function renderComprehensionWindow() {
  ensureComprehensionAttemptTiming();
  const allAnswered = COMPREHENSION_QUESTIONS.every((question) => state.comprehension.answers[question.id]);
  const canSubmit = state.practiceCompleted && !state.comprehension.locked && !state.comprehension.passed;
  const messageClass = state.comprehension.messageType ? ` ${state.comprehension.messageType}` : "";
  app.innerHTML = `
    <main class="screen practice-hub-screen">
      ${renderPracticeTabs(PRACTICE_PANEL_COMPREHENSION)}
      <section class="comprehension-window" id="comprehensionWindowPanel" role="tabpanel" aria-labelledby="comprehensionWindowTab">
        <div class="step-label">理解度確認</div>
        <h2>実験の理解度確認</h2>
        <p class="comprehension-intro">説明を確認し、6問すべてに回答してください。</p>
        ${state.practiceCompleted
          ? ""
          : '<p class="comprehension-status info">回答内容は先に確認できます。回答の提出は、練習問題を完了した後にできます。</p>'}
        <form class="comprehension-form" id="comprehensionForm">
          <div class="comprehension-question-list">
            ${COMPREHENSION_QUESTIONS.map(renderComprehensionQuestion).join("")}
          </div>
          <div class="comprehension-footer">
            <p class="comprehension-attempts">回答確認の残り回数：<strong>${state.comprehension.attemptsRemaining}回</strong></p>
            <p class="comprehension-status${messageClass}" id="comprehensionStatus" aria-live="assertive">${escapeHtml(state.comprehension.message)}</p>
            ${!allAnswered && state.practiceCompleted
              ? '<p class="comprehension-help">未回答の問題があります。すべての問題に回答してください。</p>'
              : ""}
            <div class="comprehension-actions">
              ${state.comprehension.passed
                ? ""
                : '<button class="btn-secondary" id="switchToPractice" type="button">練習問題へ</button>'}
              ${state.comprehension.passed
                ? isComprehensionPassSaved()
                  ? '<button class="btn-primary" id="startFormalTasks" type="button">正式な実験を開始する</button>'
                  : '<button class="btn-primary" id="retryComprehensionSave" type="button">保存を再試行</button>'
                : `<button class="btn-primary" id="submitComprehension" type="submit" ${canSubmit ? "" : "disabled"}>回答を提出</button>`}
            </div>
          </div>
        </form>
      </section>
      ${renderComprehensionConfirmDialog()}
      ${renderComprehensionLockDialog()}
    </main>
  `;
  bindComprehensionHandlers();
}

function bindModalFocusTrap(dialogId, initialFocusId, onEscape = null) {
  const dialog = document.getElementById(dialogId);
  if (!dialog) return;
  const focusable = Array.from(dialog.querySelectorAll("button:not([disabled]), input:not([disabled])"));
  const initialFocus = document.getElementById(initialFocusId) || focusable[0];
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      if (onEscape) onEscape();
      return;
    }
    if (event.key !== "Tab" || focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  window.requestAnimationFrame(() => initialFocus?.focus());
}

function focusComprehensionQuestion(questionId) {
  window.requestAnimationFrame(() => {
    document.getElementById(`comprehension-question-${questionId}`)?.focus();
  });
}

function beginComprehensionAttempt() {
  state.comprehension.attemptStartedAt = Date.now();
  state.comprehension.questionResponseTimesMs = {};
  return state.comprehension.attemptStartedAt;
}

function ensureComprehensionAttemptTiming() {
  if (!state.practiceCompleted || state.comprehension.locked || state.comprehension.passed) return null;
  const startedAt = Number(state.comprehension.attemptStartedAt);
  if (Number.isFinite(startedAt) && startedAt > 0) return startedAt;
  return beginComprehensionAttempt();
}

function comprehensionQuestionResponseTimesForEvent() {
  return Object.fromEntries(COMPREHENSION_QUESTIONS.map((question) => {
    const duration = state.comprehension.questionResponseTimesMs[question.id];
    return [question.id, Number.isInteger(duration) && duration >= 0 ? duration : null];
  }));
}

function evaluateComprehensionAnswers() {
  state.comprehension.confirmOpen = false;
  const submittedAnswers = { ...state.comprehension.answers };
  const wrongQuestionIds = COMPREHENSION_QUESTIONS
    .filter((question) => submittedAnswers[question.id] !== question.correctAnswer)
    .map((question) => question.id);
  const attemptsBefore = state.comprehension.attemptsRemaining;
  const attemptsAfter = Math.max(0, attemptsBefore - 1);
  const attemptLimit = state.comprehension.roundNumber === 1
    ? COMPREHENSION_INITIAL_ATTEMPTS
    : COMPREHENSION_RETRY_ATTEMPTS;
  const attemptNumber = state.comprehension.attemptNumber + 1;
  const attemptInRound = attemptLimit - attemptsBefore + 1;
  const submittedAt = Date.now();
  const attemptStartedAt = ensureComprehensionAttemptTiming() || submittedAt;
  const passed = wrongQuestionIds.length === 0;
  const lockedAfter = !passed && attemptsAfter === 0;
  const comprehensionEvent = {
    event_id: createComprehensionEventId(),
    question_set_version: COMPREHENSION_QUESTION_SET_VERSION,
    sequence: state.comprehension.events.length + 1,
    event_type: "submission",
    outcome: passed ? "passed" : lockedAfter ? "locked" : "failed",
    round_number: state.comprehension.roundNumber,
    attempt_number: attemptNumber,
    attempt_in_round: attemptInRound,
    attempt_limit: attemptLimit,
    attempts_before: attemptsBefore,
    attempts_after: attemptsAfter,
    attempt_started_at: new Date(attemptStartedAt).toISOString(),
    attempt_duration_ms: Math.max(0, submittedAt - attemptStartedAt),
    question_response_times_ms: comprehensionQuestionResponseTimesForEvent(),
    answers: submittedAnswers,
    incorrect_question_ids: wrongQuestionIds,
    correct_count: COMPREHENSION_QUESTIONS.length - wrongQuestionIds.length,
    passed,
    locked_after: lockedAfter,
    source_timestamp: new Date(submittedAt).toISOString(),
  };
  state.comprehension.attemptNumber = attemptNumber;

  if (passed) {
    state.comprehension.passed = true;
    state.comprehension.locked = false;
    state.comprehension.message = EMBEDDED_MODE
      ? "すべて正解です。回答記録を保存しています。保存後、正式な実験を開始できます。"
      : "すべて正解です。理解度確認が完了しました。続けて、正式な実験を開始してください。";
    state.comprehension.messageType = EMBEDDED_MODE ? "info" : "success";
    recordComprehensionEvent(comprehensionEvent);
    state.practicePanel = PRACTICE_PANEL_COMPREHENSION;
    render();
    return;
  }

  wrongQuestionIds.forEach((questionId) => {
    delete state.comprehension.answers[questionId];
  });
  beginComprehensionAttempt();
  state.comprehension.attemptsRemaining = attemptsAfter;
  state.comprehension.locked = lockedAfter;
  state.comprehension.message = "一部の回答が正しくありませんでした。正しくなかった問題の選択を解除しました。内容を確認し、もう一度回答してください。";
  state.comprehension.messageType = "error";
  state.practicePanel = PRACTICE_PANEL_COMPREHENSION;
  recordComprehensionEvent(comprehensionEvent);
  render();
  if (!state.comprehension.locked) focusComprehensionQuestion(wrongQuestionIds[0]);
}

function bindComprehensionHandlers() {
  bindPracticeNavigation();
  document.getElementById("retryComprehensionSave")?.addEventListener("click", retryComprehensionSave);
  document.getElementById("startFormalTasks")?.addEventListener("click", startFormalTasks);
  document.querySelectorAll("[data-comprehension-question]").forEach((input) => {
    input.addEventListener("change", () => {
      state.comprehension.answers[input.dataset.comprehensionQuestion] = input.value;
      const attemptStartedAt = ensureComprehensionAttemptTiming();
      const questionId = input.dataset.comprehensionQuestion;
      if (
        attemptStartedAt
        && !Object.prototype.hasOwnProperty.call(state.comprehension.questionResponseTimesMs, questionId)
      ) {
        state.comprehension.questionResponseTimesMs[questionId] = Math.max(0, Date.now() - attemptStartedAt);
      }
      const allAnswered = COMPREHENSION_QUESTIONS.every((question) => state.comprehension.answers[question.id]);
      if (allAnswered) {
        document.querySelector(".comprehension-help")?.remove();
        if (state.comprehension.message === COMPREHENSION_INCOMPLETE_MESSAGE) {
          state.comprehension.message = "";
          state.comprehension.messageType = "";
          const status = document.getElementById("comprehensionStatus");
          if (status) {
            status.textContent = "";
            status.className = "comprehension-status";
          }
        }
      }
      saveState();
    });
  });

  document.getElementById("comprehensionForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!state.practiceCompleted || state.comprehension.locked || state.comprehension.passed) return;
    const unanswered = COMPREHENSION_QUESTIONS.filter((question) => !state.comprehension.answers[question.id]);
    if (unanswered.length > 0) {
      state.comprehension.message = COMPREHENSION_INCOMPLETE_MESSAGE;
      state.comprehension.messageType = "error";
      saveState();
      render();
      focusComprehensionQuestion(unanswered[0].id);
      return;
    }
    state.comprehension.confirmOpen = true;
    render();
  });

  document.getElementById("cancelComprehensionSubmit")?.addEventListener("click", () => {
    state.comprehension.confirmOpen = false;
    render();
    window.requestAnimationFrame(() => document.getElementById("submitComprehension")?.focus());
  });
  document.getElementById("confirmComprehensionSubmit")?.addEventListener("click", evaluateComprehensionAnswers);
  bindModalFocusTrap("comprehensionConfirmDialog", "cancelComprehensionSubmit", () => {
    state.comprehension.confirmOpen = false;
    render();
    window.requestAnimationFrame(() => document.getElementById("submitComprehension")?.focus());
  });

  const unlockForm = document.getElementById("comprehensionUnlockForm");
  const unlockInput = document.getElementById("comprehensionUnlockCode");
  unlockInput?.addEventListener("input", () => {
    unlockInput.value = unlockInput.value.replace(/\D/g, "").slice(0, 7);
  });
  unlockForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const code = unlockInput?.value || "";
    if (code !== COMPREHENSION_UNLOCK_CODE) {
      const error = document.getElementById("comprehensionUnlockError");
      if (error) error.textContent = "コードが正しくありません。手を挙げたまま、実験担当者をお待ちください。";
      if (unlockInput) unlockInput.value = "";
      unlockInput?.focus();
      return;
    }
    const nextRoundNumber = state.comprehension.roundNumber + 1;
    const retainedAnswers = { ...state.comprehension.answers };
    const unlockEvent = {
      event_id: createComprehensionEventId(),
      question_set_version: COMPREHENSION_QUESTION_SET_VERSION,
      sequence: state.comprehension.events.length + 1,
      event_type: "unlock",
      outcome: "unlocked",
      round_number: nextRoundNumber,
      attempt_number: null,
      attempt_in_round: null,
      attempt_limit: COMPREHENSION_RETRY_ATTEMPTS,
      attempts_before: 0,
      attempts_after: COMPREHENSION_RETRY_ATTEMPTS,
      attempt_started_at: null,
      attempt_duration_ms: null,
      question_response_times_ms: {},
      answers: retainedAnswers,
      incorrect_question_ids: [],
      correct_count: Object.keys(retainedAnswers).length,
      passed: false,
      locked_after: false,
      source_timestamp: new Date().toISOString(),
    };
    state.comprehension.locked = false;
    state.comprehension.attemptsRemaining = COMPREHENSION_RETRY_ATTEMPTS;
    state.comprehension.roundNumber = nextRoundNumber;
    state.comprehension.message = "理解度確認に戻ります。説明を確認してから回答してください。回答の確認はあと2回できます。";
    state.comprehension.messageType = "info";
    state.practicePanel = PRACTICE_PANEL_COMPREHENSION;
    beginComprehensionAttempt();
    recordComprehensionEvent(unlockEvent);
    render();
    const unanswered = COMPREHENSION_QUESTIONS.find((question) => !state.comprehension.answers[question.id]);
    if (unanswered) focusComprehensionQuestion(unanswered.id);
  });
  bindModalFocusTrap("comprehensionLockDialog", "comprehensionUnlockCode");
}

function renderPracticeCiPaymentFeedback(payment) {
  if (!payment) return "";

  const wasParticipantChoice = payment.selectionMethod === "participant_choice";
  const wasStep4Indifference = payment.selectionMethod === "random_indifferent_choice";
  const heading = wasParticipantChoice
    ? "あなたが選んだ選択肢をもとに抽選しました"
    : wasStep4Indifference
    ? "無差別のため、A と B からランダムに選びました"
    : "この2つの選択肢は無差別として扱います";
  const explanation = wasParticipantChoice
    ? "あなたが選んだくじの確率に従って、獲得金額を決めました。"
    : "A と B からランダムに1つを選び、選ばれたくじの確率に従って獲得金額を決めました。";
  const selectedBadge = wasParticipantChoice ? "あなたが選んだ選択肢" : "ランダムに選ばれた選択肢";

  return `
    <section class="practice-ci-payment-feedback">
      <h4>${heading}</h4>
      <p>${explanation}</p>
      <div class="practice-ci-payment-summary">
        <div>
          <span>抽選された選択肢</span>
          <strong>選択肢${escapeHtml(payment.selectedOption)}</strong>
          <small>${selectedBadge}</small>
        </div>
        <div>
          <span>抽選結果</span>
          <strong>${escapeHtml(formatOutcomeProbability(payment.probability))} の抽選で ${escapeHtml(formatYen(payment.rewardAmount))}</strong>
        </div>
      </div>
      <div class="practice-ci-payment-reward">
        <span>獲得金額</span>
        <strong>${escapeHtml(formatYen(payment.rewardAmount))}</strong>
      </div>
    </section>
  `;
}

function renderPracticeFeedback() {
  const practiceFeedback = state.practiceFeedback;
  const isFinalPractice = state.practiceStepIndex === PRACTICE_STEP_4;
  let feedbackContent = "";
  let feedbackHeading = "練習問題の回答";
  let modeDescription = "この回答は練習用であり、研究データには保存されません。";

  if (state.practiceStepIndex === PRACTICE_STEP_MPL && practiceFeedback?.feedback) {
    const task = currentPracticeTask();
    const record = { payload: practiceFeedback.payload || {} };
    feedbackHeading = "この練習問題の結果";
    modeDescription = "この抽選結果は練習用であり、報酬には含まれません。";
    feedbackContent = `
      <div class="step-label">練習 1 / ${PRACTICE_STEP_COUNT}</div>
      <h3 class="question-title">${feedbackHeading}</h3>
      ${renderFeedbackPaymentSummary(practiceFeedback.feedback)}
      ${renderFeedbackTaskDetails(task, record, practiceFeedback.feedback)}
      <p class="practice-feedback-note">練習問題の結果は保存されず、最終的な報酬にも含まれません。</p>
    `;
  } else if (state.practiceStepIndex === PRACTICE_STEP_1 && practiceFeedback?.kind === "step1") {
    feedbackHeading = "Step 1 フィードバック";
    feedbackContent = `
      <div class="step-label">Step 1</div>
      <h3 class="question-title">Step 1 フィードバック</h3>
      <div class="practice-ci-option-list feedback">
        <p><span class="practice-ci-option-label">選択肢A</span><strong>確率 20% で 100円</strong></p>
        <p><span class="practice-ci-option-label">選択肢B</span><strong>確率 10% で ${escapeHtml(formatAmount(practiceFeedback.value, "JPY"))}</strong></p>
      </div>
      ${renderPracticeCiPaymentFeedback(practiceFeedback.payment)}
      <p class="practice-feedback-note">ここでは正解・不正解はありません。確率の低い選択肢には100円以上を入力し、自分にとって同じくらい魅力的になる金額を答えます。</p>
    `;
  } else if (isFinalPractice && practiceFeedback?.kind === "step4") {
    feedbackHeading = "Step 4 フィードバック";
    const choiceLabels = {
      X: "Aを好む",
      Indifferent: "ほとんど無差別",
      Y: "Bを好む",
    };
    feedbackContent = `
      <div class="step-label">Step 4</div>
      <h3 class="question-title">Step 4 フィードバック：${escapeHtml(choiceLabels[practiceFeedback.choice] || "")}</h3>
      ${renderFixedStep4Display({ selectedChoice: practiceFeedback.choice, showStepLabel: false })}
      ${renderPracticeCiPaymentFeedback(practiceFeedback.payment)}
      <p class="practice-feedback-note">ここでは正解・不正解はありません。正式な課題でも自分の本当の好みに基づいて回答してください。</p>
    `;
  } else {
    state.phase = "practice";
    state.practiceFeedback = null;
    saveState();
    render();
    return;
  }

  app.innerHTML = `
    <main class="screen">
      <section class="mode-panel practice-mode">
        <strong>${feedbackHeading}</strong>
        <span>${modeDescription}</span>
      </section>
      <section class="feedback-card practice-feedback-card">
        ${feedbackContent}
        <div class="feedback-actions">
          ${isFinalPractice
            ? '<button class="btn-secondary" id="redoPractice" type="button">練習をもう一度</button><button class="btn-primary" id="continueAfterPracticeFeedback" type="button">理解度確認へ</button>'
            : '<button class="btn-primary" id="continueToNextPractice" type="button">次の練習問題へ</button>'}
        </div>
      </section>
    </main>
  `;
  document.getElementById("continueToNextPractice")?.addEventListener("click", advanceToNextPractice);
  document.getElementById("redoPractice")?.addEventListener("click", resetPractice);
  document.getElementById("continueAfterPracticeFeedback")?.addEventListener("click", finishPracticeFeedback);
}

function advanceToNextPractice() {
  state.practiceStepIndex = Math.min(PRACTICE_STEP_4, state.practiceStepIndex + 1);
  state.phase = "practice";
  state.practicePanel = PRACTICE_PANEL_PRACTICE;
  state.runtime = null;
  state.taskTimedOut = false;
  state.memoryChallenge = null;
  state.practiceFeedback = null;
  state.taskStartedAt = Date.now();
  beginComprehensionAttempt();
  state.error = "";
  saveState();
  render();
  scrollToTopAfterRender();
}

function resetPractice() {
  state.phase = "practice";
  state.practicePanel = PRACTICE_PANEL_PRACTICE;
  state.practiceCompleted = false;
  state.practiceStepIndex = PRACTICE_STEP_MPL;
  state.runtime = null;
  state.taskTimedOut = false;
  state.memoryChallenge = null;
  state.practiceFeedback = null;
  state.taskStartedAt = Date.now();
  state.error = "";
  saveState();
  render();
}

function finishPracticeFeedback() {
  if (state.practiceStepIndex !== PRACTICE_STEP_4) {
    advanceToNextPractice();
    return;
  }
  state.phase = "practiceSummary";
  state.practicePanel = PRACTICE_PANEL_COMPREHENSION;
  state.practiceCompleted = true;
  state.runtime = null;
  state.taskTimedOut = false;
  state.memoryChallenge = null;
  state.practiceFeedback = null;
  state.taskStartedAt = Date.now();
  state.error = "";
  saveState();
  render();
  scrollToTopAfterRender();
}

function startFormalTasks() {
  if (!state.practiceCompleted || !state.comprehension.passed) {
    state.practicePanel = PRACTICE_PANEL_COMPREHENSION;
    state.comprehension.message = "練習問題と理解度確認を完了してください。";
    state.comprehension.messageType = "error";
    saveState();
    render();
    return;
  }
  if (!isComprehensionPassSaved()) {
    state.practicePanel = PRACTICE_PANEL_COMPREHENSION;
    retryComprehensionSave();
    return;
  }
  state.taskIndex = 0;
  state.practiceFeedback = null;
  state.comprehension.confirmOpen = false;
  state.error = "";
  startCurrentTaskFlow();
}

function createTaskModes(blockOrTasks, participant = state.participant) {
  const block = Array.isArray(blockOrTasks) ? null : blockOrTasks;
  const tasks = Array.isArray(blockOrTasks) ? blockOrTasks : blockOrTasks.tasks;
  const blockId = block?.id ?? "ad-hoc-task-list";
  if (block?.modeStrategy === EXPERIMENT_G_MODE_STRATEGY) {
    return createExperimentGTaskModes(tasks, participant, blockId);
  }
  const taskCount = tasks.length;
  const modes = Array.from({ length: taskCount }, () => MODE_NORMAL);
  const random = createSeededRandom([
    "pwf-cp-task-assignment",
    CP_ASSIGNMENT_ALGORITHM,
    DESIGN_VERSION,
    String(participant ?? ""),
    String(blockId ?? ""),
  ].join("|"));
  const randomizedIndexes = shuffle(Array.from({ length: taskCount }, (_, index) => index), random);
  // The first displayed formal task is never under time pressure; number-memory mode remains eligible.
  const timePressureCandidates = randomizedIndexes.filter((index) => index !== 0);
  const timePressureIndexes = timePressureCandidates.slice(0, TIME_PRESSURE_TASKS_PER_BLOCK);
  const remainingIndexes = randomizedIndexes.filter((index) => !timePressureIndexes.includes(index));
  const numberMemoryIndexes = remainingIndexes.slice(0, NUMBER_MEMORY_TASKS_PER_BLOCK);
  timePressureIndexes.forEach((index) => {
    modes[index] = MODE_TIME_PRESSURE;
  });
  numberMemoryIndexes.forEach((index) => {
    modes[index] = MODE_NUMBER_MEMORY;
  });
  return modes;
}

function createExperimentGTaskModes(tasks, participant, blockId) {
  const modes = Array.from({ length: tasks.length }, () => MODE_NORMAL);
  const random = createSeededRandom([
    "pwf-cp-task-assignment",
    CP_ASSIGNMENT_ALGORITHM,
    DESIGN_VERSION,
    String(participant ?? ""),
    String(blockId ?? ""),
  ].join("|"));
  const categories = [...new Set(tasks.map((task) => task.category).filter(Boolean))];
  categories.forEach((category) => {
    const categoryIndexes = tasks
      .map((task, index) => ({ task, index }))
      .filter(({ task, index }) => task.category === category && index !== 0)
      .map(({ index }) => index);
    const categoryTaskCount = tasks.filter((task) => task.category === category).length;
    const timePressureCount = Math.min(Math.floor(categoryTaskCount / 2), categoryIndexes.length);
    shuffle(categoryIndexes, random).slice(0, timePressureCount).forEach((index) => {
      modes[index] = MODE_TIME_PRESSURE;
    });
  });
  return modes;
}

function createSeededRandom(seedText) {
  let seed = 2166136261;
  for (let index = 0; index < seedText.length; index += 1) {
    seed ^= seedText.charCodeAt(index);
    seed = Math.imul(seed, 16777619);
  }
  seed >>>= 0;
  return () => {
    seed += 0x6D2B79F5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(items, random = Math.random) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function createTaskOrder(block, participant) {
  const indexes = Array.from({ length: block.tasks.length }, (_, index) => index);
  if (block.id !== "experiment-g") return indexes;
  return shuffle(indexes, createSeededRandom(`${DESIGN_VERSION}:${participant}:${block.id}:task-order`));
}

function normalizeTaskOrder(block, savedOrder, participant) {
  const taskCount = block.tasks.length;
  if (
    Array.isArray(savedOrder)
    && savedOrder.length === taskCount
    && new Set(savedOrder).size === taskCount
    && savedOrder.every((index) => Number.isInteger(index) && index >= 0 && index < taskCount)
  ) {
    return savedOrder;
  }
  return createTaskOrder(block, participant);
}

function taskModeAt(index) {
  return state.taskModes[index] ?? MODE_NORMAL;
}

function currentTaskMode() {
  if (!["timePressureIntro", "memoryDisplay", "task", "memoryPostRecall"].includes(state.phase)) return MODE_NORMAL;
  return taskModeAt(state.taskIndex);
}

function isTimePressureTask() {
  return state.phase === "task" && currentTaskMode() === MODE_TIME_PRESSURE;
}

function timePressureSecondsForBlock(block = currentBlock()) {
  return block?.id === "abdellaoui-2000"
    ? ABDELLAOUI_TIME_PRESSURE_SECONDS
    : DEFAULT_TIME_PRESSURE_SECONDS;
}

function clearTaskTimer() {
  if (!taskTimerId) return;
  cancelAnimationFrame(taskTimerId);
  clearInterval(taskTimerId);
  taskTimerId = null;
}

function clearMemoryTimer() {
  if (!memoryTimerId) return;
  cancelAnimationFrame(memoryTimerId);
  clearTimeout(memoryTimerId);
  clearInterval(memoryTimerId);
  memoryTimerId = null;
}

function remainingTaskMs() {
  const limitMs = timePressureSecondsForBlock() * 1000;
  if (!state.taskStartedAt) return limitMs;
  const elapsedMs = Math.max(0, Date.now() - state.taskStartedAt);
  return Math.max(0, limitMs - elapsedMs);
}

function remainingTaskSeconds() {
  return Math.ceil(remainingTaskMs() / 1000);
}

function exceededTaskMs() {
  if (!state.taskStartedAt) return 0;
  const limitMs = timePressureSecondsForBlock() * 1000;
  const elapsedMs = Math.max(0, Date.now() - state.taskStartedAt);
  return Math.max(0, elapsedMs - limitMs);
}

function exceededTaskSeconds() {
  return Math.ceil(exceededTaskMs() / 1000);
}

function startTaskTimerIfNeeded() {
  if (!isTimePressureTask()) return;
  const tick = () => {
    const remainingMs = remainingTaskMs();
    const exceededMs = exceededTaskMs();
    const timer = document.getElementById("timerRemaining");
    const panel = document.getElementById("timerPanel");
    const progress = document.getElementById("timerProgressFill");
    if (timer) timer.textContent = timerText(remainingMs, exceededMs);
    if (panel) panel.classList.toggle("expired", exceededMs > 0 || state.taskTimedOut);
    if (progress) progress.style.width = `${timerProgressPercent(remainingMs, exceededMs)}%`;
    if (remainingMs <= 0) handleTimeExpired();
    if (isTimePressureTask()) taskTimerId = requestAnimationFrame(tick);
  };
  tick();
}

function handleTimeExpired() {
  if (!isTimePressureTask() || state.taskTimedOut) return;
  state.taskTimedOut = true;
}

function timerText(remainingMs, exceededMs) {
  if (exceededMs > 0) return `制限時間を ${Math.ceil(exceededMs / 1000)} 秒超過しています`;
  return `${Math.ceil(remainingMs / 1000)}s / ${timePressureSecondsForBlock()}s`;
}

function timerProgressPercent(remainingMs, exceededMs) {
  if (exceededMs > 0) return 100;
  return Math.max(0, Math.min(100, (remainingMs / (timePressureSecondsForBlock() * 1000)) * 100));
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

function completePractice(task, payload) {
  const feedback = task && payload ? buildTaskFeedback(task, payload) : null;
  state.practiceFeedback = { kind: "mpl", payload, feedback };
  state.phase = "practiceFeedback";
  state.runtime = null;
  state.taskTimedOut = false;
  state.memoryChallenge = null;
  state.taskStartedAt = Date.now();
  state.error = "";
  saveState();
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
  } else if (taskModeAt(state.taskIndex) === MODE_TIME_PRESSURE) {
    state.phase = "timePressureIntro";
    state.taskStartedAt = null;
  } else {
    state.phase = "task";
    state.taskStartedAt = Date.now();
  }
  saveState();
  render();
  scrollToTopAfterRender();
}

function renderTimePressureIntro() {
  const limitSeconds = timePressureSecondsForBlock();
  app.innerHTML = `
    <main class="screen narrow-screen">
      <section class="center-card time-pressure-intro-card">
        <div class="step-label">時間制限</div>
        <h2>次の課題には時間制限があります</h2>
        <p>確認ボタンを押すと、すぐに時間制限つきの課題が始まります。</p>
        <p class="muted">制限時間は ${limitSeconds} 秒です。</p>
        <div class="btn-row">
          <button class="btn-primary" id="startTimePressureTask" type="button" autofocus>確認して始める</button>
        </div>
      </section>
    </main>
  `;
  document.getElementById("startTimePressureTask").addEventListener("click", startTimePressureTask);
}

function startTimePressureTask() {
  state.phase = "task";
  state.runtime = null;
  state.taskTimedOut = false;
  state.memoryChallenge = null;
  state.taskStartedAt = Date.now();
  state.error = "";
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
  if (!["memoryDisplay", "task", "memoryPostRecall"].includes(phase)) return null;
  const number = String(value.number ?? "");
  if (!isValidMemoryNumber(number)) return null;
  return {
    taskIndex: Number.isInteger(Number(value.taskIndex)) ? Number(value.taskIndex) : taskIndex,
    number,
    digits: Number(value.digits) || NUMBER_MEMORY_DIGITS,
    seconds: Number(value.seconds) || NUMBER_MEMORY_SECONDS,
    displayStartedAt: Number(value.displayStartedAt) || Date.now(),
    displayEndedAt: Number(value.displayEndedAt) || null,
    preStartedAt: null,
    preInput: "",
    preCorrect: null,
    preResponseTimeMs: null,
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
        <p class="muted">時間が終わると課題へ進みます。</p>
      </section>
    </main>
  `;
  const finishDisplay = () => {
    clearMemoryTimer();
    challenge.displayEndedAt = Date.now();
    state.phase = "task";
    state.runtime = null;
    state.taskStartedAt = Date.now();
    state.taskTimedOut = false;
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
    if (currentRemainingMs <= 0) {
      finishDisplay();
      return;
    }
    memoryTimerId = requestAnimationFrame(tick);
  };
  tick();
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
  return Math.max(0, Math.min(100, (remainingMs / (NUMBER_MEMORY_SECONDS * 1000)) * 100));
}

function renderMemoryRecall(stage) {
  const challenge = ensureMemoryChallenge();
  app.innerHTML = `
    <main class="screen narrow-screen">
      <section class="center-card">
        <div class="step-label">数字記憶</div>
        <h2>先ほどの数字を入力してください</h2>
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
        </form>
      </section>
    </main>
  `;
  document.getElementById("memoryRecallForm").addEventListener("submit", (event) => {
    event.preventDefault();
    submitMemoryRecall(stage);
  });
  bindMemoryDigitInputs(stage);
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
  if (stage !== "post") return;
  challenge.postInput = value;
  challenge.postCorrect = value === challenge.number;
  challenge.postResponseTimeMs = challenge.postStartedAt ? now - challenge.postStartedAt : null;
  challenge.postCompleted = true;
  updateCurrentMemoryRecord();
  showCurrentTaskFeedback();
}

function bindMemoryDigitInputs(stage) {
  const inputs = memoryDigitInputs();
  inputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      const digits = normalizeDigitInput(input.value);
      if (digits.length > 1) {
        fillMemoryDigits(digits, index);
        maybeSubmitMemoryRecall(stage);
        return;
      }
      input.value = digits;
      if (digits && index < inputs.length - 1) inputs[index + 1].focus();
      maybeSubmitMemoryRecall(stage);
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
      maybeSubmitMemoryRecall(stage);
    });
  });
  inputs[0]?.focus();
}

function maybeSubmitMemoryRecall(stage) {
  if (currentMemoryInputValue().length !== NUMBER_MEMORY_DIGITS) return;
  window.setTimeout(() => submitMemoryRecall(stage), 0);
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

function renderFeedback() {
  const block = currentBlock();
  const task = currentTask();
  const record = currentFeedbackRecord();
  const feedback = record?.payload?.feedback;
  if (!feedback) {
    advanceToNextTask();
    return;
  }
  const totalTasks = block.tasks.length;
  const progress = Math.round(((state.taskIndex + 1) / totalTasks) * 100);
  app.innerHTML = `
    <main class="screen">
      <div class="progress-bar-wrapper">
        <div class="progress-info">
          <span>課題 ${state.taskIndex + 1} / ${totalTasks}</span>
          <span class="block-label">${escapeHtml(block.title)} | ${escapeHtml(block.label)}</span>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div>
      </div>
      <section class="feedback-card">
        <div class="step-label">抽選結果</div>
        <h3 class="question-title">この課題の結果</h3>
        ${renderFeedbackPaymentSummary(feedback)}
        ${renderFeedbackPenaltyReasons(feedback)}
        ${renderFeedbackTaskDetails(task, record, feedback)}
        <div class="feedback-actions">
          <button class="btn-primary" id="continueAfterFeedback" type="button">次へ進む</button>
        </div>
      </section>
    </main>
  `;
  document.getElementById("continueAfterFeedback").addEventListener("click", continueAfterFeedback);
}

function renderFeedbackPaymentSummary(feedback) {
  return `
    <div class="feedback-payment-summary">
      <span class="feedback-summary-label">
        <span>獲得金額</span>
        ${feedback.summary_note ? `<small>${escapeHtml(feedback.summary_note)}</small>` : ""}
      </span>
      <strong class="feedback-total ${feedback.penalty_applied ? "zero" : ""}">${escapeHtml(formatYen(feedback.total_amount))}</strong>
    </div>
  `;
}

function renderFeedbackTaskDetails(task, record, feedback) {
  if (task.type === "mpl") return renderMplFeedbackTable(task, record?.payload, feedback);
  if (task.type === "bisection" || task.type === "probabilityBisection") {
    return renderBisectionFeedbackList(task, record?.payload, feedback);
  }
  return `
    <details class="feedback-details" open>
      <summary class="feedback-summary">
        <span class="feedback-summary-label">抽選の詳細</span>
        <span class="feedback-toggle">詳細</span>
      </summary>
      <div class="feedback-detail-list">
        ${renderFeedbackItems(feedback.items)}
      </div>
    </details>
  `;
}

function renderMplFeedbackTable(task, payload, feedback) {
  const itemsByRow = new Map((feedback.items || []).map((item) => [Number(item.item_index), item]));
  const compact = task.rows.length >= 18;
  return `
    <section class="feedback-task-details feedback-mpl-details">
      <p class="feedback-task-intro">色が付いている選択肢が、あなたが選んだ選択肢です。右端に各行の抽選結果を表示しています。</p>
      <div class="table feedback-mpl-table ${compact ? "compact-table" : ""}">
        <div class="table-row table-head">
          <div></div>
          <div>行</div>
          <div><span>選択肢A</span><span class="table-head-subtitle">くじ</span></div>
          <div><span>選択肢B</span><span class="table-head-subtitle">確実金額</span></div>
          <div>獲得金額</div>
        </div>
        ${task.rows.map((row) => {
          const item = itemsByRow.get(row.row);
          const choice = payload?.choices?.[row.row] || (item?.selected_label === "選択肢A" ? "A" : "B");
          const rewardSourceClass = choice === "B" ? "feedback-reward-from-b" : "feedback-reward-from-a";
          return `
            <div class="table-row feedback-mpl-row ${item?.selected_for_payment ? "selected-for-payment" : ""}">
              <div class="feedback-payment-marker">${item?.selected_for_payment ? '<span class="feedback-selected-row-label">抽選された行</span>' : ""}</div>
              <div class="feedback-mpl-row-index">${row.row}</div>
              <div class="table-option-cell feedback-table-option choice-a ${choice === "A" ? "selected" : ""}">
                <span class="mobile-cell-label">選択肢A くじ</span>
                <span>${renderMplFeedbackLottery(row.optionA, choice, item)}</span>
              </div>
              <div class="table-option-cell feedback-table-option choice-b ${choice === "B" ? "selected" : ""}">
                <span class="mobile-cell-label">選択肢B 確実金額</span>
                <span class="feedback-certain-amount">${escapeHtml(simplifyCertainDisplay(row.optionB))}</span>
              </div>
              ${renderFeedbackReward(item, `feedback-table-result ${rewardSourceClass}`, { showSelectedBadge: false })}
            </div>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderMplFeedbackLottery(optionA, choice, item) {
  const display = simplifyLotteryDisplay(optionA);
  const rendered = renderTextWithFractions(display);
  if (choice !== "A" || !Number.isFinite(Number(item?.reward_amount))) return rendered;

  const amount = formatYen(item.reward_amount);
  const probability = formatOutcomeProbability(item.outcome_probability);
  const winningOutcome = `${probability}で ${amount}`;
  const outcomes = display.split("、").map((outcome) => outcome.trim());
  const winningIndex = outcomes.findIndex((outcome) => outcome.includes(winningOutcome));
  const amountIndex = outcomes.findIndex((outcome) => outcome.includes(amount));
  const outcomeIndex = winningIndex >= 0 ? winningIndex : amountIndex;

  if (outcomeIndex >= 0) {
    return outcomes.map((outcome, index) => {
      const className = index === outcomeIndex ? "feedback-lottery-outcome" : "feedback-lottery-missed-outcome";
      const separator = index < outcomes.length - 1 ? "、" : "";
      return `<span class="${className}">${renderTextWithFractions(outcome)}${separator}</span>`;
    }).join("");
  }

  return rendered.replace(escapeHtml(amount), `<span class="feedback-lottery-outcome">${escapeHtml(amount)}</span>`);
}

function renderBisectionFeedbackList(task, payload, feedback) {
  const history = Array.isArray(payload?.history) ? payload.history : [];
  if (!history.length) {
    return `
      <details class="feedback-details" open>
        <summary class="feedback-summary">
          <span class="feedback-summary-label">抽選の詳細</span>
          <span class="feedback-toggle">詳細</span>
        </summary>
        <div class="feedback-detail-list">${renderFeedbackItems(feedback.items)}</div>
      </details>
    `;
  }
  const itemsByRound = new Map((feedback.items || []).map((item) => [Number(item.item_index), item]));
  return `
    <section class="feedback-task-details feedback-bisection-details">
      <p class="feedback-task-intro">色が付いている選択肢が、あなたが選んだ選択肢です。各比較の右側に最終的な獲得金額を表示しています。</p>
      <div class="feedback-bisection-list">
        <div class="feedback-bisection-header" aria-hidden="true">
          <span></span>
          <strong>獲得金額</strong>
        </div>
        ${history.map((entry) => renderBisectionFeedbackEntry(task, payload, entry, itemsByRound.get(Number(entry.round)))).join("")}
      </div>
    </section>
  `;
}

function renderBisectionFeedbackEntry(task, payload, entry, item) {
  const choice = entry.choice === "A" ? "A" : "B";
  const isProbability = task.type === "probabilityBisection";
  const optionA = isProbability
    ? `${escapeHtml(formatYen(entry.sure_amount ?? payload.sure_amount))} を確実に受け取る`
    : renderTextWithFractions(task.optionA);
  const optionB = isProbability
    ? `${escapeHtml(formatProbability(entry.candidate))} の確率で ${escapeHtml(formatYen(entry.high_amount ?? payload.high_amount))}、それ以外は ${escapeHtml(formatYen(entry.baseline_amount ?? payload.baseline_amount))}`
    : `${renderTextWithFractions(task.optionBPrefix)} ${escapeHtml(formatAmount(entry.candidate, task.unit))}${task.optionBSuffix ? `、${renderTextWithFractions(task.optionBSuffix)}` : ""}`;
  const stepLabel = isProbability ? "確率比較" : "比較";
  return `
    <article class="feedback-bisection-entry ${item?.selected_for_payment ? "selected-for-payment" : ""}">
      <div class="feedback-bisection-step">${stepLabel} ${escapeHtml(entry.round)}</div>
      <div class="feedback-bisection-row">
        <div class="feedback-bisection-options">
          <div class="lottery-box lottery-a feedback-lottery-box ${choice === "A" ? "selected" : ""}">
            <div class="lottery-label">選択肢A</div>
            <div class="lottery-detail">${optionA}</div>
          </div>
          <div class="vs-label">vs</div>
          <div class="lottery-box lottery-b feedback-lottery-box ${choice === "B" ? "selected" : ""}">
            <div class="lottery-label">選択肢B</div>
            <div class="lottery-detail">${optionB}</div>
          </div>
        </div>
        ${renderFeedbackReward(item, "feedback-bisection-result")}
      </div>
    </article>
  `;
}

function renderFeedbackReward(item, className, options = {}) {
  const amount = Number(item?.reward_amount);
  const renderedAmount = Number.isFinite(amount) ? formatYen(amount) : "—";
  const showSelectedBadge = options.showSelectedBadge !== false;
  return `
    <div class="${className}">
      <strong>${escapeHtml(renderedAmount)}</strong>
      ${showSelectedBadge && item?.selected_for_payment ? `<span class="feedback-selected-badge">${escapeHtml(item.selected_payment_badge || "抽選された行")}</span>` : ""}
    </div>
  `;
}

function renderFeedbackPenaltyReasons(feedback) {
  const reasons = Array.isArray(feedback?.penalty_reasons) ? feedback.penalty_reasons : [];
  if (!reasons.length) return "";
  return `
    <div class="feedback-zero-reasons">
      ${reasons.map((reason) => `<p>${escapeHtml(reason)}</p>`).join("")}
    </div>
  `;
}

function renderFeedbackItems(items = []) {
  if (!items.length) {
    return `<p class="muted">この課題の抽選明細はありません。</p>`;
  }
  return `
    <div class="feedback-item-header">
      <span></span>
      <strong>獲得金額</strong>
    </div>
    ${items.map((item) => `
    <div class="feedback-item ${item.selected_for_payment ? "selected-for-payment" : ""}">
      <div class="feedback-item-main">
        <strong>${escapeHtml(item.label)}</strong>
        <span>${escapeHtml(item.selected_label)}: ${escapeHtml(item.selected_option)}</span>
      </div>
      <div class="feedback-item-result">
        <strong>${escapeHtml(formatYen(item.reward_amount))}</strong>
        ${item.selected_for_payment ? `<span class="feedback-selected-badge">${escapeHtml(item.selected_payment_badge || "抽選された行")}</span>` : ""}
      </div>
    </div>
  `).join("")}
  `;
}

function currentFeedbackRecord() {
  return [...state.records].reverse().find((record) =>
    record.block_id === currentBlock().id && Number(record.task_index) === state.taskIndex + 1
  );
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
  const remainingMs = remainingTaskMs();
  const exceededMs = exceededTaskMs();
  const expired = state.taskTimedOut || exceededMs > 0;
  return `
    <section class="timer-panel ${expired ? "expired" : ""}" id="timerPanel">
      <div class="timer-panel-row">
        <span>時間制限モード</span>
        <span class="timer-countdown" id="timerRemaining">${timerText(remainingMs, exceededMs)}</span>
      </div>
      <div class="timer-progress-track" aria-hidden="true">
        <div class="timer-progress-fill" id="timerProgressFill" style="width:${timerProgressPercent(remainingMs, exceededMs)}%"></div>
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
          <div class="lottery-detail">${renderTextWithFractions(task.optionA)}</div>
        </div>
        <div class="vs-label">vs</div>
        <div class="lottery-box lottery-b">
          <div class="lottery-label">選択肢B</div>
          <div class="lottery-detail">${renderTextWithFractions(task.optionBPrefix)} <strong class="changing-amount">${escapeHtml(formatAmount(runtime.candidate, task.unit))}</strong>${task.optionBSuffix ? `、${renderTextWithFractions(task.optionBSuffix)}` : ""}</div>
        </div>
      </div>
      ${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ""}
      ${renderBisectionActions(runtime)}
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
  return `
    <section class="question-box">
      <div class="step-label">確率比較 ${runtime.round} / ${task.rounds}</div>
      <h3 class="question-title">${escapeHtml(task.prompt)}</h3>
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
      ${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ""}
      ${renderBisectionActions(runtime)}
    </section>
  `;
}

function renderBisectionActions(runtime) {
  const selected = runtime.pendingChoice;
  const nextDisabled = selected ? "" : " disabled";
  return `
    <div class="btn-row bisection-actions">
      <button class="btn-choice choice-a${selected === "A" ? " selected" : ""}" id="chooseA" type="button">選択肢Aを選ぶ</button>
      <button class="btn-choice choice-b${selected === "B" ? " selected" : ""}" id="chooseB" type="button">選択肢Bを選ぶ</button>
    </div>
    <div class="btn-row bisection-next-row">
      <button class="btn-primary bisection-next" id="continueBisection" type="button"${nextDisabled}>次へ進む</button>
    </div>
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
        <div><span>選択肢A</span><span class="table-head-subtitle">くじ</span></div>
        <div><span>選択肢B</span><span class="table-head-subtitle">確実金額</span></div>
      </div>
      ${rows.map((row) => `
        <div class="table-row">
          <div>${row.row}</div>
          <button class="table-option-cell choice-a ${choices[row.row] === "A" ? "selected" : ""}" data-row="${row.row}" data-choice="A" type="button">
            <span class="mobile-cell-label">選択肢A くじ</span>
            <span>${renderTextWithFractions(simplifyLotteryDisplay(row.optionA))}</span>
          </button>
          <button class="table-option-cell choice-b ${choices[row.row] === "B" ? "selected" : ""}" data-row="${row.row}" data-choice="B" type="button">
            <span class="mobile-cell-label">選択肢B 確実金額</span>
            <span>${escapeHtml(simplifyCertainDisplay(row.optionB))}</span>
          </button>
        </div>
      `).join("")}
    </div>
  `;
}

function simplifyLotteryDisplay(value) {
  return String(value ?? "").replace(/%の確率で/g, "%で");
}

function simplifyCertainDisplay(value) {
  return String(value ?? "").replace(/\s*を確実に受け取る\s*$/, "");
}

function shouldUseCompactTable(rows) {
  return state.phase === "task" && rows.length >= 18;
}

function bindTaskHandlers(block, task, options = {}) {
  if (task.type === "bisection") {
    document.getElementById("chooseA").addEventListener("click", () => selectBisectionChoice("A"));
    document.getElementById("chooseB").addEventListener("click", () => selectBisectionChoice("B"));
    document.getElementById("continueBisection").addEventListener("click", () => submitBisection(block, task, options));
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
    document.getElementById("chooseA").addEventListener("click", () => selectBisectionChoice("A"));
    document.getElementById("chooseB").addEventListener("click", () => selectBisectionChoice("B"));
    document.getElementById("continueBisection").addEventListener("click", () => submitProbabilityBisection(block, task, options));
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
      pendingChoice: "",
      history: [],
    };
  } else if (task.type === "probabilityBisection") {
    state.runtime = {
      ...base,
      low: task.low,
      high: task.high,
      candidate: midpointProbability(task.low, task.high),
      round: 1,
      pendingChoice: "",
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
    completePractice(task, {
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

function selectBisectionChoice(choice) {
  if (!state.runtime) return;
  state.runtime.pendingChoice = choice;
  state.error = "";
  render();
  focusContinueBisectionButton();
}

function focusContinueBisectionButton() {
  const button = document.getElementById("continueBisection");
  if (!button || button.disabled) return;
  try {
    button.focus({ preventScroll: true });
  } catch (_error) {
    button.focus();
  }
}

function submitBisection(block, task, options = {}) {
  const runtime = state.runtime;
  const choice = runtime.pendingChoice;
  if (!choice) {
    state.error = "先に選択肢AまたはBを選んでください。";
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
  });
  if (candidateTooLow) {
    runtime.low = candidate;
  } else {
    runtime.high = candidate;
  }
  runtime.pendingChoice = "";
  if (runtime.round >= task.rounds) {
    const estimate = midpoint(runtime.low, runtime.high);
    if (options.practice) {
      completePractice(task, {
        response_type: "bisection",
        estimate,
        final_low: runtime.low,
        final_high: runtime.high,
        history: runtime.history,
      });
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
    completePractice(task, {
      response_type: "outcome_matching",
      unknown: task.unknown,
      value,
    });
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
    completePractice(task, {
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

function submitProbabilityBisection(block, task, options = {}) {
  const runtime = state.runtime;
  const choice = runtime.pendingChoice;
  if (!choice) {
    state.error = "先に選択肢AまたはBを選んでください。";
    render();
    return;
  }
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
  runtime.pendingChoice = "";
  if (runtime.round >= task.rounds) {
    const estimate = midpointProbability(runtime.low, runtime.high);
    if (options.practice) {
      completePractice(task, {
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
    completePractice(task, {
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
  const timePressureSeconds = timePressureSecondsForBlock(block);
  const timeOverSeconds = taskMode === MODE_TIME_PRESSURE ? exceededTaskSeconds() : "";
  const memoryFields = memoryRecordFields();
  const feedback = buildTaskFeedback(task, payload);
  const record = {
    pwf_trial: state.records.length + 1,
    participant: state.participant,
    gender: state.gender,
    consent_version: CONSENT_VERSION,
    consent_accepted_at: state.consentAcceptedAt,
    assignment_group: state.assignment?.groupNumber ?? "",
    assignment_modulus: state.assignment?.modulus ?? "",
    student_id_last3: state.assignment?.lastThreeText ?? "",
    student_id_last_digit: "",
    amount_level: task.amountLevel || block.amountLevel || "standard",
    amount_multiplier: task.amountMultiplier || block.amountMultiplier || 1,
    assigned_block_id: state.assignment?.blockId ?? block.id,
    task_id: task.taskId ?? "",
    task_category: task.category ?? "",
    is_anchor: Boolean(task.isAnchor),
    block_id: block.id,
    block_title: block.title,
    task_index: state.taskIndex + 1,
    task_type: task.type,
    task_mode: taskMode,
    time_limit_seconds: taskMode === MODE_TIME_PRESSURE ? timePressureSeconds : "",
    timed_out: taskMode === MODE_TIME_PRESSURE && (state.taskTimedOut || timeOverSeconds > 0),
    time_over_seconds: timeOverSeconds,
    ...memoryFields,
    prompt: task.prompt,
    payload: {
      task_category: task.category ?? "",
      ...payload,
      feedback,
      memory: memoryPayloadFields(memoryFields),
    },
    response_time_ms: state.taskStartedAt ? Date.now() - state.taskStartedAt : null,
    timestamp: new Date().toISOString(),
  };
  record.payload.feedback = applyFeedbackPenalties(record.payload.feedback, feedbackPenaltyReasons(record));
  state.records.push(record);
  state.error = "";
  saveState();
  postEmbeddedMessage({
    type: "pwf-record",
    participant: state.participant,
    gender: state.gender,
    consent_version: CONSENT_VERSION,
    consent_accepted_at: state.consentAcceptedAt,
    assignment: state.assignment,
    record,
  });
}

function buildTaskFeedback(task, payload) {
  const items = buildFeedbackItems(task, payload);
  const payment = selectFeedbackPayment(task, items);
  return {
    currency: "JPY",
    raw_total_amount: payment.amount,
    total_amount: payment.amount,
    raw_all_items_total_amount: payment.allItemsAmount,
    item_count: items.length,
    payment_rule: payment.rule,
    selected_item_index: payment.selectedItemIndex,
    selected_item_label: payment.selectedItemLabel,
    selected_item_amount: payment.selectedItemAmount,
    summary_note: payment.summaryNote,
    items: payment.items,
    penalty_applied: false,
    penalty_reasons: [],
    settled_at: new Date().toISOString(),
  };
}

function selectFeedbackPayment(task, items) {
  const allItemsAmount = roundYen(items.reduce((sum, item) => sum + Number(item.reward_amount ?? 0), 0));
  const randomPayment = randomFeedbackPaymentConfig(task);
  if (randomPayment && items.length) {
    const selectedIndex = Math.floor(Math.random() * items.length);
    const selectedItem = items[selectedIndex];
    const selectedAmount = roundYen(selectedItem.reward_amount ?? 0);
    return {
      amount: selectedAmount,
      allItemsAmount,
      rule: randomPayment.rule,
      selectedItemIndex: selectedItem.item_index ?? selectedIndex + 1,
      selectedItemLabel: selectedItem.label,
      selectedItemAmount: selectedAmount,
      summaryNote: `${randomPayment.summaryLabel}: ${selectedItem.label}`,
      items: items.map((item, index) => ({
        ...item,
        selected_for_payment: index === selectedIndex,
        selected_payment_badge: index === selectedIndex ? randomPayment.badgeLabel : "",
      })),
    };
  }
  return {
    amount: allItemsAmount,
    allItemsAmount,
    rule: "sum_all_items",
    selectedItemIndex: "",
    selectedItemLabel: "",
    selectedItemAmount: "",
    summaryNote: "",
    items: items.map((item) => ({
      ...item,
      selected_for_payment: false,
      selected_payment_badge: "",
    })),
  };
}

function randomFeedbackPaymentConfig(taskOrType) {
  const type = typeof taskOrType === "string" ? taskOrType : taskOrType?.type;
  if (type === "mpl") {
    return {
      rule: "random_mpl_row",
      summaryLabel: "抽選された行",
      badgeLabel: "抽選された行",
    };
  }
  if (type === "bisection") {
    return {
      rule: "random_bisection_decision",
      summaryLabel: "抽選された決定",
      badgeLabel: "抽選された決定",
    };
  }
  if (type === "probabilityBisection") {
    return {
      rule: "random_probability_bisection_decision",
      summaryLabel: "抽選された決定",
      badgeLabel: "抽選された決定",
    };
  }
  return null;
}

function applyFeedbackPenalties(feedback, reasons) {
  const penaltyReasons = (reasons || []).filter(Boolean);
  const rawTotal = Number.isFinite(Number(feedback?.raw_total_amount))
    ? roundYen(feedback.raw_total_amount)
    : roundYen(feedback?.total_amount ?? 0);
  return {
    ...feedback,
    raw_total_amount: rawTotal,
    total_amount: penaltyReasons.length ? 0 : rawTotal,
    penalty_applied: penaltyReasons.length > 0,
    penalty_reasons: penaltyReasons,
  };
}

function feedbackPenaltyReasons(record) {
  const reasons = [];
  if (record.task_mode === MODE_TIME_PRESSURE && record.timed_out) {
    reasons.push("制限時間を超過したため、獲得金額は ¥0 です。");
  }
  if (record.has_memory_task && record.memory_post_correct === false) {
    reasons.push("数字記憶の回答が正しくなかったため、獲得金額は ¥0 です。");
  }
  return reasons;
}

function buildFeedbackItems(task, payload) {
  if (task.type === "mpl") return buildMplFeedbackItems(task, payload);
  if (task.type === "bisection") return buildBisectionFeedbackItems(task, payload);
  if (task.type === "probabilityBisection") return buildProbabilityBisectionFeedbackItems(task, payload);
  if (task.type === "probabilityMatch") return buildProbabilityMatchFeedbackItems(task, payload);
  if (task.type === "inputMatch" || task.type === "ceMenu") return buildDeterministicFeedbackItems(task, payload);
  return [];
}

function buildMplFeedbackItems(task, payload) {
  const choices = payload.choices || {};
  return task.rows.map((row) => {
    const choice = choices[row.row];
    const selectedOption = choice === "A" ? row.optionA : row.optionB;
    const settlement = choice === "A"
      ? settleLottery(parseLotteryText(row.optionA))
      : settleCertain(row.amount);
    return buildFeedbackItem({
      label: `行 ${row.row}`,
      itemIndex: row.row,
      selectedLabel: choice === "A" ? "選択肢A" : "選択肢B",
      selectedOption,
      settlement,
    });
  });
}

function buildBisectionFeedbackItems(task, payload) {
  const history = Array.isArray(payload.history) ? payload.history : [];
  return history.map((entry) => {
    const choice = entry.choice;
    const candidate = roundYen(entry.candidate);
    const outcomes = choice === "A"
      ? task.settlement.optionA
      : [
          { probability: task.settlement.optionBHighProbability, amount: candidate },
          { probability: task.settlement.optionBLowProbability, amount: task.settlement.optionBLowAmount },
        ];
    const selectedOption = choice === "A"
      ? task.optionA
      : `${task.optionBPrefix} ${formatYen(candidate)}、${task.optionBSuffix}`;
    return buildFeedbackItem({
      label: `比較 ${entry.round}`,
      itemIndex: entry.round,
      selectedLabel: choice === "A" ? "選択肢A" : "選択肢B",
      selectedOption,
      settlement: settleLottery(outcomes),
    });
  });
}

function buildProbabilityBisectionFeedbackItems(_task, payload) {
  const history = Array.isArray(payload.history) ? payload.history : [];
  return history.map((entry) => {
    const choice = entry.choice;
    const sureAmount = roundYen(entry.sure_amount ?? payload.sure_amount);
    const highAmount = roundYen(entry.high_amount ?? payload.high_amount);
    const baselineAmount = roundYen(entry.baseline_amount ?? payload.baseline_amount);
    const candidate = Number(entry.candidate);
    const settlement = choice === "A"
      ? settleCertain(sureAmount)
      : settleLottery([
          { probability: candidate, amount: highAmount },
          { probability: 1 - candidate, amount: baselineAmount },
        ]);
    const selectedOption = choice === "A"
      ? `${formatYen(sureAmount)} を確実に受け取る`
      : `${formatProbability(candidate)} の確率で ${formatYen(highAmount)}、それ以外は ${formatYen(baselineAmount)}`;
    return buildFeedbackItem({
      label: `確率比較 ${entry.round}`,
      itemIndex: entry.round,
      selectedLabel: choice === "A" ? "選択肢A" : "選択肢B",
      selectedOption,
      settlement,
    });
  });
}

function buildProbabilityMatchFeedbackItems(task, payload) {
  const probability = Number(payload.value);
  const highAmount = roundYen(payload.high_amount);
  const baselineAmount = roundYen(payload.baseline_amount ?? task.baselineAmount);
  const settlement = settleLottery([
    { probability, amount: highAmount },
    { probability: 1 - probability, amount: baselineAmount },
  ]);
  return [buildFeedbackItem({
    label: "確率入力",
    itemIndex: 1,
    selectedLabel: "入力された確率",
    selectedOption: `${formatProbability(probability)} の確率で ${formatYen(highAmount)}、それ以外は ${formatYen(baselineAmount)}`,
    settlement,
  })];
}

function buildDeterministicFeedbackItems(_task, payload) {
  const amount = payload.ce_estimate ?? payload.estimate ?? payload.value ?? 0;
  return [buildFeedbackItem({
    label: "回答",
    itemIndex: 1,
    selectedLabel: "入力値",
    selectedOption: formatYen(amount),
    settlement: settleCertain(amount),
  })];
}

function buildFeedbackItem({ label, itemIndex = "", selectedLabel, selectedOption, settlement }) {
  return {
    label,
    item_index: itemIndex,
    selected_label: selectedLabel,
    selected_option: selectedOption,
    outcome_probability: settlement.probability,
    random_value: settlement.randomValue,
    outcome_label: settlement.outcomeLabel,
    reward_amount: settlement.rewardAmount,
    selected_for_payment: false,
  };
}

function settleCertain(amount) {
  const numeric = Number(amount);
  const rewardAmount = Number.isFinite(numeric) ? roundYen(numeric) : 0;
  return {
    probability: 1,
    randomValue: "",
    outcomeLabel: `確実に ${formatYen(rewardAmount)}`,
    rewardAmount,
  };
}

function settleLottery(outcomes) {
  const normalized = normalizeOutcomes(outcomes);
  if (!normalized.length) return settleCertain(0);
  const totalProbability = normalized.reduce((sum, outcome) => sum + outcome.probability, 0);
  const randomValue = Math.random();
  const target = randomValue * totalProbability;
  let cumulative = 0;
  let selected = normalized[normalized.length - 1];
  for (const outcome of normalized) {
    cumulative += outcome.probability;
    if (target <= cumulative) {
      selected = outcome;
      break;
    }
  }
  const rewardAmount = roundYen(selected.amount);
  return {
    probability: selected.probability,
    randomValue: Math.round(randomValue * 10000) / 10000,
    outcomeLabel: `${formatOutcomeProbability(selected.probability)} の抽選で ${formatYen(rewardAmount)}`,
    rewardAmount,
  };
}

function normalizeOutcomes(outcomes) {
  return (outcomes || [])
    .map((outcome) => ({
      probability: Number(outcome.probability),
      amount: roundYen(outcome.amount),
    }))
    .filter((outcome) => Number.isFinite(outcome.probability) && outcome.probability > 0 && Number.isFinite(outcome.amount));
}

function parseLotteryText(text) {
  return [...String(text ?? "").matchAll(/([0-9.]+)%の確率で\s*([^、]+)/g)]
    .map((match) => ({
      probability: parseProbabilityValue(`${match[1]}%`),
      amount: parseYenAmount(match[2]),
    }));
}

function parseProbabilityValue(value) {
  const text = String(value ?? "").trim();
  const fraction = text.match(/^([0-9.]+)\s*\/\s*([0-9.]+)$/);
  if (fraction) {
    const numerator = Number(fraction[1]);
    const denominator = Number(fraction[2]);
    return denominator ? numerator / denominator : 0;
  }
  const percent = text.match(/^([0-9.]+)%$/);
  if (percent) return Number(percent[1]) / 100;
  const numeric = Number(text);
  if (!Number.isFinite(numeric)) return 0;
  return numeric > 1 ? numeric / 100 : numeric;
}

function parseYenAmount(value) {
  const text = String(value ?? "")
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/,/g, "");
  const match = text.match(/(-)?\s*¥?\s*([0-9.]+)/);
  if (!match) return 0;
  const sign = match[1] ? -1 : 1;
  return roundYen(sign * Number(match[2]));
}

function formatOutcomeProbability(probability) {
  const percent = Number(probability) * 100;
  if (!Number.isFinite(percent)) return "";
  const rounded = Math.round(percent * 100) / 100;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(2)}%`;
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
  showCurrentTaskFeedback();
}

function showCurrentTaskFeedback() {
  state.phase = "feedback";
  state.runtime = null;
  state.taskTimedOut = false;
  state.memoryChallenge = null;
  state.error = "";
  saveState();
  render();
  scrollToTopAfterRender();
}

function continueAfterFeedback() {
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
    memory_input_pre: "",
    memory_pre_correct: "",
    memory_input_post: challenge.postInput ?? "",
    memory_post_correct: challenge.postCorrect,
    memory_display_duration_ms: challenge.displayStartedAt && challenge.displayEndedAt ? challenge.displayEndedAt - challenge.displayStartedAt : "",
    memory_pre_response_time_ms: "",
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
  record.payload.feedback = applyFeedbackPenalties(record.payload.feedback, feedbackPenaltyReasons(record));
  record.timestamp = new Date().toISOString();
  state.error = "";
  saveState();
  postEmbeddedMessage({
    type: "pwf-record",
    participant: state.participant,
    gender: state.gender,
    consent_version: CONSENT_VERSION,
    consent_accepted_at: state.consentAcceptedAt,
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
      gender: state.gender,
      consent_version: CONSENT_VERSION,
      consent_accepted_at: state.consentAcceptedAt,
      assignment: state.assignment,
      record_count: state.records.length,
      comprehension_events: state.comprehension.events,
    });
  }
  if (!state.csvDownloaded) {
    state.csvDownloaded = true;
    saveState();
    if (!EMBEDDED_MODE) {
      void downloadCsv(csvFilename(), state.records).catch(() => {
        state.csvDownloaded = false;
        state.error = "匿名化済み CSV の作成に失敗しました。もう一度お試しください。";
        saveState();
        render();
      });
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
  const block = BASE_BLOCKS[state.blockIndex];
  if (!block) return block;
  const order = state.taskOrder;
  if (!Array.isArray(order) || order.length !== block.tasks.length) return block;
  const tasks = order.map((index) => block.tasks[index]);
  if (tasks.some((task) => !task)) return block;
  return { ...block, tasks };
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
  const blockIndex = 0;
  const block = BASE_BLOCKS[0];
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

async function sha256Hex(value) {
  const encoded = new TextEncoder().encode(String(value ?? "").trim());
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function downloadCsv(filename, data) {
  const studentIdHash = await sha256Hex(state.participant);
  const columns = [
    "participant",
    "student_id_hash",
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
    "task_category",
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
    "reward_payment_rule",
    "reward_total_amount",
    "reward_raw_total_amount",
    "reward_raw_all_items_total_amount",
    "reward_item_count",
    "reward_selected_item_index",
    "reward_selected_item_label",
    "reward_selected_item_amount",
    "reward_penalty_reasons",
    "reward_settled_at",
    "timestamp",
  ];
  const rows = data.map((record) => ({
    participant: record.participant,
    student_id_hash: studentIdHash,
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
    task_category: record.task_category,
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
    reward_payment_rule: record.payload.feedback?.payment_rule ?? "",
    reward_total_amount: record.payload.feedback?.total_amount ?? "",
    reward_raw_total_amount: record.payload.feedback?.raw_total_amount ?? "",
    reward_raw_all_items_total_amount: record.payload.feedback?.raw_all_items_total_amount ?? "",
    reward_item_count: record.payload.feedback?.item_count ?? "",
    reward_selected_item_index: record.payload.feedback?.selected_item_index ?? "",
    reward_selected_item_label: record.payload.feedback?.selected_item_label ?? "",
    reward_selected_item_amount: record.payload.feedback?.selected_item_amount ?? "",
    reward_penalty_reasons: (record.payload.feedback?.penalty_reasons ?? []).join("; "),
    reward_settled_at: record.payload.feedback?.settled_at ?? "",
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
    taskOrder: [],
    taskModes: [],
    taskTimedOut: false,
    memoryChallenge: null,
    csvDownloaded: false,
    error: "",
  });

  const failures = [];
  const expectedRecords = BASE_BLOCKS.reduce((sum, block) => sum + block.tasks.length, 0);
  let forcedTimePenalty = false;
  let forcedMemoryPenalty = false;

  BASE_BLOCKS.forEach((_baseBlock, blockIndex) => {
    state.phase = "task";
    state.blockIndex = blockIndex;
    state.participant = String(9999000 + blockIndex);
    state.assignment = assignBlockFromStudentId(state.participant);
    state.taskOrder = createTaskOrder(BASE_BLOCKS[blockIndex], state.participant);
    const block = currentBlock();
    state.taskModes = createTaskModes(block, state.participant);
    const modeCounts = countModes(state.taskModes);
    const expectedModeCounts = expectedTaskModeCounts(block);
    const expectedTaskCount = expectedTaskCountForBlock(block);
    if (block.tasks.length !== expectedTaskCount) {
      failures.push(`${block.title} task count ${block.tasks.length}, expected ${expectedTaskCount}`);
    }
    if (
      (modeCounts[MODE_NORMAL] ?? 0) !== expectedModeCounts[MODE_NORMAL]
      || (modeCounts[MODE_TIME_PRESSURE] ?? 0) !== expectedModeCounts[MODE_TIME_PRESSURE]
      || (modeCounts[MODE_NUMBER_MEMORY] ?? 0) !== expectedModeCounts[MODE_NUMBER_MEMORY]
    ) {
      failures.push(`${block.title} mode counts normal=${modeCounts[MODE_NORMAL] ?? 0}, time_pressure=${modeCounts[MODE_TIME_PRESSURE] ?? 0}, number_memory=${modeCounts[MODE_NUMBER_MEMORY] ?? 0}`);
    }
    if (state.taskModes.join("|") !== createTaskModes(block, state.participant).join("|")) {
      failures.push(`${block.title} CP assignment is not reproducible for the same student and block`);
    }
    const firstTaskCanReceiveTimePressure = Array.from({ length: 24 }, (_, offset) => (
      createTaskModes(block, String(8888000 + blockIndex * 100 + offset))[0]
    )).some((mode) => mode === MODE_TIME_PRESSURE);
    if (firstTaskCanReceiveTimePressure) {
      failures.push(`${block.title} first task received time pressure in the seeded assignment check`);
    }
    block.tasks.forEach((task, taskIndex) => {
      state.taskIndex = taskIndex;
      const mode = currentTaskMode();
      const shouldForceTimePenalty = !forcedTimePenalty && mode === MODE_TIME_PRESSURE;
      const shouldForceMemoryPenalty = !forcedMemoryPenalty && mode === MODE_NUMBER_MEMORY;
      const timePressureSeconds = timePressureSecondsForBlock(block);
      state.taskStartedAt = shouldForceTimePenalty ? Date.now() - (timePressureSeconds + 2) * 1000 : Date.now();
      state.taskTimedOut = shouldForceTimePenalty;
      state.memoryChallenge = smokeMemoryChallengeIfNeeded(taskIndex, shouldForceMemoryPenalty);
      if (shouldForceTimePenalty) forcedTimePenalty = true;
      if (shouldForceMemoryPenalty) forcedMemoryPenalty = true;
      try {
        recordSmokeTask(block, task);
      } catch (error) {
        failures.push(`${block.title} task ${taskIndex + 1}: ${error.message}`);
      }
    });
  });

  const taskTypes = new Set(state.records.map((record) => record.task_type));
  ["mpl"].forEach((type) => {
    if (!taskTypes.has(type)) failures.push(`missing task type: ${type}`);
  });
  if (state.records.length !== expectedRecords) {
    failures.push(`record count ${state.records.length}, expected ${expectedRecords}`);
  }
  if (state.records.some((record) => !record.payload?.feedback || !Number.isFinite(Number(record.payload.feedback.total_amount)))) {
    failures.push("some records are missing feedback settlement totals");
  }
  if (state.records.some((record) => Number(record.payload?.feedback?.item_count ?? 0) < 1)) {
    failures.push("some records are missing feedback settlement items");
  }
  state.records.filter((record) => randomFeedbackPaymentConfig(record.task_type)).forEach((record) => {
    const feedback = record.payload?.feedback;
    const expectedPayment = randomFeedbackPaymentConfig(record.task_type);
    const selectedItems = (feedback?.items ?? []).filter((item) => item.selected_for_payment);
    if (feedback?.payment_rule !== expectedPayment.rule) {
      failures.push(`${record.task_id} feedback payment rule ${feedback?.payment_rule}, expected ${expectedPayment.rule}`);
    }
    if (selectedItems.length !== 1) {
      failures.push(`${record.task_id} selected feedback items ${selectedItems.length}, expected 1`);
    } else if (roundYen(feedback.raw_total_amount) !== roundYen(selectedItems[0].reward_amount)) {
      failures.push(`${record.task_id} raw reward ${feedback.raw_total_amount}, expected selected item reward ${selectedItems[0].reward_amount}`);
    } else if (selectedItems[0].selected_payment_badge !== expectedPayment.badgeLabel) {
      failures.push(`${record.task_id} selected badge ${selectedItems[0].selected_payment_badge}, expected ${expectedPayment.badgeLabel}`);
    }
  });
  if (!state.records.some((record) => record.task_mode === MODE_TIME_PRESSURE && record.payload?.feedback?.penalty_applied && record.payload.feedback.total_amount === 0)) {
    failures.push("time pressure zero-reward penalty was not covered");
  }
  if (!state.records.some((record) => record.task_mode === MODE_NUMBER_MEMORY && record.payload?.feedback?.penalty_applied && record.payload.feedback.total_amount === 0)) {
    failures.push("number memory zero-reward penalty was not covered");
  }
  BASE_BLOCKS.forEach((block) => {
    const blockRecords = state.records.filter((record) => record.block_id === block.id);
    const modeCounts = countModes(blockRecords.map((record) => record.task_mode));
    const expectedModeCounts = expectedTaskModeCounts(block);
    if (
      (modeCounts[MODE_NORMAL] ?? 0) !== expectedModeCounts[MODE_NORMAL]
      || (modeCounts[MODE_TIME_PRESSURE] ?? 0) !== expectedModeCounts[MODE_TIME_PRESSURE]
      || (modeCounts[MODE_NUMBER_MEMORY] ?? 0) !== expectedModeCounts[MODE_NUMBER_MEMORY]
    ) {
      failures.push(`${block.title} exported mode counts normal=${modeCounts[MODE_NORMAL] ?? 0}, time_pressure=${modeCounts[MODE_TIME_PRESSURE] ?? 0}, number_memory=${modeCounts[MODE_NUMBER_MEMORY] ?? 0}`);
    }
    const timePressureSeconds = timePressureSecondsForBlock(block);
    if (blockRecords.some((record) => record.task_mode === MODE_TIME_PRESSURE && record.time_limit_seconds !== timePressureSeconds)) {
      failures.push(`${block.title} time pressure limit is not ${timePressureSeconds}`);
    }
    const memoryRecords = blockRecords.filter((record) => record.task_mode === MODE_NUMBER_MEMORY);
    if (memoryRecords.length !== expectedModeCounts[MODE_NUMBER_MEMORY]) failures.push(`${block.title} memory record count ${memoryRecords.length}, expected ${expectedModeCounts[MODE_NUMBER_MEMORY]}`);
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

function expectedTaskCountForBlock(block) {
  return block?.tasks?.length ?? 0;
}

function expectedTaskModeCounts(blockOrTaskCount) {
  const block = typeof blockOrTaskCount === "number" ? null : blockOrTaskCount;
  const taskCount = typeof blockOrTaskCount === "number" ? blockOrTaskCount : block.tasks.length;
  if (block?.modeStrategy === EXPERIMENT_G_MODE_STRATEGY) {
    const timePressureCount = [...new Set(block.tasks.map((task) => task.category).filter(Boolean))]
      .reduce((total, category) => total + Math.floor(block.tasks.filter((task) => task.category === category).length / 2), 0);
    return {
      [MODE_NORMAL]: taskCount - timePressureCount,
      [MODE_TIME_PRESSURE]: timePressureCount,
      [MODE_NUMBER_MEMORY]: 0,
    };
  }
  const timePressureCount = Math.min(TIME_PRESSURE_TASKS_PER_BLOCK, Math.max(0, taskCount - 1));
  const numberMemoryCount = Math.min(NUMBER_MEMORY_TASKS_PER_BLOCK, Math.max(0, taskCount - timePressureCount));
  return {
    [MODE_NORMAL]: taskCount - timePressureCount - numberMemoryCount,
    [MODE_TIME_PRESSURE]: timePressureCount,
    [MODE_NUMBER_MEMORY]: numberMemoryCount,
  };
}

function smokeMemoryChallengeIfNeeded(taskIndex, forceWrong = false) {
  if (currentTaskMode() !== MODE_NUMBER_MEMORY) return null;
  const now = Date.now();
  const number = "12345";
  const input = forceWrong ? "12340" : number;
  return {
    taskIndex,
    number,
    digits: NUMBER_MEMORY_DIGITS,
    seconds: NUMBER_MEMORY_SECONDS,
    displayStartedAt: now - NUMBER_MEMORY_SECONDS * 1000,
    displayEndedAt: now,
    preStartedAt: null,
    preInput: "",
    preCorrect: null,
    preResponseTimeMs: null,
    postStartedAt: now - 900,
    postInput: input,
    postCorrect: !forceWrong,
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
            ? `生成了 ${state.records.length} / ${expectedRecords} 条 task-level 记录，覆盖 MPL。`
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

if (SMOKE_MODE) {
  runSmokeTest();
} else {
  initializeNavigationHistory();
  initializeKeyboardShortcuts();
  initializeComprehensionSync();
  render();
}
