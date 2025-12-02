/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

const getUrlPath = (uri: string) => {
    const url = new URL(uri)
    return url.pathname
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const path = getUrlPath(request.url)
		if (request.method == "GET") {
			let file = await env.STORAGE_BUCKET.get(path)
			if (file == null) {
				return new Response(null, { status: 404 })
			} else {
				return new Response(file!.body)
			}
		}
		if (request.method == "PUT") {
			let file = await env.STORAGE_BUCKET.put(path, request.body)
			if (file == null) {
				return new Response(null, { status: 500 })
			} else {
				return new Response(null, { status: 201 })
			}
		}
		return new Response(`Unsupported method: ${request.method}`, { status: 400 });
	},
} satisfies ExportedHandler<Env>;
