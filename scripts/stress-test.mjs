#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";

const DEFAULT_BASE_URL = "http://127.0.0.1:5174";
const DEFAULT_START_COUNT = 150;
const DEFAULT_FINISH_COUNT = 100;
const DEFAULT_SETUP_CONCURRENCY = 25;
const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_STUDY_MODE = "full";
const PWF_APP_PATH = path.resolve("frontend/public/pwf/app.js");

function parseArgs(argv) {
  const options = {
    baseUrl: DEFAULT_BASE_URL,
    startCount: DEFAULT_START_COUNT,
    finishCount: DEFAULT_FINISH_COUNT,
    setupConcurrency: DEFAULT_SETUP_CONCURRENCY,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    studyMode: DEFAULT_STUDY_MODE,
    idStart: null,
    appFile: PWF_APP_PATH,
    yes: false,
    skipDownloads: false,
    verifyResume: false,
    checkpointId: null,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      if (i + 1 >= argv.length) throw new Error(`Missing value for ${arg}`);
      i += 1;
      return argv[i];
    };

    if (arg === "--base-url") options.baseUrl = next();
    else if (arg === "--start-count") options.startCount = positiveInt(next(), arg);
    else if (arg === "--finish-count") options.finishCount = positiveInt(next(), arg);
    else if (arg === "--setup-concurrency") options.setupConcurrency = positiveInt(next(), arg);
    else if (arg === "--timeout-ms") options.timeoutMs = positiveInt(next(), arg);
    else if (arg === "--study-mode") options.studyMode = next();
    else if (arg === "--id-start") options.idStart = positiveInt(next(), arg);
    else if (arg === "--app-file") options.appFile = path.resolve(next());
    else if (arg === "--yes") options.yes = true;
    else if (arg === "--skip-downloads") options.skipDownloads = true;
    else if (arg === "--verify-resume") options.verifyResume = true;
    else if (arg === "--checkpoint-id") options.checkpointId = positiveInt(next(), arg);
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (!["full", "pilot"].includes(options.studyMode)) {
    throw new Error("--study-mode must be full or pilot");
  }
  if (options.finishCount > options.startCount) {
    throw new Error("--finish-count cannot exceed --start-count");
  }
  if (options.verifyResume && options.idStart && !options.checkpointId) {
    options.checkpointId = options.idStart + options.startCount;
  }
  if (options.verifyResume && !options.checkpointId) {
    throw new Error("--verify-resume requires --checkpoint-id when --id-start is not provided");
  }
  options.baseUrl = options.baseUrl.replace(/\/+$/, "");
  return options;
}

function positiveInt(value, label) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
  return parsed;
}

function printHelp() {
  console.log(`
Usage:
  npm run stress:test -- --base-url http://127.0.0.1:5174
  npm run stress:test -- --base-url https://your-vercel-app.vercel.app --yes

Options:
  --base-url URL             Frontend/API base URL. Default: ${DEFAULT_BASE_URL}
  --start-count N            Concurrent session starts. Default: ${DEFAULT_START_COUNT}
  --finish-count N           Participants that finish and download CSV. Default: ${DEFAULT_FINISH_COUNT}
  --setup-concurrency N      Concurrency for preparatory PWF/CI saves. Default: ${DEFAULT_SETUP_CONCURRENCY}
  --timeout-ms N             Per-request timeout. Default: ${DEFAULT_TIMEOUT_MS}
  --study-mode full|pilot    Study mode sent to /api/session/start. Default: ${DEFAULT_STUDY_MODE}
  --id-start N               First fake 7-digit student id. Default: timestamp-based 9xxxxxx
  --skip-downloads           Do not fetch final CI/PWF CSV files.
  --verify-resume            After all main participants pass, verify PWF and CI checkpoint recovery.
  --checkpoint-id N          Separate fake student ID for --verify-resume. Defaults to id-start + start-count.
  --dry-run                  Validate configuration without calling the API or writing data.
  --yes                      Required for non-localhost targets.
`);
}

function isLocalTarget(baseUrl) {
  const url = new URL(baseUrl);
  return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
}

function loadPwfBlocks(appFile) {
  const fallback = [
    { id: "bruhin-2010", title: "実験B", tasks: Array.from({ length: 12 }, (_, index) => ({ taskId: `bruhin-stress-${index + 1}`, type: "mpl" })) },
  ];

  if (!fs.existsSync(appFile)) {
    console.warn(`PWF app file not found: ${appFile}. Using fallback block metadata.`);
    return fallback;
  }

  const source = fs.readFileSync(appFile, "utf8");
  const sanitized = source.replace(
    /if \(SMOKE_MODE\) \{[\s\S]*$/m,
    "globalThis.__stress = { BASE_BLOCKS };",
  );
  const context = {
    window: { location: { search: "?embedded=1" } },
    document: { getElementById: () => ({ innerHTML: "" }) },
    URLSearchParams,
    console: { log() {}, warn() {}, error() {} },
  };
  vm.runInNewContext(sanitized, context, { filename: appFile });
  const blocks = context.__stress?.BASE_BLOCKS;
  if (!Array.isArray(blocks) || blocks.length === 0) {
    console.warn("Could not extract BASE_BLOCKS. Using fallback block metadata.");
    return fallback;
  }
  return blocks.map((block) => ({
    id: block.id,
    title: block.title,
    amountLevel: block.amountLevel || "standard",
    amountMultiplier: block.amountMultiplier || 1,
    tasks: (block.tasks || []).map((task, index) => ({
      taskId: task.taskId || `${block.id}-stress-${index + 1}`,
      type: task.type || "mpl",
      category: task.category || "",
      amountLevel: task.amountLevel || block.amountLevel || "standard",
      amountMultiplier: task.amountMultiplier || block.amountMultiplier || 1,
    })),
  }));
}

function fakeStudentIds(count, idStart) {
  const seed = idStart ?? 9000000 + (Date.now() % 900000);
  if (seed < 1 || seed + count - 1 > 9999999) {
    throw new Error(`Fake student id range must stay within 7 digits: ${seed}..${seed + count - 1}`);
  }
  return Array.from({ length: count }, (_, index) => {
    return String(seed + index).padStart(7, "0");
  });
}

function assignmentForStudent(studentId, blocks) {
  const normalized = String(studentId);
  const lastThreeText = normalized.slice(-3);
  const lastThree = Number(lastThreeText);
  const blockIndex = lastThree % blocks.length;
  const block = blocks[blockIndex];
  return {
    lastThreeText,
    blockIndex,
    groupNumber: blockIndex + 1,
    modulus: blocks.length,
    block,
  };
}

async function requestJson(baseUrl, pathName, options, timeoutMs) {
  const text = await requestText(baseUrl, pathName, options, timeoutMs);
  if (!text) return {};
  return JSON.parse(text);
}

async function requestText(baseUrl, pathName, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = performance.now();
  try {
    const response = await fetch(`${baseUrl}${pathName}`, {
      ...options,
      signal: controller.signal,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
    });
    const text = await response.text();
    const durationMs = performance.now() - startedAt;
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText} at ${pathName}: ${text.slice(0, 240)}`);
    }
    return text;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`Timeout after ${timeoutMs}ms at ${pathName}`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function timed(label, fn) {
  const startedAt = performance.now();
  try {
    const value = await fn();
    return { ok: true, label, value, durationMs: performance.now() - startedAt };
  } catch (error) {
    return { ok: false, label, error, durationMs: performance.now() - startedAt };
  }
}

async function runLimited(items, concurrency, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function consume() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  }
  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, consume));
  return results;
}

async function startSession(baseUrl, studentId, studyMode, timeoutMs) {
  const name = `stress-${studentId}`;
  const gender = "male";
  const data = await requestJson(
    baseUrl,
    "/api/session/start",
    {
      method: "POST",
      body: JSON.stringify({
        student_id: studentId,
        name,
        gender,
        consent_version: "stress-test-v1",
        consent_accepted_at: new Date().toISOString(),
        study_mode: studyMode,
        pwf_comprehension_version: "2026-07-11-comprehension-v2",
      }),
    },
    timeoutMs,
  );
  return {
    studentId,
    name,
    gender,
    sessionId: data.session_id,
    trials: data.trials || [],
    studyMode: data.study_mode || studyMode,
    experimentMode: data.experiment_mode || "normal",
    timePressureSeconds: data.time_pressure_seconds || 0,
    resumed: Boolean(data.resumed),
    sessionStatus: data.session_status || "started",
    pwfCompleted: Boolean(data.pwf_completed),
    savedPwfResults: data.saved_pwf_results || [],
    savedCiResults: data.saved_ci_results || [],
  };
}

function assertFreshSession(session, label) {
  if (
    session.resumed
    || session.sessionStatus === "completed"
    || session.pwfCompleted
    || session.savedPwfResults.length > 0
    || session.savedCiResults.length > 0
  ) {
    throw new Error(`${label} reused an existing session for ${session.studentId}; use unused fake student IDs.`);
  }
}

function assertResumedSession(session, expectedSessionId, label) {
  if (!session.resumed) {
    throw new Error(`${label} did not return a resumable session.`);
  }
  if (session.sessionId !== expectedSessionId) {
    throw new Error(`${label} returned a different session ID.`);
  }
}

function feedbackPayload(amount = 100) {
  return {
    total_amount: amount,
    raw_total_amount: amount,
    item_count: 1,
    selected_item_index: 1,
    selected_item_label: "stress synthetic payoff",
    selected_item_amount: amount,
    penalty_reasons: [],
    settled_at: new Date().toISOString(),
  };
}

function syntheticPayloadForTask(task, index) {
  const base = {
    task_category: task.category || "",
    feedback: feedbackPayload(100 + index),
  };
  if (task.type === "bisection") {
    return {
      ...base,
      response_type: "bisection",
      estimate: 1000 + index,
      final_low: 950 + index,
      final_high: 1050 + index,
      choices: ["A", "B"],
    };
  }
  if (task.type === "probabilityBisection") {
    return {
      ...base,
      response_type: "probability_bisection",
      estimate: 0.5,
      final_low: 0.45,
      final_high: 0.55,
      choices: ["A", "B"],
    };
  }
  if (task.type === "probabilityMatch") {
    return {
      ...base,
      response_type: "probability_matching",
      unknown: "p",
      value: 0.5,
    };
  }
  return {
    ...base,
    response_type: "mpl",
    ce_estimate: 1000 + index,
    switch_lower: 950 + index,
    switch_upper: 1050 + index,
    switch_row: 6,
    switch_direction: "B_TO_A",
    switch_status: "bracketed",
    monotonic: true,
  };
}

function buildPwfRecord(session, assignment, task, index) {
  const block = assignment.block;
  const amountMultiplier = task.amountMultiplier || block.amountMultiplier || 1;
  return {
    session_id: session.sessionId,
    student_id: session.studentId,
    name: session.name,
    gender: session.gender,
    study_mode: session.studyMode,
    pwf_trial: index + 1,
    participant: session.studentId,
    assignment_group: assignment.groupNumber,
    assignment_modulus: assignment.modulus,
    student_id_last3: assignment.lastThreeText,
    student_id_last_digit: session.studentId.slice(-1),
    amount_level: task.amountLevel || block.amountLevel || "standard",
    amount_multiplier: amountMultiplier,
    assigned_block_id: block.id,
    block_id: block.id,
    block_title: block.title,
    task_id: task.taskId,
    task_category: task.category || "",
    is_anchor: false,
    task_index: index + 1,
    task_type: task.type || "mpl",
    task_mode: index === 0 ? "normal" : "normal",
    time_limit_seconds: "",
    timed_out: false,
    time_over_seconds: "",
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
    response_time_ms: 800 + index,
    prompt: "stress test synthetic PWF record",
    payload: syntheticPayloadForTask(task, index),
    timestamp: new Date().toISOString(),
  };
}

async function savePwfRecord(baseUrl, session, assignment, task, index, timeoutMs) {
  const record = buildPwfRecord(session, assignment, task, index);
  await requestJson(
    baseUrl,
    "/api/pwf-results",
    {
      method: "POST",
      body: JSON.stringify({ results: [record] }),
    },
    timeoutMs,
  );
  return record;
}

async function completePwf(baseUrl, session, timeoutMs) {
  return requestJson(
    baseUrl,
    `/api/session/${encodeURIComponent(session.sessionId)}/pwf-complete`,
    { method: "POST" },
    timeoutMs,
  );
}

async function saveComprehensionPass(baseUrl, session, timeoutMs) {
  const submittedAt = new Date();
  const attemptStartedAt = new Date(submittedAt.getTime() - 12_000);
  return requestJson(
    baseUrl,
    "/api/pwf-comprehension-events",
    {
      method: "POST",
      body: JSON.stringify({
        events: [{
          event_id: randomUUID(),
          session_id: session.sessionId,
          question_set_version: "2026-07-11-comprehension-v2",
          sequence: 1,
          event_type: "submission",
          outcome: "passed",
          round_number: 1,
          attempt_number: 1,
          attempt_in_round: 1,
          attempt_limit: 3,
          attempts_before: 3,
          attempts_after: 2,
          attempt_started_at: attemptStartedAt.toISOString(),
          attempt_duration_ms: 12_000,
          question_response_times_ms: {
            probability_meaning: 1_000,
            lottery_tradeoff: 2_000,
            standard_answer: 3_000,
            indifference_input: 5_000,
            serious_answers: 7_000,
            indifferent_payment: 9_000,
          },
          answers: {
            probability_meaning: "b",
            lottery_tradeoff: "d",
            standard_answer: "no",
            indifference_input: "c",
            serious_answers: "yes",
            indifferent_payment: "d",
          },
          incorrect_question_ids: [],
          correct_count: 6,
          passed: true,
          locked_after: false,
          source_timestamp: submittedAt.toISOString(),
        }],
      }),
    },
    timeoutMs,
  );
}

function buildCiResult(session, trial, trialIndex, choice = "Indifferent") {
  const n = Number(trial.N);
  const pN = Number((trial.p ** n).toFixed(10));
  const qN = Number((trial.q ** n).toFixed(10));
  const rN = Number((trial.r ** n).toFixed(10));
  const s = trial.r;
  const sN = Number((s ** n).toFixed(10));
  return {
    session_id: session.sessionId,
    student_id: session.studentId,
    name: session.name,
    gender: session.gender,
    study_mode: session.studyMode,
    experiment_mode: session.experimentMode,
    time_pressure_seconds: session.timePressureSeconds,
    trial: trial.trial,
    block: trial.block,
    N: n,
    student_id_last_digit: trial.student_id_last_digit ?? session.studentId.slice(-1),
    amount_level: trial.amount_level ?? "low",
    amount_multiplier: trial.amount_multiplier ?? 1,
    ci_assignment_block: trial.ci_assignment_block ?? null,
    ci_assignment_position: trial.ci_assignment_position ?? null,
    ci_assignment_block_size: trial.ci_assignment_block_size ?? null,
    ci_assignment_condition: trial.ci_assignment_condition ?? null,
    p: trial.p,
    q: trial.q,
    r: trial.r,
    x: trial.x,
    x_prime: trial.x_prime,
    y: trial.x,
    s,
    y_prime: trial.x_prime,
    pN,
    qN,
    rN,
    sN,
    choice,
    ci_satisfied: choice === "Indifferent",
    response_time_ms: 900 + trialIndex,
    timed_out: false,
  };
}

async function saveCi(baseUrl, session, trial, trialIndex, timeoutMs) {
  return requestJson(
    baseUrl,
    "/api/ci-results",
    {
      method: "POST",
      body: JSON.stringify(buildCiResult(session, trial, trialIndex)),
    },
    timeoutMs,
  );
}

async function createCiSettlement(baseUrl, session, timeoutMs) {
  return requestJson(
    baseUrl,
    `/api/session/${encodeURIComponent(session.sessionId)}/ci-settlement`,
    { method: "POST" },
    timeoutMs,
  );
}

async function downloadCsvs(baseUrl, session, expectedPwfRows, expectedCiRows, timeoutMs) {
  const [ciCsv, pwfCsv, comprehensionCsv] = await Promise.all([
    requestText(baseUrl, `/api/ci-results/${encodeURIComponent(session.studentId)}/csv`, {}, timeoutMs),
    requestText(baseUrl, `/api/pwf-results/${encodeURIComponent(session.studentId)}/csv`, {}, timeoutMs),
    requestText(baseUrl, `/api/pwf-comprehension-events/${encodeURIComponent(session.studentId)}/csv`, {}, timeoutMs),
  ]);
  const ciRows = countCsvRows(ciCsv);
  const pwfRows = countCsvRows(pwfCsv);
  const comprehensionRows = countCsvRows(comprehensionCsv);
  if (ciRows !== expectedCiRows) {
    throw new Error(`CI CSV row count ${ciRows}, expected ${expectedCiRows}`);
  }
  if (pwfRows !== expectedPwfRows) {
    throw new Error(`PWF CSV row count ${pwfRows}, expected ${expectedPwfRows}`);
  }
  if (comprehensionRows !== 1) {
    throw new Error(`Comprehension CSV row count ${comprehensionRows}, expected 1`);
  }
  const comprehensionHeaders = comprehensionCsv.split(/\r?\n/, 1)[0].split(",");
  for (const header of ["attempt_duration_ms", "response_time_probability_meaning_ms"]) {
    if (!comprehensionHeaders.includes(header)) {
      throw new Error(`Comprehension CSV is missing required timing column: ${header}`);
    }
  }
  return {
    ciRows,
    pwfRows,
    comprehensionRows,
    ciBytes: ciCsv.length,
    pwfBytes: pwfCsv.length,
    comprehensionBytes: comprehensionCsv.length,
  };
}

async function verifyCheckpointRecovery(baseUrl, studentId, studyMode, blocks, timeoutMs) {
  const initial = await startSession(baseUrl, studentId, studyMode, timeoutMs);
  assertFreshSession(initial, "checkpoint start");
  if (!initial.trials.length) throw new Error("checkpoint session has no CI trials");

  const assignment = assignmentForStudent(initial.studentId, blocks);
  if (!assignment.block?.tasks?.length) throw new Error("checkpoint session has no PWF tasks");

  await savePwfRecord(baseUrl, initial, assignment, assignment.block.tasks[0], 0, timeoutMs);
  const afterFirstPwf = await startSession(baseUrl, studentId, studyMode, timeoutMs);
  assertResumedSession(afterFirstPwf, initial.sessionId, "PWF checkpoint");
  if (!afterFirstPwf.savedPwfResults.some((record) => Number(record.pwf_trial) === 1)) {
    throw new Error("PWF checkpoint is missing the saved first task.");
  }

  for (let index = 1; index < assignment.block.tasks.length; index += 1) {
    await savePwfRecord(baseUrl, afterFirstPwf, assignment, assignment.block.tasks[index], index, timeoutMs);
  }
  await saveComprehensionPass(baseUrl, afterFirstPwf, timeoutMs);
  await completePwf(baseUrl, afterFirstPwf, timeoutMs);

  const afterPwfComplete = await startSession(baseUrl, studentId, studyMode, timeoutMs);
  assertResumedSession(afterPwfComplete, initial.sessionId, "post-PWF checkpoint");
  if (!afterPwfComplete.pwfCompleted) {
    throw new Error("PWF completion was not restored after restarting the session.");
  }

  await saveCi(baseUrl, afterPwfComplete, afterPwfComplete.trials[0], 0, timeoutMs);
  const afterFirstCi = await startSession(baseUrl, studentId, studyMode, timeoutMs);
  assertResumedSession(afterFirstCi, initial.sessionId, "CI checkpoint");
  if (!afterFirstCi.savedCiResults.some((record) => Number(record.trial) === Number(afterPwfComplete.trials[0].trial))) {
    throw new Error("CI checkpoint is missing the saved first trial.");
  }

  for (let index = 1; index < afterFirstCi.trials.length; index += 1) {
    await saveCi(baseUrl, afterFirstCi, afterFirstCi.trials[index], index, timeoutMs);
  }
  await createCiSettlement(baseUrl, afterFirstCi, timeoutMs);
  const csv = await downloadCsvs(
    baseUrl,
    afterFirstCi,
    assignment.block.tasks.length,
    afterFirstCi.trials.length,
    timeoutMs,
  );
  return {
    studentId,
    sessionId: initial.sessionId,
    pwfRows: csv.pwfRows,
    ciRows: csv.ciRows,
    checkpoints: ["PWF task", "PWF completion", "CI trial"],
  };
}

function countCsvRows(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  return Math.max(0, lines.length - 1);
}

function summarizeStage(name, results) {
  const ok = results.filter((result) => result.ok);
  const failed = results.filter((result) => !result.ok);
  const durations = ok.map((result) => result.durationMs).sort((a, b) => a - b);
  const percentile = (p) => {
    if (!durations.length) return 0;
    const index = Math.min(durations.length - 1, Math.floor((durations.length - 1) * p));
    return durations[index];
  };
  return {
    name,
    ok: ok.length,
    failed: failed.length,
    p50ms: Math.round(percentile(0.5)),
    p95ms: Math.round(percentile(0.95)),
    maxMs: Math.round(durations[durations.length - 1] || 0),
    failures: failed.slice(0, 8).map((result) => ({
      label: result.label,
      message: result.error?.message || String(result.error),
    })),
  };
}

function printStage(summary) {
  console.log(
    `${summary.name}: ok=${summary.ok} failed=${summary.failed} p50=${summary.p50ms}ms p95=${summary.p95ms}ms max=${summary.maxMs}ms`,
  );
  for (const failure of summary.failures) {
    console.log(`  FAIL ${failure.label}: ${failure.message}`);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!isLocalTarget(options.baseUrl) && !options.yes) {
    throw new Error("Non-local stress tests write test rows. Re-run with --yes after confirming the target uses a test Neon branch or disposable fake IDs.");
  }

  const blocks = loadPwfBlocks(options.appFile);
  const ids = fakeStudentIds(options.startCount, options.idStart);
  const checkpointStudentId = options.checkpointId
    ? String(options.checkpointId).padStart(7, "0")
    : null;
  if (checkpointStudentId && ids.includes(checkpointStudentId)) {
    throw new Error("--checkpoint-id must not overlap with the main test student IDs.");
  }
  console.log("Stress test target:", options.baseUrl);
  console.log("Study mode:", options.studyMode);
  console.log("Fake student id range:", `${ids[0]}..${ids[ids.length - 1]}`);
  console.log("PWF blocks:", blocks.map((block) => `${block.title}/${block.id}:${block.tasks.length}`).join(", "));
  if (options.dryRun) {
    console.log("Dry run: no API requests were sent and no data was written.");
    if (checkpointStudentId) console.log("Checkpoint student ID:", checkpointStudentId);
    return;
  }
  console.log(`Phase 1: starting ${ids.length} sessions concurrently`);

  const startResults = await Promise.all(ids.map((studentId) => timed(
    `start:${studentId}`,
    () => startSession(options.baseUrl, studentId, options.studyMode, options.timeoutMs),
  )));
  printStage(summarizeStage("session/start", startResults));

  const startedSessions = startResults.filter((result) => result.ok).map((result) => result.value);
  if (startedSessions.length < options.finishCount) {
    throw new Error(`Only ${startedSessions.length} sessions started; cannot finish ${options.finishCount}`);
  }
  startResults.filter((result) => result.ok).forEach((result) => assertFreshSession(result.value, "main test start"));

  const finishingSessions = startedSessions.slice(0, options.finishCount).map((session) => {
    const assignment = assignmentForStudent(session.studentId, blocks);
    return { session, assignment };
  });

  console.log(`Phase 2: preparing PWF + first CI trials for ${finishingSessions.length} finishers`);
  const prepResults = await runLimited(
    finishingSessions,
    options.setupConcurrency,
    async ({ session, assignment }) => timed(`prep:${session.studentId}`, async () => {
      for (let i = 0; i < assignment.block.tasks.length; i += 1) {
        await savePwfRecord(options.baseUrl, session, assignment, assignment.block.tasks[i], i, options.timeoutMs);
      }
      await saveComprehensionPass(options.baseUrl, session, options.timeoutMs);
      await completePwf(options.baseUrl, session, options.timeoutMs);
      const trialsBeforeFinal = session.trials.slice(0, -1);
      for (let i = 0; i < trialsBeforeFinal.length; i += 1) {
        await saveCi(options.baseUrl, session, trialsBeforeFinal[i], i, options.timeoutMs);
      }
      return { pwfRows: assignment.block.tasks.length, ciPreparedRows: trialsBeforeFinal.length };
    }),
  );
  printStage(summarizeStage("prep PWF + CI except final", prepResults));

  const readyFinishers = finishingSessions.filter((_, index) => prepResults[index]?.ok);
  console.log(`Phase 3: completing final CI trial and settlement for ${readyFinishers.length} participants concurrently`);
  const finalResults = await Promise.all(readyFinishers.map(({ session }) => timed(
    `complete-ci:${session.studentId}`,
    async () => {
      await saveCi(
        options.baseUrl,
        session,
        session.trials[session.trials.length - 1],
        session.trials.length - 1,
        options.timeoutMs,
      );

      await createCiSettlement(options.baseUrl, session, options.timeoutMs);
      return { finalCiRows: 1, settlementWrites: 1 };
    },
  )));
  printStage(summarizeStage("final CI + settlement", finalResults));

  let downloadResults = [];
  if (!options.skipDownloads) {
    const completedForDownload = readyFinishers.filter((_, index) => finalResults[index]?.ok);
    console.log(`Phase 4: downloading CI/PWF/comprehension CSV for ${completedForDownload.length} participants concurrently`);
    downloadResults = await Promise.all(completedForDownload.map(({ session, assignment }) => timed(
      `csv:${session.studentId}`,
      () => downloadCsvs(options.baseUrl, session, assignment.block.tasks.length, session.trials.length, options.timeoutMs),
    )));
    printStage(summarizeStage("CSV concurrent download", downloadResults));
  }

  const summaries = [
    summarizeStage("session/start", startResults),
    summarizeStage("prep PWF + CI except final", prepResults),
    summarizeStage("final CI + settlement", finalResults),
    ...(options.skipDownloads ? [] : [summarizeStage("CSV concurrent download", downloadResults)]),
  ];
  let failedTotal = summaries.reduce((sum, summary) => sum + summary.failed, 0);
  const expectedApiWrites =
    options.startCount +
    prepResults.filter((result) => result.ok).reduce((sum, result) => (
      sum + result.value.pwfRows + 2 + result.value.ciPreparedRows
    ), 0) +
    finalResults.filter((result) => result.ok).reduce((sum, result) => (
      sum + result.value.finalCiRows + result.value.settlementWrites
    ), 0);
  console.log("Expected successful POST writes:", expectedApiWrites);
  if (options.verifyResume) {
    if (failedTotal > 0) {
      console.log("Checkpoint recovery: SKIPPED because the main 50-participant submission test failed.");
      failedTotal += 1;
    } else {
      console.log(`Phase 5: verifying checkpoint recovery with ${checkpointStudentId}`);
      const checkpointResult = await timed(
        `checkpoint:${checkpointStudentId}`,
        () => verifyCheckpointRecovery(
          options.baseUrl,
          checkpointStudentId,
          options.studyMode,
          blocks,
          options.timeoutMs,
        ),
      );
      printStage(summarizeStage("checkpoint recovery", [checkpointResult]));
      if (!checkpointResult.ok) failedTotal += 1;
    }
  }
  console.log("Stress test result:", failedTotal === 0 ? "PASS" : "FAIL");
  if (failedTotal > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
