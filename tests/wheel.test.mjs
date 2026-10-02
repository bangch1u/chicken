import test from "node:test";
import assert from "node:assert/strict";
import { parseNames, pickWinner, targetRotation } from "../src/lib/wheel.ts";
const names = Array.from({ length: 400 }, (_, i) =>
  i === 137 ? "Khoa Anthony" : `Person ${i}`,
);
test("400 entries and the sixth scheduled winner", () => {
  assert.equal(pickWinner(names, 6), 137);
  assert.equal(pickWinner(["khoa anthony"], 6), 0);
  for (let turn = 1; turn <= 100; turn++) {
    const index = pickWinner(names, turn);
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
test("invalid lists and missing scheduled winner are blocked", () => {
  assert.throws(() => pickWinner([], 1));
  assert.throws(() => pickWinner(Array(401).fill("A"), 1));
  assert.throws(() => pickWinner(["A"], 6));
  assert.equal(pickWinner(["A"], 5), 0);
  assert.equal(pickWinner(["A"], 7), 0);
  assert.deepEqual(parseNames(" A\r\n\n B "), ["A", "B"]);
});
