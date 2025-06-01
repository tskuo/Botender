import "./index2.js";
const handle = async ({ event, resolve }) => {
  if (event.url.pathname.startsWith("/.well-known/appspecific/com.chrome.devtools")) {
    return new Response(null, { status: 204 });
  }
  const response = await resolve(event);
  return response;
};
export {
  handle
};
