const fs       = require('fs');
const path     = require('path');
const readline = require('readline');
const slack    = require('../lib/slack.js');

// ── 설정 로드 ──────────────────────────────────────────────────────────────
// 프로젝트별 알림 비활성화: .claude/settings.local.json에 SLACK_NOTIFY_ENABLED=false 설정
if (process.env.SLACK_NOTIFY_ENABLED === 'false') process.exit(0);

// Bot Token: ~/.claude/settings.json의 SLACK_BOT_TOKEN 환경변수
const BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
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

    const projectName = process.env.PROJECT_NAME || path.basename(process.cwd());
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

    slack.sendDmByEmail(BOT_TOKEN, USER_EMAIL, text, err => {
        if (err) process.stderr.write(`[slack-notify] ${err.message}\n`);
    });
});
