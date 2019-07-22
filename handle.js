async function handle(event) {
  async function retrieveAudioLoc() {
    let data = await fetch(`https://luminary-283021.s3.amazonaws.com/meta.json`)
    data = await data.json()
    /** 
     * data.audio_url will return a URL with a hostname defined in the resolveTargets
     * object below
     */ 
    return data.audio_url
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
  let cacheKey = new URL(await retrieveAudioLoc())

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
