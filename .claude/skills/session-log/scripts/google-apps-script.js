/**
 * [session-log] Google Apps Script
 *
 * Claude Code /session-log 스킬에서 POST 요청을 받아 Google Sheets에 기록합니다.
 *
 * ## 배포 방법
 * 1. Google Sheets 열기
 * 2. 확장 프로그램 → Apps Script
 * 3. 이 파일 내용을 붙여넣기
 * 4. 배포 → 새 배포 → 웹 앱
 *    - 실행 계정: 나
 *    - 액세스 권한: 모든 사용자
 * 5. 배포 URL을 settings.local.json의 SESSION_LOG_SCRIPT_URL에 입력
 *
 * ## 수신 데이터 예시
 * {
 *   "date":             "2026-04-17",
 *   "name":             "신봉수",
 *   "project":          "claude-code-template",
 *   "requirements":     "작업 요약",
 *   "conversationFlow": "대화 흐름 요약",
 *   "wentWell":         "잘된 부분",
 *   "wentWrong":        "잘못된 부분",
 *   "rootCause":        "원인 분석",
 *   "improvement":      "개선 내용",
 *   "other":            "없음"
 * }
 */

const SPREADSHEET_ID = '1hpRyGUOKBC6M84qtMHDZuVlwOePatbhRgLWk1Dta9-w';
const SHEET_GID = 2106728685;

// Google Sheets 컬럼 헤더 순서 (시트 1행과 일치해야 합니다)
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
  'other',
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheets().find(s => s.getSheetId() === SHEET_GID);

    if (!sheet) {
      throw new Error('Sheet not found. GID: ' + SHEET_GID);
    }

    // 헤더가 없으면 1행에 자동 생성
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
    }

    // HEADERS 순서대로 값 추출 후 다음 행에 입력
    const row = HEADERS.map((key) => data[key] ?? '');
    const newRow = sheet.getLastRow() + 1;
    sheet.getRange(newRow, 1, 1, HEADERS.length).setValues([row]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
