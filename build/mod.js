export async function compile() {
  const compiled = Deno.run({ cmd: ['tsc', '--incremental'] });
  return await compiled.status();
}