import { describe, it, expect } from "vitest";

describe("Project Setup", () => {
  it("should have proper TypeScript support", () => {
    const message: string = "Hello TypeScript!";
    expect(message).toBe("Hello TypeScript!");
  });

  it("should support async/await", async () => {
    const result = await Promise.resolve("async result");
    expect(result).toBe("async result");
  });

  it("should support modern JavaScript features", () => {
    const numbers = [1, 2, 3, 4, 5];
    const doubled = numbers.map((n) => n * 2);
    expect(doubled).toEqual([2, 4, 6, 8, 10]);
  });
});
