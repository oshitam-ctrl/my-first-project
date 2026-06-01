// ESM resolve hook: redirect the bare 'three' specifier to the local stub,
// mirroring what the browser importmap does (but with a headless stub).
const stub = new URL('./three.stub.mjs', import.meta.url).href;
export async function resolve(specifier, context, next) {
  if (specifier === 'three' || specifier.endsWith('vendor/three.module.js')) return { url: stub, shortCircuit: true };
  return next(specifier, context);
}
