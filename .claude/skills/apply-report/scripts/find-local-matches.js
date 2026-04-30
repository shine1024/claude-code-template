/**
 * 적용된 규칙과 CLAUDE.local.md 의 "## 공유 가능" 섹션 블록을 비교하여
 * 매칭 후보를 출력합니다. (블록 추출 로직은 share-rules/extract-shareable.js 와 동일)
 *
 * 입력 (stdin, JSON):
 *   [{ "id": 1, "text": "규칙 본문..." }, ...]
 *
 * 출력 (stdout, JSON):
 *   {
 *     "blocks":  [{ "id": 1, "text": "..." }, ...],          ← 공유 가능 섹션의 모든 블록
 *     "matches": [{ "ruleId": 1, "blockId": 2, "score": 0.62 }, ...]  ← score 0.4 이상만
 *   }
 *
 * 매칭은 토큰 교집합 / min(토큰수) 비율(0~1). 한국어/영문 단어 단위.
 *
 * Usage: echo '[{"id":1,"text":"..."}]' | node find-local-matches.js
 */

const fs = require('fs');
const path = require('path');

function extractShareableBlocks(content) {
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

	return merged;
}

function tokenize(text) {
	return text
		.toLowerCase()
		.replace(/[^\w가-힣\s]/g, ' ')
		.split(/\s+/)
		.filter(t => t.length >= 2);
}

function similarity(a, b) {
	const ta = new Set(tokenize(a));
	const tb = new Set(tokenize(b));
	if (ta.size === 0 || tb.size === 0) return 0;
	let inter = 0;
	for (const t of ta) if (tb.has(t)) inter++;
	return inter / Math.min(ta.size, tb.size);
}

function readStdin() {
	return new Promise(resolve => {
		let data = '';
		process.stdin.setEncoding('utf8');
		process.stdin.on('data', chunk => { data += chunk; });
		process.stdin.on('end', () => resolve(data));
	});
}

async function main() {
	const filePath = path.join(process.cwd(), 'CLAUDE.local.md');
	const blocks = fs.existsSync(filePath)
		? extractShareableBlocks(fs.readFileSync(filePath, 'utf8'))
		: [];

	const stdinData = await readStdin();
	let rules = [];
	try {
		rules = stdinData.trim() ? JSON.parse(stdinData) : [];
	} catch (e) {
		console.error('stdin JSON 파싱 실패: ' + e.message);
		process.exit(1);
	}

	const blockObjs = blocks.map((text, idx) => ({ id: idx + 1, text }));
	const matches = [];
	for (const rule of rules) {
		for (const block of blockObjs) {
			const score = similarity(rule.text || '', block.text);
			if (score >= 0.4) {
				matches.push({
					ruleId: rule.id,
					blockId: block.id,
					score: Math.round(score * 100) / 100,
				});
			}
		}
	}
	matches.sort((a, b) => b.score - a.score);

	console.log(JSON.stringify({ blocks: blockObjs, matches }, null, 2));
}

main();
