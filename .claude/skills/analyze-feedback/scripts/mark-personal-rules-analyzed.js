/**
 * 개인 규칙 후보 시트의 지정 행 "클로드 분석여부" 컬럼(E열)에 오늘 날짜를 기입합니다.
 *
 * Usage: node mark-personal-rules-analyzed.js <rowIndex1> <rowIndex2> ...
 *
 * Env:
 *   GOOGLE_SERVICE_ACCOUNT_KEY_PATH
 *   GOOGLE_SHEETS_FEEDBACK_ID
 *   GOOGLE_SHEETS_PERSONAL_RULES_GID
 */

const sheets = require('../../../lib/sheets');

async function main() {
	sheets.requireEnv('GOOGLE_SERVICE_ACCOUNT_KEY_PATH', 'GOOGLE_SHEETS_FEEDBACK_ID', 'GOOGLE_SHEETS_PERSONAL_RULES_GID');
	const sheetId = process.env.GOOGLE_SHEETS_FEEDBACK_ID;
	const gid = process.env.GOOGLE_SHEETS_PERSONAL_RULES_GID;

	const rowIndices = process.argv.slice(2).map(Number).filter(n => !isNaN(n) && n > 0);
	if (rowIndices.length === 0) {
		console.error(JSON.stringify({ error: '행 번호를 인수로 전달하세요. 예: node mark-personal-rules-analyzed.js 3 4 5' }));
		process.exit(1);
	}

	const today = new Date().toISOString().slice(0, 10);

	const key = sheets.loadServiceAccountKey();
	const token = await sheets.getAccessToken(key);
	const sheetTitle = await sheets.getSheetTitleByGid(token, sheetId, gid);

	const data = rowIndices.map(rowIndex => ({
		range: "'" + sheetTitle + "'!E" + rowIndex,
		values: [[today]]
	}));

	const result = await sheets.batchUpdateValues(token, sheetId, data);
	console.log(JSON.stringify({ success: true, updatedRows: rowIndices.length, date: today, result }));
}

main().catch(e => {
	console.error(JSON.stringify({ error: e.message }));
	process.exit(1);
});
