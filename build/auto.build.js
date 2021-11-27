const watcher = Deno.watchFs('./modules/ts');
for await (const event of watcher) {
  console.log(`File system event:`, event);
  const bundle = Deno.run({ cmd: ["tsc", "--outDir", "modules"] });
  await bundle.status();
}