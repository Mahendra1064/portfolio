const ORIGIN = 'https://www.mahendrakumarsijapati.com.np';
const PUBLIC_HOST = 'modeltest.mahendrakumarsijapati.com.np';

function originPath(pathname) {
    if (pathname === '/' || pathname === '') return '/model-test/modeltest-portal.html';
    if (pathname === '/robots.txt') return '/model-test/robots.txt';
    if (pathname === '/sitemap.xml') return '/model-test/sitemap.xml';
    return '/model-test' + pathname;
}

export default {
    async fetch(request) {
        const url = new URL(request.url);

        if (url.hostname !== PUBLIC_HOST) {
            return new Response('Not found', { status: 404 });
        }

        const target = new URL(ORIGIN);
        target.pathname = originPath(url.pathname);
        target.search = url.search;

        const response = await fetch(target, request);
        const headers = new Headers(response.headers);
        headers.set('Content-Security-Policy', "frame-ancestors 'self'");

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers
        });
    }
};
