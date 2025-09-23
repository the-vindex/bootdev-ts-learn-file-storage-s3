export function respondWithJSON<T>(status: number, payload: T): Response {
  const body = JSON.stringify(payload);
  return new Response(body, {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
