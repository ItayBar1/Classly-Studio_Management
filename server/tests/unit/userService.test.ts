import { UserService } from '../../src/services/userService';
import { supabaseAdmin, queueQueryResponse, resetSupabaseMock } from '../mocks/supabaseAdmin';

jest.mock('../../src/config/supabase', () => require('../mocks/supabaseAdmin'));

describe('UserService.validateStudioSerial', () => {
  beforeEach(() => {
    resetSupabaseMock();
  });

  it('returns studio when serial exists', async () => {
    const studio = { id: 'studio-1', name: 'Main Studio' };
    queueQueryResponse({ data: studio, error: null });

    const result = await UserService.validateStudioSerial('ABC-123');

    expect(supabaseAdmin.from).toHaveBeenCalledWith('studios');
    expect(result).toEqual(studio);
  });

  it('returns null when serial is not found', async () => {
    queueQueryResponse({ data: null, error: { code: 'PGRST116', message: 'No rows found' } });

    const result = await UserService.validateStudioSerial('MISSING');

    expect(result).toBeNull();
  });

  it('throws on unexpected errors', async () => {
    queueQueryResponse({ data: null, error: { code: 'OTHER', message: 'Failure' } });

    await expect(UserService.validateStudioSerial('ERR')).rejects.toThrow(
      'Error validating studio serial: Failure'
    );
  });
});
