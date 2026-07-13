#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const appFile = path.resolve("frontend/public/pwf/app.js");
const source = fs.readFileSync(appFile, "utf8");
const sanitized = source.replace(
  /if \(SMOKE_MODE\) \{[\s\S]*$/m,
  `globalThis.__pwfTest = {
    ACTIVE_BLOCK_IDS,
    ASSIGNMENT_MODULUS,
    BLOCK_LIBRARY,
    BASE_BLOCKS,
    assignBlockFromStudentId,
    createTaskModes,
    createTaskOrder,
    currentBlock,
    restoreState,
    saveState,
    state,
    timePressureSecondsForBlock,
  };`,
);

const storage = new Map();
const localStorage = {
  getItem(key) {
    return storage.has(key) ? storage.get(key) : null;
  },
  setItem(key, value) {
    storage.set(key, String(value));
  },
};
const inertElement = () => ({ innerHTML: "", addEventListener() {} });
const context = {
  URLSearchParams,
  console: { log() {}, warn() {}, error() {} },
  localStorage,
  document: {
    body: {},
    documentElement: {},
    getElementById: inertElement,
    querySelectorAll: () => [],
  },
  window: {
    location: { search: "?embedded=1", origin: "http://localhost", href: "http://localhost/pwf" },
    parent: null,
    addEventListener() {},
    history: {},
  },
};
vm.runInNewContext(sanitized, context, { filename: appFile });

const app = context.__pwfTest;
assert.ok(app, "PWF test exports were not captured");
assert.equal(app.ASSIGNMENT_MODULUS, 1, "PWF assignment modulus must be one");
assert.equal(app.ACTIVE_BLOCK_IDS.join(","), "bruhin-2010", "Only Bruhin must be active");
assert.equal(app.BASE_BLOCKS.length, 1, "Only one runtime PWF block is allowed");
assert.equal(app.BASE_BLOCKS[0].id, "bruhin-2010", "Bruhin must be the active PWF block");

const libraryById = new Map(app.BLOCK_LIBRARY.map((block) => [block.id, block]));
for (const [blockId, taskCount] of Object.entries({
  "choi-2022-study2": 12,
  "abdellaoui-2000": 12,
  "bruhin-2010": 12,
  "experiment-g": 20,
})) {
  assert.equal(libraryById.get(blockId)?.tasks.length, taskCount, `${blockId} task generation failed`);
}
assert.equal(
  libraryById.get("abdellaoui-2000").tasks.filter((task) => task.type === "probabilityBisection").length,
  4,
  "Abdellaoui probability-bisection tasks were not restored",
);
assert.ok(
  libraryById.get("experiment-g").tasks.some((task) => task.category === "ternary"),
  "Gonzalez & Wu ternary lotteries were not restored",
);
assert.equal(app.timePressureSecondsForBlock(libraryById.get("abdellaoui-2000")), 18, "Abdellaoui time limit was not restored");
assert.equal(app.timePressureSecondsForBlock(libraryById.get("bruhin-2010")), 12, "Bruhin time limit changed unexpectedly");

const gBlock = libraryById.get("experiment-g");
const gOrder = app.createTaskOrder(gBlock, "1234567");
assert.equal(gOrder.join(","), app.createTaskOrder(gBlock, "1234567").join(","), "Gonzalez & Wu order is not reproducible");
const orderedGBlock = { ...gBlock, tasks: gOrder.map((index) => gBlock.tasks[index]) };
const gModes = app.createTaskModes(orderedGBlock, "1234567");
assert.equal(gModes.filter((mode) => mode === "time_pressure").length, 10, "Gonzalez & Wu time-pressure count is wrong");
assert.equal(gModes.filter((mode) => mode === "number_memory").length, 0, "Gonzalez & Wu must not receive number-memory tasks");
assert.notEqual(gModes[0], "time_pressure", "The first displayed Gonzalez & Wu task must not have time pressure");

for (const studentId of ["0000000", "1234567", "9999999"]) {
  const assignment = app.assignBlockFromStudentId(studentId);
  assert.equal(assignment.blockId, "bruhin-2010", `${studentId} was assigned to a non-Bruhin block`);
  assert.equal(assignment.blockIndex, 0, `${studentId} has a nonzero active block index`);
  assert.equal(assignment.modulus, 1, `${studentId} has a non-singleton assignment modulus`);
}

const bBlock = app.BASE_BLOCKS[0];
const studentId = "1234567";
const assignment = app.assignBlockFromStudentId(studentId);
const bOrder = app.createTaskOrder(bBlock, studentId);
assert.equal(bOrder.join(","), app.createTaskOrder(bBlock, studentId).join(","), "Bruhin order is not reproducible");
assert.equal(new Set(bOrder).size, bBlock.tasks.length, "Bruhin order is not a complete permutation");
assert.notEqual(bOrder.join(","), bBlock.tasks.map((_, index) => index).join(","), "Bruhin task order was not shuffled");
const orderedBBlock = { ...bBlock, tasks: bOrder.map((index) => bBlock.tasks[index]) };
const bModes = app.createTaskModes(orderedBBlock, studentId);
assert.equal(bModes.filter((mode) => mode === "time_pressure").length, 5, "Bruhin time-pressure count is wrong");
assert.equal(bModes.filter((mode) => mode === "number_memory").length, 1, "Bruhin number-memory count is wrong");
assert.notEqual(bModes[0], "time_pressure", "The first displayed Bruhin task must not have time pressure");
assert.deepEqual(
  Array.from(bBlock.tasks, (task) => task.taskId),
  Array.from({ length: 12 }, (_, index) => `bruhin-sheet-${index + 1}`),
  "Bruhin task IDs must be continuous from sheet 1 through sheet 12",
);
const firstDisplayedBruhinTasks = new Set();
const bruhinModeTotals = { normal: 0, time_pressure: 0, number_memory: 0 };
for (let offset = 0; offset < 100; offset += 1) {
  const participant = String(9100101 + offset);
  const order = app.createTaskOrder(bBlock, participant);
  const orderedBlock = { ...bBlock, tasks: order.map((index) => bBlock.tasks[index]) };
  const modes = app.createTaskModes(orderedBlock, participant);
  firstDisplayedBruhinTasks.add(orderedBlock.tasks[0].taskId);
  assert.notEqual(modes[0], "time_pressure", "The first displayed Bruhin task must never have time pressure");
  modes.forEach((mode) => { bruhinModeTotals[mode] += 1; });
}
assert.equal(firstDisplayedBruhinTasks.size, bBlock.tasks.length, "Bruhin shuffle does not spread every task into the first displayed position");
assert.deepEqual(bruhinModeTotals, { normal: 600, time_pressure: 500, number_memory: 100 }, "Bruhin condition totals changed across 100 participants");
Object.assign(app.state, {
  phase: "task",
  participant: studentId,
  gender: "male",
  consentChoice: "agree",
  consentAcceptedAt: "2026-07-13T00:00:00.000Z",
  assignment,
  blockIndex: 0,
  taskIndex: 3,
  runtime: null,
  records: [{ task_id: "bruhin-sheet-1", task_index: 1 }],
  taskOrder: bOrder,
  taskModes: bModes,
  taskTimedOut: false,
  memoryChallenge: null,
  practiceFeedback: null,
  practicePanel: "practice",
  practiceCompleted: true,
  practiceStepIndex: 2,
  csvDownloaded: false,
  error: "",
});
app.saveState();
Object.assign(app.state, { participant: "", blockIndex: 99, taskIndex: 99, records: [] });
assert.equal(app.restoreState(studentId), true, "B-only state failed to restore");
assert.equal(app.state.assignment.blockId, "bruhin-2010", "Restored assignment is not Bruhin");
assert.equal(app.currentBlock().id, "bruhin-2010", "Restored current block is not Bruhin");
assert.equal(app.state.taskIndex, 3, "Restored task index changed");

const savedState = JSON.parse(localStorage.getItem("pwf-research-app"));
savedState.assignment.blockId = "choi-2022-study2";
localStorage.setItem("pwf-research-app", JSON.stringify(savedState));
assert.equal(app.restoreState(studentId), false, "Inactive-block state must not restore");

console.log("PWF block generation, B-only assignment, serialization, and restore: PASS");
