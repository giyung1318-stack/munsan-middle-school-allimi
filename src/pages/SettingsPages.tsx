import { Link } from 'react-router-dom'
import { Moon, ShieldCheck, Sun } from 'lucide-react'
import type { AppPreferences } from '../lib/preferences'

function Title({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
  return <div className="page-title"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{desc}</p></div>
}

export function SettingsPage({ preferences, onChange }: { preferences: AppPreferences; onChange: (next: AppPreferences) => void }) {
  return <>
    <Title eyebrow="PREFERENCES" title="설정" desc="이 브라우저에 저장되는 화면과 시간표 기본값을 관리합니다."/>
    <section className="panel settings-panel">
      <div className="settings-group">
        <div><h2>화면 테마</h2><p>원하는 화면 밝기를 선택하세요. 설정은 이 기기에 저장됩니다.</p></div>
        <div className="theme-options" role="group" aria-label="화면 테마">
          <button type="button" className={`button ${preferences.theme === 'light' ? 'primary' : 'secondary'}`} aria-pressed={preferences.theme === 'light'} onClick={() => onChange({ ...preferences, theme: 'light' })}><Sun size={17}/>밝게</button>
          <button type="button" className={`button ${preferences.theme === 'dark' ? 'primary' : 'secondary'}`} aria-pressed={preferences.theme === 'dark'} onClick={() => onChange({ ...preferences, theme: 'dark' })}><Moon size={17}/>어둡게</button>
        </div>
      </div>
      <div className="settings-group">
        <div><h2>시간표 기본 선택</h2><p>시간표 페이지를 열 때 처음 선택할 학년과 반입니다.</p></div>
        <div className="settings-selects">
          <label>기본 학년<select value={preferences.defaultGrade} onChange={e => onChange({ ...preferences, defaultGrade: Number(e.target.value) })}>{[1,2,3].map(grade => <option key={grade} value={grade}>{grade}학년</option>)}</select></label>
          <label>기본 반<select value={preferences.defaultClassroom} onChange={e => onChange({ ...preferences, defaultClassroom: Number(e.target.value) })}>{Array.from({ length: 12 }, (_, i) => i + 1).map(room => <option key={room} value={room}>{room}반</option>)}</select></label>
        </div>
      </div>
      <div className="settings-privacy"><ShieldCheck size={19}/><div><b>개인정보 안내</b><p>테마와 시간표 기본값, 시간표 비교 기준은 이 브라우저의 로컬 저장소에 보관됩니다. Supabase 계정 정보와는 별도로 저장돼요.</p><Link to="/privacy" className="text-link">개인정보처리방침 보기</Link></div></div>
    </section>
  </>
}

const privacyContact = (import.meta.env.VITE_PRIVACY_CONTACT_EMAIL as string | undefined)?.trim()

export function PrivacyPage() {
  return <>
    <Title eyebrow="PRIVACY" title="개인정보처리방침" desc="문산중 알리미에서 현재 구현된 데이터 처리 내용을 안내합니다."/>
    <div className="notice info privacy-status"><ShieldCheck size={18}/><div><b>운영 주체 정보 확인이 필요합니다.</b><p>서비스 운영자와 문의 연락처가 확정되지 않아 아래 연락처 항목은 공개 배포 전에 설정해야 합니다. 임의의 담당자 정보는 기재하지 않았습니다.</p></div></div>
    <section className="panel privacy-panel">
      <p className="privacy-lead">이 방침은 현재 앱 코드와 연결된 Supabase 기능을 기준으로 작성했습니다. 이메일 인증 설정 및 운영자 연락처처럼 코드만으로 확정할 수 없는 항목은 별도 확인이 필요하다고 표시합니다.</p>
      <section><h2>1. 개인정보 처리자와 문의</h2><dl><div><dt>서비스 운영 주체</dt><dd>확인 필요 — 학교 공식 운영 주체 또는 서비스 운영자를 확정해 기재해야 합니다.</dd></div><div><dt>개인정보 문의</dt><dd>{privacyContact || '설정되지 않음 — 배포 설정의 VITE_PRIVACY_CONTACT_EMAIL에 운영자 문의 이메일을 등록해야 합니다.'}</dd></div></dl></section>
      <section><h2>2. 처리하는 정보와 이용 목적</h2><ul><li><b>회원가입·로그인:</b> 이메일 주소, Supabase 사용자 식별자, 인증 정보는 계정 생성·로그인·세션 유지에 사용됩니다. 비밀번호 입력은 Supabase Auth로 전달되며 앱은 비밀번호를 별도로 저장하거나 표시하지 않습니다.</li><li><b>프로필:</b> 표시 이름과 가입 시 요청한 사용자 유형(학생·교사 신청·일반 사용자), 서버가 부여한 역할 상태를 계정 관리와 접근 권한 확인에 사용합니다. 가입 화면에서 교사를 골라도 교사 권한은 자동 부여되지 않습니다.</li><li><b>학습자료실:</b> 승인된 교사/관리자가 올린 자료의 제목, 설명, 분류, 저장 경로, 업로더 식별자와 파일을 자료 제공 및 권한 관리에 사용합니다. 파일 버킷은 비공개이며 다운로드 링크는 제한 시간으로 발급됩니다.</li><li><b>시간표 설정·비교:</b> 기본 학년·반·테마와 같은 날짜·학년·반의 첫 NEIS 응답 기준은 이 브라우저의 로컬 저장소에 보관됩니다. 이 설정은 Supabase 계정으로 전송되지 않습니다.</li><li><b>NEIS 조회:</b> 선택한 날짜, 학년, 반과 문산중학교 식별 코드가 Supabase Edge Function을 거쳐 NEIS에 요청됩니다. 로그인 이메일이나 프로필은 시간표 요청에 포함하지 않습니다.</li></ul></section>
      <section><h2>3. 보관 기간과 삭제</h2><p>계정·프로필과 자료 정보는 계정 또는 자료가 삭제될 때까지 Supabase 프로젝트에 보관됩니다. 현재 앱에는 회원의 직접 탈퇴/삭제 기능과 자료의 직접 삭제 기능이 없습니다. 프로필은 Auth 계정 삭제 시 함께 삭제되지만, 자료 메타데이터는 업로더 정보만 비워질 수 있고 Storage 파일은 자동 삭제되지 않으므로 운영자가 별도로 확인·삭제해야 합니다. 자동 보관기간이나 NEIS 비교 기준 만료기간은 현재 설정되어 있지 않습니다. 브라우저 설정과 비교 기준은 브라우저 저장공간을 지우면 삭제됩니다.</p></section>
      <section><h2>4. 처리 위탁 및 외부 서비스</h2><ul><li><b>Supabase:</b> 인증, 데이터베이스, 비공개 파일 저장, NEIS 프록시를 제공합니다. 확인된 프로젝트 리전은 ap-northeast-2(서울)입니다.</li><li><b>NEIS 교육정보 개방 포털:</b> 공개 학사일정 및 학급 시간표를 조회합니다. NEIS 인증키는 서버 함수의 비밀 환경변수로만 사용됩니다.</li><li><b>Google Fonts:</b> 화면 글꼴을 내려받기 위해 브라우저가 Google Fonts 도메인에 접속할 수 있습니다. 일반적인 웹 요청 과정에서 IP 주소와 브라우저 정보가 전달될 수 있습니다.</li></ul><p>현재 코드에서 별도 광고·분석 SDK는 확인되지 않았습니다. 이메일 인증 메일의 발송 여부는 Supabase Auth 프로젝트 설정에 따르며, 운영 설정을 별도로 확인해야 합니다.</p></section>
      <section><h2>5. 정보주체 요청과 로컬 저장</h2><p>개인정보 열람·수정·삭제 요청은 위 문의처를 통해 운영자에게 요청할 수 있어야 합니다. 현재 운영자 문의처가 설정되지 않았으므로, 서비스 공개 전에 담당 운영자와 연락처를 확정해야 합니다. 앱은 Supabase 로그인 세션을 브라우저에 유지하고, 테마·시간표 기본값·비교 기준은 브라우저 로컬 저장소에 저장합니다.</p></section>
      <p className="privacy-updated">문서 기준일: 2026년 10월 24일 · 운영 주체/문의처 및 Supabase 이메일 인증 설정 확인 후 갱신해야 합니다.</p>
    </section>
  </>
}
