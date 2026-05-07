/**
 * /validate-rules 가 생성한 검증 보고서를 파싱해 JSON 으로 출력한다.
 *
 * Usage:
 *   node parse-validate-report.js [YYYY-MM-DD]
 *
 * 인자:
 *   - 없음          → reports/validate-rules/ 의 가장 최근 보고서 자동 선택
 *   - YYYY-MM-DD    → 해당 날짜 보고서 (같은 날 여러 개면 가장 마지막 버전)
 *
 * 출력 (JSON):
 *   {
 *     "reportPath": "reports/validate-rules/2026-05-07-validate-report.md",
 *     "deletes": [{"id":"...", "reason":"...", "raw":"..."}],
 *     "merges":  [{"ids":["a","b"], "reason":"...", "raw":"..."}],
 *     "keeps":   ["id1","id2"]
 *   }
 *
 * 파싱 대상:
 *   - "## 삭제 후보" 의 - [x] / - [X] 체크된 항목
 *   - "## 병합 후보" 의 - [x] / - [X] 체크된 항목
 *   - "## 유지" 섹션의 - <id> 라인 (체크박스 없음)
 *
 * "## 충돌 보고" 섹션은 자동 처리 대상이 아니므로 파싱하지 않는다.
 */

const fs = require('fs');
const path = require('path');

function findLatestReport(dir) {
	if (!fs.existsSync(dir)) return null;
	const files = fs.readdirSync(dir)
		.filter(f => /^\d{4}-\d{2}-\d{2}(-\d+)?-validate-report\.md$/.test(f))
		.sort()
		.reverse();
	return files.length ? path.join(dir, files[0]) : null;
}

function findReportByDate(dir, date) {
	if (!fs.existsSync(dir)) return null;
	const files = fs.readdirSync(dir)
		.filter(f => f.startsWith(date) && /-validate-report\.md$/.test(f))
		.sort()
		.reverse();
	return files.length ? path.join(dir, files[0]) : null;
}

function findSectionRange(lines, headingRegex) {
	let start = -1;
	for (let i = 0; i < lines.length; i++) {
		if (headingRegex.test(lines[i])) { start = i; break; }
	}
	if (start === -1) return null;
	let end = lines.length;
	for (let i = start + 1; i < lines.length; i++) {
		if (/^##\s/.test(lines[i])) { end = i; break; }
	}
	return [start + 1, end];
}

function parseChecked(lines, range, kind) {
	if (!range) return [];
	const result = [];
	for (let i = range[0]; i < range[1]; i++) {
		const m = /^\s*-\s+\[([xX ])\]\s+(.+?)\s*$/.exec(lines[i]);
		if (!m) continue;
		if (m[1] === ' ') continue;
		const text = m[2];
		if (kind === 'merge') {
			const mm = /^([\w.\-]+)\s*\+\s*([\w.\-]+)\s*[—-]\s*(.+)$/.exec(text);
			if (mm) {
				result.push({ ids: [mm[1], mm[2]], reason: mm[3].trim(), raw: text });
			} else {
				result.push({ ids: [], reason: text, raw: text });
			}
		} else {
			const mm = /^([\w.\-]+)\s*[—-]\s*(.+)$/.exec(text);
			if (mm) {
				result.push({ id: mm[1], reason: mm[2].trim(), raw: text });
			} else {
				result.push({ id: text, reason: '', raw: text });
			}
		}
	}
	return result;
}

function parseKeeps(lines, range) {
	if (!range) return [];
	const result = [];
	for (let i = range[0]; i < range[1]; i++) {
		const line = lines[i];
		// "- <id>" — 체크박스 없는 단순 불릿
		if (/^\s*-\s+\[/.test(line)) continue;
		const m = /^\s*-\s+([\w.\-]+)\s*$/.exec(line);
		if (m) result.push(m[1]);
	}
	return result;
}

function main() {
	const arg = process.argv[2];
	const cwd = process.cwd();
	const dir = path.join(cwd, 'reports', 'validate-rules');

	const filePath = arg ? findReportByDate(dir, arg) : findLatestReport(dir);
	if (!filePath) {
		const msg = arg
			? `검증 보고서를 찾을 수 없습니다: ${arg}-validate-report.md`
			: '검증 보고서가 없습니다. /validate-rules 를 먼저 실행하세요.';
		console.error(msg);
		process.exit(1);
	}

	const content = fs.readFileSync(filePath, 'utf8');
	const lines = content.split(/\r?\n/);

	const deletes = parseChecked(lines, findSectionRange(lines, /^##\s+삭제 후보/), 'delete');
	const merges = parseChecked(lines, findSectionRange(lines, /^##\s+병합 후보/), 'merge');
	const keeps = parseKeeps(lines, findSectionRange(lines, /^##\s+유지/));

	console.log(JSON.stringify({
		reportPath: path.relative(cwd, filePath).replace(/\\/g, '/'),
		deletes,
		merges,
		keeps,
	}, null, 2));
}

main();
