// Stop 훅 — track.js 가 누적한 수정 파일을 DEPLOY_ROOT 로 일괄 복사한다.
// 성공 시 stderr 한 줄 요약(LLM 컨텍스트 영향 없음), 실패 시에만 상세.
// SRC_ROOT 기준 상대경로를 그대로 DEPLOY_ROOT 하위로 복사. 디렉토리는 자동 생성.

const fs   = require('fs');
const path = require('path');

const SRC_ROOT    = process.env.SRC_ROOT;
const DEPLOY_ROOT = process.env.DEPLOY_ROOT;
if (!SRC_ROOT || !DEPLOY_ROOT) process.exit(0);

const logPath = path.join(process.cwd(), '.claude/cache/modified_files.log');
if (!fs.existsSync(logPath)) process.exit(0);

let raw = '';
try { raw = fs.readFileSync(logPath, 'utf8'); } catch { process.exit(0); }

const files = [...new Set(raw.split('\n').map(s => s.trim()).filter(Boolean))];
try { fs.unlinkSync(logPath); } catch {}
if (files.length === 0) process.exit(0);

const absSrc    = path.resolve(SRC_ROOT);
const absDeploy = path.resolve(DEPLOY_ROOT);

let copied = 0;
const errors = [];

for (const src of files) {
    try {
        const rel = path.relative(absSrc, src);
        if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) continue;
        if (!fs.existsSync(src)) { errors.push(`missing: ${rel}`); continue; }

        const dest = path.join(absDeploy, rel);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
        copied++;
    } catch (e) {
        errors.push(`${path.basename(src)}: ${e.message}`);
    }
}

if (copied > 0) {
    process.stderr.write(`[deploy-static] ✓ ${copied} file${copied === 1 ? '' : 's'} → ${absDeploy}\n`);
}
if (errors.length > 0) {
    process.stderr.write(`[deploy-static] ✗ ${errors.length} error(s): ${errors.slice(0, 5).join(' | ')}\n`);
}

process.exit(0);
