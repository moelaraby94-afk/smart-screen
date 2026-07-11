import { apiFetch, type ApiFetchInit } from '@/features/auth/session';

export async function login(email: string, password: string): Promise<Response> {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    omitAuth: true,
  } as ApiFetchInit);
}

export async function devLogin(): Promise<Response> {
  return apiFetch('/auth/dev-login', {
    method: 'POST',
    omitAuth: true,
  } as ApiFetchInit);
}

export async function registerStart(data: Record<string, unknown>): Promise<Response> {
  return apiFetch('/auth/register/start', {
    method: 'POST',
    body: JSON.stringify(data),
  } as ApiFetchInit);
}

export async function registerVerify(email: string, code: string): Promise<Response> {
  return apiFetch('/auth/register/verify', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  } as ApiFetchInit);
}

export async function registerResend(email: string): Promise<Response> {
  return apiFetch('/auth/register/resend', {
    method: 'POST',
    body: JSON.stringify({ email }),
  } as ApiFetchInit);
}

export async function forgotPassword(email: string): Promise<Response> {
  return apiFetch('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  } as ApiFetchInit);
}

export async function resetPassword(data: Record<string, unknown>): Promise<Response> {
  return apiFetch('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  } as ApiFetchInit);
}
