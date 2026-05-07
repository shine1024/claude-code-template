const https = require('https');
const fs    = require('fs');
const path  = require('path');

const CACHE_FILE = path.join(process.cwd(), '.claude/cache/.slack_user_id.json');

// ── 캐시 읽기/쓰기 ─────────────────────────────────────────────────────────
function readCache(email) {
    try {
        const raw    = fs.readFileSync(CACHE_FILE, 'utf8');
        const cached = JSON.parse(raw);
        if (cached.email === email && cached.userId) return cached.userId;
    } catch {}
    return null;
}

function writeCache(email, userId) {
    try {
        fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
        fs.writeFileSync(CACHE_FILE, JSON.stringify({ email, userId }));
    } catch {}
}

function clearCache() {
    try { fs.unlinkSync(CACHE_FILE); } catch {}
}

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
                    callback(null, result.user.id);
                } else {
                    callback(new Error(`이메일 조회 실패: ${result.error}`), null);
                }
            } catch (err) {
                callback(err, null);
            }
        });
    });
    req.on('error', err => callback(err, null));
    req.end();
}

// ── chat.postMessage — User ID로 DM 전송 ───────────────────────────────────
function sendDm(token, userId, text, callback) {
    const cb = callback || (() => {});
    const payload = JSON.stringify({ channel: userId, text });
    const req = https.request({
        hostname: 'slack.com',
        path    : '/api/chat.postMessage',
        method  : 'POST',
        headers : {
            'Authorization' : `Bearer ${token}`,
            'Content-Type'  : 'application/json; charset=utf-8',
            'Content-Length': Buffer.byteLength(payload),
        },
    }, res => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
            try {
                const result = JSON.parse(body);
                if (result.ok) {
                    cb(null, result);
                } else {
                    cb(new Error(`전송 실패: ${result.error}`), null);
                }
            } catch (err) {
                cb(err, null);
            }
        });
    });
    req.on('error', err => cb(err, null));
    req.write(payload);
    req.end();
}

// ── 이메일 → User ID 조회 후 DM 전송 (User ID 캐싱) ────────────────────────
function sendDmByEmail(token, email, text, callback) {
    const cb = callback || (() => {});

    const send = userId => {
        sendDm(token, userId, text, (err, result) => {
            // 캐시된 userId가 무효해진 경우 (계정 변경·삭제 등) 캐시 제거
            if (err && /user_not_found|channel_not_found/.test(err.message)) {
                clearCache();
            }
            cb(err, result);
        });
    };

    const cachedId = readCache(email);
    if (cachedId) {
        send(cachedId);
        return;
    }

    lookupUserByEmail(token, email, (err, userId) => {
        if (err || !userId) {
            cb(err || new Error('User ID를 찾을 수 없습니다'), null);
            return;
        }
        writeCache(email, userId);
        send(userId);
    });
}

module.exports = { lookupUserByEmail, sendDm, sendDmByEmail };
