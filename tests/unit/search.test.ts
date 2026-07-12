import { spellCorrect } from "@/lib/search/spell-correct";

describe("spellCorrect", () => {
  describe("single word corrections", () => {
    it("should correct 'fone' to 'phone'", () => {
      expect(spellCorrect("fone")).toBe("phone");
    });

    it("should correct 'laptob' to 'laptop'", () => {
      expect(spellCorrect("laptob")).toBe("laptop");
    });

    it("should correct 'headfones' to 'headphones'", () => {
      expect(spellCorrect("headfones")).toBe("headphones");
    });

    it("should correct 'snekers' to 'sneakers'", () => {
      expect(spellCorrect("snekers")).toBe("sneakers");
    });

    it("should correct 'shrt' to 'shirt'", () => {
      expect(spellCorrect("shrt")).toBe("shirt");
    });

    it("should correct 'computr' to 'computer'", () => {
      expect(spellCorrect("computr")).toBe("computer");
    });
  });

  describe("multiple word corrections", () => {
    it("should correct multiple misspelled words in a phrase", () => {
      expect(spellCorrect("fone laptob")).toBe("phone laptop");
    });

    it("should correct only misspelled words and leave correct ones unchanged", () => {
      expect(spellCorrect("red fone")).toBe("red phone");
    });

    it("should handle a full search query with multiple corrections", () => {
      expect(spellCorrect("laptob chargr for computr")).toBe("laptop charger for computer");
    });
  });

  describe("case insensitivity", () => {
    it("should correct uppercase input", () => {
      expect(spellCorrect("FONE")).toBe("phone");
    });

    it("should correct mixed case input", () => {
      expect(spellCorrect("LaPtOb")).toBe("laptop");
    });

    it("should correct lowercase input", () => {
      expect(spellCorrect("fone")).toBe("phone");
    });

    it("should handle mixed case in multi-word queries", () => {
      expect(spellCorrect("FONE LapTob")).toBe("phone laptop");
    });
  });

  describe("empty and edge cases", () => {
    it("should return empty string for empty input", () => {
      expect(spellCorrect("")).toBe("");
    });

    it("should return empty string for whitespace-only input", () => {
      expect(spellCorrect("   ")).toBe("");
    });

    it("should handle null input gracefully", () => {
      expect(spellCorrect(null as unknown as string)).toBe("");
    });

    it("should handle undefined input gracefully", () => {
      expect(spellCorrect(undefined as unknown as string)).toBe("");
    });

    it("should trim leading and trailing whitespace", () => {
      expect(spellCorrect("  fone  ")).toBe("phone");
    });
  });

  describe("correct words remain unchanged", () => {
    it("should not change correctly spelled 'phone'", () => {
      expect(spellCorrect("phone")).toBe("phone");
    });

    it("should not change correctly spelled 'laptop'", () => {
      expect(spellCorrect("laptop")).toBe("laptop");
    });

    it("should not change correctly spelled multi-word query", () => {
      expect(spellCorrect("red phone case")).toBe("red phone case");
    });

    it("should not change correctly spelled 'computer'", () => {
      expect(spellCorrect("computer")).toBe("computer");
    });

    it("should not change correctly spelled 'headphones'", () => {
      expect(spellCorrect("headphones")).toBe("headphones");
    });
  });

  describe("numbers and special characters", () => {
    it("should preserve numbers in the query", () => {
      expect(spellCorrect("iphone 14")).toBe("iphone 14");
    });

    it("should preserve special characters", () => {
      expect(spellCorrect("phone-case")).toBe("phone-case");
    });

    it("should handle alphanumeric queries", () => {
      expect(spellCorrect("fone 14 pro")).toBe("phone 14 pro");
    });
  });
});
