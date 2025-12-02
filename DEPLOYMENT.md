# 배포 가이드

이 문서는 근무 스케줄 관리 시스템을 다양한 플랫폼에 배포하는 방법을 설명합니다.

## 목차
1. [GitHub Pages 배포](#github-pages-배포)
2. [Cloudflare Pages 배포](#cloudflare-pages-배포)
3. [Vercel 배포](#vercel-배포)
4. [로컬 테스트](#로컬-테스트)

---

## GitHub Pages 배포

### 사전 요구사항
- GitHub 계정
- Git 설치

### 단계별 가이드

#### 1. GitHub 저장소 생성

1. [GitHub](https://github.com)에 로그인
2. 우측 상단 `+` 버튼 → `New repository` 클릭
3. 저장소 이름 입력 (예: `shift-scheduler`)
4. Public으로 설정
5. `Create repository` 클릭

#### 2. 로컬 프로젝트 Git 초기화

```bash
# 프로젝트 폴더로 이동
cd /path/to/shift-scheduler

# Git 초기화
git init

# 파일 추가
git add .

# 커밋
git commit -m "Initial commit: Shift Scheduler v2.1"

# 기본 브랜치를 main으로 설정
git branch -M main

# GitHub 저장소 연결 (your-username을 실제 사용자명으로 변경)
git remote add origin https://github.com/your-username/shift-scheduler.git

# 푸시
git push -u origin main
```

#### 3. GitHub Pages 활성화

1. GitHub 저장소 페이지로 이동
2. `Settings` 탭 클릭
3. 좌측 메뉴에서 `Pages` 클릭
4. Source 섹션에서:
   - Branch: `main` 선택
   - Folder: `/ (root)` 선택
5. `Save` 클릭

#### 4. 배포 완료

- 약 1-2분 후 배포 완료
- 배포 URL: `https://your-username.github.io/shift-scheduler/`
- 초록색 체크 표시가 나타나면 배포 성공!

---

## Cloudflare Pages 배포

### 사전 요구사항
- Cloudflare 계정
- GitHub 저장소 (위의 GitHub Pages 가이드 참조)

### 단계별 가이드

#### 1. Cloudflare Pages 프로젝트 생성

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) 로그인
2. 좌측 메뉴에서 `Pages` 클릭
3. `Create a project` 버튼 클릭
4. `Connect to Git` 선택

#### 2. GitHub 저장소 연결

1. GitHub 계정 연결 (처음이면 인증 필요)
2. 저장소 목록에서 `shift-scheduler` 선택
3. `Begin setup` 클릭

#### 3. 빌드 설정

**Build settings:**
- Project name: `shift-scheduler` (원하는 이름)
- Production branch: `main`
- Framework preset: `None` 선택
- Build command: (비워둠)
- Build output directory: `/` 또는 비워둠

#### 4. 배포

1. `Save and Deploy` 클릭
2. 자동으로 빌드 및 배포 시작
3. 완료 후 제공되는 URL로 접속:
   - `https://shift-scheduler.pages.dev`

#### 5. 커스텀 도메인 설정 (선택사항)

1. 프로젝트 대시보드 → `Custom domains` 탭
2. `Set up a custom domain` 클릭
3. 도메인 입력 (예: `scheduler.yourdomain.com`)
4. DNS 레코드 자동 구성 (Cloudflare 도메인인 경우)

### 자동 배포

- GitHub에 푸시할 때마다 자동으로 재배포됩니다
- 브랜치별 프리뷰 배포 지원

---

## Vercel 배포

### 사전 요구사항
- Vercel 계정
- GitHub 저장소

### 단계별 가이드

#### 1. Vercel 프로젝트 생성

1. [Vercel](https://vercel.com/) 로그인
2. `New Project` 버튼 클릭
3. GitHub 저장소 Import

#### 2. 저장소 선택

1. `Import Git Repository` 섹션에서 검색
2. `shift-scheduler` 저장소 선택
3. `Import` 클릭

#### 3. 프로젝트 설정

**Configure Project:**
- Framework Preset: `Other` 선택
- Root Directory: `./` (기본값)
- Build Command: (비워둠)
- Output Directory: `./` (기본값)
- Install Command: (비워둠)

#### 4. 배포

1. `Deploy` 버튼 클릭
2. 자동 빌드 및 배포 시작
3. 완료 후 URL 제공:
   - `https://shift-scheduler.vercel.app`

#### 5. 도메인 설정 (선택사항)

1. 프로젝트 설정 → `Domains` 탭
2. 커스텀 도메인 추가
3. DNS 레코드 구성

---

## 로컬 테스트

개발 중에는 로컬 서버로 테스트할 수 있습니다.

### 방법 1: Python 서버 (Python 3)

```bash
# 프로젝트 폴더로 이동
cd /path/to/shift-scheduler

# 서버 실행
python3 -m http.server 8000

# 브라우저에서 http://localhost:8000 접속
```

### 방법 2: Node.js 서버

```bash
# http-server 설치 (전역)
npm install -g http-server

# 프로젝트 폴더로 이동
cd /path/to/shift-scheduler

# 서버 실행
http-server -p 8000

# 브라우저에서 http://localhost:8000 접속
```

### 방법 3: VS Code Live Server

1. VS Code 확장 프로그램 설치: `Live Server`
2. `index.html` 파일 우클릭
3. `Open with Live Server` 선택

---

## 데이터베이스 관리

### 개발 환경
- RESTful Table API 사용
- 데이터는 프로젝트 세션에 저장됨

### 프로덕션 환경 옵션

#### Option 1: 내장 RESTful API 사용 (권장)
- 별도 설정 불필요
- 배포 플랫폼의 데이터 저장소 자동 사용

#### Option 2: Cloudflare D1 (고급)

**1. D1 데이터베이스 생성**
```bash
wrangler d1 create shift-scheduler-db
```

**2. 스키마 생성**
```sql
-- users 테이블
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TEXT NOT NULL
);

-- shifts 테이블
CREATE TABLE shifts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    week_start TEXT NOT NULL,
    day_key TEXT NOT NULL,
    date_str TEXT,
    ln_start TEXT,
    ln_end TEXT,
    ln_hours REAL,
    dn_start TEXT,
    dn_end TEXT,
    dn_hours REAL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- archives 테이블
CREATE TABLE archives (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    week_start TEXT NOT NULL,
    label TEXT,
    summary TEXT,
    weekday_total REAL,
    saturday_total REAL,
    sunday_total REAL,
    total_hours REAL,
    archived_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**3. Cloudflare Worker 생성**
- API 엔드포인트 구현
- D1 데이터베이스 바인딩
- CORS 헤더 설정

#### Option 3: Firebase/Supabase 연동
- Firebase Firestore
- Supabase PostgreSQL
- 별도 SDK 통합 필요

---

## 문제 해결

### 배포 후 데이터가 보이지 않음
- 데이터는 각 사용자의 브라우저에 저장됩니다
- 새 브라우저나 시크릿 모드에서는 데이터가 없을 수 있습니다
- 프로덕션에서는 서버 기반 데이터베이스 사용 권장

### API 요청 오류
- 브라우저 콘솔에서 오류 확인
- CORS 에러인 경우 API 설정 확인
- RESTful Table API가 활성화되어 있는지 확인

### PDF/Excel 다운로드 안 됨
- 브라우저 팝업 차단 해제
- JavaScript 활성화 확인
- 최신 브라우저 사용 권장

---

## 보안 강화 (프로덕션)

### 권장사항

1. **HTTPS 사용**: 모든 배포 플랫폼은 기본적으로 HTTPS 제공
2. **환경 변수 사용**: API 키 등 민감 정보는 환경 변수로 관리
3. **서버 사이드 인증**: JWT 토큰 기반 인증 구현
4. **비밀번호 해싱**: bcrypt 등 강력한 해싱 알고리즘 사용
5. **Rate Limiting**: API 요청 제한 설정

---

## 업데이트 배포

### GitHub Pages / Cloudflare Pages / Vercel

```bash
# 코드 수정 후
git add .
git commit -m "Update: 기능 설명"
git push origin main

# 자동으로 재배포됨
```

---

## 지원

문제가 발생하면:
1. README.md 참조
2. 브라우저 개발자 도구 콘솔 확인
3. GitHub Issues에 버그 리포트 등록

---

**작성일**: 2025-01-01  
**버전**: 2.1
