# 🚀 자동 배포 가이드

이 가이드는 자동 배포 스크립트를 사용하는 방법을 설명합니다.

## 📋 사전 준비

### 1. GitHub Personal Access Token 생성

1. GitHub 로그인 → 우측 상단 프로필 클릭
2. **Settings** 클릭
3. 좌측 맨 아래 **Developer settings** 클릭
4. **Personal access tokens** → **Tokens (classic)** 클릭
5. **Generate new token (classic)** 클릭
6. 설정:
   ```
   Note: shift-scheduler-deploy
   Expiration: 30 days (또는 90 days)
   Scopes: ✅ repo (전체 체크)
   ```
7. **Generate token** 버튼 클릭
8. 🔴 **생성된 토큰을 복사** (페이지를 벗어나면 다시 볼 수 없습니다!)

### 2. GitHub 저장소 생성

1. https://github.com/new 접속
2. Repository name: `shift-scheduler`
3. **Public** 선택
4. **Create repository** 클릭

---

## 🖥️ 사용 방법

### Windows 사용자

1. **deploy.bat 파일 수정**
   ```batch
   메모장으로 deploy.bat 열기
   
   수정할 부분:
   SET GITHUB_USERNAME=your-username  → 본인의 GitHub 아이디
   SET TOKEN=                         → 복사한 토큰 붙여넣기
   
   예시:
   SET GITHUB_USERNAME=john-smith
   SET TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

2. **실행**
   ```
   deploy.bat 파일을 더블클릭
   또는
   명령 프롬프트에서: deploy.bat
   ```

3. **GitHub Pages 활성화** (최초 1회만)
   - 브라우저에서 https://github.com/your-username/shift-scheduler/settings/pages
   - Branch: main 선택
   - Save 클릭

4. **완료!**
   - 1-2분 후 https://your-username.github.io/shift-scheduler/ 접속

### Mac/Linux 사용자

1. **deploy.sh 파일 수정**
   ```bash
   텍스트 에디터로 deploy.sh 열기
   
   수정할 부분:
   GITHUB_USERNAME="your-username"  → 본인의 GitHub 아이디
   TOKEN=""                         → 복사한 토큰 붙여넣기
   
   예시:
   GITHUB_USERNAME="john-smith"
   TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   ```

2. **실행 권한 부여**
   ```bash
   chmod +x deploy.sh
   ```

3. **실행**
   ```bash
   ./deploy.sh
   ```

4. **GitHub Pages 활성화** (최초 1회만)
   - 브라우저에서 https://github.com/your-username/shift-scheduler/settings/pages
   - Branch: main 선택
   - Save 클릭

5. **완료!**
   - 1-2분 후 https://your-username.github.io/shift-scheduler/ 접속

---

## 🔄 업데이트 배포

코드를 수정한 후 다시 배포하려면:

**Windows**: `deploy.bat` 더블클릭  
**Mac/Linux**: `./deploy.sh` 실행

그게 전부입니다! 🎉

---

## 🔒 보안 주의사항

### ⚠️ 중요!

1. **토큰 절대 공유 금지**
   - 토큰 = GitHub 계정의 전체 권한
   - 타인에게 절대 알려주지 마세요

2. **토큰이 노출되었다면**
   - GitHub → Settings → Developer settings
   - Personal access tokens에서 해당 토큰 삭제
   - 새 토큰 생성

3. **Git에 토큰 커밋하지 않기**
   - deploy.sh / deploy.bat 파일은 Git에 커밋하지 마세요
   - 또는 토큰 부분만 비우고 커밋하세요

4. **.gitignore 설정**
   ```
   deploy.sh
   deploy.bat
   ```

---

## 🆘 문제 해결

### 에러: "토큰이 설정되지 않았습니다"

**해결**: deploy.sh 또는 deploy.bat 파일에서 TOKEN 변수에 토큰을 붙여넣으세요.

### 에러: "Permission denied"

**Windows**: 
- 관리자 권한으로 명령 프롬프트 실행
- 또는 파일 우클릭 → 관리자 권한으로 실행

**Mac/Linux**:
```bash
chmod +x deploy.sh
./deploy.sh
```

### 에러: "Invalid credentials"

**해결**: 
- 토큰이 올바른지 확인
- 토큰이 만료되지 않았는지 확인 (GitHub에서 재확인)
- 토큰 권한에 `repo`가 체크되어 있는지 확인

### 에러: "Repository not found"

**해결**:
- GITHUB_USERNAME이 정확한지 확인
- GitHub 저장소가 생성되었는지 확인
- 저장소 이름이 `shift-scheduler`인지 확인

### 페이지가 404 에러

**해결**:
- GitHub Pages가 활성화되었는지 확인
- Settings → Pages → Source: main 선택
- 1-2분 대기 후 재접속

---

## 💡 추가 기능

### 커밋 메시지 커스터마이징

**Windows (deploy.bat)**:
```batch
REM 이 줄을 수정:
SET COMMIT_MSG=Deploy: %TIMESTAMP%

REM 예시:
SET COMMIT_MSG=Fix: login bug
SET COMMIT_MSG=Feature: new dashboard
```

**Mac/Linux (deploy.sh)**:
```bash
# 이 줄을 수정:
COMMIT_MSG="Deploy: $(date '+%Y-%m-%d %H:%M:%S')"

# 예시:
COMMIT_MSG="Fix: login bug"
COMMIT_MSG="Feature: new dashboard"
```

### 특정 브랜치에 배포

```bash
# main 대신 다른 브랜치로:
git branch -M develop
git push -u origin develop
```

---

## 📞 지원

문제가 계속되면:
1. 에러 메시지 전체를 복사
2. GitHub Issues에 등록
3. 또는 질문해주세요!

---

**작성일**: 2025-01-01  
**버전**: 2.1
