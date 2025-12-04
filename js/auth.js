// 인증 관리 모듈
const Auth = {
  currentUser: null,

  // 초기화
  init() {
    this.checkSession();
    this.setupEventListeners();
  },

  // 세션 확인
  checkSession() {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      try {
        this.currentUser = JSON.parse(userJson);
        this.showApp();
      } catch (e) {
        console.error('세션 파싱 에러:', e);
        this.showAuthModal();
      }
    } else {
      this.showAuthModal();
    }
  },

  // 이벤트 리스너 설정
  setupEventListeners() {
    // 로그인 폼
    document.getElementById('loginForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin();
    });

    // 회원가입 폼
    document.getElementById('registerForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleRegister();
    });

    // 폼 전환
    document.getElementById('showRegister').addEventListener('click', (e) => {
      e.preventDefault();
      this.showRegisterForm();
    });

    document.getElementById('showLogin').addEventListener('click', (e) => {
      e.preventDefault();
      this.showLoginForm();
    });

    // 로그아웃
    document.getElementById('logoutBtn').addEventListener('click', () => {
      this.handleLogout();
    });

    // Google 로그인 버튼
    document.getElementById('googleLoginBtn').addEventListener('click', () => {
      this.handleGoogleLogin();
    });

    document.getElementById('googleSignupBtn').addEventListener('click', () => {
      this.handleGoogleLogin();
    });

    // Firebase Auth State 변경 감지
    if (auth) {
      // 리다이렉트 결과 확인
      auth.getRedirectResult()
        .then((result) => {
          if (result && result.user) {
            this.handleFirebaseUser(result.user);
          }
        })
        .catch((error) => {
          if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/popup-blocked') {
            console.error('Redirect result error:', error);
          }
        });

      // 인증 상태 변경 감지
      auth.onAuthStateChanged((user) => {
        if (user && !this.currentUser) {
          this.handleFirebaseUser(user);
        }
      });
    }
  },

  // 로그인 처리
  async handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
      alert('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    if (!db) {
      alert('Firebase Firestore가 초기화되지 않았습니다.');
      return;
    }

    try {
      // Firestore에서 사용자 검색
      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('email', '==', email).get();
      
      if (snapshot.empty) {
        alert('등록되지 않은 이메일입니다.');
        return;
      }

      const userDoc = snapshot.docs[0];
      const user = userDoc.data();
      
      // 비밀번호 확인
      const hashedPassword = this.hashPassword(password);
      
      if (user.password === hashedPassword) {
        // 로그인 성공
        this.currentUser = {
          id: userDoc.id,
          username: user.username,
          email: user.email
        };
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        this.showApp();
      } else {
        alert('비밀번호가 일치하지 않습니다.');
      }
    } catch (error) {
      console.error('로그인 에러:', error);
      alert('로그인 중 오류가 발생했습니다: ' + error.message);
    }
  },

  // 회원가입 처리
  async handleRegister() {
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;

    // 유효성 검사
    if (!name || !email || !password) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    if (password.length < 6) {
      alert('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    if (password !== passwordConfirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (!db) {
      alert('Firebase Firestore가 초기화되지 않았습니다.');
      return;
    }

    try {
      // Firestore에서 이메일 중복 확인
      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('email', '==', email).get();
      
      if (!snapshot.empty) {
        alert('이미 등록된 이메일입니다.');
        return;
      }

      // 사용자 생성
      const hashedPassword = this.hashPassword(password);
      const newUser = {
        username: name,
        email: email,
        password: hashedPassword,
        created_at: firebase.firestore.FieldValue.serverTimestamp()
      };

      // Firestore에 저장
      await usersRef.add(newUser);
      
      alert('회원가입이 완료되었습니다! 로그인해주세요.');
      this.showLoginForm();
      
      // 폼 초기화
      document.getElementById('registerForm').reset();
    } catch (error) {
      console.error('회원가입 에러:', error);
      alert('회원가입 중 오류가 발생했습니다: ' + error.message);
    }
  },

  // 로그아웃 처리
  handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
      // Firebase 로그아웃
      if (typeof auth !== 'undefined' && auth && auth.currentUser) {
        auth.signOut();
      }
      
      this.currentUser = null;
      localStorage.removeItem('currentUser');
      this.showAuthModal();
    }
  },

  // Google 로그인 처리
  async handleGoogleLogin() {
    if (typeof auth === 'undefined' || !auth) {
      alert('Firebase is not configured. Please check firebase-config.js');
      return;
    }

    // Firebase 초기화 확인
    if (typeof firebase === 'undefined') {
      alert('Firebase SDK not loaded. Please refresh the page.');
      return;
    }

    console.log('🔑 Firebase Config Check:', {
      apiKey: firebaseConfig.apiKey ? '✅ Set' : '❌ Missing',
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId
    });

    try {
      console.log('🚀 Starting Google Sign-in with Redirect...');
      
      // 모바일 호환성을 위해 리다이렉트 방식 사용
      await auth.signInWithRedirect(googleProvider);
      // 리다이렉트 후 돌아오면 onAuthStateChanged에서 처리됨
      
    } catch (error) {
      console.error('❌ Google login error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/popup-blocked') {
        // 사용자가 팝업을 닫거나 차단됨 - 에러 표시 안 함
        return;
      }
      
      // API Key 관련 에러 상세 정보
      if (error.code && error.code.includes('api-key')) {
        alert('Firebase API Key Error. This may be due to:\n\n1. API Key restrictions in Google Cloud Console\n2. Identity Platform API not enabled\n3. Firebase configuration issue\n\nPlease check Firebase Console settings.');
      } else {
        alert('Google login failed: ' + error.message);
      }
    }
  },

  // Firebase 사용자 처리
  async handleFirebaseUser(firebaseUser) {
    if (!db) {
      console.error('Firestore is not initialized.');
      alert('Firebase Firestore가 초기화되지 않았습니다.');
      return;
    }

    try {
      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('email', '==', firebaseUser.email).limit(1).get();

      let userDoc = null;

      if (snapshot.empty) {
        // 새 사용자 생성
        const newUser = {
          username: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Google User'),
          email: firebaseUser.email,
          password: 'google_auth',
          auth_provider: 'google',
          photoURL: firebaseUser.photoURL || null,
          created_at: firebase.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await usersRef.add(newUser);
        userDoc = await docRef.get();
      } else {
        userDoc = snapshot.docs[0];

        // 프로필 정보 업데이트 (필요 시)
        const userData = userDoc.data();
        const updates = {};
        if (!userData.photoURL && firebaseUser.photoURL) {
          updates.photoURL = firebaseUser.photoURL;
        }
        if (!userData.auth_provider) {
          updates.auth_provider = 'google';
        }
        if (Object.keys(updates).length > 0) {
          await usersRef.doc(userDoc.id).update(updates);
        }
      }

      const userData = userDoc.data();

      this.currentUser = {
        id: userDoc.id,
        username: userData.username,
        email: userData.email,
        photoURL: userData.photoURL || firebaseUser.photoURL || null
      };

      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      this.showApp();

    } catch (error) {
      console.error('Firebase user handling error:', error);
      alert('Google 계정 정보를 처리하는 중 오류가 발생했습니다.');
    }
  },

  // 간단한 비밀번호 해싱 (실제 프로덕션에서는 서버에서 처리해야 함)
  hashPassword(password) {
    // 간단한 해시 함수 (실제로는 bcrypt 등을 사용해야 함)
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'hash_' + Math.abs(hash).toString(36);
  },

  // UI 표시 함수
  showAuthModal() {
    document.getElementById('authModal').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
  },

  showApp() {
    document.getElementById('authModal').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    document.getElementById('currentUserName').textContent = this.currentUser.username;
    
    // 앱 초기화
    if (window.App) {
      window.App.init();
    }
  },

  showLoginForm() {
    document.getElementById('loginForm').style.display = 'flex';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('authTitle').textContent = 'Login';
  },

  showRegisterForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'flex';
    document.getElementById('authTitle').textContent = 'Sign Up';
  },

  // 현재 사용자 정보 가져오기
  getCurrentUser() {
    return this.currentUser;
  }
};

// DOM 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
  Auth.init();
});
