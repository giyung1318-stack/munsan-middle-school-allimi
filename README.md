# 문산중 알리미

React + TypeScript + Vite 기반 문산중학교 학교 정보 서비스입니다. 화면에서 실제 NEIS 응답과 예시 일정을 구분하고, 실제 자료가 없으면 빈 상태를 표시합니다.

## 실행

```bash
pnpm install
pnpm dev
```

터미널에 표시되는 주소(보통 http://localhost:5173)를 브라우저에서 엽니다. npm을 쓰고 싶다면 `npm install`, `npm run dev`, `npm run build`를 사용해도 됩니다. 배포용 빌드는 `pnpm build`입니다.

## Supabase 연결

1. Supabase 프로젝트의 **Project Settings → API**에서 Project URL과 Publishable key를 확인합니다.
2. 루트의 `.env.example` 파일을 복사해 `.env.local` 파일을 만듭니다.
3. `VITE_SUPABASE_URL`에 프로젝트 URL, `VITE_SUPABASE_PUBLISHABLE_KEY`에 Publishable key를 입력합니다. 프로젝트 URL은 예시 파일에 미리 입력했습니다.
4. 개발 서버를 재시작합니다. `.env.local`은 Git에 포함되지 않습니다.

Publishable key는 브라우저에서 쓸 수 있지만 데이터 접근 보호는 RLS 정책이 담당합니다. `service_role` 키와 DB 비밀번호는 프론트엔드에 넣지 마세요. `supabase/migrations/0001_initial_schema.sql`의 프로필, 자료실, private Storage 정책은 연결된 Supabase 프로젝트에 적용했습니다. 사용자는 본인의 표시 이름만 변경할 수 있으며, 교사 권한은 가입 시 선택만으로 얻지 못합니다.

## NEIS 연동

NEIS 인증 키는 서버 측에만 보관합니다. `supabase/functions/neis-calendar`와 `supabase/functions/neis-timetable` Edge Functions가 각각 `SchoolSchedule`, `misTimetable`을 호출하며, 함수 코드는 학교 코드 `J10` / `7681006`을 고정으로 사용합니다. 현재 설정된 `.env.local`의 서버 프록시 주소로 실제 요청을 보냅니다. NEIS 키는 Supabase Dashboard → Edge Functions → Secrets의 `NEIS_API_KEY` 비밀값으로만 관리하며 이 키를 `.env.local`, 프런트엔드, GitHub에 넣지 마세요.

로컬 `.env.local`에는 `VITE_NEIS_PROXY_URL=https://eujcyglosxurjfbmcncl.supabase.co`를 지정합니다. 이 주소와 Supabase Publishable key는 공개 클라이언트 설정이며, NEIS 키는 함수의 서버 비밀 값으로만 보관합니다. 응답 형식은 일정 `{ "events": [{"date":"YYYY-MM-DD","title":"...","category":"..."}] }`, 시간표 `{ "lessons": [{"period":1,"subject":"..."}] }`입니다.

학교 정보: 문산중학교, 교육청 코드 `J10`, 학교 코드 `7681006`.

## 시간표 변경 표시와 사용자 설정

NEIS 시간표 API는 현재 시간표 데이터를 반환하지만, 공식 변경 이력/원본 시간표는 이 서비스가 조회하지 않습니다. 따라서 앱은 같은 날짜·학년·반의 브라우저 첫 실제 응답을 로컬 기준으로 저장하고 이후 응답과 비교합니다. 서로 다른 교시 정보가 관찰되면 해당 교시에 `변동됨` 배지가 표시됩니다. 첫 조회, 브라우저 저장 공간 초기화, 다른 기기에서는 비교 기준이 없으므로 일반 시간표로 나옵니다. 이 표시는 NEIS의 공식 변경 내역 확인을 뜻하지 않습니다.

설정의 테마, 기본 학년·반과 비교 기준은 브라우저 로컬 저장소에 저장됩니다. 개인정보처리방침의 운영 주체와 문의처는 서비스 운영자가 확정한 뒤 설정해야 합니다. 배포에서 `VITE_PRIVACY_CONTACT_EMAIL`을 지정하면 해당 문의 이메일이 방침에 표시됩니다.

## GitHub Pages

저장소 이름이 `munsan-middle-school-allimi`라면 Actions 빌드에서 `VITE_BASE_PATH=/munsan-middle-school-allimi/`를 지정합니다. 사용자/저장소 페이지라면 `/`를 씁니다. `vite.config.ts`가 이 값을 Vite `base`로 반영합니다. 화면 이동에는 HashRouter를 사용해 GitHub Pages의 새로고침 404를 피합니다.

## 배포와 후속 확인

- GitHub 공개 저장소와 Pages 배포: `.github/workflows/deploy.yml`이 저장소의 `main` 푸시 때 빌드·배포하도록 준비되어 있습니다. Pages 저장소 변수 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_NEIS_PROXY_URL`을 지정합니다. 저장소 인증과 배포 실행 결과는 GitHub에서 별도로 확인해야 합니다.
- NEIS 실데이터: Supabase Edge Function Secret `NEIS_API_KEY` 설정은 Supabase에서 관리합니다. 키는 프런트엔드 빌드에 포함하지 않습니다.
- 실제 로그인/가입과 파일 전송: 계정이 있어야 인증 상태에 따른 가입·로그인·자료 업로드/다운로드를 끝까지 검증할 수 있습니다.
- 교사 승인 처리: 관리자 승인 절차는 DB 권한 상승 없이 운영자용 안전한 관리 인터페이스를 추가하는 단계가 남아 있습니다.
