/**
 * 작업세션 수집 시트의 지정 행 "클로드 분석여부" 컬럼(K열)에 오늘 날짜를 기입합니다.
 *
 * Usage: node mark-analyzed.js <rowIndex1> <rowIndex2> ...
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

	const rowIndices = process.argv.slice(2).map(Number).filter(n => !isNaN(n) && n > 0);
	if (rowIndices.length === 0) {
		console.error(JSON.stringify({ error: '행 번호를 인수로 전달하세요. 예: node mark-analyzed.js 3 4 5' }));
		process.exit(1);
	}

	const today = new Date().toISOString().slice(0, 10);

	const key = sheets.loadServiceAccountKey();
	const token = await sheets.getAccessToken(key);
	const sheetTitle = await sheets.getSheetTitleByGid(token, sheetId, gid);

	const data = rowIndices.map(rowIndex => ({
		range: "'" + sheetTitle + "'!K" + rowIndex,
		values: [[today]]
	}));

	const result = await sheets.batchUpdateValues(token, sheetId, data);
	console.log(JSON.stringify({ success: true, updatedRows: rowIndices.length, date: today, result }));
}

main().catch(e => {
	console.error(JSON.stringify({ error: e.message }));
	process.exit(1);
});
