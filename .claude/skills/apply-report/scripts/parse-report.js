/**
 * /analyze-report 가 생성한 보고서 마크다운을 파싱해 JSON 으로 출력합니다.
 *
 * 인자:
 *   - 없음          → reports/analyze-report/ 의 가장 최근 보고서 자동 선택
 *   - YYYY-MM-DD    → 해당 날짜 보고서 선택
 *
 * 출력 (JSON):
 *   {
 *     "reportPath": "reports/analyze-report/2026-04-30-analyze-report.md",
 *     "newRules":    [{ "태그", "규칙 타입", "문제 패턴", "출처", "제안 내용", "적용 위치(추정)" }, ...],
 *     "promotions":  [{ "강도", "규칙 타입", "규칙 요약", "작성자 수", "회고 매칭", "승격 대상 파일" }, ...],
 *     "userGuides":  [{ "상황", "권장 프롬프트 문구" }, ...],
 *     "infoNeeds":   [{ "항목", "내용" }, ...]
 *   }
 *
 * Usage: node parse-report.js [YYYY-MM-DD]
 */

const fs = require('fs');
const path = require('path');

function findLatestReport(dir) {
	if (!fs.existsSync(dir)) return null;
	const files = fs.readdirSync(dir)
		.filter(f => /^\d{4}-\d{2}-\d{2}-analyze-report\.md$/.test(f))
		.sort()
		.reverse();
	return files.length ? path.join(dir, files[0]) : null;
}

function findReportByDate(dir, date) {
	const filePath = path.join(dir, `${date}-analyze-report.md`);
	return fs.existsSync(filePath) ? filePath : null;
}

function isSeparator(line) {
	return /^\s*\|[\s\-:|]+\|\s*$/.test(line);
}

function isTableRow(line) {
	return /^\s*\|.*\|\s*$/.test(line);
}

function parseRow(line) {
	return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(s => s.trim());
}

function parseTable(lines, startIdx) {
	const headerLine = lines[startIdx];
	const sepLine = lines[startIdx + 1];
	if (!headerLine || !isTableRow(headerLine) || !sepLine || !isSeparator(sepLine)) return null;

	const headers = parseRow(headerLine);
	const rows = [];
	let i = startIdx + 2;
	while (i < lines.length && isTableRow(lines[i])) {
		const cells = parseRow(lines[i]);
		if (cells.length === headers.length && cells.some(c => c.length > 0)) {
			const row = {};
			headers.forEach((h, idx) => { row[h] = cells[idx]; });
			rows.push(row);
		}
		i++;
	}
	return { headers, rows };
}

function findHeading(lines, headingPattern, fromIdx) {
	for (let i = fromIdx || 0; i < lines.length; i++) {
		if (headingPattern.test(lines[i])) return i;
	}
	return -1;
}

function findFirstTableInRange(lines, startIdx, endIdx) {
	for (let i = startIdx; i < endIdx; i++) {
		if (isTableRow(lines[i]) && lines[i + 1] && isSeparator(lines[i + 1])) {
			return i;
		}
	}
	return -1;
}

function extractSectionTable(lines, headingPattern) {
	const start = findHeading(lines, headingPattern, 0);
	if (start === -1) return [];
	let end = lines.length;
	for (let i = start + 1; i < lines.length; i++) {
		if (/^##\s/.test(lines[i])) { end = i; break; }
	}
	const tableIdx = findFirstTableInRange(lines, start + 1, end);
	if (tableIdx === -1) return [];
	const parsed = parseTable(lines, tableIdx);
	return parsed ? parsed.rows : [];
}

function main() {
	const arg = process.argv[2];
	const dir = path.join(process.cwd(), 'reports', 'analyze-report');

	const filePath = arg ? findReportByDate(dir, arg) : findLatestReport(dir);
	if (!filePath) {
		const msg = arg
			? `보고서를 찾을 수 없습니다: ${arg}-analyze-report.md`
			: '분석 보고서가 없습니다. /analyze-report 를 먼저 실행하세요.';
		console.error(msg);
		process.exit(1);
	}

	const content = fs.readFileSync(filePath, 'utf8');
	const lines = content.split(/\r?\n/);

	const result = {
		reportPath: path.relative(process.cwd(), filePath).replace(/\\/g, '/'),
		newRules:   extractSectionTable(lines, /^## 신규 발견/),
		promotions: extractSectionTable(lines, /^## 개인 규칙 후보 승격 검토/),
		userGuides: extractSectionTable(lines, /^## 사용자 가이드 제안/),
		infoNeeds:  extractSectionTable(lines, /^## 정보 보완 필요 항목/),
	};

	console.log(JSON.stringify(result, null, 2));
}

main();
