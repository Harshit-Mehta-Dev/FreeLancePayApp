export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Build the target URL pointing to the backend Worker
  const targetUrl = new URL(
    url.pathname + url.search,
    'https://freelance-pay-api.cyber-freelance.workers.dev'
  );

  // Clone headers and set correct Origin for backend CORS check
  const headers = new Headers(request.headers);
  headers.set('Origin', 'https://freelance-pay-cloud.pages.dev');
  headers.set('X-Forwarded-Host', url.host);

  // Forward the request, including body for POST/PUT/PATCH
  const proxyRequest = new Request(targetUrl.toString(), {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    redirect: 'follow',
  });

  try {
    const response = await fetch(proxyRequest);

    // Forward all response headers back to the browser
    const responseHeaders = new Headers(response.headers);
    
    // Ensure cookies work cross-domain via the proxy
    responseHeaders.delete('Access-Control-Allow-Origin');
    responseHeaders.set('Access-Control-Allow-Origin', url.origin);
    responseHeaders.set('Access-Control-Allow-Credentials', 'true');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Proxy error', details: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
