//import { compile } from './mod.js';


const watcher = Deno.watchFs('./src');
for await (const event of watcher) {
  console.log(' ');
  console.log(`File system event:`, event);
  
  for (const path of event.paths) {
    try {
      const compiledPath = path.replace('./src', './dist')
                               .replace('.ts', '.js');

      // If a file was deleted in ./src, delete the compiled or copied version in ./modules too
      if (event.kind === 'remove') {
        try {
          await Deno.remove(compiledPath);
          console.log(`[:)] ${compiledPath} removed`);
        } catch (error) {
          console.error(`[:(] Error while removing "${compiledPath}"`, error);
        }
      }

      // If a .ts file was created, modified or deleted, compile all modules
      if (path.endsWith('.ts')) {
        try {
          //await compile();
          //console.log(`[:)] "${path}" compiled into "${compiledPath}"`);
          console.log('--- Compilation needed ---');
        } catch (error) {
          //console.error(`[:(] Error while compiling "${path}" into "${compiledPath}"`, error);
        }
      }

      // If a non-.ts file was created or modified, copy it into ./modules
      else if (event.kind !== 'remove') {
        try {
          await Deno.copyFile(path, compiledPath);
          console.log(`[:)] "${path}" copied to "${compiledPath}"`);
        } catch (error) {
          console.error(`[:(] Error while copying "${path}" to "${compiledPath}"`, error);
        }
      }
    } catch (error) {
      console.log(error); continue;
    }
  }
}