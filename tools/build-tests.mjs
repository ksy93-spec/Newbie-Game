/* 테스트용 빌드. tsc가 @/ 별칭을 그대로 두므로 상대 경로로 바꿔 준다. */
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';

execSync('npx tsc -p tsconfig.test.json', { stdio: 'inherit' });

const root = '.test-build';
function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.js')) {
      const rel = (m, spec) => {
        let r = relative(dirname(p), join(root, spec)).replace(/\\/g, '/');
        if (!r.startsWith('.')) r = './' + r;
        return m.replace('@/' + spec, r);
      };
      const out = readFileSync(p, 'utf8').replace(/["']@\/([^"']+)["']/g, (m, spec) => rel(m, spec));
      writeFileSync(p, out);
    }
  }
}
walk(root);
console.log('테스트 빌드 완료');
