import {
  getOptimizedUrl,
  getThumbnailUrl,
  getFullSizeUrl,
  getAvatarUrl,
} from "../../lib/cloudinary";

// Mock the Cloudinary configuration
jest.mock("../../lib/cloudinary/config", () => ({
  cloudName: "test-cloud-name",
}));

describe("Cloudinary URL Helpers", () => {
  const publicId = "products/sample-image123";

  describe("getOptimizedUrl", () => {
    it("should return a valid Cloudinary URL with optimization parameters", () => {
      const url = getOptimizedUrl(publicId);
      expect(url).toContain("res.cloudinary.com");
      expect(url).toContain("test-cloud-name");
      expect(url).toContain("image/upload");
      expect(url).toContain(publicId);
    });

    it("should include auto format and quality parameters", () => {
      const url = getOptimizedUrl(publicId);
      expect(url).toContain("f_auto");
      expect(url).toContain("q_auto");
    });

    it("should accept custom width parameter", () => {
      const url = getOptimizedUrl(publicId, { width: 800 });
      expect(url).toContain("w_800");
    });

    it("should accept custom height parameter", () => {
      const url = getOptimizedUrl(publicId, { width: 600, height: 400 });
      expect(url).toContain("h_400");
    });

    it("should include crop mode when specified", () => {
      const url = getOptimizedUrl(publicId, { width: 600, crop: "fill" });
      expect(url).toContain("c_fill");
    });
  });

  describe("getThumbnailUrl", () => {
    it("should return a URL with thumbnail dimensions", () => {
      const url = getThumbnailUrl(publicId);
      expect(url).toContain("res.cloudinary.com");
      expect(url).toContain(publicId);
    });

    it("should use small width for thumbnail", () => {
      const url = getThumbnailUrl(publicId);
      expect(url).toMatch(/w_(150|200|300)/);
    });

    it("should include crop fill for thumbnail", () => {
      const url = getThumbnailUrl(publicId);
      expect(url).toContain("c_fill");
    });

    it("should include auto format and quality", () => {
      const url = getThumbnailUrl(publicId);
      expect(url).toContain("f_auto");
      expect(url).toContain("q_auto");
    });
  });

  describe("getFullSizeUrl", () => {
    it("should return a URL with full-size parameters", () => {
      const url = getFullSizeUrl(publicId);
      expect(url).toContain("res.cloudinary.com");
      expect(url).toContain(publicId);
    });

    it("should include large width for full size", () => {
      const url = getFullSizeUrl(publicId);
      expect(url).toMatch(/w_(1000|1200|1600|1920)/);
    });

    it("should include auto format and quality", () => {
      const url = getFullSizeUrl(publicId);
      expect(url).toContain("f_auto");
      expect(url).toContain("q_auto");
    });

    it("should not apply aggressive cropping for full size", () => {
      const url = getFullSizeUrl(publicId);
      expect(url).not.toContain("c_fill");
    });
  });

  describe("getAvatarUrl", () => {
    it("should return a URL with avatar dimensions", () => {
      const url = getAvatarUrl(publicId);
      expect(url).toContain("res.cloudinary.com");
      expect(url).toContain(publicId);
    });

    it("should use square dimensions for avatar", () => {
      const url = getAvatarUrl(publicId);
      expect(url).toMatch(/w_(100|150|200|256|400)/);
      expect(url).toMatch(/h_(100|150|200|256|400)/);
    });

    it("should include crop fill for avatar", () => {
      const url = getAvatarUrl(publicId);
      expect(url).toContain("c_fill");
    });

    it("should include auto format and quality", () => {
      const url = getAvatarUrl(publicId);
      expect(url).toContain("f_auto");
      expect(url).toContain("q_auto");
    });

    it("should handle default avatar when no publicId provided", () => {
      const url = getAvatarUrl("");
      expect(url).toBeDefined();
      expect(url).toContain("res.cloudinary.com");
    });
  });

  describe("all URL helpers", () => {
    it("should all return strings", () => {
      expect(typeof getOptimizedUrl(publicId)).toBe("string");
      expect(typeof getThumbnailUrl(publicId)).toBe("string");
      expect(typeof getFullSizeUrl(publicId)).toBe("string");
      expect(typeof getAvatarUrl(publicId)).toBe("string");
    });

    it("should all contain the cloud name", () => {
      expect(getOptimizedUrl(publicId)).toContain("test-cloud-name");
      expect(getThumbnailUrl(publicId)).toContain("test-cloud-name");
      expect(getFullSizeUrl(publicId)).toContain("test-cloud-name");
      expect(getAvatarUrl(publicId)).toContain("test-cloud-name");
    });

    it("should all contain the public ID", () => {
      expect(getOptimizedUrl(publicId)).toContain(publicId);
      expect(getThumbnailUrl(publicId)).toContain(publicId);
      expect(getFullSizeUrl(publicId)).toContain(publicId);
      expect(getAvatarUrl(publicId)).toContain(publicId);
    });
  });
});
