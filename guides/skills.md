# 스킬 (Skills) 가이드

Claude Code에서 스킬은 `/스킬명` 으로 직접 호출하는 커스텀 커맨드입니다.  
`.claude/skills/<스킬명>/SKILL.md` 파일로 정의하며, 세션 중 자동으로 감지됩니다.

---

## 스킬 파일 구조

```
.claude/skills/
└── <스킬명>/
    ├── SKILL.md        ← 필수: 스킬 실행 지침
    ├── template.md     ← 선택: Claude가 채울 템플릿
    ├── examples/       ← 선택: 예시 파일
    └── scripts/        ← 선택: 실행 스크립트
```

---

## 현재 구성된 스킬

### /session-log — 세션 회고 기록

**용도**: 현재 세션을 분석해 회고 초안을 작성하고 Google Sheets에 제출

**사용법**: 세션 종료 전 `/session-log` 입력

**실행 절차**
1. `CLAUDE.local.md`에서 이름·시스템명·제출 URL 읽기
2. 세션 전체 대화를 분석해 회고 초안 작성
3. 소요시간 질문
4. 초안 확인 후 수정 또는 제출

**사전 설정** (`CLAUDE.local.md`에 아래 항목 추가)

```markdown
## 세션 회고 설정 (/session-log)

- 세션회고_이름: [이름]
- 세션회고_시스템명: [프로젝트명]
- 세션회고_SCRIPT_URL: [Google Apps Script 배포 URL]
```

**Google Sheets 연동 구성**
- Google Sheets에 시트 생성 (date, name, system, requirements, wentWell, wentWrong, ruleImprovement, duration, other 컬럼)
- Google Apps Script로 POST 수신 엔드포인트 배포
- 배포 URL을 `세션회고_SCRIPT_URL`에 입력
