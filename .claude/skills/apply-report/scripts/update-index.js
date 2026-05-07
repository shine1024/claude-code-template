/**
 * .claude/state/rules-index.json 갱신 스크립트.
 *
 * 인자로 받은 파일들을 인덱스에 touch (추가 또는 last_validated_at 갱신).
 *
 * Usage:
 *   node update-index.js <file1> [<file2> ...]
 *
 * 동작:
 *   - 인덱스 파일이 없으면 빈 구조({"rules": []})로 새로 생성
 *   - 입력 파일 중 .claude/rules/*.md 만 처리 (그 외는 무시)
 *   - 신규 파일: id, file, title, added_at, last_validated_at 모두 오늘로 추가
 *   - 기존 entry: last_validated_at 만 오늘로 갱신 (title 도 최신 본문 헤딩으로 동기화)
 *   - 출력: 처리 결과 JSON (added / touched / skipped)
 *
 * 인덱스 위치 주의: .claude/state/ 는 /sync-template 시 제외되는 디렉토리이므로
 * 검증 이력이 sync 로 휘발되지 않는다.
 *
 * id 규칙: 파일명에서 .md 제외 (예: coding-behavior.md → coding-behavior)
 * title 규칙: 파일 본문 첫 "# " 헤딩 텍스트
 */

const fs = require('fs');
const path = require('path');

const INDEX_REL = '.claude/state/rules-index.json';

function todayStr() {
	const d = new Date();
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

function toRelPosix(input, cwd) {
	const abs = path.isAbsolute(input) ? input : path.resolve(cwd, input);
	return path.relative(cwd, abs).replace(/\\/g, '/');
}

function isRuleFile(relPosix) {
	return /^\.claude\/rules\/[^/]+\.md$/.test(relPosix);
}

function readTitle(absPath) {
	if (!fs.existsSync(absPath)) return null;
	const content = fs.readFileSync(absPath, 'utf8');
	for (const line of content.split(/\r?\n/)) {
		const m = /^#\s+(.+?)\s*$/.exec(line);
		if (m) return m[1].trim();
	}
	return null;
}

function readIndex(indexAbs) {
	if (!fs.existsSync(indexAbs)) return { rules: [] };
	try {
		const data = JSON.parse(fs.readFileSync(indexAbs, 'utf8'));
		if (!Array.isArray(data.rules)) return { rules: [] };
		return data;
	} catch (e) {
		console.error(`${INDEX_REL} 읽기 실패: ${e.message}`);
		process.exit(1);
	}
}

function writeIndex(indexAbs, data) {
	fs.mkdirSync(path.dirname(indexAbs), { recursive: true });
	fs.writeFileSync(indexAbs, JSON.stringify(data, null, 2) + '\n');
}

function main() {
	const cwd = process.cwd();
	const inputs = process.argv.slice(2);
	if (inputs.length === 0) {
		console.error('사용법: node update-index.js <rule-file> [<rule-file> ...]');
		process.exit(1);
	}

	const indexAbs = path.join(cwd, INDEX_REL);
	const data = readIndex(indexAbs);
	const today = todayStr();

	const result = { added: [], touched: [], skipped: [] };

	for (const input of inputs) {
		const relPosix = toRelPosix(input, cwd);
		if (!isRuleFile(relPosix)) {
			result.skipped.push({ input, reason: '대상 외 (.claude/rules/*.md 가 아님)' });
			continue;
		}
		const absPath = path.join(cwd, relPosix);
		if (!fs.existsSync(absPath)) {
			result.skipped.push({ input: relPosix, reason: '파일이 존재하지 않음' });
			continue;
		}

		const id = path.posix.basename(relPosix, '.md');
		const title = readTitle(absPath) || id;

		const existing = data.rules.find(r => r.file === relPosix || r.id === id);
		if (existing) {
			existing.file = relPosix;
			existing.id = id;
			existing.title = title;
			existing.last_validated_at = today;
			result.touched.push(id);
		} else {
			data.rules.push({
				id,
				file: relPosix,
				title,
				added_at: today,
				last_validated_at: today,
			});
			result.added.push(id);
		}
	}

	data.rules.sort((a, b) => a.id.localeCompare(b.id));
	writeIndex(indexAbs, data);

	console.log(JSON.stringify({
		indexPath: INDEX_REL,
		today,
		...result,
	}, null, 2));
}

main();
