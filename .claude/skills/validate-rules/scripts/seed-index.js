/**
 * .claude/state/rules-index.json 을 git log 기반으로 1회 시드한다.
 *
 * Usage:
 *   node seed-index.js [--force]
 *
 * 동작:
 *   - .claude/rules/*.md 를 모두 스캔 (.md 가 아닌 파일은 자연스럽게 제외)
 *   - 각 파일의 git log 첫 커밋 날짜를 added_at, last_validated_at 으로 사용
 *   - git 추적 이력이 없는 파일(신규)은 오늘 날짜로 시드
 *   - 기존 인덱스 파일이 있으면 종료 (--force 로 덮어쓰기)
 *
 * 인덱스 위치 주의: .claude/state/ 는 /sync-template 시 제외되는 디렉토리이므로
 * 검증 이력이 sync 로 휘발되지 않는다.
 *
 * 출력: 시드 결과 JSON (indexPath, ruleCount, rules[{id, added_at}])
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const INDEX_REL = '.claude/state/rules-index.json';

function todayStr() {
	const d = new Date();
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

function readTitle(absPath) {
	const content = fs.readFileSync(absPath, 'utf8');
	for (const line of content.split(/\r?\n/)) {
		const m = /^#\s+(.+?)\s*$/.exec(line);
		if (m) return m[1].trim();
	}
	return null;
}

function gitFirstCommitDate(relPosix, cwd) {
	try {
		const out = execFileSync(
			'git',
			['log', '--reverse', '--format=%ad', '--date=short', '--', relPosix],
			{ cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
		);
		const first = out.split(/\r?\n/).find(l => /^\d{4}-\d{2}-\d{2}$/.test(l));
		return first || null;
	} catch (e) {
		return null;
	}
}

function main() {
	const force = process.argv.slice(2).includes('--force');
	const cwd = process.cwd();
	const rulesDir = path.join(cwd, '.claude', 'rules');

	if (!fs.existsSync(rulesDir)) {
		console.error('.claude/rules/ 디렉토리가 없습니다.');
		process.exit(1);
	}

	const indexAbs = path.join(cwd, INDEX_REL);
	if (fs.existsSync(indexAbs) && !force) {
		console.error(`${INDEX_REL} 이 이미 존재합니다. 덮어쓰려면 --force 사용.`);
		process.exit(1);
	}

	const files = fs.readdirSync(rulesDir)
		.filter(f => f.endsWith('.md'))
		.sort();

	const today = todayStr();
	const rules = [];

	for (const f of files) {
		const relPosix = `.claude/rules/${f}`;
		const absPath = path.join(rulesDir, f);
		const id = path.basename(f, '.md');
		const title = readTitle(absPath) || id;
		const firstDate = gitFirstCommitDate(relPosix, cwd) || today;
		rules.push({
			id,
			file: relPosix,
			title,
			added_at: firstDate,
			last_validated_at: firstDate,
		});
	}

	const data = { rules };
	fs.mkdirSync(path.dirname(indexAbs), { recursive: true });
	fs.writeFileSync(indexAbs, JSON.stringify(data, null, 2) + '\n');

	console.log(JSON.stringify({
		indexPath: INDEX_REL,
		ruleCount: rules.length,
		rules: rules.map(r => ({ id: r.id, added_at: r.added_at })),
	}, null, 2));
}

main();
