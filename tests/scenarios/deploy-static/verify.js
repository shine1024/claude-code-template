// deploy-static 시나리오 검증.
// 자식 claude 가 4개 파일을 수정한 뒤 deploy-static 훅이 정확히 동작했는지 확인한다.

const fs   = require('fs');
const path = require('path');

function exists(p) { return fs.existsSync(p); }
function read(p)   { return exists(p) ? fs.readFileSync(p, 'utf8') : ''; }

module.exports = function verify(ctx) {
    const { sandbox, deployRoot } = ctx;

    const appJs    = path.join(deployRoot, 'static/js/app.js');
    const styleCss = path.join(deployRoot, 'static/css/style.css');
    const sampleHb = path.join(deployRoot, 'templates/sample.hbs');
    const buildGd  = path.join(deployRoot, 'build.gradle');
    const cacheLog = path.join(sandbox, '.claude/cache/modified_files.log');

    return [
        { name: 'V1 app.js exists',       pass: exists(appJs),                              message: appJs },
        { name: 'V2 app.js verified',     pass: read(appJs).includes("'[reservation] verified'"), message: "'[reservation] verified' 포함" },
        { name: 'V3 style.css exists',    pass: exists(styleCss),                           message: styleCss },
        { name: 'V4 style.css #111',      pass: read(styleCss).includes('color: #111;'),    message: 'color: #111; 포함' },
        { name: 'V5 sample.hbs exists',   pass: exists(sampleHb),                           message: sampleHb },
        { name: 'V6 sample.hbs verified', pass: read(sampleHb).includes('(verified)'),      message: '(verified) 포함' },
        { name: 'V7 build.gradle absent', pass: !exists(buildGd),                           message: '화이트리스트 외 파일은 미복사' },
        { name: 'V8 log cleared',         pass: !exists(cacheLog),                          message: 'modified_files.log 자동 삭제' },
    ];
};
