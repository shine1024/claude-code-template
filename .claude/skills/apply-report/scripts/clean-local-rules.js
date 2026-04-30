/**
 * CLAUDE.local.md 의 "## 공유 가능" 섹션에서 지정된 블록 ID 의 규칙을 제거합니다.
 * 블록 ID 는 find-local-matches.js 의 출력에서 부여된 1부터의 일련번호와 동일합니다.
 *
 * 입력 (stdin, JSON):
 *   { "blockIds": [1, 3, 5] }
 *
 * 동작:
 *   - "## 공유 가능" 섹션 내에서 해당 블록의 라인을 삭제
 *   - 인접한 빈 줄이 3줄 이상 연속되면 1줄로 축약
 *   - "## 비공유" 등 다른 섹션은 절대 건드리지 않음
 *
 * 출력:
 *   { "removed": N, "skipped": [블록ID 들], "filePath": "CLAUDE.local.md" }
 *
 * Usage: echo '{"blockIds":[1,3]}' | node clean-local-rules.js
 */

const fs = require('fs');
const path = require('path');

function readStdin() {
	return new Promise(resolve => {
		let data = '';
		process.stdin.setEncoding('utf8');
		process.stdin.on('data', chunk => { data += chunk; });
		process.stdin.on('end', () => resolve(data));
	});
}

/**
 * "## 공유 가능" 섹션 내 블록을 라인 범위 정보와 함께 추출합니다.
 * 추출 로직은 share-rules/extract-shareable.js 와 동일하되, 각 블록이 차지한 라인 번호를 보존합니다.
 */
function extractBlocksWithRanges(lines) {
	let secStart = -1;
	let secEnd = lines.length;
	for (let i = 0; i < lines.length; i++) {
		const m = lines[i].match(/^##\s+(.+?)\s*$/);
		if (!m) continue;
		if (m[1].trim() === '공유 가능') {
			secStart = i + 1;
		} else if (secStart !== -1) {
			secEnd = i;
			break;
		}
	}
	if (secStart === -1) return { blocks: [], secStart, secEnd };

	const rawBlocks = [];
	let current = null;
	for (let i = secStart; i < secEnd; i++) {
		const line = lines[i];
		if (line.trim() === '') {
			if (current) {
				rawBlocks.push(current);
				current = null;
			}
		} else {
			if (!current) current = { text: '', startLine: i, endLine: i };
			current.text += (current.text ? '\n' : '') + line;
			current.endLine = i;
		}
	}
	if (current) rawBlocks.push(current);

	const merged = [];
	for (const block of rawBlocks) {
		const trimmed = block.text.trim();
		if (!trimmed || trimmed === '---' || trimmed.startsWith('<!--')) continue;
		if (/^#{1,6}\s/.test(trimmed)) {
			merged.push({ ranges: [[block.startLine, block.endLine]] });
		} else if (merged.length > 0) {
			merged[merged.length - 1].ranges.push([block.startLine, block.endLine]);
		} else {
			merged.push({ ranges: [[block.startLine, block.endLine]] });
		}
	}

	return { blocks: merged, secStart, secEnd };
}

function collapseBlankLines(lines) {
	const out = [];
	let blanks = 0;
	for (const l of lines) {
		if (l.trim() === '') {
			blanks++;
			if (blanks <= 1) out.push(l);
		} else {
			blanks = 0;
			out.push(l);
		}
	}
	return out;
}

async function main() {
	const filePath = path.join(process.cwd(), 'CLAUDE.local.md');
	if (!fs.existsSync(filePath)) {
		console.error('CLAUDE.local.md 가 없습니다.');
		process.exit(1);
	}

	const stdinData = await readStdin();
	let payload;
	try {
		payload = stdinData.trim() ? JSON.parse(stdinData) : {};
	} catch (e) {
		console.error('stdin JSON 파싱 실패: ' + e.message);
		process.exit(1);
	}
	const blockIds = Array.isArray(payload.blockIds) ? payload.blockIds : [];
	if (blockIds.length === 0) {
		console.log(JSON.stringify({ removed: 0, skipped: [], filePath: 'CLAUDE.local.md' }));
		return;
	}

	const content = fs.readFileSync(filePath, 'utf8');
	const lines = content.split(/\r?\n/);
	const { blocks } = extractBlocksWithRanges(lines);

	const removeLines = new Set();
	const skipped = [];
	let removed = 0;
	for (const id of blockIds) {
		const block = blocks[id - 1];
		if (!block) {
			skipped.push(id);
			continue;
		}
		for (const [s, e] of block.ranges) {
			for (let i = s; i <= e; i++) removeLines.add(i);
		}
		removed++;
	}

	if (removed === 0) {
		console.log(JSON.stringify({ removed: 0, skipped, filePath: 'CLAUDE.local.md' }));
		return;
	}

	const filtered = lines.filter((_, i) => !removeLines.has(i));
	const collapsed = collapseBlankLines(filtered);
	fs.writeFileSync(filePath, collapsed.join('\n'), 'utf8');

	console.log(JSON.stringify({ removed, skipped, filePath: 'CLAUDE.local.md' }));
}

main();
