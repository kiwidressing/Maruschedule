# ⚡ 5분 완성 - 초간단 배포 가이드

## 🎯 가장 빠른 방법: GitHub 웹 인터페이스 사용

터미널, Git 명령어 없이 **브라우저만으로 3분 안에 완료!**

---

## 📋 준비물

- [ ] GitHub 계정 (없으면 https://github.com/join 에서 1분 만에 생성)
- [ ] 프로젝트 파일들 (다운로드 필요)

---

## 🚀 Step 1: GitHub 저장소 생성 (30초)

1. **https://github.com/new** 접속
2. 입력:
   ```
   Repository name: shift-scheduler
   Description: Shift Schedule Management System
   ✅ Public 선택
   ✅ Add a README file 체크
   ```
3. **Create repository** 클릭

---

## 📤 Step 2: 파일 업로드 (2분)

### 방법 A: 드래그 앤 드롭 (추천)

1. 생성된 저장소 페이지에서
2. 아래로 스크롤하면 "uploading an existing file" 링크 찾기
3. 클릭
4. **모든 파일을 드래그해서 놓기**
   - index.html
   - css 폴더
   - js 폴더
   - README.md
   - 등등
5. 하단의 **Commit changes** 버튼 클릭

### 방법 B: 폴더별 업로드

**루트 파일 업로드:**
```
1. Add file → Upload files
2. index.html, README.md 등 드래그
3. Commit changes
```

**css 폴더 생성 및 업로드:**
```
1. Add file → Create new file
2. 파일명에 "css/style.css" 입력 (자동으로 폴더 생성)
3. 파일 내용 붙여넣기
4. Commit new file
```

**js 폴더도 동일하게:**
```
1. Add file → Create new file
2. 파일명: "js/auth.js"
3. 내용 붙여넣기
4. 반복...
```

---

## 🌐 Step 3: GitHub Pages 활성화 (30초)

1. 저장소 페이지 상단의 **Settings** 탭 클릭
2. 좌측 메뉴에서 **Pages** 클릭
3. **Source** 섹션:
   - Branch: **main** 선택
   - Folder: **/ (root)** 선택
4. **Save** 버튼 클릭

---

## ✅ Step 4: 완료 확인 (1분)

1. 초록색 박스에 URL 표시됨:
   ```
   ✅ Your site is live at https://your-username.github.io/shift-scheduler/
   ```

2. 1-2분 대기 (배포 중)

3. URL 클릭해서 접속!

---

## 🎊 성공!

이제 누구나 아래 URL로 접속 가능:
```
https://your-username.github.io/shift-scheduler/
```

---

## 🔄 업데이트하려면?

파일을 수정하고 싶을 때:

1. GitHub 저장소에서 수정할 파일 클릭
2. 연필 아이콘(Edit) 클릭
3. 내용 수정
4. **Commit changes** 클릭
5. 자동으로 재배포! (1-2분)

---

## 📱 모바일에서도 가능!

GitHub 모바일 앱으로도 동일하게 가능합니다!

---

## 🆘 문제가 생겼다면?

### 404 Not Found 에러
- Settings → Pages에서 Source가 "main" 브랜치로 설정되었는지 확인
- 1-2분 더 대기 (배포 시간 필요)

### 파일이 안 보임
- 파일 이름이 정확한지 확인 (index.html, 대소문자 구분)
- 파일이 저장소 루트에 있는지 확인

### 로그인이 안 됨
- 브라우저 콘솔(F12) 확인
- 데이터베이스 API 설정 확인

---

## 💡 Pro Tip

**한 번에 모든 파일 업로드:**

1. 로컬에 모든 파일 준비
2. 한 번에 드래그 앤 드롭
3. 끝!

폴더 구조도 자동으로 인식합니다!

---

## 📞 도움이 필요하면

1. 스크린샷 찍어서 보내주세요
2. 어느 단계에서 막혔는지 알려주세요
3. 에러 메시지가 있다면 복사해주세요

---

**소요 시간**: 3-5분  
**난이도**: ⭐☆☆☆☆ (매우 쉬움)  
**필요 기술**: 없음! (클릭만 할 줄 알면 됨)

---

**작성일**: 2025-01-01  
**버전**: 2.1
