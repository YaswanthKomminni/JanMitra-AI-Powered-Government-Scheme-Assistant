import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const model = 'Xenova/clip-vit-base-patch32';
const directory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../models', model);
const files = ['config.json', 'preprocessor_config.json', 'tokenizer_config.json', 'tokenizer.json', 'onnx/model_quantized.onnx'];
for (const file of files) {
  const destination = path.join(directory, file);
  try { const info = await fs.stat(destination); if (info.size > 0) continue; } catch {}
  await fs.mkdir(path.dirname(destination), { recursive: true });
  const temporary = `${destination}.partial`;
  const downloaded = await fs.stat(temporary).then(info => info.size).catch(() => 0);
  const response = await fetch(`https://huggingface.co/${model}/resolve/main/${file}`, {
    signal: AbortSignal.timeout(600000),
    headers: downloaded ? { Range: `bytes=${downloaded}-` } : {},
  });
  if (!response.ok) throw new Error(`Local vision download failed: ${file}, HTTP ${response.status}`);
  const { Readable } = await import('node:stream');
  const { pipeline } = await import('node:stream/promises');
  const { createWriteStream } = await import('node:fs');
  await pipeline(Readable.fromWeb(response.body), createWriteStream(temporary, { flags: response.status === 206 ? 'a' : 'w' }));
  await fs.rename(temporary, destination);
  console.log(`Installed ${file}`);
}
console.log('Local semantic vision model is ready.');
