const stub = new URL('./three.full-stub.mjs', import.meta.url).href;
export async function resolve(specifier, context, next) {
  if (specifier === 'three') return { url: stub, shortCircuit: true };
  return next(specifier, context);
}
