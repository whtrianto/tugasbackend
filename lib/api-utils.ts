import { NextResponse } from 'next/server';

export function jsonResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(
  message: string,
  status = 400,
  details?: Record<string, unknown>
) {
  return NextResponse.json(
    { success: false, error: message, ...details },
    { status }
  );
}

export function parseBody<T>(body: string): T | null {
  try {
    return JSON.parse(body) as T;
  } catch {
    return null;
  }
}
