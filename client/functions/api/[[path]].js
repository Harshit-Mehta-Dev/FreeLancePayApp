export async function onRequest(context) {
  const url = new URL(context.request.url);
  // Reconstruct the URL for the backend
  const targetUrl = new URL(url.pathname + url.search, 'https://freelance-pay-api.cyber-freelance.workers.dev');
  
  // Clone the request
  const request = new Request(targetUrl, context.request);
  
  // We need to set the Origin header to match what the backend expects if necessary,
  // but it should be fine. We can set it to the frontend's origin just in case.
  request.headers.set('Origin', 'https://freelance-pay-cloud.pages.dev');

  // Send the request to the worker
  const response = await fetch(request);
  
  // Create a new response to modify headers if needed, but we can just return it
  // Pages functions automatically forward the response headers.
  return response;
}
