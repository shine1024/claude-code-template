/**
 * 분석 완료된 행의 "클로드 분석여부" 컬럼(K열)에 오늘 날짜를 기입합니다.
 * Usage: node mark-analyzed.js <rowIndex1> <rowIndex2> ...
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

function batchUpdate(token, sheetId, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ valueInputOption: 'USER_ENTERED', data });
    const req = https.request({
      hostname: 'sheets.googleapis.com',
      path: `/v4/spreadsheets/${sheetId}/values:batchUpdate`,
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
  const sheetId = process.env.SHEETS_FEEDBACK_ID;

  if (!keyPath || !sheetId) {
    console.error(JSON.stringify({ error: 'GOOGLE_SERVICE_ACCOUNT_KEY_PATH 또는 SHEETS_FEEDBACK_ID 환경변수가 없습니다.' }));
    process.exit(1);
  }

  const rowIndices = process.argv.slice(2).map(Number).filter(n => !isNaN(n) && n > 0);
  if (rowIndices.length === 0) {
    console.error(JSON.stringify({ error: '행 번호를 인수로 전달하세요. 예: node mark-analyzed.js 3 4 5' }));
    process.exit(1);
  }

  const today = new Date().toISOString().slice(0, 10);
  const sheetName = '2) 작업세션 수집';

  const key = JSON.parse(fs.readFileSync(keyPath));
  const token = await getAccessToken(key);

  // K열 = 클로드 분석여부 컬럼
  const data = rowIndices.map(rowIndex => ({
    range: `'${sheetName}'!K${rowIndex}`,
    values: [[today]]
  }));

  const result = await batchUpdate(token, sheetId, data);
  console.log(JSON.stringify({ success: true, updatedRows: rowIndices.length, date: today, result }));
}

main().catch(e => {
  console.error(JSON.stringify({ error: e.message }));
  process.exit(1);
});
