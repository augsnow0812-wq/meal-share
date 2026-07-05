# 밥친구 (meal-share)

친구 3명이 간식·저녁 사진을 공유하고 주간 그리드로 서로의 식단을 확인하는 웹 서비스.

## 기능

- 사용자 3명 하드코딩 (로그인 없음, 첫 접속 시 본인 선택 → `localStorage`)
- 사진 등록: 브라우저 촬영(촬영 시각 워터마크 자동 합성) / 앨범 업로드
- 홈: 월~일 기준 주간 그리드 (친구 × 요일), 이전 주 이동 가능
- 상세 모달: 원본 사진 + 메타 + 본인 게시물 삭제
- 30일이 지난 사진은 매일 03:00 UTC 크론으로 자동 삭제 (무료 티어 절약)

## 로컬 실행

```bash
npm install
npm run dev
```

카메라 API는 HTTPS 또는 `localhost`에서만 동작합니다. 로컬 개발은 `localhost:3000`으로 접속하세요.

## 배포 (Vercel)

1. GitHub에 이 저장소를 push
2. Vercel에서 새 프로젝트 임포트
3. **Storage 탭에서 두 개 생성**:
   - **Postgres** (Neon 통합) → 프로젝트에 연결
   - **Blob** → 프로젝트에 연결
   - 연결하면 `POSTGRES_URL`, `BLOB_READ_WRITE_TOKEN` 등 env가 자동 주입됨
4. (선택) `CRON_SECRET` 환경 변수 추가 → 크론 엔드포인트 보호
5. 배포 후 첫 접속 시 자동으로 스키마가 생성됨 (또는 `POST /api/init` 수동 호출)

## 사용자 이름 변경

앱 상단 좌측의 본인 이름/이모지를 탭하면 닉네임 수정 모달이 열립니다. 저장하면 서버 DB에 반영되어 모든 친구 화면에서 동일하게 보입니다.

기본값(첫 배포 시 자동 시딩)은 `src/lib/users.ts`의 `DEFAULT_USERS`에서 수정할 수 있습니다. 이미 DB에 시딩된 뒤에는 기본값을 바꿔도 반영되지 않으니, 그 이후에는 UI에서 수정하세요.

## 데이터 보존

- 사진과 게시물 모두 **30일** 후 자동 삭제 (`src/app/api/cleanup/route.ts`의 `RETENTION_DAYS`)
- 삭제 주기 변경: `vercel.json`의 `schedule` (cron 표현식)

## 스택

- Next.js 16 (App Router, Turbopack)
- React 19 / TypeScript / Tailwind CSS 4
- Vercel Postgres (Neon) + Vercel Blob
- date-fns

## 주요 파일

- 사용자 기본값: `src/lib/users.ts` / 서버 API: `src/app/api/users/`
- 닉네임 편집 UI: `src/components/NicknameEditor.tsx`
- DB 헬퍼: `src/lib/db.ts`
- 주 계산: `src/lib/week.ts`
- 카메라 + 워터마크: `src/components/CameraCapture.tsx`
- 홈 그리드: `src/components/WeeklyGrid.tsx`
- 업로드 페이지: `src/app/upload/page.tsx`
- API: `src/app/api/posts/route.ts`, `src/app/api/posts/[id]/route.ts`, `src/app/api/cleanup/route.ts`
