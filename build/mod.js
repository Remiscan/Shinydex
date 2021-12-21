export async function compile() {
  //await Deno.remove('modules', { recursive: true });

  const compile = Deno.run({ cmd: ['tsc.cmd', '--incremental'] });
  await compile.status();
}