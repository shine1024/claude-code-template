/**
 * Google Sheets API 공통 헬퍼.
 * 서비스 계정 JWT 인증, gid 기반 탭 이름 조회, 값 읽기·쓰기·일괄 갱신.
 *
 * 사용 예:
 *   const sheets = require('../../../lib/sheets');
 *   const key = sheets.loadServiceAccountKey();
 *   const token = await sheets.getAccessToken(key);
 *   const title = await sheets.getSheetTitleByGid(token, sheetId, gid);
 *   await sheets.appendValues(token, sheetId, `'${title}'!A:E`, rows);
 */

const fs = require('fs');
const https = require('https');
const crypto = require('crypto');

function loadServiceAccountKey() {
	const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
	if (!keyPath) {
		throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY_PATH 환경변수가 없습니다.');
	}
	return JSON.parse(fs.readFileSync(keyPath, 'utf8'));
}

function requireEnv() {
	const names = Array.prototype.slice.call(arguments);
	const missing = names.filter(n => !process.env[n]);
	if (missing.length > 0) {
		throw new Error(missing.join(', ') + ' 환경변수가 없습니다.');
	}
}

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
			hostname: 'oauth2.googleapis.com',
			path: '/token',
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': body.length
			}
		}, res => {
			let data = '';
			res.on('data', c => data += c);
			res.on('end', () => {
				try {
					const json = JSON.parse(data);
					json.access_token ? resolve(json.access_token) : reject(new Error(JSON.stringify(json)));
				} catch (e) {
					reject(new Error('토큰 응답 파싱 실패: ' + data));
				}
			});
		});
		req.on('error', reject);
		req.write(body);
		req.end();
	});
}

function request(token, method, path, body) {
	return new Promise((resolve, reject) => {
		const headers = { Authorization: 'Bearer ' + token };
		let payload = null;
		if (body !== undefined && body !== null) {
			payload = Buffer.from(JSON.stringify(body), 'utf8');
			headers['Content-Type'] = 'application/json; charset=utf-8';
			headers['Content-Length'] = payload.length;
		}
		const req = https.request({
			hostname: 'sheets.googleapis.com',
			path,
			method,
			headers
		}, res => {
			let d = '';
			res.on('data', c => d += c);
			res.on('end', () => {
				let parsed;
				try { parsed = d ? JSON.parse(d) : {}; } catch (e) { parsed = d; }
				resolve({ status: res.statusCode, body: parsed });
			});
		});
		req.on('error', reject);
		if (payload) req.write(payload);
		req.end();
	});
}

async function getSheetTitleByGid(token, spreadsheetId, gid) {
	const res = await request(token, 'GET', '/v4/spreadsheets/' + spreadsheetId + '?fields=sheets.properties');
	if (res.status !== 200) {
		throw new Error('스프레드시트 metadata 조회 실패: ' + JSON.stringify(res.body));
	}
	const target = Number(gid);
	const sheet = (res.body.sheets || []).find(s => s.properties && Number(s.properties.sheetId) === target);
	if (!sheet) {
		throw new Error('gid=' + gid + ' 인 시트를 찾을 수 없습니다. SHEETS_*_GID 환경변수를 확인하세요.');
	}
	return sheet.properties.title;
}

async function getValues(token, spreadsheetId, range) {
	const res = await request(token, 'GET', '/v4/spreadsheets/' + spreadsheetId + '/values/' + encodeURIComponent(range));
	if (res.status !== 200) {
		throw new Error('값 조회 실패: ' + JSON.stringify(res.body));
	}
	return res.body.values || [];
}

async function appendValues(token, spreadsheetId, range, values) {
	const path = '/v4/spreadsheets/' + spreadsheetId + '/values/' + encodeURIComponent(range)
		+ ':append?valueInputOption=RAW&insertDataOption=OVERWRITE';
	const res = await request(token, 'POST', path, { values });
	if (res.status !== 200) {
		throw new Error('append 실패: ' + JSON.stringify(res.body));
	}
	return res.body;
}

async function batchUpdateValues(token, spreadsheetId, data) {
	const res = await request(
		token,
		'POST',
		'/v4/spreadsheets/' + spreadsheetId + '/values:batchUpdate',
		{ valueInputOption: 'RAW', data }
	);
	if (res.status !== 200) {
		throw new Error('batchUpdate 실패: ' + JSON.stringify(res.body));
	}
	return res.body;
}

module.exports = {
	loadServiceAccountKey,
	requireEnv,
	getAccessToken,
	request,
	getSheetTitleByGid,
	getValues,
	appendValues,
	batchUpdateValues
};
