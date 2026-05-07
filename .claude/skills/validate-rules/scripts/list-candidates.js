/**
 * .claude/state/rules-index.json 에서 검증 후보를 추출한다.
 *
 * Usage:
 *   node list-candidates.js [--force]
 *
 * 일반 모드 (기본):
 *   - 추가 후 60일 경과 + 미검증 (added_at == last_validated_at)
 *   - 또는 마지막 검증 후 180일 경과
 *   - last_validated_at 오름차순으로 최대 10건
 *
 * --force 모드:
 *   - 모든 entry, 상한 무시
 *
 * 출력 (JSON):
 *   {
 *     "indexPath": ".claude/state/rules-index.json",
 *     "today": "YYYY-MM-DD",
 *     "mode": "normal" | "force",
 *     "thresholds": { "added": 60, "validated": 180, "max": 10 },
 *     "totalCandidates": N,
 *     "truncated": true|false,
 *     "candidates": [{ id, file, title, added_at, last_validated_at, reason }],
 *     "skippedRules": [{ id, reason }]
 *   }
 */

const fs = require('fs');
const path = require('path');

const INDEX_REL = '.claude/state/rules-index.json';
const ADDED_THRESHOLD_DAYS = 60;
const VALIDATED_THRESHOLD_DAYS = 180;
const MAX_CANDIDATES = 10;

function todayStr() {
	const d = new Date();
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

function parseDate(str) {
	const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str || '');
	if (!m) return null;
	return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function daysBetween(fromStr, today) {
	const d = parseDate(fromStr);
	if (!d) return Infinity;
	return Math.floor((today - d) / (1000 * 60 * 60 * 24));
}

function main() {
	const force = process.argv.slice(2).includes('--force');
	const cwd = process.cwd();
	const indexAbs = path.join(cwd, INDEX_REL);

	if (!fs.existsSync(indexAbs)) {
		console.error(`${INDEX_REL} 이 없습니다. 시드 스크립트를 먼저 실행하세요:`);
		console.error('  node .claude/skills/validate-rules/scripts/seed-index.js');
		process.exit(1);
	}

	let data;
	try {
		data = JSON.parse(fs.readFileSync(indexAbs, 'utf8'));
	} catch (e) {
		console.error(`${INDEX_REL} 파싱 실패: ${e.message}`);
		process.exit(1);
	}

	const today = parseDate(todayStr());
	const candidates = [];
	const skippedRules = [];

	for (const r of (data.rules || [])) {
		const filePath = path.join(cwd, r.file || '');
		if (!r.file || !fs.existsSync(filePath)) {
			skippedRules.push({ id: r.id, reason: '파일 없음 (index 정리 필요)' });
			continue;
		}

		if (force) {
			candidates.push({ ...r, reason: '--force' });
			continue;
		}

		const addedDays = daysBetween(r.added_at, today);
		const validatedDays = daysBetween(r.last_validated_at, today);
		const neverValidated = r.added_at === r.last_validated_at;

		let reason = null;
		if (neverValidated && addedDays >= ADDED_THRESHOLD_DAYS) {
			reason = `추가 후 ${addedDays}일 미검증`;
		} else if (validatedDays >= VALIDATED_THRESHOLD_DAYS) {
			reason = `마지막 검증 후 ${validatedDays}일 경과`;
		}

		if (reason) candidates.push({ ...r, reason });
	}

	candidates.sort((a, b) =>
		(a.last_validated_at || '').localeCompare(b.last_validated_at || '')
	);

	let limited = candidates;
	let truncated = false;
	if (!force && candidates.length > MAX_CANDIDATES) {
		limited = candidates.slice(0, MAX_CANDIDATES);
		truncated = true;
	}

	console.log(JSON.stringify({
		indexPath: INDEX_REL,
		today: todayStr(),
		mode: force ? 'force' : 'normal',
		thresholds: {
			added: ADDED_THRESHOLD_DAYS,
			validated: VALIDATED_THRESHOLD_DAYS,
			max: MAX_CANDIDATES,
		},
		totalCandidates: candidates.length,
		truncated,
		candidates: limited,
		skippedRules,
	}, null, 2));
}

main();
