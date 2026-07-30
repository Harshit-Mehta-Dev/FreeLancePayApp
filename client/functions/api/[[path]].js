export async function onRequest(context) {
  const url = new URL(context.request.url);

  // Build the backend target URL
  const targetUrl = new URL(
    url.pathname + url.search,
    'https://freelance-pay-api.cyber-freelance.workers.dev'
  );

  // Copy headers and set correct Origin for backend CORS check
  const headers = new Headers(context.request.headers);
  headers.set('Origin', 'https://freelance-pay-cloud.pages.dev');

  // Build the proxied request, including body for POST/PUT/PATCH
  const init = {
    method: context.request.method,
    headers,
  };

  if (!['GET', 'HEAD'].includes(context.request.method)) {
    init.body = context.request.body;
  }

  try {
    return await fetch(new Request(targetUrl.toString(), init));
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Proxy error', details: err.message }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
