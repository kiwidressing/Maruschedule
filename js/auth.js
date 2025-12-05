// 인증 관리 모듈
const Auth = {
  currentUser: null,

  // 화면에 로그 표시
  showDebugLog(message, type = 'info') {
    const logDiv = document.getElementById('authDebugLog');
    const logContent = document.getElementById('authDebugLogContent');
    
    if (logDiv && logContent) {
      logDiv.style.display = 'block';
      
      const timestamp = new Date().toLocaleTimeString();
      const color = type === 'error' ? '#f00' : type === 'success' ? '#0f0' : type === 'warning' ? '#ff0' : '#0ff';
      
      logContent.innerHTML += `<div style="color: ${color}; margin: 3px 0;">[${timestamp}] ${message}</div>`;
      logContent.scrollTop = logContent.scrollHeight;
    }
    
    console.log(message);
  },

  // 초기화
  init() {
    this.companyCache = {};
    this.setupEventListeners();
    this.checkSession();
  },

  // 세션 확인
  checkSession() {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      try {
        this.currentUser = JSON.parse(userJson);
        if (this.currentUser.status && this.currentUser.status !== 'active') {
          this.showAuthModal();
          this.showPendingNotice('승인이 완료될 때까지 기다려 주세요.');
        } else {
          this.showApp();
        }
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
      this.showAccountTypeSelection();
    });

    // Account type selection
    document.getElementById('selectBusinessAccount').addEventListener('click', () => {
      this.showRegisterForm();
    });

    document.getElementById('selectPersonalAccount').addEventListener('click', () => {
      this.showPersonalRegisterForm();
    });

    document.getElementById('backToLoginFromSelection').addEventListener('click', (e) => {
      e.preventDefault();
      this.showLoginForm();
    });

    document.getElementById('backToSelectionFromBusiness').addEventListener('click', (e) => {
      e.preventDefault();
      this.showAccountTypeSelection();
    });

    document.getElementById('backToSelectionFromPersonal').addEventListener('click', (e) => {
      e.preventDefault();
      this.showAccountTypeSelection();
    });

    // 로그아웃
    document.getElementById('logoutBtn').addEventListener('click', () => {
      this.handleLogout();
    });

    // Google 로그인 버튼
    document.getElementById('googleLoginBtn').addEventListener('click', () => {
      this.handleGoogleLogin();
    });

    // Personal register form
    document.getElementById('personalRegisterForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handlePersonalRegister();
    });

    // 간편 로그인 폼
    document.getElementById('simpleLoginForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSimpleLogin();
    });

    // 간편 로그인 전환
    document.getElementById('showSimpleLogin').addEventListener('click', (e) => {
      e.preventDefault();
      this.showSimpleLoginForm();
    });

    document.getElementById('showLoginFromSimple').addEventListener('click', (e) => {
      e.preventDefault();
      this.showLoginForm();
    });

    // 역할 선택 라디오 버튼 변경 시 필드 업데이트
    const roleRadios = document.querySelectorAll('input[name="registerRole"]');
    roleRadios.forEach(radio => radio.addEventListener('change', () => this.updateRoleFields()));
    this.updateRoleFields();

    // Firebase Auth State 변경 감지
    if (auth) {
      this.showDebugLog('🔧 Firebase auth listeners 설정 중...', 'info');
      
      // Popup 방식 사용으로 인해 getRedirectResult 불필요
      // authStateChanged만 설정하여 세션 복원 처리
      auth.onAuthStateChanged(async (user) => {
        this.showDebugLog(`👤 authStateChanged 발생 (user ${user ? '존재' : '없음'})`, user ? 'info' : 'warning');
        
        if (user) {
          this.showDebugLog(`   • email: ${user.email}`, 'info');
          this.showDebugLog(`   • uid: ${user.uid}`, 'info');
        }
        this.showDebugLog(`   • currentUser 캐시 있음? ${!!this.currentUser}`, 'info');
        
        // 이미 currentUser가 있으면 무시 (중복 처리 방지)
        if (this.currentUser) {
          this.showDebugLog('⏭️ currentUser 이미 존재, 건너뜀', 'warning');
          return;
        }
        
        if (user) {
          this.showDebugLog(`🔄 세션 복원 중: ${user.email}`, 'info');
          try {
            await this.handleFirebaseUser(user);
          } catch (err) {
            this.showDebugLog(`❌ 세션 복원 오류: ${err.message}`, 'error');
          }
        } else {
          this.showDebugLog('ℹ️ 로그인된 사용자 없음', 'info');
        }
      });
      
      this.showDebugLog('✅ Auth 리스너 설정 완료', 'success');
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
      
      // Try email login first
      let snapshot = await usersRef.where('email', '==', email).get();
      
      // If not found, try employee ID login (simple accounts)
      if (snapshot.empty) {
        // Check if it's an employee ID
        const allUsers = await usersRef.where('account_type', '==', 'simple').get();
        let found = false;
        allUsers.forEach(doc => {
          const data = doc.data();
          if (data.employee_id === email) {
            snapshot = { empty: false, docs: [doc] };
            found = true;
          }
        });
        
        if (!found) {
          alert('등록되지 않은 이메일 또는 직원 ID입니다.');
          return;
        }
      }

      const userDoc = snapshot.docs[0];
      const user = userDoc.data();
      
      // Simple account login (no password check)
      if (user.account_type === 'simple' && user.employee_id === email) {
        // Simple account - just login
        console.log('Simple account login');
      } else {
        // Regular account - check password
        const hashedPassword = this.hashPassword(password);
        
        if (user.password !== hashedPassword) {
          alert('비밀번호가 일치하지 않습니다.');
          return;
        }
      }

      if (user.status && user.status !== 'active') {
        const message = user.status === 'pending'
          ? '승인 대기 중입니다. 관리자 승인 후 다시 로그인해주세요.'
          : '이 계정은 현재 사용이 제한되어 있습니다. 관리자에게 문의해주세요.';
        this.showPendingNotice(message);
        return;
      }

      const companyName = user.company_name || null;

      this.currentUser = {
        id: userDoc.id,
        username: user.username,
        email: user.email,
        role: user.role || 'employee',
        status: user.status || 'active',
        companyId: user.company_id || null,
        companyName
      };
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      this.showApp();
    } catch (error) {
      console.error('로그인 에러:', error);
      alert('로그인 중 오류가 발생했습니다: ' + error.message);
    }
  },

  // 간편 로그인 처리 (직원 ID만)
  async handleSimpleLogin() {
    const employeeId = document.getElementById('simpleLoginId').value.trim();

    if (!employeeId) {
      alert('직원 ID를 입력해주세요.');
      return;
    }

    if (!db) {
      alert('Firebase Firestore가 초기화되지 않았습니다.');
      return;
    }

    try {
      // Firestore에서 간편 계정 검색
      const usersRef = db.collection('users');
      const snapshot = await usersRef
        .where('employee_id', '==', employeeId)
        .where('account_type', '==', 'simple')
        .get();

      if (snapshot.empty) {
        alert('등록되지 않은 직원 ID입니다.\n관리자에게 문의하세요.');
        return;
      }

      const userDoc = snapshot.docs[0];
      const user = userDoc.data();

      // 승인 상태 확인
      if (user.status !== 'active') {
        alert('승인 대기 중입니다.\n관리자 승인 후 로그인할 수 있습니다.');
        return;
      }

      // 회사 정보 가져오기
      let companyName = '';
      if (user.company_id) {
        const companyDoc = await db.collection('companies').doc(user.company_id).get();
        if (companyDoc.exists) {
          companyName = companyDoc.data().name;
        }
      }

      // 로그인 성공 - 세션 저장
      this.currentUser = {
        id: userDoc.id,
        uid: userDoc.id,
        name: user.name,
        email: user.email || null,
        employeeId: user.employee_id,
        role: user.role,
        companyId: user.company_id,
        companyName: companyName,
        status: user.status,
        accountType: 'simple'
      };
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      this.showApp();
    } catch (error) {
      console.error('간편 로그인 에러:', error);
      alert('로그인 중 오류가 발생했습니다: ' + error.message);
    }
  },

  // 개인 계정 가입 처리
  async handlePersonalRegister() {
    const name = document.getElementById('personalName').value.trim();
    const email = document.getElementById('personalEmail').value.trim().toLowerCase();
    const password = document.getElementById('personalPassword').value;
    const passwordConfirm = document.getElementById('personalPasswordConfirm').value;

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
      // 이메일 중복 체크
      const existingUser = await db.collection('users').where('email', '==', email).get();
      if (!existingUser.empty) {
        alert('이미 등록된 이메일입니다.');
        return;
      }

      // 비밀번호 해싱
      const hashedPassword = this.hashPassword(password);

      // 개인 사용자 생성 (company_id 없음, role = 'personal')
      const newUser = {
        username: name,
        email: email,
        password: hashedPassword,
        role: 'personal',
        account_type: 'email',
        auth_provider: 'local',
        status: 'active',
        created_at: new Date().toISOString()
      };

      const userRef = await db.collection('users').add(newUser);

      alert(`✅ 개인 계정 가입 완료!\n\n이메일: ${email}\n\n로그인 후 스케줄 관리를 시작하세요.`);
      
      // 자동 로그인
      this.currentUser = {
        id: userRef.id,
        uid: userRef.id,
        name: name,
        email: email,
        role: 'personal',
        companyId: null,
        companyName: null,
        status: 'active',
        accountType: 'personal'
      };
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      this.showApp();
    } catch (error) {
      console.error('개인 계정 가입 에러:', error);
      alert('가입 중 오류가 발생했습니다: ' + error.message);
    }
  },

  // 기업 계정 가입 처리
  async handleRegister() {
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim().toLowerCase();
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    const role = (document.querySelector('input[name="registerRole"]:checked') || {}).value || 'employee';
    const companyName = document.getElementById('registerCompanyName').value.trim();
    const companyCodeInput = document.getElementById('registerCompanyCode').value.trim().toUpperCase();

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
      const usersRef = db.collection('users');
      const companiesRef = db.collection('companies');

      // 이메일 중복 확인
      const existing = await usersRef.where('email', '==', email).get();
      if (!existing.empty) {
        alert('이미 등록된 이메일입니다. 다른 이메일을 사용해주세요.');
        return;
      }

      let hashedPassword = this.hashPassword(password);
      const baseUserData = {
        username: name,
        email,
        password: hashedPassword,
        role,
        auth_provider: 'local',
        status: 'pending',
        created_at: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (role === 'master') {
        if (!companyName) {
          alert('기업명을 입력해주세요.');
          return;
        }

        // 사용자 문서 생성
        const userDocRef = await usersRef.add({
          ...baseUserData,
          role: 'master',
          status: 'active',
          company_id: null // Will be updated after company creation
        });

        // CompanyUtils를 사용하여 기업 생성
        try {
          const company = await CompanyUtils.createCompany(companyName, userDocRef.id);
          
          // 사용자 문서에 company_id 업데이트
          await userDocRef.update({
            company_id: company.id
          });

          this.currentUser = {
            id: userDocRef.id,
            username: name,
            email,
            role: 'master',
            status: 'active',
            companyId: company.id,
            companyName: companyName,
            inviteCode: company.invite_code
          };
          localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
          this.showApp();
          alert(`기업이 생성되었습니다!\n\n기업명: ${companyName}\n초대 코드: ${company.invite_code}\n\n이 코드를 관리자와 직원에게 공유하세요.`);
          document.getElementById('registerForm').reset();
          this.updateRoleFields();
          return;
        } catch (companyError) {
          // 기업 생성 실패 시 사용자 문서 삭제
          await userDocRef.delete();
          throw companyError;
        }
      }

      // 관리자/직원 가입 처리
      if (!companyCodeInput || companyCodeInput.length !== 6) {
        alert('6자리 기업 초대 코드를 정확히 입력해주세요.');
        return;
      }

      // CompanyUtils로 기업 확인
      const company = await CompanyUtils.getCompanyByInviteCode(companyCodeInput);
      if (!company) {
        alert('해당 기업 코드를 찾을 수 없습니다. 정확한 코드를 입력했는지 확인해주세요.');
        return;
      }

      // 사용자 문서 생성 (pending 상태)
      const userDocRef = await usersRef.add({
        ...baseUserData,
        company_id: company.id,
        status: 'pending'
      });

      // CompanyUtils로 가입 요청 생성
      await CompanyUtils.createJoinRequest(userDocRef.id, company.id, role);

      alert(`가입 요청이 접수되었습니다!\n\n기업명: ${company.name}\n요청 역할: ${role === 'admin' ? '관리자' : '직원'}\n\n관리자 승인이 완료되면 로그인하실 수 있습니다.`);
      document.getElementById('registerForm').reset();
      this.updateRoleFields();
      this.showLoginForm();
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
    this.showDebugLog('🔑 Google 로그인 시작...', 'info');
    
    if (typeof auth === 'undefined' || !auth) {
      this.showDebugLog('❌ Firebase 설정 안 됨', 'error');
      alert('Firebase is not configured. Please check firebase-config.js');
      return;
    }

    // Firebase 초기화 확인
    if (typeof firebase === 'undefined') {
      this.showDebugLog('❌ Firebase SDK 로드 안 됨', 'error');
      alert('Firebase SDK not loaded. Please refresh the page.');
      return;
    }

    this.showDebugLog(`✅ Firebase 설정 확인 완료`, 'success');
    this.showDebugLog(`📋 Project: ${firebaseConfig.projectId}`, 'info');

    try {
      this.showDebugLog('🚀 Google 팝업 로그인 시작...', 'info');
      this.showDebugLog('⏳ Google 계정 선택 팝업이 열립니다...', 'warning');

      await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      
      // Popup 방식 사용 (iOS Safari에서 더 안정적)
      const result = await auth.signInWithPopup(googleProvider);
      
      this.showDebugLog('✅ 팝업 로그인 성공!', 'success');
      this.showDebugLog(`📧 로그인된 이메일: ${result.user.email}`, 'info');
      
      // 즉시 사용자 처리
      await this.handleFirebaseUser(result.user);
      
    } catch (error) {
      this.showDebugLog(`❌ Google 로그인 오류: ${error.message}`, 'error');
      this.showDebugLog(`❌ 오류 코드: ${error.code}`, 'error');
      
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/popup-blocked') {
        // 사용자가 팝업을 닫거나 차단됨 - 에러 표시 안 함
        this.showDebugLog('ℹ️ 사용자가 팝업을 닫음', 'warning');
        return;
      }
      
      // API Key 관련 에러 상세 정보
      if (error.code && error.code.includes('api-key')) {
        this.showDebugLog('❌ API Key 오류 발생', 'error');
        alert('Firebase API Key Error. This may be due to:\n\n1. API Key restrictions in Google Cloud Console\n2. Identity Platform API not enabled\n3. Firebase configuration issue\n\nPlease check Firebase Console settings.');
      } else {
        alert('Google login failed: ' + error.message);
      }
    }
  },

  // Firebase 사용자 처리
  async handleFirebaseUser(firebaseUser) {
    if (!db) {
      this.showDebugLog('❌ Firestore 초기화되지 않음', 'error');
      alert('Firebase Firestore가 초기화되지 않았습니다.');
      return;
    }

    try {
      this.showDebugLog(`🔍 Firebase 사용자 처리 중: ${firebaseUser.email}`, 'info');

      const usersRef = db.collection('users');
      let userDoc = null;

      this.showDebugLog('🔍 Firestore에서 사용자 검색 중...', 'info');

      // 1) Try to find by firebase_uid first
      if (firebaseUser.uid) {
        this.showDebugLog(`🔍 UID로 검색: ${firebaseUser.uid}`, 'info');
        const byUid = await usersRef.where('firebase_uid', '==', firebaseUser.uid).limit(1).get();
        if (!byUid.empty) {
          userDoc = byUid.docs[0];
          this.showDebugLog(`✅ UID로 사용자 찾음: ${userDoc.id}`, 'success');
        } else {
          this.showDebugLog('ℹ️ UID로 사용자 못 찾음', 'warning');
        }
      }

      // 2) Fallback to email lookup
      if (!userDoc && firebaseUser.email) {
        this.showDebugLog(`🔍 이메일로 검색: ${firebaseUser.email}`, 'info');
        const byEmail = await usersRef.where('email', '==', firebaseUser.email.toLowerCase()).limit(1).get();
        if (!byEmail.empty) {
          userDoc = byEmail.docs[0];
          this.showDebugLog(`✅ 이메일로 사용자 찾음: ${userDoc.id}`, 'success');
        } else {
          this.showDebugLog('ℹ️ 이메일로 사용자 못 찾음', 'warning');
        }
      }

      if (!userDoc) {
        this.showDebugLog('🆕 새 개인 계정 생성 중...', 'info');
        const newUser = {
          username: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Google User'),
          email: firebaseUser.email ? firebaseUser.email.toLowerCase() : '',
          password: 'google_auth',
          auth_provider: 'google',
          firebase_uid: firebaseUser.uid || null,
          photoURL: firebaseUser.photoURL || null,
          role: 'personal',
          account_type: 'google',
          status: 'active',
          created_at: firebase.firestore.FieldValue.serverTimestamp()
        };

        this.showDebugLog('💾 Firestore에 사용자 저장 중...', 'info');
        let docRef;
        if (firebaseUser.uid) {
          docRef = usersRef.doc(firebaseUser.uid);
          await docRef.set(newUser, { merge: true });
          this.showDebugLog(`✅ 사용자 저장 완료 (UID 문서)`, 'success');
        } else {
          docRef = await usersRef.add(newUser);
          this.showDebugLog(`✅ 사용자 저장 완료 (자동 ID)`, 'success');
        }
        userDoc = await docRef.get();
      } else {
        // ensure firebase_uid stored
        const userData = userDoc.data();
        const updates = {};
        if (!userData.firebase_uid && firebaseUser.uid) {
          updates.firebase_uid = firebaseUser.uid;
        }
        if (!userData.photoURL && firebaseUser.photoURL) {
          updates.photoURL = firebaseUser.photoURL;
        }
        if (!userData.auth_provider) {
          updates.auth_provider = 'google';
        }
        if (Object.keys(updates).length > 0) {
          console.log('ℹ️ Updating Firestore user with:', updates);
          await usersRef.doc(userDoc.id).update(updates);
          userDoc = await usersRef.doc(userDoc.id).get();
        }
      }

      const userData = userDoc.data();
      this.showDebugLog(`✅ Firestore 사용자 데이터 로드 완료`, 'success');
      this.showDebugLog(`📋 역할: ${userData.role || 'N/A'}`, 'info');
      this.showDebugLog(`📋 상태: ${userData.status || 'N/A'}`, 'info');

      // 개인 계정 (role: 'personal')은 company_id 체크 생략
      if (userData.role === 'personal') {
        this.showDebugLog('✅ 개인 계정 확인됨 - 회사 체크 생략', 'success');
        
        this.currentUser = {
          id: userDoc.id,
          uid: userDoc.id,
          name: userData.username,
          email: userData.email,
          role: 'personal',
          status: 'active',
          companyId: null,
          companyName: null,
          photoURL: userData.photoURL || firebaseUser.photoURL || null,
          firebaseUid: userData.firebase_uid || firebaseUser.uid || null,
          accountType: 'google'
        };

        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        this.showDebugLog('✅ localStorage에 저장 완료', 'success');
        this.showDebugLog('🚀 앱 화면으로 전환 중...', 'success');
        this.showApp();
        return;
      }

      // 기업 계정은 company_id와 status 체크
      if (!userData.company_id || userData.status !== 'active') {
        this.showPendingNotice('Google 계정이 기업에 연결되지 않았거나 승인 대기 중입니다.\n관리자에게 승인을 요청하거나, 개인 계정으로 사용하려면 로그아웃 후 다시 로그인하세요.');
        localStorage.removeItem('currentUser');
        if (auth && auth.currentUser) {
          await auth.signOut();
        }
        return;
      }

      // 회사 정보 가져오기
      let companyName = '';
      if (userData.company_id) {
        const companyDoc = await db.collection('companies').doc(userData.company_id).get();
        if (companyDoc.exists) {
          companyName = companyDoc.data().name;
        }
      }

      this.currentUser = {
        id: userDoc.id,
        uid: userDoc.id,
        name: userData.username,
        email: userData.email,
        role: userData.role || 'employee',
        status: userData.status || 'active',
        companyId: userData.company_id,
        companyName: companyName,
        photoURL: userData.photoURL || firebaseUser.photoURL || null,
        firebaseUid: userData.firebase_uid || firebaseUser.uid || null,
        accountType: 'google'
      };

      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      console.log('✅ Business Google user logged in & stored in localStorage');
      this.showApp();

    } catch (error) {
      this.showDebugLog(`❌ 오류 발생: ${error.message}`, 'error');
      this.showDebugLog(`❌ 오류 코드: ${error.code || 'N/A'}`, 'error');
      alert(`Google 계정 정보 처리 중 오류 발생:\n\n${error.message}\n\n화면 상단의 디버그 로그를 확인해주세요.`);
      
      // 오류 발생 시 로그아웃하고 로그인 화면으로
      this.currentUser = null;
      localStorage.removeItem('currentUser');
      if (auth && auth.currentUser) {
        await auth.signOut();
      }
      this.showAuthModal();
      throw error; // 에러를 다시 던져서 호출자가 처리할 수 있도록
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
    document.getElementById('simpleLoginForm').style.display = 'none';
    document.getElementById('accountTypeSelection').style.display = 'none';
    document.getElementById('personalRegisterForm').style.display = 'none';
    document.getElementById('authTitle').textContent = 'Login';
  },

  showAccountTypeSelection() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('simpleLoginForm').style.display = 'none';
    document.getElementById('accountTypeSelection').style.display = 'flex';
    document.getElementById('personalRegisterForm').style.display = 'none';
    document.getElementById('authTitle').textContent = 'Sign Up';
  },

  showRegisterForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'flex';
    document.getElementById('simpleLoginForm').style.display = 'none';
    document.getElementById('accountTypeSelection').style.display = 'none';
    document.getElementById('personalRegisterForm').style.display = 'none';
    document.getElementById('authTitle').textContent = 'Sign Up';
  },

  showPersonalRegisterForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('simpleLoginForm').style.display = 'none';
    document.getElementById('accountTypeSelection').style.display = 'none';
    document.getElementById('personalRegisterForm').style.display = 'flex';
    document.getElementById('authTitle').textContent = 'Sign Up';
  },

  showSimpleLoginForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('simpleLoginForm').style.display = 'flex';
    document.getElementById('accountTypeSelection').style.display = 'none';
    document.getElementById('personalRegisterForm').style.display = 'none';
    document.getElementById('authTitle').textContent = '간편 로그인';
  },

  // 현재 사용자 정보 가져오기
  getCurrentUser() {
    return this.currentUser;
  },

  // 역할에 따라 폼 필드 표시/숨김 전환
  updateRoleFields() {
    const selectedRole = document.querySelector('input[name="registerRole"]:checked');
    if (!selectedRole) return;

    const role = selectedRole.value;
    const companyNameGroup = document.getElementById('companyNameGroup');
    const companyCodeGroup = document.getElementById('companyCodeGroup');
    const registerHelpText = document.getElementById('registerHelpText');

    if (role === 'master') {
      // Master: 기업명 입력 필요
      companyNameGroup.style.display = 'block';
      companyCodeGroup.style.display = 'none';
      document.getElementById('registerCompanyName').required = true;
      document.getElementById('registerCompanyCode').required = false;
      registerHelpText.textContent = 'Master: 기업 생성 및 관리자 권한 보유';
    } else {
      // Employee: 기업 코드 입력 필요
      companyNameGroup.style.display = 'none';
      companyCodeGroup.style.display = 'block';
      document.getElementById('registerCompanyName').required = false;
      document.getElementById('registerCompanyCode').required = true;
      registerHelpText.textContent = 'Employee: 가입 요청 후 관리자 승인 필요';
    }
  },

  // 승인 대기 안내 표시
  showPendingNotice(message) {
    const modal = document.getElementById('authModal');
    const modalBody = modal.querySelector('.modal-body');
    
    // 기존 폼 숨기기
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    
    // 안내 메시지 표시
    const noticeDiv = document.createElement('div');
    noticeDiv.className = 'pending-notice';
    noticeDiv.innerHTML = `
      <div class="notice-icon">
        <i class="fas fa-hourglass-half"></i>
      </div>
      <h3>승인 대기 중</h3>
      <p>${message}</p>
      <button class="btn btn-primary" onclick="location.reload()">확인</button>
    `;
    
    modalBody.innerHTML = '';
    modalBody.appendChild(noticeDiv);
  }
};

// DOM 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
  Auth.init();
});
