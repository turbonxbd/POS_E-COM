import {
  DEFAULT_LOYALTY_CONFIG,
  RewardActionType,
  RewardTransactionDTO,
} from '../../../types/customer-crm.types';
import { ltvCalculatorService } from './ltv-calculator.service';

export interface AddPointsResult {
  success: boolean;
  newBalance: number;
  pointsAdded: number;
  transactionLog: RewardTransactionDTO;
  message: string;
}

export interface RedeemPointsResult {
  success: boolean;
  newBalance: number;
  pointsRedeemed: number;
  discountBDT: number;
  transactionLog: RewardTransactionDTO;
  message: string;
}

/**
 * Enterprise Service for Reward Points Credit Allocation, Redemption, and Financial Balance Enforcement.
 */
export class RewardService {
  private static instance: RewardService | null = null;

  // In-memory store: Map<customerId, RewardTransactionDTO[]>
  private rewardLogsStore: Map<string, RewardTransactionDTO[]> = new Map();

  private constructor() {
    this.seedDemoRewardLogs();
  }

  public static getInstance(): RewardService {
    if (!RewardService.instance) {
      RewardService.instance = new RewardService();
    }
    return RewardService.instance;
  }

  /**
   * Credits reward points to a customer profile and records audit transaction log.
   */
  public async addRewardPoints(
    merchantId: string,
    customerId: string,
    points: number,
    actionType: RewardActionType = 'EARNED_PURCHASE',
    reason?: string,
    orderId?: string
  ): Promise<AddPointsResult> {
    if (points <= 0) {
      throw new Error('Reward points to credit must be a positive integer greater than zero.');
    }

    const profile = await ltvCalculatorService.getCustomerProfile(merchantId, customerId);
    if (!profile) {
      throw new Error(`Customer CRM profile "${customerId}" not found.`);
    }

    profile.rewardPoints += Math.round(points);

    const transactionLog: RewardTransactionDTO = {
      id: `rw-tx-${Date.now()}`,
      merchantId,
      customerId,
      pointsChanged: Math.round(points),
      actionType,
      referenceOrderId: orderId || null,
      note: reason || `Credited ${points} reward points (${actionType}).`,
      createdAt: new Date().toISOString(),
    };

    const logs = this.rewardLogsStore.get(customerId) || [];
    logs.unshift(transactionLog);
    this.rewardLogsStore.set(customerId, logs);

    return {
      success: true,
      newBalance: profile.rewardPoints,
      pointsAdded: Math.round(points),
      transactionLog,
      message: `Credited ${points} reward points successfully. New balance: ${profile.rewardPoints} points.`,
    };
  }

  /**
   * Validates active points balance, calculates equivalent BDT discount, deducts points, and records redemption log.
   */
  public async redeemRewardPoints(
    merchantId: string,
    customerId: string,
    pointsToRedeem: number,
    orderId?: string
  ): Promise<RedeemPointsResult> {
    if (pointsToRedeem <= 0) {
      throw new Error('Points to redeem must be a positive integer greater than zero.');
    }

    const profile = await ltvCalculatorService.getCustomerProfile(merchantId, customerId);
    if (!profile) {
      throw new Error(`Customer CRM profile "${customerId}" not found.`);
    }

    if (profile.rewardPoints < pointsToRedeem) {
      throw new Error(
        `Insufficient reward points balance. Current Balance: ${profile.rewardPoints} points, Requested: ${pointsToRedeem} points.`
      );
    }

    const discountBDT = Math.round(pointsToRedeem * DEFAULT_LOYALTY_CONFIG.pointValueBDT * 100) / 100;
    profile.rewardPoints -= Math.round(pointsToRedeem);

    const transactionLog: RewardTransactionDTO = {
      id: `rw-tx-${Date.now()}`,
      merchantId,
      customerId,
      pointsChanged: -Math.round(pointsToRedeem),
      actionType: 'REDEEMED_ORDER',
      referenceOrderId: orderId || null,
      note: `Redeemed ${pointsToRedeem} reward points for ৳${discountBDT} BDT discount.`,
      createdAt: new Date().toISOString(),
    };

    const logs = this.rewardLogsStore.get(customerId) || [];
    logs.unshift(transactionLog);
    this.rewardLogsStore.set(customerId, logs);

    return {
      success: true,
      newBalance: profile.rewardPoints,
      pointsRedeemed: Math.round(pointsToRedeem),
      discountBDT,
      transactionLog,
      message: `Redeemed ${pointsToRedeem} points for ৳${discountBDT} discount. New balance: ${profile.rewardPoints} points.`,
    };
  }

  /**
   * Fetches customer reward transaction history audit logs.
   */
  public async getCustomerRewardHistory(customerId: string): Promise<RewardTransactionDTO[]> {
    return this.rewardLogsStore.get(customerId) || [];
  }

  private seedDemoRewardLogs(): void {
    const demoCustId = 'cust-101';
    this.rewardLogsStore.set(demoCustId, [
      {
        id: 'rw-tx-101',
        merchantId: 'merch-techstore',
        customerId: demoCustId,
        pointsChanged: 245,
        actionType: 'EARNED_PURCHASE',
        referenceOrderId: 'ORD-20260801-9901',
        note: 'Earned 245 reward points from Order #ORD-20260801-9901',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ]);
  }
}

export const rewardService = RewardService.getInstance();
