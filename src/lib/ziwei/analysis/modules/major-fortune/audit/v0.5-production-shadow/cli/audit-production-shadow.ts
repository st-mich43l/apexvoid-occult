/**
 * Run Major Fortune V0.5 production shadow corpus audit and write research pack.
 */
import { writeMajorFortuneV05ShadowPack } from "../write-pack";

function main(): void {
  const result = writeMajorFortuneV05ShadowPack();
  console.log(JSON.stringify(result, null, 2));
}

main();
