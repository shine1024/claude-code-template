const path  = require('path');
const slack = require(path.join(__dirname, '..', '..', '..', 'hooks', 'lib', 'slack.js'));

// ── 1. stdin 수집 ──────────────────────────────────────────────────────────
let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { raw += chunk; });
process.stdin.on('end', () => {
    let payload;
    try {
        payload = JSON.parse(raw || '{}');
    } catch (err) {
        process.stderr.write(`[sync-template/notify] payload 파싱 실패: ${err.message}\n`);
        process.exit(0);
    }
    main(payload);
});

// ── 2. 본체 ────────────────────────────────────────────────────────────────
function main(payload) {
    const BOT_TOKEN  = process.env.SLACK_BOT_TOKEN;
    const USER_EMAIL = process.env.SLACK_USER_EMAIL;
    const enabled    = process.env.SLACK_NOTIFY_ENABLED !== 'false';

    if (!enabled) process.exit(0);
    if (!BOT_TOKEN || BOT_TOKEN.startsWith('xoxb-YOUR')) process.exit(0);
    if (!USER_EMAIL) process.exit(0);

    const text = buildMessage(payload);

    slack.sendDmByEmail(BOT_TOKEN, USER_EMAIL, text, err => {
        if (err) {
            process.stderr.write(`[sync-template/notify] Slack 전송 실패: ${err.message}\n`);
        }
    });
}

// ── 3. 메시지 작성 ─────────────────────────────────────────────────────────
function buildMessage(payload) {
    const projectName = payload.projectName || '(unknown)';
    const oldHash     = (payload.oldHash || '').slice(0, 7);
    const newHash     = (payload.newHash || '').slice(0, 7);
    const rawChanges  = Array.isArray(payload.changes) ? payload.changes : [];

    const header = `[Claude Code] 템플릿 동기화 완료 ✅\n프로젝트: ${projectName}`;

    if (!oldHash) {
        return `${header}\n초기 동기화 — 이전 SYNC_HASH 없음 (HEAD: ${newHash})`;
    }

    const formatted = toSlackMrkdwn(rawChanges);

    if (formatted.length === 0) {
        return `${header}\n변경 구간: ${oldHash}..${newHash} (CHANGES.md 변경 없음)`;
    }

    const MAX_LINES = 60;
    const shown = formatted.slice(0, MAX_LINES).join('\n');
    const extra = formatted.length > MAX_LINES ? `\n…외 ${formatted.length - MAX_LINES}줄 생략` : '';

    return `${header}\n변경 구간: ${oldHash}..${newHash}\n\n${shown}${extra}`;
}

// CHANGES.md 라인 배열을 Slack mrkdwn 으로 변환
// - `## YYYY-MM-DD` → `*YYYY-MM-DD*` (Slack 굵게) + 앞에 빈 줄
// - `**굵게**` → `*굵게*`
// - `- ` / `  - ` 불릿 → `• ` / `    • `
// - 빈 줄·`---` 구분선 제거
function toSlackMrkdwn(rawChanges) {
    const lines = rawChanges
        .map(l => String(l).replace(/\r$/, ''))
        .filter(l => l.trim() !== '' && l.trim() !== '---');

    const out = [];
    for (const orig of lines) {
        const isHeading = /^##\s+/.test(orig);
        let line = orig
            .replace(/^##\s+(.+?)\s*$/, '*$1*')
            .replace(/\*\*([^*]+?)\*\*/g, '*$1*')
            .replace(/^- /, '• ')
            .replace(/^  - /, '    • ');

        if (isHeading && out.length > 0) out.push('');
        out.push(line);
    }
    return out;
}
