# Modeltest Cloudflare Worker

This Worker serves the public model-test portal at
`modeltest.mahendrakumarsijapati.com.np` from the protected model-test files
hosted by GitHub Pages. The subdomain remains in the browser address bar, so
search engines can index the portal URL.

The portal is searchable, but visitors must still enter access code `2059`
before opening the technical tests. The technical question pages remain
excluded from indexing.

## Deploy

1. Add `modeltest.mahendrakumarsijapati.com.np` to the same Cloudflare zone as
   `mahendrakumarsijapati.com.np`.
2. Remove any stale `A`, `AAAA`, or `CNAME` record for `modeltest`.
3. Deploy this Worker from this directory:

   ```text
   npx wrangler login
   npx wrangler deploy
   ```

4. Confirm the custom domain route is attached to the Worker. Cloudflare will
   provision the HTTPS certificate for the subdomain.
5. Test:

   ```text
   https://modeltest.mahendrakumarsijapati.com.np/
   ```

6. Submit the sitemap in Google Search Console:

   `https://modeltest.mahendrakumarsijapati.com.np/sitemap.xml`

The Worker proxies the portal and its assets while preserving the subdomain.
Direct technical-test URLs still redirect to the portal in the browser unless
the access code was accepted in the current session.
