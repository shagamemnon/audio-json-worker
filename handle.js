/**
 * @global - AUDIO_LOCATION_URL_PROP the property defined in the
 * JSON file that indicates the podcast location.
 * e.g. { 'name': 'frank', 'audio_url': 'https://mymp3s.com/audio.mp3' }
 */
const AUDIO_LOCATION_URL_PROP = 'audio_url'

/**
 * We can make use of the Workers machine memory cache here.
 * This in-memory cache does not provide a guarantee that an
 * object will be cached in memory, but high volume Worker nodes
 * will see measurable performance improvements
 */
let memCache = new Map()

async function handle (event) {
  async function getLocationUrl (url) {
    let data = await fetch(url)
    data = await data.json()
    /**
     * data[AUDIO_LOCATION_URL] will return a URL with a hostname defined in the resolveTargets
     * object below
     */
    return data[AUDIO_LOCATION_URL_PROP]
  }

  async function getResourceUrl (url) {
    /* Check the in-memory cache for the resource URL */
    if (memCache.has(url)) return memCache.get(url)

    /* Also cache the 301/302 response in cf-cache */
    let response = await fetch(url, {
      method: 'HEAD',
      cf: {
        cacheTtl: 604800
      }
    })

    let location = response.headers.get('Location')
    if (response.status > 299 && response.status < 310 && location) {
      memCache.put(url, location)
      return location
    }
    return url
  }

  /**
   * Map the hostname returned my retrieveAudioLoc to a corresponding
   * DNS target in the luminarypodcasts.com zone.
   */
  let resolveTargets = {
    'www.megaphone.fm': 'megaphone.infra.luminarypodcasts.com',
    'us-west-2.s3.amazonaws.com': 'aws-us-west.luminarypodcasts.com',
    'luminary-283021.s3.amazonaws.com': 'frank.infra.luminarypodcasts.com'
  }

  /* Set the cache key to the full URL from the JSON payload */
  let location = await getLocationUrl(`https://luminary-283021.s3.amazonaws.com/meta.json`)
  let cacheKey = await getResourceUrl(location)
  cacheKey = new URL(cacheKey)

  /**
   * JavaScript isn't so bad sometimes :)
   * Reassign the cache key hostname to the matching property name, a first-
   * party host; fallback to the host defined in retrieveAudioLoc().
   */
  cacheKey.hostname = resolveTargets[cacheKey.hostname] || cacheKey.hostname

  /**
   * Important! Pass the original, unmodified request object as the second
   * parameter to ensure the client's browser can dictate the response parameters
   */
  let response = await fetch(cacheKey, event.request)
  response = new Response(response.body, response)
  response.headers.set('X-My-Name', 'frank')
  return response
}
