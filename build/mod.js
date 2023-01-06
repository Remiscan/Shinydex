export async function compile() {
  const compiled = Deno.run({ cmd: ['bash', '-ic', 'tsc', '--incremental'] });
  return await compiled.status();
}