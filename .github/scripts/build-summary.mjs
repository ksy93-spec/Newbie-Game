// EAS 빌드 결과(JSON)를 Actions 실행 요약에 적는다. 실패하면 오류 메시지와 로그 끝부분도 붙인다.
import fs from 'node:fs';

const raw = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const b = (Array.isArray(raw) ? raw[0] : raw) || {};
const art = b.artifacts || {};
const url = art.buildUrl || art.applicationArchiveUrl || '';
const owner = b.project?.ownerAccount?.name || b.initiatingActor?.displayName || '';
const lines = [
  `## ${b.platform === 'IOS' ? '아이폰' : '안드로이드'} 빌드 (${b.buildProfile || ''})`,
  '',
  `- 상태: ${b.status}`,
  `- 파일: ${url}`,
  `- 상세: https://expo.dev/accounts/${owner}/projects/newbie-quest/builds/${b.id}`,
];

if (b.status !== 'FINISHED') {
  if (b.error) lines.push(`- 오류: ${b.error.errorCode || ''} ${b.error.message || ''}`);
  for (const f of b.logFiles || []) {
    try {
      const txt = await (await fetch(f)).text();
      // 로그 파일은 줄마다 JSON이다. 마지막 120줄의 msg만 뽑는다.
      const msgs = txt.trim().split('\n').slice(-120).map((l) => {
        try { const j = JSON.parse(l); return `[${j.phase || ''}] ${j.msg ?? ''}`; } catch { return l; }
      });
      lines.push('', '<details><summary>로그 끝부분</summary>', '', '```', ...msgs, '```', '</details>');
      console.log(msgs.join('\n'));
    } catch (e) {
      lines.push(`- 로그를 못 받음: ${e}`);
    }
  }
}

console.log(lines.join('\n'));
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n');
