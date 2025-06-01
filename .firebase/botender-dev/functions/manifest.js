export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.png"]),
	mimeTypes: {".png":"image/png"},
	_: {
		client: {start:"_app/immutable/entry/start.C8AIb0nK.js",app:"_app/immutable/entry/app.DZ0ipC5Y.js",imports:["_app/immutable/entry/start.C8AIb0nK.js","_app/immutable/chunks/aw79YEyW.js","_app/immutable/chunks/1faxBNgX.js","_app/immutable/chunks/BPSGK7qZ.js","_app/immutable/entry/app.DZ0ipC5Y.js","_app/immutable/chunks/BPSGK7qZ.js","_app/immutable/chunks/DyL54UEi.js","_app/immutable/chunks/CAjZ-n2Z.js","_app/immutable/chunks/1faxBNgX.js","_app/immutable/chunks/CrV9SW7a.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js')),
			__memo(() => import('./nodes/5.js')),
			__memo(() => import('./nodes/6.js')),
			__memo(() => import('./nodes/7.js'))
		],
		routes: [
			{
				id: "/(authed)",
				pattern: /^\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/api/bot",
				pattern: /^\/api\/bot\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/bot/_server.ts.js'))
			},
			{
				id: "/api/tasks",
				pattern: /^\/api\/tasks\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/tasks/_server.ts.js'))
			},
			{
				id: "/(authed)/cases",
				pattern: /^\/cases\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/(authed)/playground",
				pattern: /^\/playground\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/(authed)/proposals",
				pattern: /^\/proposals\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/(authed)/tasks",
				pattern: /^\/tasks\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 7 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
