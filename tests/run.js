// claude-code-template 통합 테스트 러너.
// 사용법: node tests/run.js <scenario>
//
// 시나리오 디렉토리: tests/scenarios/<scenario>/
//   - prompt.md   자식 claude 에 전달할 지시
//   - verify.js   module.exports = function(ctx) -> Check[]
//   - README.md   설명
//
// sandbox 상태는 시작 시점 HEAD 를 baseline 으로 기록 후 끝에 reset 으로 원복한다.

const fs   = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const SANDBOX     = process.env.SANDBOX_PATH || 'D:/claude-code-sandbox';
const DEPLOY_ROOT = process.env.DEPLOY_ROOT  || 'D:/claude-code-sandbox-deploy';
const SRC_ROOT    = path.join(SANDBOX, 'src/main/resources');

function git(args, opts = {}) {
    return execFileSync('git', ['-C', SANDBOX, ...args], { encoding: 'utf8', ...opts }).trim();
}

function abort(msg) { console.error(`[runner] ${msg}`); process.exit(1); }

function clearDeployRoot() {
    if (!fs.existsSync(DEPLOY_ROOT)) {
        fs.mkdirSync(DEPLOY_ROOT, { recursive: true });
        return;
    }
    for (const entry of fs.readdirSync(DEPLOY_ROOT)) {
        fs.rmSync(path.join(DEPLOY_ROOT, entry), { recursive: true, force: true });
    }
}

function spawnClaude(prompt) {
    // Windows + Node 의 spawnSync 는 .cmd 직접 호출이 까다로움.
    // bash -c 로 wrap 하고 prompt 는 환경변수로 전달해 따옴표·줄바꿈·한국어 escape 이슈를 회피한다.
    const args = ['-c', 'claude -p --dangerously-skip-permissions "$PROMPT"'];
    const result = spawnSync('bash', args, {
        cwd: SANDBOX,
        env: { ...process.env, PROMPT: prompt },
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
    });
    return {
        stdout: result.stdout || '',
        stderr: result.stderr || '',
        status: result.status,
        error:  result.error,
        signal: result.signal,
    };
}

function loadVerify(scenarioDir) {
    const verifyPath = path.join(scenarioDir, 'verify.js');
    if (!fs.existsSync(verifyPath)) abort(`verify.js missing: ${verifyPath}`);
    delete require.cache[require.resolve(verifyPath)];
    return require(verifyPath);
}

function run(name) {
    const scenarioDir = path.join(__dirname, 'scenarios', name);
    if (!fs.existsSync(scenarioDir)) abort(`scenario not found: ${name}`);

    const promptPath = path.join(scenarioDir, 'prompt.md');
    if (!fs.existsSync(promptPath)) abort(`prompt.md missing: ${promptPath}`);
    const prompt = fs.readFileSync(promptPath, 'utf8');

    if (!fs.existsSync(path.join(SANDBOX, '.git'))) abort(`sandbox is not a git repo: ${SANDBOX}`);

    const status = git(['status', '--porcelain']);
    if (status) {
        console.error('[runner] sandbox working tree is dirty. commit or stash first:');
        console.error(status);
        process.exit(1);
    }

    const baseline = git(['rev-parse', 'HEAD']);
    console.log(`[runner] scenario   : ${name}`);
    console.log(`[runner] sandbox    : ${SANDBOX}`);
    console.log(`[runner] baseline   : ${baseline}`);
    console.log(`[runner] deploy_root: ${DEPLOY_ROOT}`);

    console.log('[runner] setup — reset + clean + DEPLOY_ROOT clear');
    git(['reset', '--hard', baseline]);
    git(['clean', '-fd']);
    clearDeployRoot();

    console.log('[runner] spawning child claude...');
    const child = spawnClaude(prompt);
    console.log(`[runner] child exit: ${child.status} signal: ${child.signal || '-'}`);
    if (child.error)  console.log(`[runner] child error: ${child.error.message}`);
    if (child.stdout) console.log(`[runner] child stdout:\n${child.stdout.trim()}`);
    if (child.stderr) console.log(`[runner] child stderr:\n${child.stderr.trim()}`);

    console.log('[runner] verify');
    const verify = loadVerify(scenarioDir);
    const ctx = {
        sandbox: SANDBOX,
        deployRoot: DEPLOY_ROOT,
        srcRoot: SRC_ROOT,
        baseline,
        childStdout: child.stdout,
        childStderr: child.stderr,
    };
    const checks = verify(ctx) || [];

    let pass = 0, fail = 0;
    for (const c of checks) {
        const symbol = c.pass ? '✓' : '✗';
        const msg = c.message ? ` — ${c.message}` : '';
        console.log(`  ${symbol} ${c.name}${msg}`);
        if (c.pass) pass++; else fail++;
    }
    console.log(`\n[runner] ${pass}/${checks.length} PASS`);

    console.log('[runner] teardown — reset + clean + DEPLOY_ROOT clear');
    git(['reset', '--hard', baseline]);
    git(['clean', '-fd']);
    clearDeployRoot();

    process.exit(fail === 0 ? 0 : 1);
}

const name = process.argv[2];
if (!name) abort('usage: node tests/run.js <scenario>');
run(name);
