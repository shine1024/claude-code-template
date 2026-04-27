/**
 * Google Sheets 작업세션 수집 시트(GOOGLE_SHEETS_SESSION_LOG_GID)에서 미분석 행만 조회하여 JSON 으로 출력합니다.
 *
 * Usage: node fetch-sheet.js
 *
 * Env:
 *   GOOGLE_SERVICE_ACCOUNT_KEY_PATH
 *   GOOGLE_SHEETS_FEEDBACK_ID
 *   GOOGLE_SHEETS_SESSION_LOG_GID
 */

const sheets = require('../../../lib/sheets');

async function main() {
	sheets.requireEnv('GOOGLE_SERVICE_ACCOUNT_KEY_PATH', 'GOOGLE_SHEETS_FEEDBACK_ID', 'GOOGLE_SHEETS_SESSION_LOG_GID');
	const sheetId = process.env.GOOGLE_SHEETS_FEEDBACK_ID;
	const gid = process.env.GOOGLE_SHEETS_SESSION_LOG_GID;

	const key = sheets.loadServiceAccountKey();
	const token = await sheets.getAccessToken(key);
	const sheetTitle = await sheets.getSheetTitleByGid(token, sheetId, gid);

	const values = await sheets.getValues(token, sheetId, "'" + sheetTitle + "'");
	const rows = values.slice(2);
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
		.filter(r => r.날짜 && r.프로젝트 && !r.클로드분석여부);

	console.log(JSON.stringify(structured, null, 2));
}

main().catch(e => {
	console.error(JSON.stringify({ error: e.message }));
	process.exit(1);
});
