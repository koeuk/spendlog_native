import { api } from '../client';
import { login, me, register } from '../endpoints/auth';
import { getBranding } from '../endpoints/branding';

describe('malformed API responses', () => {
  afterEach(() => jest.restoreAllMocks());

  it.each([
    ['login', () => login({ email: 'dara@example.com', password: 'secret', device_name: 'test' })],
    ['register', () => register({ name: 'Dara', email: 'dara@example.com', password: 'secret', password_confirmation: 'secret', device_name: 'test' })],
    ['me', () => me()],
  ])('%s rejects HTML instead of returning undefined data', async (_name, request) => {
    jest.spyOn(api, _name === 'me' ? 'get' : 'post').mockResolvedValue({ data: '<!doctype html>' } as never);
    await expect(request()).rejects.toThrow('Invalid response');
  });

  it('uses stock branding when the configured host returns a non-API payload', async () => {
    jest.spyOn(api, 'get').mockResolvedValue({ data: '<!doctype html>' } as never);
    await expect(getBranding()).resolves.toMatchObject({ name: 'SpendLog', branded: false });
  });
});
