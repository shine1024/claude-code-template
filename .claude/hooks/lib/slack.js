const https = require('https');

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

// ── 이메일 → User ID 조회 후 DM 전송 ───────────────────────────────────────
function sendDmByEmail(token, email, text, callback) {
    const cb = callback || (() => {});
    lookupUserByEmail(token, email, (err, userId) => {
        if (err || !userId) {
            cb(err || new Error('User ID를 찾을 수 없습니다'), null);
            return;
        }
        sendDm(token, userId, text, cb);
    });
}

module.exports = { lookupUserByEmail, sendDm, sendDmByEmail };
