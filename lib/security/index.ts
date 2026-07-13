// @ts-nocheck
import type { UserRole } from '@/lib/types';

export interface AuthContext {
  userId: string;
  role: UserRole;
  email: string;
}

export interface AuditLogEntry {
  userId: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

function getEnv(key: string): string | undefined {
  if (typeof process !== 'undefined' && process.env) return process.env[key];
  return undefined;
}

// ===== RBAC =====

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  customer: ['cart:read', 'cart:write', 'orders:read', 'orders:create', 'reviews:read', 'reviews:write', 'wishlist:read', 'wishlist:write', 'profile:read', 'profile:write', 'tickets:read', 'tickets:write', 'notifications:read', 'notifications:write'],
  vendor: ['products:read', 'products:write', 'orders:read', 'inventory:read', 'inventory:write', 'profile:read', 'profile:write', 'tickets:read', 'tickets:write', 'notifications:read', 'notifications:write'],
  admin: ['*'],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes('*') || permissions.includes(permission);
}

export function requireRole(userRole: UserRole | undefined, requiredRoles: UserRole[]): boolean {
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
}

export function isAdmin(role: UserRole | undefined): boolean {
  return role === 'admin';
}

export function isVendor(role: UserRole | undefined): boolean {
  return role === 'vendor';
}

export function isCustomer(role: UserRole | undefined): boolean {
  return role === 'customer';
}

// ===== Audit Logging =====

export async function logActivity(entry: AuditLogEntry): Promise<boolean> {
  const supabaseUrl = getEnv('SUPABASE_URL');
  const serviceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    console.warn('[security] Supabase not configured for audit log');
    return false;
  }
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/activity_logs`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        user_id: entry.userId,
        action: entry.action,
        entity_type: entry.entityType || null,
        entity_id: entry.entityId || null,
        details: entry.details || null,
        ip_address: entry.ipAddress || null,
        user_agent: entry.userAgent || null,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('[security] Audit log failed:', err);
    return false;
  }
}

// ===== Rate Limiting =====

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000,
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, resetTime: entry.resetTime };
}

export function clearRateLimit(identifier: string): void {
  rateLimitMap.delete(identifier);
}

// ===== Fraud Detection =====

export interface FraudCheckResult {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  flags: string[];
}

export function checkFraud(params: {
  orderAmount: number;
  userAge: number;
  previousOrders: number;
  previousCancellations: number;
  paymentMethod: string;
  ipAddress?: string;
}): FraudCheckResult {
  const flags: string[] = [];
  let score = 0;

  if (params.orderAmount > 5000) {
    score += 20;
    flags.push('high_value_order');
  }
  if (params.userAge < 1) {
    score += 25;
    flags.push('new_account');
  }
  if (params.previousOrders === 0) {
    score += 15;
    flags.push('first_order');
  }
  if (params.previousCancellations > 3) {
    score += 20;
    flags.push('high_cancellation_rate');
  }
  if (params.paymentMethod === 'cash_on_delivery' && params.orderAmount > 1000) {
    score += 15;
    flags.push('high_value_cod');
  }

  const riskLevel: 'low' | 'medium' | 'high' =
    score >= 50 ? 'high' : score >= 25 ? 'medium' : 'low';

  return { riskScore: score, riskLevel, flags };
}

// ===== Input Validation =====

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateGhanaPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, '');
  return /^(\+233|0)(20|24|25|26|27|28|29|54|55|56|57|58|59)\d{7}$/.test(cleaned);
}

export function sanitizeInput(input: string): string {
  return input.replace(/[<>]/g, '').trim();
}

// ===== Session Security =====

export function generateSessionToken(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}`;
}

export function isSessionExpired(sessionCreatedAt: number, maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): boolean {
  return Date.now() - sessionCreatedAt > maxAgeMs;
}
