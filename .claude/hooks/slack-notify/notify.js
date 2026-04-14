const https    = require('https');
const fs       = require('fs');
const path     = require('path');
const readline = require('readline');

// ── 설정 로드 ──────────────────────────────────────────────────────────────
// 프로젝트별 알림 비활성화: .claude/settings.local.json에 SLACK_NOTIFY_ENABLED=false 설정
if (process.env.SLACK_NOTIFY_ENABLED === 'false') process.exit(0);

// Bot Token: notify.config.json (팀 공유)
const configPath = path.join(__dirname, 'notify.config.json');
if (!fs.existsSync(configPath)) process.exit(0);

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const BOT_TOKEN = config.slackBotToken;
if (!BOT_TOKEN || BOT_TOKEN.startsWith('xoxb-YOUR')) process.exit(0);

// User Email: Claude Code 전역 설정 (개인 설정 — ~/.claude/settings.json)
const USER_EMAIL = process.env.SLACK_USER_EMAIL;
if (!USER_EMAIL) {
    process.stderr.write('[slack-notify] SLACK_USER_EMAIL 환경변수가 설정되지 않았습니다.\n');
    process.exit(0);
}

const START_FILE = path.join(process.cwd(), '.claude/hooks/.task_start');

// ── stdin 읽기 ─────────────────────────────────────────────────────────────
const rl  = readline.createInterface({ input: process.stdin });
let raw   = '';
rl.on('line', line => { raw += line; });
rl.on('close', () => {
    let inputData = null;
    try { if (raw.trim()) inputData = JSON.parse(raw); } catch {}

    const projectName = path.basename(process.cwd());
    const now = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });

    let text;

    if (inputData && inputData.message) {
        // ── Notification 이벤트 ──────────────────────────────────────────────
        let startFormatted = '';
        let elapsed = '';

        if (fs.existsSync(START_FILE)) {
            const startStr  = fs.readFileSync(START_FILE, 'utf8').trim();
            const startTime = new Date(startStr);
            startFormatted = startTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });

            const diffSec   = Math.floor((new Date() - startTime) / 1000);
            const hours     = Math.floor(diffSec / 3600);
            const minutes   = Math.floor((diffSec % 3600) / 60);
            const seconds   = diffSec % 60;

            elapsed = hours > 0
                ? `${hours}시간 ${minutes}분 ${seconds}초`
                : minutes > 0
                    ? `${minutes}분 ${seconds}초`
                    : `${seconds}초`;
        }

        text = `[Claude Code] 사용자 확인이 필요합니다 💬\n프로젝트: ${projectName}\n시작: ${startFormatted} | 현재: ${now} | 소요: ${elapsed}`;
    } else {
        // ── Stop 이벤트 ─────────────────────────────────────────────────────
        if (fs.existsSync(START_FILE)) {
            const startStr  = fs.readFileSync(START_FILE, 'utf8').trim();
            const startTime = new Date(startStr);
            const diffSec   = Math.floor((new Date() - startTime) / 1000);
            const hours     = Math.floor(diffSec / 3600);
            const minutes   = Math.floor((diffSec % 3600) / 60);
            const seconds   = diffSec % 60;

            const elapsed = hours > 0
                ? `${hours}시간 ${minutes}분 ${seconds}초`
                : minutes > 0
                    ? `${minutes}분 ${seconds}초`
                    : `${seconds}초`;

            const startFormatted = startTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
            fs.unlinkSync(START_FILE);
            text = `[Claude Code] 작업 완료 ✅\n프로젝트: ${projectName}\n시작: ${startFormatted} | 완료: ${now} | 소요: ${elapsed}`;
        } else {
            text = `[Claude Code] 작업 완료 ✅\n프로젝트: ${projectName}\n완료: ${now}`;
        }
    }

    // 이메일로 User ID 조회 후 DM 전송
    lookupUserByEmail(BOT_TOKEN, USER_EMAIL, (userId) => {
        if (userId) sendSlackDM(BOT_TOKEN, userId, text);
    });
});

// ── users.lookupByEmail — 이메일 → User ID 조회 ────────────────────────────
function lookupUserByEmail(token, email, callback) {
    const req = https.request({
        hostname: 'slack.com',
        path    : `/api/users.lookupByEmail?email=${encodeURIComponent(email)}`,
        method  : 'GET',
        headers : {
            'Authorization': `Bearer ${token}`,
        },
    }, res => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
            try {
                const result = JSON.parse(body);
                if (result.ok) {
                    callback(result.user.id);
                } else {
                    process.stderr.write(`[slack-notify] 이메일 조회 실패: ${result.error}\n`);
                    callback(null);
                }
            } catch {
                callback(null);
            }
        });
    });
    req.on('error', () => callback(null));
    req.end();
}

// ── Slack Bot API (chat.postMessage) ───────────────────────────────────────
function sendSlackDM(token, channel, text) {
    const payload = JSON.stringify({ channel, text });
    const req = https.request({
        hostname: 'slack.com',
        path    : '/api/chat.postMessage',
        method  : 'POST',
        headers : {
            'Authorization': `Bearer ${token}`,
            'Content-Type' : 'application/json; charset=utf-8',
            'Content-Length': Buffer.byteLength(payload),
        },
    }, res => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
            try {
                const result = JSON.parse(body);
                if (!result.ok) {
                    process.stderr.write(`[slack-notify] 전송 실패: ${result.error}\n`);
                }
            } catch {}
        });
    });
    req.on('error', () => {});
    req.write(payload);
    req.end();
}
