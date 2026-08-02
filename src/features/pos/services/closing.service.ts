import { CashRegisterSummary, POSSessionDTO } from '../../../types/pos.types';
import { checkoutService } from './checkout.service';
import { refundService } from './refund.service';

export interface CloseSessionResult {
  success: boolean;
  session: POSSessionDTO;
  zReport: CashRegisterSummary;
  discrepancyStatus: 'BALANCED' | 'OVERAGE' | 'SHORTAGE';
  message: string;
}

/**
 * Enterprise Service for POS Daily Register Closing, Cash Reconciliation, and Z-Report Generation.
 */
export class ClosingService {
  private static instance: ClosingService | null = null;
  private sessionsStore: Map<string, POSSessionDTO[]> = new Map();

  private constructor() {
    this.seedDemoSessions();
  }

  public static getInstance(): ClosingService {
    if (!ClosingService.instance) {
      ClosingService.instance = new ClosingService();
    }
    return ClosingService.instance;
  }

  /**
   * Opens a new Cash Register Session for a Cashier.
   */
  public async startRegisterSession(
    merchantId: string,
    registerId: string,
    cashierId: string,
    openingBalance: number,
    cashierName: string = 'Cashier'
  ): Promise<POSSessionDTO> {
    const existingSessions = this.sessionsStore.get(merchantId) || [];
    const activeSession = existingSessions.find(
      (s) => s.registerId === registerId && s.status === 'OPEN'
    );

    if (activeSession) {
      throw new Error(
        `Register is already OPEN (Session #${activeSession.id}) by ${activeSession.cashierName || 'another cashier'}. Close active session first.`
      );
    }

    const sessionId = `session-${Date.now()}`;
    const newSession: POSSessionDTO = {
      id: sessionId,
      registerId,
      cashierId,
      cashierName,
      openingBalance: Math.round(openingBalance * 100) / 100,
      closingBalance: null,
      expectedCash: null,
      actualCash: null,
      cashDifference: null,
      status: 'OPEN',
      openedAt: new Date().toISOString(),
      closedAt: null,
    };

    existingSessions.unshift(newSession);
    this.sessionsStore.set(merchantId, existingSessions);

    return newSession;
  }

  /**
   * Fetches currently active open session for a register.
   */
  public async getActiveSession(
    merchantId: string,
    registerId: string
  ): Promise<POSSessionDTO | null> {
    const list = this.sessionsStore.get(merchantId) || [];
    return list.find((s) => s.registerId === registerId && s.status === 'OPEN') || null;
  }

  /**
   * Closes a cash register session, calculates expected cash vs actual cash, and generates Z-Report.
   */
  public async closeRegisterSession(
    merchantId: string,
    sessionId: string,
    actualCash: number,
    notes?: string
  ): Promise<CloseSessionResult> {
    const sessions = this.sessionsStore.get(merchantId) || [];
    const sessionIndex = sessions.findIndex((s) => s.id === sessionId);

    if (sessionIndex === -1) {
      throw new Error(`POS Session "${sessionId}" not found.`);
    }

    const session = sessions[sessionIndex];
    if (session.status === 'CLOSED') {
      throw new Error(`POS Session "${sessionId}" is already CLOSED.`);
    }

    // 1. Fetch Session Orders & Payments
    const sessionOrders = await checkoutService.getOrdersBySession(merchantId, sessionId);
    const refunds = await refundService.getRefundsHistory(merchantId);

    let totalCashSales = 0;
    let totalDigitalSales = 0;
    let totalDueSales = 0;

    for (const order of sessionOrders) {
      totalDueSales += order.dueAmount;

      if (order.payments && order.payments.length > 0) {
        for (const payment of order.payments) {
          if (payment.paymentMethod === 'CASH') {
            totalCashSales += payment.amount;
          } else {
            totalDigitalSales += payment.amount;
          }
        }
      }
    }

    // 2. Calculate Refunds in cash
    const totalRefunds = refunds.reduce((sum, r) => sum + r.refundedAmount, 0);

    totalCashSales = Math.round(totalCashSales * 100) / 100;
    totalDigitalSales = Math.round(totalDigitalSales * 100) / 100;
    totalDueSales = Math.round(totalDueSales * 100) / 100;

    // 3. Compute Expected Cash = Opening Balance + Cash Sales - Refunds
    const openingBalance = session.openingBalance || 0;
    const expectedCashInDrawer = Math.round((openingBalance + totalCashSales - totalRefunds) * 100) / 100;
    const cleanActualCash = Math.round(actualCash * 100) / 100;
    const cashDifference = Math.round((cleanActualCash - expectedCashInDrawer) * 100) / 100;

    let discrepancyStatus: 'BALANCED' | 'OVERAGE' | 'SHORTAGE' = 'BALANCED';
    if (cashDifference > 0) {
      discrepancyStatus = 'OVERAGE';
    } else if (cashDifference < 0) {
      discrepancyStatus = 'SHORTAGE';
    }

    // 4. Update Session Record
    const closedAt = new Date().toISOString();
    const updatedSession: POSSessionDTO = {
      ...session,
      closingBalance: cleanActualCash,
      expectedCash: expectedCashInDrawer,
      actualCash: cleanActualCash,
      cashDifference,
      status: 'CLOSED',
      closedAt,
    };

    sessions[sessionIndex] = updatedSession;
    this.sessionsStore.set(merchantId, sessions);

    // 5. Generate Z-Report
    const zReport: CashRegisterSummary = {
      sessionId,
      registerId: session.registerId,
      registerName: session.register?.name || 'Counter Register 01',
      openedAt: session.openedAt,
      cashierName: session.cashierName || 'Cashier',
      openingBalance,
      totalCashSales,
      totalDigitalSales,
      totalDueSales,
      totalRefunds,
      expectedCashInDrawer,
      actualCashInDrawer: cleanActualCash,
      cashDifference,
      totalTransactions: sessionOrders.length,
      status: 'CLOSED',
    };

    let summaryMessage = `Session #${sessionId} closed. Register Balanced.`;
    if (discrepancyStatus === 'SHORTAGE') {
      summaryMessage = `Session closed with Cash Shortage of ৳${Math.abs(cashDifference)}.`;
    } else if (discrepancyStatus === 'OVERAGE') {
      summaryMessage = `Session closed with Cash Overage of ৳${cashDifference}.`;
    }

    return {
      success: true,
      session: updatedSession,
      zReport,
      discrepancyStatus,
      message: summaryMessage,
    };
  }

  /**
   * Generates a Z-Report summary on demand for a session.
   */
  public async getSessionZReport(
    merchantId: string,
    sessionId: string
  ): Promise<CashRegisterSummary> {
    const sessions = this.sessionsStore.get(merchantId) || [];
    const session = sessions.find((s) => s.id === sessionId);

    if (!session) {
      throw new Error(`POS Session "${sessionId}" not found.`);
    }

    const sessionOrders = await checkoutService.getOrdersBySession(merchantId, sessionId);
    const refunds = await refundService.getRefundsHistory(merchantId);

    let totalCashSales = 0;
    let totalDigitalSales = 0;
    let totalDueSales = 0;

    for (const order of sessionOrders) {
      totalDueSales += order.dueAmount;
      if (order.payments) {
        for (const p of order.payments) {
          if (p.paymentMethod === 'CASH') totalCashSales += p.amount;
          else totalDigitalSales += p.amount;
        }
      }
    }

    const totalRefunds = refunds.reduce((sum, r) => sum + r.refundedAmount, 0);
    const expectedCashInDrawer =
      Math.round((session.openingBalance + totalCashSales - totalRefunds) * 100) / 100;
    const actualCashInDrawer = session.actualCash ?? expectedCashInDrawer;
    const cashDifference = session.cashDifference ?? 0;

    return {
      sessionId,
      registerId: session.registerId,
      registerName: 'Counter Register 01',
      openedAt: session.openedAt,
      cashierName: session.cashierName || 'Cashier',
      openingBalance: session.openingBalance,
      totalCashSales: Math.round(totalCashSales * 100) / 100,
      totalDigitalSales: Math.round(totalDigitalSales * 100) / 100,
      totalDueSales: Math.round(totalDueSales * 100) / 100,
      totalRefunds: Math.round(totalRefunds * 100) / 100,
      expectedCashInDrawer,
      actualCashInDrawer,
      cashDifference,
      totalTransactions: sessionOrders.length,
      status: session.status,
    };
  }

  private seedDemoSessions(): void {
    const demoId = 'merch-techstore';

    this.sessionsStore.set(demoId, [
      {
        id: 'session-demo-01',
        registerId: 'reg-counter-01',
        cashierId: 'cashier-demo-01',
        cashierName: 'Rahim Ahmed',
        openingBalance: 5000,
        closingBalance: null,
        expectedCash: null,
        actualCash: null,
        cashDifference: null,
        status: 'OPEN',
        openedAt: new Date(Date.now() - 7200000).toISOString(),
        closedAt: null,
      },
    ]);
  }
}

export const closingService = ClosingService.getInstance();
