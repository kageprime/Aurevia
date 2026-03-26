export const OFFLINE_ERROR_MESSAGE =
  'Backend is offline. Check the API URL and try again.';

export const SESSION_EXPIRED_ERROR_MESSAGE =
  'Your session expired. Sign in again to continue.';

export function isNetworkFailure(error: unknown) {
  return error instanceof TypeError || error instanceof DOMException;
}

export function isOfflineError(error: unknown) {
  return error instanceof Error && error.message === OFFLINE_ERROR_MESSAGE;
}

export function isSessionExpiredError(error: unknown) {
  return error instanceof Error && error.message === SESSION_EXPIRED_ERROR_MESSAGE;
}

export function getFirstFormErrorMessage(error: unknown) {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }

  if (!('formErrors' in error)) {
    return undefined;
  }

  const formErrors = (error as { formErrors?: unknown }).formErrors;
  if (!Array.isArray(formErrors) || typeof formErrors[0] !== 'string') {
    return undefined;
  }

  return formErrors[0];
}

export function getErrorMessage(error: unknown) {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return undefined;
}

export async function fetchJson(path: RequestInfo | URL, init: RequestInit = {}) {
  try {
    return await fetch(path, init);
  } catch (error) {
    if (isNetworkFailure(error)) {
      throw new Error(OFFLINE_ERROR_MESSAGE);
    }

    throw error;
  }
}

export async function readJsonResponse<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}