import { validateMerchantApiAccess } from '../../../../../../../lib/merchant-api-guard';
import { customerNotesService } from '../../../../../../../features/customer-crm/services/customer-notes.service';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await validateMerchantApiAccess(request);
    if (!auth.authorized || !auth.merchantId) {
      return auth.response;
    }

    const customerId = params.id;
    const notes = await customerNotesService.getCustomerNotes(auth.merchantId, customerId);

    return new Response(
      JSON.stringify({ success: true, data: notes }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to fetch customer notes.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await validateMerchantApiAccess(request);
    if (!auth.authorized || !auth.merchantId) {
      return auth.response;
    }

    const customerId = params.id;
    const body = await request.json();
    const { noteText, isImportant = false } = body;

    if (!noteText || !noteText.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Parameter "noteText" is required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const createdBy = auth.user?.name || auth.user?.id || 'Staff Admin';
    const newNote = await customerNotesService.addNote(
      auth.merchantId,
      customerId,
      createdBy,
      noteText,
      Boolean(isImportant)
    );

    return new Response(
      JSON.stringify({ success: true, message: 'Internal customer note added.', data: newNote }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to add customer note.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
