const fs           = require('fs');
const os           = require('os');
const path         = require('path');
const crypto       = require('crypto');
const { execSync } = require('child_process');
const slack        = require('../lib/slack.js');

// ── 1. TEMPLATE_REPO_URL 확인 ──────────────────────────────────────────────
const REPO_URL = process.env.TEMPLATE_REPO_URL;
if (!REPO_URL) process.exit(0);

// ── 2. 세션 키 생성 (세션 1회 체크) ────────────────────────────────────────
const cwdHash = crypto.createHash('md5').update(process.cwd()).digest('hex').slice(0, 8);

let sessionKey;
try {
    // process.ppid는 Node.js 프로세스의 부모 PID — Claude Code 프로세스 트리 기준
    sessionKey = String(process.ppid || '');
    if (!sessionKey) throw new Error('no ppid');
} catch {
    // fallback: 1시간 단위
    const now = new Date();
    sessionKey = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}`;
}

const lockFile = path.join(os.tmpdir(), `claude-update-check-${cwdHash}-${sessionKey}`);
if (fs.existsSync(lockFile)) process.exit(0);

// ── 3. 로컬 SYNC_HASH 읽기 ─────────────────────────────────────────────────
const hashFile = path.join(process.cwd(), '.claude/state/SYNC_HASH');
if (!fs.existsSync(hashFile)) process.exit(0);
const localHash = fs.readFileSync(hashFile, 'utf8').trim();

// ── 4. 락 파일 먼저 생성 (네트워크 실패 시 재시도 폭주 방지) ───────────────
try {
    fs.writeFileSync(lockFile, '');
} catch {
    // 락 파일 생성 실패해도 진행
}

// ── 5. 원격 HEAD hash 조회 ─────────────────────────────────────────────────
let remoteHash;
try {
    const out = execSync(`git ls-remote ${REPO_URL} HEAD`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    if (!out) process.exit(0);
    remoteHash = out.split(/\s+/)[0].trim();
} catch {
    process.exit(0);
}

if (localHash === remoteHash) process.exit(0);

// ── 6. 알림 전송 ───────────────────────────────────────────────────────────
const projectName = process.env.PROJECT_NAME || path.basename(process.cwd());

const consoleMsg = `[claude-code-template 업데이트 알림] 공통 템플릿에 새 변경사항이 있습니다.\n'/sync-template' 스킬을 실행하면 최신 버전으로 동기화됩니다.\n`;

// stderr → 사용자 터미널에 직접 표시
process.stderr.write(consoleMsg);
// stdout → Claude 컨텍스트 (이중 출력으로 가시성 보강)
process.stdout.write(consoleMsg);

// Slack DM (선택적)
const BOT_TOKEN  = process.env.SLACK_BOT_TOKEN;
const USER_EMAIL = process.env.SLACK_USER_EMAIL;
const slackEnabled = process.env.SLACK_NOTIFY_ENABLED !== 'false';

if (slackEnabled && BOT_TOKEN && !BOT_TOKEN.startsWith('xoxb-YOUR') && USER_EMAIL) {
    const slackText = `[Claude Code] 템플릿 업데이트 알림 🔔\n프로젝트: ${projectName}\n'/sync-template' 실행으로 동기화 가능`;
    slack.sendDmByEmail(BOT_TOKEN, USER_EMAIL, slackText, err => {
        if (err) process.stderr.write(`[check-update] Slack 전송 실패: ${err.message}\n`);
    });
}
