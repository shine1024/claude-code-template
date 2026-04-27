/**
 * Google Sheets 개인 규칙 후보 시트(GOOGLE_SHEETS_PERSONAL_RULES_GID)에서 미분석 행만 조회하여 JSON 으로 출력합니다.
 *
 * Usage: node fetch-personal-rules.js
 *
 * Env:
 *   GOOGLE_SERVICE_ACCOUNT_KEY_PATH
 *   GOOGLE_SHEETS_FEEDBACK_ID
 *   GOOGLE_SHEETS_PERSONAL_RULES_GID
 *
 * gid 매칭 실패(시트 미준비) 시 빈 배열을 반환합니다.
 */

const sheets = require('../../../lib/sheets');

async function main() {
	sheets.requireEnv('GOOGLE_SERVICE_ACCOUNT_KEY_PATH', 'GOOGLE_SHEETS_FEEDBACK_ID', 'GOOGLE_SHEETS_PERSONAL_RULES_GID');
	const sheetId = process.env.GOOGLE_SHEETS_FEEDBACK_ID;
	const gid = process.env.GOOGLE_SHEETS_PERSONAL_RULES_GID;

	const key = sheets.loadServiceAccountKey();
	const token = await sheets.getAccessToken(key);

	let sheetTitle;
	try {
		sheetTitle = await sheets.getSheetTitleByGid(token, sheetId, gid);
	} catch (e) {
		console.log(JSON.stringify([]));
		return;
	}

	const values = await sheets.getValues(token, sheetId, "'" + sheetTitle + "'");
	const rows = values.slice(2);
	const structured = rows
		.map((r, i) => ({
			rowIndex: i + 3,
			날짜: r[0] || '',
			이름: r[1] || '',
			프로젝트: r[2] || '',
			규칙: r[3] || '',
			클로드분석여부: r[4] || ''
		}))
		.filter(r => r.규칙 && !r.클로드분석여부);

	console.log(JSON.stringify(structured, null, 2));
}

main().catch(e => {
	console.error(JSON.stringify({ error: e.message }));
	process.exit(1);
});
