import type { JXLModule } from './codec/enc/jxl_enc';
import type { EncodeOptions } from './meta';

import { defaultOptions } from './meta';
import { initEmscriptenModule } from './utils';
import { simd } from 'wasm-feature-detect';

let emscriptenModule: Promise<JXLModule>;

export async function init(module?: WebAssembly.Module): Promise<JXLModule> {
  if (await simd()) {
    const jxlEncoder = await import('./codec/enc/jxl_enc_mt_simd');
    emscriptenModule = initEmscriptenModule(jxlEncoder.default, module);
    return emscriptenModule;
  }
  const jxlEncoder = await import('./codec/enc/jxl_enc');
  emscriptenModule = initEmscriptenModule(jxlEncoder.default, module);
  return emscriptenModule;
}

export default async function encode(
  data: ImageData,
  options: Partial<EncodeOptions> = {},
): Promise<ArrayBuffer> {
  if (!emscriptenModule) emscriptenModule = init();

  const _options: EncodeOptions = { ...defaultOptions, ...options };
  const module = await emscriptenModule;
  const result = module.encode(data.data, data.width, data.height, _options);

  if (!result) throw new Error('Encoding error.');

  return result.buffer;
}