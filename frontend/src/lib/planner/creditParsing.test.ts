import { firstInteger } from "./creditParsing";

describe("firstInteger", () => {
  test("parses a single integer", () => {
    expect(firstInteger("4 credits")).toBe(4);
  });

  test("parses the first number in a range", () => {
    expect(firstInteger("12-16")).toBe(12);
    expect(firstInteger("12-16 credits")).toBe(12);
  });

  test("returns null when no number exists", () => {
    expect(firstInteger("elective")).toBeNull();
  });
});
