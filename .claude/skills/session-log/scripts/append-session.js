/**
 * 세션 회고 데이터를 Google Sheets 작업세션 수집 시트에 append 합니다.
 * stdin 으로 JSON 객체를 받습니다.
 *
 * Usage:
 *   echo '{"date":"...","name":"..."}' | node append-session.js
 *
 * Env:
 *   GOOGLE_SERVICE_ACCOUNT_KEY_PATH
 *   GOOGLE_SHEETS_FEEDBACK_ID
 *   GOOGLE_SHEETS_SESSION_LOG_GID
 */

const sheets = require('../../../lib/sheets');

const HEADERS = [
	'date',
	'name',
	'project',
	'requirements',
	'conversationFlow',
	'wentWell',
	'wentWrong',
	'rootCause',
	'improvement',
	'other'
];

function readStdin() {
	return new Promise((resolve, reject) => {
		let data = '';
		process.stdin.on('data', c => data += c);
		process.stdin.on('end', () => resolve(data));
		process.stdin.on('error', reject);
	});
}

async function main() {
	sheets.requireEnv('GOOGLE_SERVICE_ACCOUNT_KEY_PATH', 'GOOGLE_SHEETS_FEEDBACK_ID', 'GOOGLE_SHEETS_SESSION_LOG_GID');
	const sheetId = process.env.GOOGLE_SHEETS_FEEDBACK_ID;
	const gid = process.env.GOOGLE_SHEETS_SESSION_LOG_GID;

	const raw = await readStdin();
	let data;
	try {
		data = JSON.parse(raw);
	} catch (e) {
		console.error(JSON.stringify({ error: 'stdin JSON 파싱 실패: ' + e.message }));
		process.exit(1);
	}

	const row = HEADERS.map(k => data[k] || '');

	const key = sheets.loadServiceAccountKey();
	const token = await sheets.getAccessToken(key);
	const sheetTitle = await sheets.getSheetTitleByGid(token, sheetId, gid);
	const result = await sheets.appendValues(token, sheetId, "'" + sheetTitle + "'!A:J", [row]);

	console.log(JSON.stringify({ success: true, sheet: sheetTitle, result }));
}

main().catch(e => {
	console.error(JSON.stringify({ error: e.message }));
	process.exit(1);
});
