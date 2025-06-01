

export const index = 6;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/(authed)/proposals/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/6.fXb0SyeW.js","_app/immutable/chunks/CAjZ-n2Z.js","_app/immutable/chunks/BPSGK7qZ.js","_app/immutable/chunks/DAZsf_oA.js"];
export const stylesheets = [];
export const fonts = [];
