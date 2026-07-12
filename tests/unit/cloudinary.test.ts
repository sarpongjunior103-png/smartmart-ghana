import {
  getOptimizedUrl,
  getThumbnailUrl,
  getFullSizeUrl,
  getAvatarUrl,
} from '@/lib/cloudinary';

// Mock cloud name for testing
const CLOUD_NAME = 'smartmart-test';
const PUBLIC_ID = 'products/headphones-001';

describe('Cloudinary URL Helpers', () => {
  describe('getOptimizedUrl', () => {
    it('returns a valid Cloudinary URL with optimization parameters', () => {
      const url = getOptimizedUrl(PUBLIC_ID);
      expect(url).toBeDefined();
      expect(url).toContain('res.cloudinary.com');
      expect(url).toContain(CLOUD_NAME);
      expect(url).toContain('image/upload');
      expect(url).toContain(PUBLIC_ID);
    });

    it('includes auto format and quality parameters', () => {
      const url = getOptimizedUrl(PUBLIC_ID);
      expect(url).toContain('f_auto');
      expect(url).toContain('q_auto');
    });

    it('accepts custom width and height', () => {
      const url = getOptimizedUrl(PUBLIC_ID, { width: 400, height: 300 });
      expect(url).toContain('w_400');
      expect(url).toContain('h_300');
    });

    it('accepts custom quality parameter', () => {
      const url = getOptimizedUrl(PUBLIC_ID, { quality: 80 });
      expect(url).toContain('q_80');
    });

    it('accepts custom format parameter', () => {
      const url = getOptimizedUrl(PUBLIC_ID, { format: 'webp' });
      expect(url).toContain('f_webp');
    });

    it('includes crop mode when provided', () => {
      const url = getOptimizedUrl(PUBLIC_ID, { crop: 'fill' });
      expect(url).toContain('c_fill');
    });

    it('handles public IDs with special characters', () => {
      const url = getOptimizedUrl('folder/my image name');
      expect(url).toContain('folder/my%20image%20name');
    });
  });

  describe('getThumbnailUrl', () => {
    it('returns a URL with thumbnail dimensions', () => {
      const url = getThumbnailUrl(PUBLIC_ID);
      expect(url).toBeDefined();
      expect(url).toContain('res.cloudinary.com');
      expect(url).toContain(PUBLIC_ID);
    });

    it('uses a small width for thumbnails', () => {
      const url = getThumbnailUrl(PUBLIC_ID);
      expect(url).toMatch(/w_1\d{2,3}/);
    });

    it('uses a small height for thumbnails', () => {
      const url = getThumbnailUrl(PUBLIC_ID);
      expect(url).toMatch(/h_1\d{2,3}/);
    });

    it('includes auto format and quality', () => {
      const url = getThumbnailUrl(PUBLIC_ID);
      expect(url).toContain('f_auto');
      expect(url).toContain('q_auto');
    });

    it('accepts custom size override', () => {
      const url = getThumbnailUrl(PUBLIC_ID, { width: 64, height: 64 });
      expect(url).toContain('w_64');
      expect(url).toContain('h_64');
    });
  });

  describe('getFullSizeUrl', () => {
    it('returns a URL with full-size dimensions', () => {
      const url = getFullSizeUrl(PUBLIC_ID);
      expect(url).toBeDefined();
      expect(url).toContain('res.cloudinary.com');
      expect(url).toContain(PUBLIC_ID);
    });

    it('includes auto format and quality', () => {
      const url = getFullSizeUrl(PUBLIC_ID);
      expect(url).toContain('f_auto');
      expect(url).toContain('q_auto');
    });

    it('uses a large width for full-size images', () => {
      const url = getFullSizeUrl(PUBLIC_ID);
      expect(url).toMatch(/w_\d{3,4}/);
    });

    it('accepts custom width override', () => {
      const url = getFullSizeUrl(PUBLIC_ID, { width: 1920 });
      expect(url).toContain('w_1920');
    });
  });

  describe('getAvatarUrl', () => {
    it('returns a URL for avatar images', () => {
      const url = getAvatarUrl('users/user-123');
      expect(url).toBeDefined();
      expect(url).toContain('res.cloudinary.com');
      expect(url).toContain('users/user-123');
    });

    it('uses square dimensions for avatars', () => {
      const url = getAvatarUrl('users/user-123');
      // Avatars should be square
      const widthMatch = url.match(/w_(\d+)/);
      const heightMatch = url.match(/h_(\d+)/);
      if (widthMatch && heightMatch) {
        expect(widthMatch[1]).toBe(heightMatch[1]);
      }
    });

    it('uses crop fill for avatars', () => {
      const url = getAvatarUrl('users/user-123');
      expect(url).toContain('c_fill');
    });

    it('includes auto format and quality', () => {
      const url = getAvatarUrl('users/user-123');
      expect(url).toContain('f_auto');
      expect(url).toContain('q_auto');
    });

    it('accepts custom size override', () => {
      const url = getAvatarUrl('users/user-123', { width: 256, height: 256 });
      expect(url).toContain('w_256');
      expect(url).toContain('h_256');
    });

    it('handles default avatar when no publicId provided', () => {
      const url = getAvatarUrl('');
      expect(url).toBeDefined();
      expect(url).toContain('res.cloudinary.com');
    });
  });

  describe('URL consistency', () => {
    it('all helpers return URLs from the same cloud', () => {
      const optimized = getOptimizedUrl(PUBLIC_ID);
      const thumb = getThumbnailUrl(PUBLIC_ID);
      const full = getFullSizeUrl(PUBLIC_ID);
      const avatar = getAvatarUrl('users/test');

      const extractCloud = (url: string) => {
        const match = url.match(/res\.cloudinary\.com\/([^/]+)/);
        return match ? match[1] : null;
      };

      expect(extractCloud(optimized)).toBe(extractCloud(thumb));
      expect(extractCloud(thumb)).toBe(extractCloud(full));
      expect(extractCloud(full)).toBe(extractCloud(avatar));
    });
  });
});
