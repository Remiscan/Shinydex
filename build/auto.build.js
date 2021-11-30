import { compile } from './mod.js';


const watcher = Deno.watchFs('./src');
for await (const event of watcher) {
  console.log(`File system event:`, event);
  
  for (const path of event.paths) {
    if (path.endsWith('.ts')) {
      try { compile(); }
      catch (error) { console.log(error); continue; }
    } else {
      const newPath = path.replace('./src', './modules');
      try { await Deno.copyFile(path, newPath); }
      catch (error) { console.log(error); continue; }
    }
  }
}