import { CustomerNoteDTO } from '../../../types/customer-crm.types';

/**
 * Enterprise Service for Managing Internal Staff Customer Notes & Profile Audit History.
 */
export class CustomerNotesService {
  private static instance: CustomerNotesService | null = null;

  // In-memory store: Map<customerId, CustomerNoteDTO[]>
  private notesStore: Map<string, CustomerNoteDTO[]> = new Map();

  private constructor() {
    this.seedDemoNotes();
  }

  public static getInstance(): CustomerNotesService {
    if (!CustomerNotesService.instance) {
      CustomerNotesService.instance = new CustomerNotesService();
    }
    return CustomerNotesService.instance;
  }

  /**
   * Adds an internal staff note attached to a customer profile.
   */
  public async addNote(
    merchantId: string,
    customerId: string,
    createdBy: string = 'Staff Admin',
    noteText: string,
    isImportant: boolean = false
  ): Promise<CustomerNoteDTO> {
    if (!noteText || !noteText.trim()) {
      throw new Error('Note text cannot be empty.');
    }

    const noteId = `note-${Date.now()}`;
    const newNote: CustomerNoteDTO = {
      id: noteId,
      merchantId,
      customerId,
      createdBy,
      noteText: noteText.trim(),
      isImportant,
      createdAt: new Date().toISOString(),
    };

    const notes = this.notesStore.get(customerId) || [];
    notes.unshift(newNote);
    this.notesStore.set(customerId, notes);

    return newNote;
  }

  /**
   * Fetches all internal staff notes for a customer profile.
   */
  public async getCustomerNotes(
    merchantId: string,
    customerId: string
  ): Promise<CustomerNoteDTO[]> {
    return this.notesStore.get(customerId) || [];
  }

  /**
   * Deletes a customer note by ID.
   */
  public async deleteNote(merchantId: string, noteId: string): Promise<boolean> {
    for (const [custId, notes] of this.notesStore.entries()) {
      const filtered = notes.filter((n) => n.id !== noteId);
      if (filtered.length !== notes.length) {
        this.notesStore.set(custId, filtered);
        return true;
      }
    }
    return false;
  }

  private seedDemoNotes(): void {
    const demoCustId = 'cust-101';
    this.notesStore.set(demoCustId, [
      {
        id: 'note-101',
        merchantId: 'merch-techstore',
        customerId: demoCustId,
        createdBy: 'Manager Rahim',
        noteText: 'Prefers Steadfast Courier for Banani deliveries. High value repeat customer.',
        isImportant: true,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ]);
  }
}

export const customerNotesService = CustomerNotesService.getInstance();
