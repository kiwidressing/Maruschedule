# Firebase Google 로그인 설정 가이드

## 🔥 Firebase Console 설정 필수 사항

### 1️⃣ **Authorized Domains 추가**
Google 로그인이 작동하려면 도메인을 승인해야 합니다.

**경로**: Firebase Console → Authentication → Settings → Authorized domains

**추가해야 할 도메인**:
- `maruschedule.pages.dev` ✅
- `localhost` (로컬 테스트용)

**확인 방법**:
1. https://console.firebase.google.com 접속
2. 프로젝트 선택: **maruschedule-ccf5a**
3. 왼쪽 메뉴: **Authentication** 클릭
4. 상단 탭: **Settings** 클릭
5. 아래로 스크롤: **Authorized domains** 섹션
6. `maruschedule.pages.dev`가 있는지 확인
7. 없으면 **Add domain** 클릭하여 추가

---

### 2️⃣ **Google Sign-in 활성화 확인**
**경로**: Firebase Console → Authentication → Sign-in method

**확인 사항**:
- Google 제공업체가 **Enabled** 상태인지 확인
- Web SDK configuration의 **Web client ID**가 설정되어 있는지 확인

---

### 3️⃣ **Identity Platform API 활성화**
**경로**: Google Cloud Console → APIs & Services

**필수 API**:
- Identity Platform API
- Identity Toolkit API

**활성화 방법**:
1. https://console.cloud.google.com 접속
2. 프로젝트 선택: **maruschedule-ccf5a**
3. 왼쪽 메뉴: **APIs & Services** → **Library**
4. 검색: "Identity Platform API"
5. **ENABLE** 클릭
6. 검색: "Identity Toolkit API"  
7. **ENABLE** 클릭

---

## 🔍 현재 상태 확인

### ✅ 정상 동작하는 것들:
- Firebase 초기화 완료
- getRedirectResult 호출됨
- 리다이렉트 자체는 작동 (Google 계정 선택 화면 표시)

### ❌ 문제:
- 리다이렉트 후 돌아왔을 때 사용자 정보를 받지 못함
- `result.user`가 null로 반환됨

### 🎯 가능한 원인:
1. **Authorized domains**에 `maruschedule.pages.dev` 미등록 (가장 가능성 높음)
2. Identity Platform API 미활성화
3. OAuth 동의 화면 설정 문제

---

## 🛠️ 해결 방법

### A) **Authorized Domains 추가** (가장 중요!)

```
1. Firebase Console 접속
2. Authentication → Settings
3. Authorized domains
4. Add domain 클릭
5. maruschedule.pages.dev 입력
6. Add 클릭
```

### B) **OAuth 동의 화면 확인**

```
1. Google Cloud Console 접속
2. APIs & Services → OAuth consent screen
3. User type: External 확인
4. Test users: 본인 Gmail 추가 (개발 중이라면)
5. Scopes: email, profile 포함 확인
```

---

## 🧪 테스트 순서

1. ✅ Authorized domains에 `maruschedule.pages.dev` 추가
2. ✅ 브라우저 캐시 삭제 또는 시크릿 모드 사용
3. ✅ https://maruschedule.pages.dev 재접속
4. ✅ "Continue with Google" 클릭
5. ✅ 디버그 로그 확인

---

## 📝 예상되는 성공 로그

```
[시간] 🔧 Firebase auth listeners 설정 중...
[시간] 🔄 getRedirectResult 호출됨
[시간] ✅ 리다이렉트 결과: your@gmail.com  ← 이 줄이 나타나야 함!
[시간] 📧 이메일: your@gmail.com
[시간] 🆔 UID: abc123xyz
[시간] 🔍 Firebase 사용자 처리 중
...
```

현재는 "리다이렉트 결과 없음"이 나오므로 **Authorized domains 설정이 필요**합니다!

---

## 🚨 중요!

**Authorized domains 추가 후에도 즉시 작동하지 않을 수 있습니다.**
- Firebase가 설정을 전파하는데 1-2분 소요
- 브라우저 캐시 때문에 이전 오류가 남아있을 수 있음
- **시크릿 모드**로 다시 테스트하거나 브라우저 캐시 삭제 권장

---

## 📞 추가 도움이 필요하면

위 설정을 모두 완료했는데도 작동하지 않으면:
1. Firebase Console의 Authorized domains 스크린샷
2. Google Cloud Console의 OAuth consent screen 스크린샷
3. 디버그 로그 전체 스크린샷

을 제공해주세요!
