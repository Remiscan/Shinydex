import { compile } from './mod.js';


const watcher = Deno.watchFs('./src');
for await (const event of watcher) {
  console.log(`File system event:`, event);
  
  for (const path of event.paths) {
    try {
      const newPath = path.replace('./src', './modules')
                          .replace('.ts', '.js');
      if (path.endsWith('.ts'))         await compile();
    } catch (error) {
      console.log(error); continue;
    }
  }
}