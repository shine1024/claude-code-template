/**
 * .claude/state/rules-index.json 에 변경을 일괄 적용한다.
 *
 * 입력 (stdin JSON):
 *   {
 *     "touch":  ["id1", "id2"],   // last_validated_at 을 오늘로 갱신
 *     "remove": ["id3"]           // entry 자체 제거
 *   }
 *
 * Usage:
 *   echo '{"touch":["foo"],"remove":["bar"]}' | node apply-index-changes.js
 *
 * 출력 (JSON):
 *   {
 *     "indexPath": ".claude/state/rules-index.json",
 *     "today": "YYYY-MM-DD",
 *     "touched": ["id1","id2"],
 *     "removed": ["id3"],
 *     "notFound": [{"op":"touch|remove","id":"..."}]
 *   }
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

function readStdin() {
	return new Promise((resolve, reject) => {
		let data = '';
		process.stdin.setEncoding('utf8');
		process.stdin.on('data', chunk => { data += chunk; });
		process.stdin.on('end', () => resolve(data));
		process.stdin.on('error', reject);
	});
}

async function main() {
	const cwd = process.cwd();
	const indexAbs = path.join(cwd, INDEX_REL);
	if (!fs.existsSync(indexAbs)) {
		console.error(`${INDEX_REL} 이 없습니다.`);
		process.exit(1);
	}

	const raw = await readStdin();
	if (!raw.trim()) {
		console.error('stdin 입력이 비어있습니다. JSON 을 전달하세요.');
		process.exit(1);
	}

	let input;
	try {
		input = JSON.parse(raw);
	} catch (e) {
		console.error(`stdin JSON 파싱 실패: ${e.message}`);
		process.exit(1);
	}

	const touchIds = Array.isArray(input.touch) ? input.touch : [];
	const removeIds = Array.isArray(input.remove) ? input.remove : [];

	const data = JSON.parse(fs.readFileSync(indexAbs, 'utf8'));
	if (!Array.isArray(data.rules)) data.rules = [];

	const today = todayStr();
	const result = { touched: [], removed: [], notFound: [] };

	const removeSet = new Set(removeIds);
	for (const id of touchIds) {
		if (removeSet.has(id)) continue; // remove 가 우선
		const entry = data.rules.find(r => r.id === id);
		if (!entry) { result.notFound.push({ op: 'touch', id }); continue; }
		entry.last_validated_at = today;
		result.touched.push(id);
	}

	const before = data.rules.length;
	data.rules = data.rules.filter(r => {
		if (removeSet.has(r.id)) {
			result.removed.push(r.id);
			return false;
		}
		return true;
	});
	if (before - data.rules.length !== removeIds.length) {
		for (const id of removeIds) {
			if (!result.removed.includes(id)) result.notFound.push({ op: 'remove', id });
		}
	}

	data.rules.sort((a, b) => a.id.localeCompare(b.id));
	fs.writeFileSync(indexAbs, JSON.stringify(data, null, 2) + '\n');

	console.log(JSON.stringify({
		indexPath: INDEX_REL,
		today,
		...result,
	}, null, 2));
}

main();
