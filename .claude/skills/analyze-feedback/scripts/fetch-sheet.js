/**
 * Google Sheets "2) 작업세션 수집" 에서 미분석 행만 조회하여 구조화된 JSON으로 출력합니다.
 * Usage: node fetch-sheet.js
 * Env: GOOGLE_SERVICE_ACCOUNT_KEY_PATH, SHEETS_FEEDBACK_ID
 */

const fs = require('fs');
const https = require('https');
const crypto = require('crypto');

function getAccessToken(key) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  })).toString('base64url');

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(header + '.' + payload);
  const sig = sign.sign(key.private_key, 'base64url');
  const jwt = header + '.' + payload + '.' + sig;

  return new Promise((resolve, reject) => {
    const body = 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + jwt;
    const req = https.request({
      hostname: 'oauth2.googleapis.com', path: '/token', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': body.length }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const json = JSON.parse(data);
        json.access_token ? resolve(json.access_token) : reject(new Error(JSON.stringify(json)));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function fetchSheet(token, sheetId, sheetName) {
  return new Promise((resolve, reject) => {
    const path = '/v4/spreadsheets/' + sheetId + '/values/' + encodeURIComponent(sheetName);
    https.get({
      hostname: 'sheets.googleapis.com', path,
      headers: { Authorization: 'Bearer ' + token }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function main() {
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
  const sheetId = process.env.SHEETS_FEEDBACK_ID;

  if (!keyPath || !sheetId) {
    console.error(JSON.stringify({ error: 'GOOGLE_SERVICE_ACCOUNT_KEY_PATH 또는 SHEETS_FEEDBACK_ID 환경변수가 없습니다.' }));
    process.exit(1);
  }

  const key = JSON.parse(fs.readFileSync(keyPath));
  const token = await getAccessToken(key);
  const result = await fetchSheet(token, sheetId, '2) 작업세션 수집');

  const rows = (result.values || []).slice(2); // 설명행(0), 헤더행(1) 제외
  const structured = rows
    .map((r, i) => ({
      rowIndex: i + 3,
      rowKey: [r[0], r[1], r[2], (r[3] || '').substring(0, 20).replace(/\s+/g, '')].filter(Boolean).join('_'),
      날짜: r[0] || '',
      이름: r[1] || '',
      프로젝트: r[2] || '',
      요구사항: r[3] || '',
      잘된점: r[5] || '',
      잘못된점: r[6] || '',
      원인분석: r[7] || '',
      개선내용: r[8] || '',
      기타: r[9] || '',
      클로드분석여부: r[10] || ''
    }))
    .filter(r => r.날짜 && r.프로젝트 && !r.클로드분석여부); // 미분석 행만

  console.log(JSON.stringify(structured, null, 2));
}

main().catch(e => {
  console.error(JSON.stringify({ error: e.message }));
  process.exit(1);
});
