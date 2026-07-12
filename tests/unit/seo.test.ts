import {
  getWebsiteSchema,
  getOrganizationSchema,
  getProductSchema,
  getBreadcrumbSchema,
} from "../../lib/seo/structured-data";

describe("SEO Structured Data", () => {
  describe("getWebsiteSchema", () => {
    it("should return a valid WebSite schema object", () => {
      const schema = getWebsiteSchema();
      expect(schema).toBeDefined();
      expect(schema["@type"]).toBe("WebSite");
      expect(schema.name).toBeDefined();
      expect(schema.url).toBeDefined();
    });

    it("should include a search action potential action", () => {
      const schema = getWebsiteSchema();
      expect(schema.potentialAction).toBeDefined();
      const action = Array.isArray(schema.potentialAction)
        ? schema.potentialAction[0]
        : schema.potentialAction;
      expect(action["@type"]).toBe("SearchAction");
      expect(action.target).toBeDefined();
    });

    it("should have a valid URL in the search target", () => {
      const schema = getWebsiteSchema();
      const action = Array.isArray(schema.potentialAction)
        ? schema.potentialAction[0]
        : schema.potentialAction;
      const target = typeof action.target === "string" ? action.target : action.target.urlTemplate;
      expect(target).toContain("/search");
    });
  });

  describe("getOrganizationSchema", () => {
    it("should return a valid Organization schema object", () => {
      const schema = getOrganizationSchema();
      expect(schema).toBeDefined();
      expect(schema["@type"]).toBe("Organization");
      expect(schema.name).toBeDefined();
      expect(schema.url).toBeDefined();
    });

    it("should include contact information", () => {
      const schema = getOrganizationSchema();
      expect(schema.contactPoint || schema.email || schema.telephone).toBeDefined();
    });

    it("should include an address", () => {
      const schema = getOrganizationSchema();
      expect(schema.address).toBeDefined();
      if (typeof schema.address === "object" && !Array.isArray(schema.address)) {
        expect(schema.address.addressCountry).toBeDefined();
      }
    });

    it("should include logo if provided", () => {
      const schema = getOrganizationSchema({ logo: "https://example.com/logo.png" });
      expect(schema.logo).toBeDefined();
    });
  });

  describe("getProductSchema", () => {
    it("should return a valid Product schema object", () => {
      const schema = getProductSchema({
        name: "Test Product",
        description: "A test product",
        price: 99.99,
        currency: "GHS",
        image: "https://example.com/product.jpg",
        sku: "TEST-001",
      });
      expect(schema).toBeDefined();
      expect(schema["@type"]).toBe("Product");
      expect(schema.name).toBe("Test Product");
      expect(schema.description).toBe("A test product");
    });

    it("should include offers with price and currency", () => {
      const schema = getProductSchema({
        name: "Test Product",
        description: "A test product",
        price: 150.0,
        currency: "GHS",
      });
      expect(schema.offers).toBeDefined();
      const offers = Array.isArray(schema.offers) ? schema.offers[0] : schema.offers;
      expect(offers["@type"]).toBe("Offer");
      expect(offers.price).toBe("150");
      expect(offers.priceCurrency).toBe("GHS");
    });

    it("should include product image when provided", () => {
      const schema = getProductSchema({
        name: "Test Product",
        description: "A test product",
        price: 50,
        currency: "GHS",
        image: "https://example.com/product.jpg",
      });
      expect(schema.image).toBe("https://example.com/product.jpg");
    });

    it("should include SKU when provided", () => {
      const schema = getProductSchema({
        name: "Test Product",
        description: "A test product",
        price: 50,
        currency: "GHS",
        sku: "PROD-123",
      });
      expect(schema.sku).toBe("PROD-123");
    });

    it("should include availability status", () => {
      const schema = getProductSchema({
        name: "Test Product",
        description: "A test product",
        price: 50,
        currency: "GHS",
        availability: "InStock",
      });
      const offers = Array.isArray(schema.offers) ? schema.offers[0] : schema.offers;
      expect(offers.availability).toContain("InStock");
    });
  });

  describe("getBreadcrumbSchema", () => {
    it("should return a valid BreadcrumbList schema object", () => {
      const schema = getBreadcrumbSchema([
        { name: "Home", url: "https://example.com" },
        { name: "Products", url: "https://example.com/products" },
      ]);
      expect(schema).toBeDefined();
      expect(schema["@type"]).toBe("BreadcrumbList");
      expect(schema.itemListElement).toBeDefined();
      expect(Array.isArray(schema.itemListElement)).toBe(true);
    });

    it("should create correct number of breadcrumb items", () => {
      const items = [
        { name: "Home", url: "https://example.com" },
        { name: "Electronics", url: "https://example.com/electronics" },
        { name: "Phones", url: "https://example.com/electronics/phones" },
      ];
      const schema = getBreadcrumbSchema(items);
      expect(schema.itemListElement).toHaveLength(3);
    });

    it("should set correct position for each item", () => {
      const items = [
        { name: "Home", url: "https://example.com" },
        { name: "Products", url: "https://example.com/products" },
        { name: "Phone", url: "https://example.com/products/phone" },
      ];
      const schema = getBreadcrumbSchema(items);
      schema.itemListElement.forEach((item: { position: number }, index: number) => {
        expect(item.position).toBe(index + 1);
      });
    });

    it("should set ListItem type for each element", () => {
      const schema = getBreadcrumbSchema([
        { name: "Home", url: "https://example.com" },
      ]);
      expect(schema.itemListElement[0]["@type"]).toBe("ListItem");
      expect(schema.itemListElement[0].name).toBe("Home");
      expect(schema.itemListElement[0].item).toBe("https://example.com");
    });

    it("should handle empty breadcrumb array", () => {
      const schema = getBreadcrumbSchema([]);
      expect(schema.itemListElement).toHaveLength(0);
    });
  });
});
