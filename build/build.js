import { compile } from './mod.js';

try {
  compile();
  Deno.exit();
} catch (error) {
  console.log(error);
}