import { CreateMerchantDTO, UpdateMerchantDTO } from '../../../types/platform-admin.types';

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
}

/**
 * Validates CreateMerchantDTO payload.
 */
export function validateCreateMerchant(input: unknown): ValidationResult<CreateMerchantDTO> {
  const errors: Record<string, string> = {};

  if (!input || typeof input !== 'object') {
    return { success: false, errors: { _global: 'Invalid JSON payload' } };
  }

  const dto = input as Partial<CreateMerchantDTO>;

  if (!dto.name || dto.name.trim().length < 2) {
    errors.name = 'Merchant name must be at least 2 characters long.';
  }

  if (!dto.slug || !/^[a-z0-9-]+$/.test(dto.slug)) {
    errors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens (e.g. "techstore-bd").';
  }

  if (!dto.ownerName || dto.ownerName.trim().length < 2) {
    errors.ownerName = 'Owner name is required.';
  }

  if (!dto.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.email)) {
    errors.email = 'Valid email address is required.';
  }

  if (!dto.planId || dto.planId.trim().length === 0) {
    errors.planId = 'Plan selection is required.';
  }

  if (dto.customDomain && !/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(dto.customDomain)) {
    errors.customDomain = 'Invalid custom domain format (e.g. "store.mydomain.com").';
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      name: dto.name!.trim(),
      slug: dto.slug!.trim().toLowerCase(),
      customDomain: dto.customDomain ? dto.customDomain.trim().toLowerCase() : undefined,
      ownerName: dto.ownerName!.trim(),
      email: dto.email!.trim().toLowerCase(),
      phone: dto.phone ? dto.phone.trim() : undefined,
      planId: dto.planId!.trim(),
      trialDays: dto.trialDays || 14,
    },
  };
}

/**
 * Validates UpdateMerchantDTO payload.
 */
export function validateUpdateMerchant(input: unknown): ValidationResult<UpdateMerchantDTO> {
  const errors: Record<string, string> = {};

  if (!input || typeof input !== 'object') {
    return { success: false, errors: { _global: 'Invalid JSON payload' } };
  }

  const dto = input as Partial<UpdateMerchantDTO>;

  if (dto.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.email)) {
    errors.email = 'Valid email address is required.';
  }

  if (dto.status && !['ACTIVE', 'SUSPENDED', 'PENDING', 'CANCELLED'].includes(dto.status)) {
    errors.status = 'Status must be ACTIVE, SUSPENDED, PENDING, or CANCELLED.';
  }

  if (dto.customDomain && !/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(dto.customDomain)) {
    errors.customDomain = 'Invalid custom domain format.';
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: dto as UpdateMerchantDTO,
  };
}
