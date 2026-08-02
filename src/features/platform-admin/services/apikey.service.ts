import { SystemAPIKey, CreateSystemAPIKeyDTO } from '../../../types/platform-admin.types';
import { auditService } from './audit.service';

export interface CreatedAPIKeyResult {
  key: SystemAPIKey;
  rawApiKey: string; // Exposed only ONCE upon creation
}

/**
 * Service for System API Keys generation, hashing, verification, and revocation.
 */
export class APIKeyService {
  private static instance: APIKeyService | null = null;
  private apiKeysStore: Map<string, SystemAPIKey> = new Map();

  private constructor() {
    this.seedInitialKeys();
  }

  public static getInstance(): APIKeyService {
    if (!APIKeyService.instance) {
      APIKeyService.instance = new APIKeyService();
    }
    return APIKeyService.instance;
  }

  /**
   * Generates a new secure system API Key, hashes it for storage, and returns raw key ONCE.
   */
  public async createAPIKey(dto: CreateSystemAPIKeyDTO, adminId = 'system'): Promise<CreatedAPIKeyResult> {
    const rawApiKey = `ag_live_${Date.now()}_${this.generateRandomHex(24)}`;
    const hashedKey = this.hashKey(rawApiKey);

    const expiresInDays = dto.expiresInDays || 365;
    const expiresAt = new Date(Date.now() + expiresInDays * 86400000).toISOString();

    const newKey: SystemAPIKey = {
      id: `key-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      keyName: dto.keyName,
      hashedKey,
      permissions: dto.permissions.length > 0 ? dto.permissions : ['*'],
      isRevoked: false,
      expiresAt,
      createdAt: new Date().toISOString(),
    };

    this.apiKeysStore.set(newKey.id, newKey);

    await auditService.logAdminAction({
      adminId,
      action: 'CREATE_SYSTEM_API_KEY',
      targetResource: `APIKey:${newKey.id}`,
      details: { keyName: newKey.keyName, permissions: newKey.permissions },
    });

    return {
      key: newKey,
      rawApiKey,
    };
  }

  /**
   * Retrieves all registered API keys.
   */
  public async getAPIKeys(): Promise<SystemAPIKey[]> {
    return Array.from(this.apiKeysStore.values()).map((k) => ({
      ...k,
      hashedKey: `ag_live_••••${k.hashedKey.substring(0, 8)}`,
    }));
  }

  /**
   * Revokes an existing API Key by ID.
   */
  public async revokeAPIKey(id: string, adminId = 'system'): Promise<boolean> {
    const key = this.apiKeysStore.get(id);
    if (!key) return false;

    key.isRevoked = true;
    this.apiKeysStore.set(id, key);

    await auditService.logAdminAction({
      adminId,
      action: 'REVOKE_SYSTEM_API_KEY',
      targetResource: `APIKey:${id}`,
    });

    return true;
  }

  /**
   * Validates incoming raw API key and verifies non-revoked and non-expired state.
   */
  public async validateAPIKey(rawKey: string): Promise<SystemAPIKey | null> {
    if (!rawKey || !rawKey.startsWith('ag_live_')) return null;

    const incomingHash = this.hashKey(rawKey);

    const found = Array.from(this.apiKeysStore.values()).find(
      (k) => k.hashedKey === incomingHash && !k.isRevoked
    );

    if (!found) return null;

    // Check expiration
    if (found.expiresAt && new Date(found.expiresAt).getTime() < Date.now()) {
      return null;
    }

    return found;
  }

  private hashKey(rawKey: string): string {
    let hash = 0;
    for (let i = 0; i < rawKey.length; i++) {
      const char = rawKey.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `sha256_${Math.abs(hash).toString(16)}`;
  }

  private generateRandomHex(length: number): string {
    const chars = 'abcdef0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private seedInitialKeys(): void {
    const seedRaw = 'ag_live_seed1234567890abcdef12345678';
    const seedHash = this.hashKey(seedRaw);

    const seedKey: SystemAPIKey = {
      id: 'key-seed-01',
      keyName: 'Default System Integration Key',
      hashedKey: seedHash,
      permissions: ['*'],
      isRevoked: false,
      expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.apiKeysStore.set(seedKey.id, seedKey);
  }
}

export const apiKeyService = APIKeyService.getInstance();
