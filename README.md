# audio-json-worker
> Handle range requests for third party URLs on Clouflare Workers

While Cloudflare Workers supports range requests, two major challenges arise when Workers tries to store a sliceable file in cache:

- The Cache API does not support range requests or responses with a content-length greater than 50MB. While it’s possible to use Transfer-Encoding: chunked to store a file that is up to 500MB, chunked responses are interpreted by the Cache API as un-sliceable. This is because the origin does not provide a content-length
- The alternative to the Cache API is to define caching behavior using the cf options object. While this as expected for first-party URLs, third-party URLs requested via Cloudflare Workers are not eligible for slicing.

This Worker solves these two problems.
