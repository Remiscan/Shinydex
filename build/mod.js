export async function compile() {
  const compiled = Deno.run({ cmd: ['tsc.cmd', '--incremental'] });
  return await compiled.status();
}