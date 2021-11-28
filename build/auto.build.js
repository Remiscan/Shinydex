import { compile } from './mod.js';

const watcher = Deno.watchFs('./src');
for await (const event of watcher) {
  console.log(`File system event:`, event);
  try { compile(); }
  catch (error) { console.log(error); continue; }
}