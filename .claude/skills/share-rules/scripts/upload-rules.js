/**
 * stdin 으로 받은 규칙 JSON 배열을 Google Sheets 의 개인 규칙 후보 시트에 append 합니다.
 * 시트는 GOOGLE_SHEETS_PERSONAL_RULES_GID 로 식별합니다 (사전 생성 필요).
 *
 * Usage:
 *   echo '[{"rule":"..."}]' | node upload-rules.js
 *   node upload-rules.js --file rules.json
 *
 * Env:
 *   GOOGLE_SERVICE_ACCOUNT_KEY_PATH
 *   GOOGLE_SHEETS_FEEDBACK_ID
 *   GOOGLE_SHEETS_PERSONAL_RULES_GID
 *   SESSION_USER_NAME
 */

const fs = require('fs');
const path = require('path');
const sheets = require('../../../lib/sheets');

function readStdin() {
	return new Promise((resolve, reject) => {
		let data = '';
		process.stdin.on('data', c => data += c);
		process.stdin.on('end', () => resolve(data));
		process.stdin.on('error', reject);
	});
}

async function main() {
	sheets.requireEnv('GOOGLE_SERVICE_ACCOUNT_KEY_PATH', 'GOOGLE_SHEETS_FEEDBACK_ID', 'GOOGLE_SHEETS_PERSONAL_RULES_GID');
	const sheetId = process.env.GOOGLE_SHEETS_FEEDBACK_ID;
	const gid = process.env.GOOGLE_SHEETS_PERSONAL_RULES_GID;
	const name = process.env.SESSION_USER_NAME || '';

	let raw;
	const fileFlagIdx = process.argv.indexOf('--file');
	if (fileFlagIdx >= 0 && process.argv[fileFlagIdx + 1]) {
		raw = fs.readFileSync(process.argv[fileFlagIdx + 1], 'utf8');
	} else {
		raw = await readStdin();
	}

	let rules;
	try {
		rules = JSON.parse(raw);
	} catch (e) {
		console.error(JSON.stringify({ error: 'stdin JSON 파싱 실패: ' + e.message }));
		process.exit(1);
	}
	if (!Array.isArray(rules) || rules.length === 0) {
		console.error(JSON.stringify({ error: '업로드할 규칙이 없습니다.' }));
		process.exit(1);
	}

	const today = new Date().toISOString().slice(0, 10);
	const project = path.basename(process.cwd());
	const valueRows = rules.map(r => [today, name, project, r.rule || '', '']);

	const key = sheets.loadServiceAccountKey();
	const token = await sheets.getAccessToken(key);
	const sheetTitle = await sheets.getSheetTitleByGid(token, sheetId, gid);
	const result = await sheets.appendValues(token, sheetId, "'" + sheetTitle + "'!A:E", valueRows);

	console.log(JSON.stringify({ success: true, uploaded: rules.length, sheet: sheetTitle, result }));
}

main().catch(e => {
	console.error(JSON.stringify({ error: e.message }));
	process.exit(1);
});
