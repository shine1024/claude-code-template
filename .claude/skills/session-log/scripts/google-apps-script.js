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
 * 5. 배포 URL을 CLAUDE.local.md의 세션회고_SCRIPT_URL에 입력
 *
 * ## 수신 데이터 예시
 * {
 *   "date":            "2026-04-14",
 *   "name":            "봉수",
 *   "system":          "claude-code-template",
 *   "requirements":    "프로젝트 구조 정리 및 가이드 문서 작성",
 *   "wentWell":        "파일 구조 재편이 원활하게 진행됨",
 *   "wentWrong":       "README 내용이 구조 변경 후 outdated 되어 수정 필요했음",
 *   "ruleImprovement": "구조 변경 시 관련 문서도 함께 업데이트하는 규칙 추가 필요",
 *   "duration":        "2h",
 *   "other":           "없음"
 * }
 */

// Google Sheets 컬럼 헤더 순서 (시트 1행과 일치해야 합니다)
const HEADERS = [
  'date',
  'name',
  'system',
  'requirements',
  'wentWell',
  'wentWrong',
  'ruleImprovement',
  'duration',
  'other',
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // 헤더가 없으면 1행에 자동 생성
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
    }

    // HEADERS 순서대로 값 추출하여 행 추가
    const row = HEADERS.map((key) => data[key] ?? '');
    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
