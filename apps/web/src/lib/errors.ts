/** Human-readable message for anything thrown (MediaPipe sometimes throws non-Errors). */
export function errorMessage(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  if (typeof e === 'string' && e) return e;
  if (e && typeof e === 'object' && 'type' in e) return `sự kiện “${String((e as Event).type)}” (có thể do thiếu file AI khi offline)`;
  return 'lỗi không rõ';
}
