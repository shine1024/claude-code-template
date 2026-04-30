/**
 * CLAUDE.local.md 의 "## 공유 가능" 섹션을 추출하여 규칙 블록 JSON 배열을 출력합니다.
 *
 * 규칙 포맷: 각 규칙은 ### 헤딩으로 시작하고 본문을 바로 아래에 작성한다.
 *   ### 규칙 제목
 *   규칙 본문
 *
 * 처리 규칙:
 *   - 빈 줄로 분할 후 ### 헤딩 블록에 이어지는 내용을 하나로 병합
 *   - HTML 주석(<!-- ... -->), --- 구분자는 제외
 *
 * Usage: node extract-shareable.js
 * Output: [{ rule: "..." }, ...]
 */

const fs = require('fs');
const path = require('path');

function main() {
	const filePath = path.join(process.cwd(), 'CLAUDE.local.md');

	if (!fs.existsSync(filePath)) {
		console.log(JSON.stringify([]));
		return;
	}

	const content = fs.readFileSync(filePath, 'utf8');
	const lines = content.split(/\r?\n/);

	let inSection = false;
	const sectionLines = [];

	for (const line of lines) {
		const heading = line.match(/^##\s+(.+?)\s*$/);
		if (heading) {
			if (inSection) break;
			inSection = heading[1].trim() === '공유 가능';
			continue;
		}
		if (inSection) sectionLines.push(line);
	}

	const rawBlocks = sectionLines
		.join('\n')
		.split(/\n\s*\n/)
		.map(b => b.replace(/^\s+|\s+$/g, ''))
		.filter(b => b && b !== '---' && !b.startsWith('<!--'));

	const merged = [];
	for (const block of rawBlocks) {
		if (/^#{1,6}\s/.test(block)) {
			merged.push(block);
		} else if (merged.length > 0) {
			merged[merged.length - 1] += '\n' + block;
		} else {
			merged.push(block);
		}
	}

	const rules = merged.map(rule => ({ rule }));
	console.log(JSON.stringify(rules, null, 2));
}

main();
