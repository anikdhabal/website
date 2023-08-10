import { useRuntimeConfig } from '../config/app'

export async function get() {
  const config = useRuntimeConfig()
  try {
    const data = `User-agent: *\nAllow: /\nUser-agent: *\nDisallow: /rss.xml\nSitemap: ${config.public.baseUrl}/sitemap.xml`
    return new Response(data.toString(), {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  } catch (e) {
    console.error(e)
    return new Response(null, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  }
}
