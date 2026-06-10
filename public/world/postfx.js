// postfx.js — ポストプロセスチェーン（high品質のみ）。
// Render → SSAO → 控えめBloom → Output(ACES+sRGB) → グレード。
// グレード = ビネット + フィルムグレイン + ティール&オレンジ + 彩度-12%（映画的な統一感）

import { EffectComposer } from './vendor/addons/postprocessing/EffectComposer.js';
import { RenderPass } from './vendor/addons/postprocessing/RenderPass.js';
import { ShaderPass } from './vendor/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from './vendor/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from './vendor/addons/postprocessing/OutputPass.js';
import { SSAOPass } from './vendor/addons/postprocessing/SSAOPass.js';

const GradeShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 } },
  vertexShader: 'varying vec2 vUv;\nvoid main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `
uniform sampler2D tDiffuse; uniform float uTime; varying vec2 vUv;
void main(){
  vec4 c = texture2D(tDiffuse, vUv);
  float lum = dot(c.rgb, vec3(.299,.587,.114));
  c.rgb = mix(c.rgb, c.rgb * vec3(1.05,1.0,0.93), smoothstep(0.45,1.0,lum)*0.55); // ハイライトを暖色へ
  c.rgb = mix(c.rgb, c.rgb * vec3(0.93,1.0,1.07), (1.0-smoothstep(0.0,0.5,lum))*0.45); // シャドウを青緑へ
  float lum2 = dot(c.rgb, vec3(.299,.587,.114));
  c.rgb = mix(vec3(lum2), c.rgb, 0.88); // 彩度-12%（ノスタルジック）
  float d = distance(vUv, vec2(0.5));
  c.rgb *= 1.0 - smoothstep(0.45, 0.88, d) * 0.3; // ビネット
  float g = fract(sin(dot(vUv + fract(uTime*0.31), vec2(12.9898,78.233))) * 43758.5453);
  c.rgb += (g - 0.5) * 0.022; // フィルムグレイン
  gl_FragColor = c;
}`,
};

export function createPostFX(THREE, { renderer, scene, camera, prCap }) {
  const rt = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
    type: THREE.HalfFloatType, samples: 4,
  });
  const composer = new EffectComposer(renderer, rt);
  composer.setPixelRatio(prCap);
  composer.addPass(new RenderPass(scene, camera));
  const ssao = new SSAOPass(scene, camera, window.innerWidth, window.innerHeight);
  ssao.kernelRadius = 0.55;
  ssao.minDistance = 0.0008;
  ssao.maxDistance = 0.05;
  composer.addPass(ssao);
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.18, 0.5, 0.85));
  composer.addPass(new OutputPass());
  const grade = new ShaderPass(GradeShader);
  composer.addPass(grade);

  return {
    render() { composer.render(); },
    setTime(t) { grade.uniforms.uTime.value = t; },
    setSize(w, h) { composer.setSize(w, h); },
  };
}
