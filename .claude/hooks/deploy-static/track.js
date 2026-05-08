// PostToolUse 훅 — 정적 리소스 수정 파일을 세션 로그에 누적한다.
// SRC_ROOT 미설정 시 즉시 종료(opt-in). 화이트리스트 확장자 + SRC_ROOT 하위 파일만 기록.
// 출력 없음(토큰 비용 0). 실제 배포는 Stop 훅(deploy.js)에서 일괄 처리.

const fs       = require('fs');
const path     = require('path');
const readline = require('readline');

const SRC_ROOT    = process.env.SRC_ROOT;
const DEPLOY_ROOT = process.env.DEPLOY_ROOT;
if (!SRC_ROOT || !DEPLOY_ROOT) process.exit(0);

const TARGET_TOOLS = new Set(['Edit', 'Write', 'MultiEdit']);
const WHITELIST    = new Set(['.hbs', '.js', '.css']);

const rl  = readline.createInterface({ input: process.stdin });
let raw = '';
rl.on('line', line => { raw += line; });
rl.on('close', () => {
    let data;
    try { data = JSON.parse(raw); } catch { process.exit(0); }

    if (!data || !TARGET_TOOLS.has(data.tool_name)) process.exit(0);

    const filePath = data.tool_input && data.tool_input.file_path;
    if (!filePath || typeof filePath !== 'string') process.exit(0);

    const ext = path.extname(filePath).toLowerCase();
    if (!WHITELIST.has(ext)) process.exit(0);

    const absSrc  = path.resolve(SRC_ROOT);
    const absFile = path.resolve(filePath);
    const rel     = path.relative(absSrc, absFile);
    if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) process.exit(0);

    const logPath = path.join(process.cwd(), '.claude/cache/modified_files.log');
    try {
        fs.mkdirSync(path.dirname(logPath), { recursive: true });
        fs.appendFileSync(logPath, absFile + '\n');
    } catch {}

    process.exit(0);
});
