import {
  getWebsiteSchema,
  getOrganizationSchema,
  getProductSchema,
  getBreadcrumbSchema,
} from '@/lib/seo/structured-data';

describe('Structured Data Schemas', () => {
  describe('getWebsiteSchema', () => {
    it('returns a valid WebSite schema object', () => {
      const schema = getWebsiteSchema();
      expect(schema).toBeDefined();
      expect(schema['@type']).toBe('WebSite');
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema.name).toBeDefined();
      expect(schema.url).toBeDefined();
    });

    it('includes a potentialAction for search', () => {
      const schema = getWebsiteSchema();
      expect(schema.potentialAction).toBeDefined();
      expect(schema.potentialAction['@type']).toBe('SearchAction');
      expect(schema.potentialAction.target).toBeDefined();
    });
  });

  describe('getOrganizationSchema', () => {
    it('returns a valid Organization schema object', () => {
      const schema = getOrganizationSchema();
      expect(schema).toBeDefined();
      expect(schema['@type']).toBe('Organization');
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema.name).toBeDefined();
      expect(schema.url).toBeDefined();
    });

    it('includes the correct contact email', () => {
      const schema = getOrganizationSchema();
      expect(schema.email).toBe('smrtmart304@gmail.com');
    });

    it('includes the correct contact phone', () => {
      const schema = getOrganizationSchema();
      expect(schema.telephone).toBe('+233551621261');
    });

    it('includes contactPoint with email and phone', () => {
      const schema = getOrganizationSchema();
      expect(schema.contactPoint).toBeDefined();
      if (Array.isArray(schema.contactPoint)) {
        expect(schema.contactPoint.length).toBeGreaterThan(0);
        expect(schema.contactPoint[0].email).toBe('smrtmart304@gmail.com');
        expect(schema.contactPoint[0].telephone).toBe('+233551621261');
      } else {
        expect(schema.contactPoint.email).toBe('smrtmart304@gmail.com');
        expect(schema.contactPoint.telephone).toBe('+233551621261');
      }
    });

    it('includes an address', () => {
      const schema = getOrganizationSchema();
      expect(schema.address).toBeDefined();
    });
  });

  describe('getProductSchema', () => {
    it('returns a valid Product schema object', () => {
      const product = {
        id: 'prod-123',
        name: 'Wireless Headphones',
        description: 'High-quality wireless headphones with noise cancellation.',
        price: 299.99,
        currency: 'USD',
        image: 'https://example.com/headphones.jpg',
        brand: 'AudioMax',
        rating: 4.5,
        reviewCount: 128,
        sku: 'AM-WH-001',
        availability: 'in stock',
      };
      const schema = getProductSchema(product);
      expect(schema).toBeDefined();
      expect(schema['@type']).toBe('Product');
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema.name).toBe('Wireless Headphones');
      expect(schema.description).toBe(
        'High-quality wireless headphones with noise cancellation.'
      );
      expect(schema.sku).toBe('AM-WH-001');
    });

    it('includes offers with correct price and currency', () => {
      const product = {
        name: 'Test Product',
        price: 49.99,
        currency: 'GHS',
        availability: 'in stock',
      };
      const schema = getProductSchema(product);
      expect(schema.offers).toBeDefined();
      expect(schema.offers['@type']).toBe('Offer');
      expect(schema.offers.price).toBe(49.99);
      expect(schema.offers.priceCurrency).toBe('GHS');
    });

    it('includes aggregateRating when rating and reviewCount are provided', () => {
      const product = {
        name: 'Rated Product',
        price: 19.99,
        currency: 'USD',
        rating: 4.8,
        reviewCount: 200,
      };
      const schema = getProductSchema(product);
      expect(schema.aggregateRating).toBeDefined();
      expect(schema.aggregateRating['@type']).toBe('AggregateRating');
      expect(schema.aggregateRating.ratingValue).toBe(4.8);
      expect(schema.aggregateRating.reviewCount).toBe(200);
    });

    it('handles minimal product data', () => {
      const product = { name: 'Minimal Product', price: 10, currency: 'USD' };
      const schema = getProductSchema(product);
      expect(schema.name).toBe('Minimal Product');
      expect(schema.offers.price).toBe(10);
    });
  });

  describe('getBreadcrumbSchema', () => {
    it('returns a valid BreadcrumbList schema object', () => {
      const items = [
        { name: 'Home', url: 'https://smartmart.com' },
        { name: 'Electronics', url: 'https://smartmart.com/electronics' },
        { name: 'Headphones', url: 'https://smartmart.com/electronics/headphones' },
      ];
      const schema = getBreadcrumbSchema(items);
      expect(schema).toBeDefined();
      expect(schema['@type']).toBe('BreadcrumbList');
      expect(schema['@context']).toBe('https://schema.org');
    });

    it('creates itemListElement entries for each breadcrumb', () => {
      const items = [
        { name: 'Home', url: 'https://smartmart.com' },
        { name: 'Products', url: 'https://smartmart.com/products' },
      ];
      const schema = getBreadcrumbSchema(items);
      expect(schema.itemListElement).toHaveLength(2);
      expect(schema.itemListElement[0]['@type']).toBe('ListItem');
      expect(schema.itemListElement[0].position).toBe(1);
      expect(schema.itemListElement[0].name).toBe('Home');
      expect(schema.itemListElement[0].item).toBe('https://smartmart.com');
    });

    it('assigns correct positions', () => {
      const items = [
        { name: 'A', url: 'https://smartmart.com/a' },
        { name: 'B', url: 'https://smartmart.com/b' },
        { name: 'C', url: 'https://smartmart.com/c' },
      ];
      const schema = getBreadcrumbSchema(items);
      expect(schema.itemListElement[0].position).toBe(1);
      expect(schema.itemListElement[1].position).toBe(2);
      expect(schema.itemListElement[2].position).toBe(3);
    });

    it('handles empty breadcrumb list', () => {
      const schema = getBreadcrumbSchema([]);
      expect(schema.itemListElement).toHaveLength(0);
    });
  });
});
