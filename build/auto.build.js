import { compile } from './mod.js';


const watcher = Deno.watchFs('./src');
for await (const event of watcher) {
  console.log(`File system event:`, event);
  
  for (const path of event.paths) {
    try {
      const compiledPath = path.replace('./src', './modules')
                               .replace('.ts', '.js');

      // If a file was deleted in ./src, delete the compiled or copied version in ./modules too
      if (event.kind === 'remove') await Deno.remove(compiledPath);

      // If a .ts file was created, modified or deleted, compile all modules
      if (path.endsWith('.ts'))         await compile();

      // If a non-.ts file was created or modified, copy it into ./modules
      else if (event.kind !== 'remove') await Deno.copyFile(path, compiledPath);
    } catch (error) {
      console.log(error); continue;
    }
  }
}