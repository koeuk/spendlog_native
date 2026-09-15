import { AxiosError, AxiosHeaders } from 'axios';

import { apiErrorMessage, fieldErrors, NETWORK_ERROR_MESSAGE, onUnauthorized, api, setAuthToken } from '../client';

function axiosError(status: number | undefined, data?: unknown, url = '/expenses'): AxiosError {
  const config = { url, headers: new AxiosHeaders() };
  const response = status === undefined ? undefined : { status, data, statusText: '', headers: {}, config };
  return new AxiosError('failed', status ? 'ERR_BAD_REQUEST' : 'ERR_NETWORK', config, undefined, response as never);
}

describe('apiErrorMessage', () => {
  it('prefers the first validation error, then the message, then the fallback', () => {
    expect(apiErrorMessage(axiosError(422, { message: 'The given data was invalid.', errors: { price: ['Too much.'] } }))).toBe('Too much.');
    expect(apiErrorMessage(axiosError(409, { message: '"Food" is still in use and cannot be deleted.' }))).toBe(
      '"Food" is still in use and cannot be deleted.',
    );
    expect(apiErrorMessage(axiosError(500, 'html'))).toBe('Something went wrong.');
    expect(apiErrorMessage(new Error('boom'), 'Nope')).toBe('Nope');
  });

  it('names the network when there is no response at all', () => {
    expect(apiErrorMessage(axiosError(undefined))).toBe(NETWORK_ERROR_MESSAGE);
  });
});

describe('fieldErrors', () => {
  it('keys the first message by field', () => {
    expect(fieldErrors(axiosError(422, { errors: { email: ['Taken.', 'Bad.'], name: ['Required.'] } }))).toEqual({
      email: 'Taken.',
      name: 'Required.',
    });
    expect(fieldErrors(axiosError(500))).toEqual({});
  });
});

describe('401 handling', () => {
  const rejected = (error: AxiosError) => {
    const handler = (api.interceptors.response as unknown as { handlers: { rejected: (e: unknown) => Promise<never> }[] }).handlers[0];
    return handler.rejected(error);
  };

  it('signs out on a 401 from a protected path only', async () => {
    const listener = jest.fn();
    const off = onUnauthorized(listener);
    setAuthToken('abc');

    await expect(rejected(axiosError(401, {}, '/login'))).rejects.toBeDefined();
    expect(listener).not.toHaveBeenCalled();

    await expect(rejected(axiosError(401, {}, '/expenses?page=2'))).rejects.toBeDefined();
    expect(listener).toHaveBeenCalledTimes(1);

    await expect(rejected(axiosError(403, {}, '/categories'))).rejects.toBeDefined();
    expect(listener).toHaveBeenCalledTimes(1);
    off();
  });
});
