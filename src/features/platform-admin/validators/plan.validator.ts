import { CreatePlanDTO, UpdatePlanDTO } from '../../../types/platform-admin.types';
import { ValidationResult } from './merchant.validator';

/**
 * Validates CreatePlanDTO payload.
 */
export function validateCreatePlan(input: unknown): ValidationResult<CreatePlanDTO> {
  const errors: Record<string, string> = {};

  if (!input || typeof input !== 'object') {
    return { success: false, errors: { _global: 'Invalid JSON payload' } };
  }

  const dto = input as Partial<CreatePlanDTO>;

  if (!dto.name || dto.name.trim().length < 2) {
    errors.name = 'Plan name must be at least 2 characters long.';
  }

  if (dto.monthlyPrice === undefined || typeof dto.monthlyPrice !== 'number' || dto.monthlyPrice < 0) {
    errors.monthlyPrice = 'Monthly price must be a non-negative number.';
  }

  if (dto.yearlyPrice === undefined || typeof dto.yearlyPrice !== 'number' || dto.yearlyPrice < 0) {
    errors.yearlyPrice = 'Yearly price must be a non-negative number.';
  }

  if (!Array.isArray(dto.features)) {
    errors.features = 'Features must be an array of strings.';
  }

  if (!dto.limits || typeof dto.limits !== 'object') {
    errors.limits = 'Plan limits object is required.';
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      name: dto.name!.trim(),
      description: dto.description?.trim(),
      monthlyPrice: dto.monthlyPrice!,
      yearlyPrice: dto.yearlyPrice!,
      trialDays: dto.trialDays ?? 14,
      features: dto.features!,
      limits: dto.limits!,
      isActive: dto.isActive ?? true,
    },
  };
}

/**
 * Validates UpdatePlanDTO payload.
 */
export function validateUpdatePlan(input: unknown): ValidationResult<UpdatePlanDTO> {
  const errors: Record<string, string> = {};

  if (!input || typeof input !== 'object') {
    return { success: false, errors: { _global: 'Invalid JSON payload' } };
  }

  const dto = input as Partial<UpdatePlanDTO>;

  if (dto.monthlyPrice !== undefined && (typeof dto.monthlyPrice !== 'number' || dto.monthlyPrice < 0)) {
    errors.monthlyPrice = 'Monthly price must be a non-negative number.';
  }

  if (dto.yearlyPrice !== undefined && (typeof dto.yearlyPrice !== 'number' || dto.yearlyPrice < 0)) {
    errors.yearlyPrice = 'Yearly price must be a non-negative number.';
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: dto as UpdatePlanDTO,
  };
}
