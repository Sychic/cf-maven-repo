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
import jwt from '@tsndr/cloudflare-worker-jwt'

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
			const authHeader = request.headers.get("authorization")
			if (!authHeader) {
				console.log("Missing auth header")
				return new Response(null, { status: 401 })
			}
			const [authType, authValue] = authHeader.split(" ")
			if (authType != "Basic") return new Response(null, { status: 401 });
			const [username, pass] = atob(authValue).split(":")
			console.log(`Authorization { "username": ${username}, "password": ${pass}}`)

			const verifiedToken = await jwt.verify(pass, env.SECRET)
			if (!verifiedToken) return new Response(null, { status: 401 });
			let { payload }: any = verifiedToken

			console.log(`Payload ${payload}`)
			if (username != payload.username) return new Response("Username does not match!", { status: 401 })
			if (!payload.permissions.includes("write")) return new Response("Missing write permissions", { status: 401 })
			
			let file = await env.STORAGE_BUCKET.put(path, request.body)
			if (file == null) {
				console.log("Failed to insert file")
				return new Response(null, { status: 500 })
			} else {
				console.log("Successfully updated file")
				return new Response(null, { status: 201 })
			}
		}
		return new Response(`Unsupported method: ${request.method}`, { status: 400 });
	},
} satisfies ExportedHandler<Env>;
