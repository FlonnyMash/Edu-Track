import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyLeitnerStep, INTERVAL_STEPS } from "./leitner";

const BASE = "2026-07-02";

describe("applyLeitnerStep", () => {
  it("resets on incorrect answer", () => {
    const result = applyLeitnerStep(false, 3, BASE);
    assert.equal(result.repetitions, 0);
    assert.equal(result.interval, 1);
    assert.equal(result.next_review_date, "2026-07-03");
    assert.equal(result.is_mastered, false);
  });

  it("advances through interval steps on correct answers", () => {
    let reps = 0;

    for (let step = 1; step < INTERVAL_STEPS.length; step += 1) {
      const result = applyLeitnerStep(true, reps, BASE);
      assert.equal(result.repetitions, step);
      assert.equal(result.interval, INTERVAL_STEPS[step]);
      assert.equal(result.is_mastered, false);
      reps = result.repetitions;
    }
  });

  it("marks item mastered when step index exceeds array length", () => {
    const lastStep = INTERVAL_STEPS.length - 1;
    const result = applyLeitnerStep(true, lastStep, BASE);
    assert.equal(result.repetitions, INTERVAL_STEPS.length);
    assert.equal(result.next_review_date, null);
    assert.equal(result.is_mastered, true);
  });
});
