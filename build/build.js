import { compile } from './mod.js';

try {
  await compile();
  Deno.exit();
} catch (error) {
  console.log(error);
}