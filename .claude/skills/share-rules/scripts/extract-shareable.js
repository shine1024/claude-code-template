/**
 * CLAUDE.local.md 의 "## 공유 가능" 섹션 본문을 추출하여
 * 빈 줄 기준으로 분할된 규칙 블록 JSON 배열을 출력합니다.
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
			inSection = heading[1].trim() === '공유 가능';
			continue;
		}
		if (inSection) sectionLines.push(line);
	}

	const blocks = sectionLines
		.join('\n')
		.split(/\n\s*\n/)
		.map(b => b.replace(/^\s+|\s+$/g, ''))
		.filter(Boolean);

	const rules = blocks.map(rule => ({ rule }));
	console.log(JSON.stringify(rules, null, 2));
}

main();
