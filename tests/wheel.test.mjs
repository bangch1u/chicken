import test from "node:test";
import fs from "node:fs";
import assert from "node:assert/strict";
import { configStorageKey, validateConfig, parseNames, pickWinner, targetRotation } from "../src/lib/wheel.ts";
const config = validateConfig(JSON.parse(fs.readFileSync(new URL('../public/wheel-config.json', import.meta.url), 'utf8')));
const names = Array.from({ length: 400 }, (_, i) =>
  i === 137 ? "145 Nguyễn Văn Khoa" : `Person ${i}`,
);
test("400 entries and the sixth scheduled winner", () => {
  assert.equal(pickWinner(names, 6, config), 137);
  assert.equal(pickWinner(["145 nguyễn văn khoa"], 6, config), 0);
  for (let turn = 1; turn <= 100; turn++) {
    const index = pickWinner(names, turn, config);
    assert.ok(index >= 0 && index < 400);
  }
});
test("the pointer lands within every selected segment over consecutive rotations", () => {
  for (const count of [1, 2, 12, 400]) {
    let angle = 0;
    for (let index = 0; index < count; index++) {
      const next = targetRotation(angle, index, count);
      assert.ok(next - angle >= 2520);
      assert.equal(
        Math.floor(((360 - (next % 360)) % 360) / (360 / count)),
        index,
      );
      angle = next;
    }
  }
});
test("invalid lists are blocked and a missing scheduled winner falls back to random", () => {
  assert.throws(() => pickWinner([], 1, config));
  assert.throws(() => pickWinner(Array(401).fill("A"), 1, config));
  assert.equal(pickWinner(["A"], 6, config), 0);
  assert.equal(pickWinner(["A"], 5, config), 0);
  assert.equal(pickWinner(["A"], 7, config), 0);
  assert.deepEqual(parseNames(" A\r\n\n B "), ["A", "B"]);
});

test('configuration changes select the new name and isolate stored sessions', () => {
 const changed = validateConfig({scheduledTurn: 3, winnerName: '002 Test', names: ['001 Test', '002 Test']});
 assert.equal(pickWinner(changed.names, 3, changed), 1);
 assert.notEqual(configStorageKey(config), configStorageKey(changed));
 assert.equal(configStorageKey(config), configStorageKey(validateConfig({...config})));

 assert.equal(pickWinner(['145  Nguyễn Văn Khoa'.normalize('NFD')], 6, config), 0);
});
test('invalid configuration is rejected', () => {
 for (const value of [null, {}, {...config,scheduledTurn:0}, {...config,scheduledTurn:1.5},   {...config,names:Array(401).fill(config.winnerName)}, {...config,names:[123]}, {...config,winnerName:'A\nB',names:['A\nB']}]) {
  assert.throws(() => validateConfig(value));
 }
});

test("an empty configured list allows entering participants in the UI", () => { assert.deepEqual(validateConfig({...config, names: []}).names, []); });

test('missing configured winner uses the random path at the scheduled turn', (t) => {
 const changed = validateConfig({...config, names: ['A', 'B', 'C']});
 const random = t.mock.method(globalThis.crypto, 'getRandomValues', buffer => { buffer[0] = 2; return buffer; });
 assert.equal(pickWinner(changed.names, changed.scheduledTurn, changed), 2);
 assert.equal(random.mock.callCount(), 1);
});
