import { compile } from './mod.js';


const watcher = Deno.watchFs('./src');
for await (const event of watcher) {
  console.log(`File system event:`, event);
  
  for (const path of event.paths) {
    try {
      const newPath = path.replace('./src', './modules')
                          .replace('.ts', '.js');
      if (event.kind === 'remove') await Deno.remove(newPath);
      if (path.endsWith('.ts'))         compile(); // Compile whether a file got created, modified or removed
      else if (event.kind !== 'remove') await Deno.copyFile(path, newPath);
    } catch (error) {
      console.log(error); continue;
    }
  }
}