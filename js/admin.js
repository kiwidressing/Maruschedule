/**
 * Admin Dashboard Module
 * Handles company management, approval requests, and member management
 */

const AdminPanel = (function() {
    'use strict';

    let currentUser = null;
    let currentCompany = null;
    let pendingRequests = [];
    let companyMembers = [];
    let currentFilter = 'all';

    /**
     * Show debug alert on screen
     */
    function showDebugAlert(message, type = 'info') {
        const debugDiv = document.getElementById('debugMessages');
        if (debugDiv) {
            const timestamp = new Date().toLocaleTimeString();
            const color = type === 'error' ? 'red' : type === 'warning' ? 'orange' : 'green';
            debugDiv.innerHTML += `<div style="color: ${color}; margin: 5px 0;">[${timestamp}] ${message}</div>`;
            debugDiv.style.display = 'block';
        }
        console.log(message);
    }

    /**
     * Initialize admin panel
     */
    async function init(user) {
        try {
            showDebugAlert('🔧 Admin Panel Init 시작', 'info');
            currentUser = user;
            
            showDebugAlert(`🔧 User: ${user ? JSON.stringify(user) : 'null'}`, 'info');
            showDebugAlert(`🔧 User role: ${user?.role}`, 'info');
            showDebugAlert(`🔧 User companyId: ${user?.companyId}`, 'info');
            
            // Show/hide admin tab based on role
            const adminTabBtn = document.getElementById('adminTabBtn');
            if (user && (user.role === 'master' || user.role === 'admin')) {
                if (adminTabBtn) {
                    adminTabBtn.style.display = 'block';
                    showDebugAlert(`✅ Admin tab button shown for ${user.role}`, 'info');
                }
            } else {
                if (adminTabBtn) {
                    adminTabBtn.style.display = 'none';
                }
                showDebugAlert('⚠️ User is not admin/master, hiding admin tab', 'warning');
                return;
            }

            // Load company data
            if (user && user.companyId) {
                showDebugAlert('📊 Loading company data...', 'info');
                await loadCompanyData();
                await loadPendingRequests();
                await loadCompanyMembers();
            } else {
                showDebugAlert('⚠️ No company ID found for user', 'warning');
            }

            setupEventListeners();
            showDebugAlert('✅ Admin Panel initialized', 'info');
        } catch (error) {
            showDebugAlert(`❌ Admin Panel Init 오류: ${error.message}`, 'error');
            console.error('Admin Panel Init Error:', error);
        }
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Copy invite code button
        const copyBtn = document.getElementById('copyInviteCodeBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', copyInviteCode);
        }

        // Quick account creation
        const createQuickBtn = document.getElementById('createQuickAccountBtn');
        if (createQuickBtn) {
            createQuickBtn.addEventListener('click', createQuickAccount);
        }

        // Member filter buttons
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.currentTarget.dataset.filter;
                filterMembers(filter);
            });
        });
    }

    /**
     * Load company data
     */
    async function loadCompanyData() {
        try {
            showDebugAlert(`📊 회사 데이터 로드 중... companyId: ${currentUser.companyId}`, 'info');
            currentCompany = await CompanyUtils.getCompanyById(currentUser.companyId);
            
            if (currentCompany) {
                showDebugAlert(`✅ 회사 데이터 로드 완료: ${currentCompany.name}`, 'info');
                document.getElementById('adminCompanyName').textContent = currentCompany.name;
                document.getElementById('adminInviteCode').textContent = currentCompany.invite_code;
                document.getElementById('adminUserRole').textContent = 
                    currentUser.role === 'master' ? 'Master' : 'Admin';
                document.getElementById('adminUserRole').className = 
                    `role-badge role-${currentUser.role}`;
            } else {
                showDebugAlert('⚠️ 회사 데이터가 null입니다', 'warning');
            }
        } catch (error) {
            showDebugAlert(`❌ 회사 데이터 로드 오류: ${error.message}`, 'error');
            console.error('Error loading company data:', error);
        }
    }

    /**
     * Load pending approval requests
     */
    async function loadPendingRequests() {
        try {
            showDebugAlert('📋 대기 중인 승인 요청 로드 중...', 'info');
            pendingRequests = await CompanyUtils.getPendingRequests(currentUser.companyId);
            showDebugAlert(`✅ 승인 요청 ${pendingRequests.length}건 로드 완료`, 'info');
            renderPendingRequests();
        } catch (error) {
            showDebugAlert(`❌ 승인 요청 로드 오류: ${error.message}`, 'error');
            console.error('Error loading pending requests:', error);
            showError('Failed to load pending requests');
        }
    }

    /**
     * Render pending requests
     */
    function renderPendingRequests() {
        const container = document.getElementById('pendingRequestsList');
        
        if (pendingRequests.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>No pending requests</p>
                </div>
            `;
            return;
        }

        container.innerHTML = pendingRequests.map(request => `
            <div class="request-card" data-request-id="${request.id}">
                <div class="request-header">
                    <div class="request-user">
                        <i class="fas fa-user-circle"></i>
                        <div>
                            <strong>${escapeHtml(request.user_name)}</strong>
                            <small>${escapeHtml(request.user_email)}</small>
                        </div>
                    </div>
                    <span class="role-badge role-${request.requested_role}">
                        ${request.requested_role === 'admin' ? 'Admin' : 'Employee'}
                    </span>
                </div>
                <div class="request-actions">
                    <button class="btn btn-success btn-sm" onclick="AdminPanel.approveRequest('${request.id}')">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="AdminPanel.rejectRequest('${request.id}')">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Approve a join request
     */
    async function approveRequest(requestId) {
        if (!confirm('이 가입 요청을 승인하시겠습니까?')) {
            return;
        }

        try {
            await CompanyUtils.approveJoinRequest(requestId, currentUser.id);
            showSuccess('가입 요청이 승인되었습니다.');
            await loadPendingRequests();
            await loadCompanyMembers();
        } catch (error) {
            console.error('Error approving request:', error);
            showError('승인 처리 중 오류가 발생했습니다: ' + error.message);
        }
    }

    /**
     * Reject a join request
     */
    async function rejectRequest(requestId) {
        if (!confirm('이 가입 요청을 거부하시겠습니까?')) {
            return;
        }

        try {
            await CompanyUtils.rejectJoinRequest(requestId, currentUser.id);
            showSuccess('가입 요청이 거부되었습니다.');
            await loadPendingRequests();
        } catch (error) {
            console.error('Error rejecting request:', error);
            showError('거부 처리 중 오류가 발생했습니다: ' + error.message);
        }
    }

    /**
     * Load company members
     */
    async function loadCompanyMembers() {
        try {
            showDebugAlert('👥 회사 멤버 로드 중...', 'info');
            const db = firebase.firestore();
            if (!db) {
                throw new Error('Firestore가 초기화되지 않았습니다');
            }
            const snapshot = await db.collection('users')
                .where('company_id', '==', currentUser.companyId)
                .where('status', '==', 'active')
                .get();

            companyMembers = [];
            snapshot.forEach(doc => {
                companyMembers.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            showDebugAlert(`✅ 회사 멤버 ${companyMembers.length}명 로드 완료`, 'info');
            updateMemberCounts();
            renderMembers();
        } catch (error) {
            showDebugAlert(`❌ 회사 멤버 로드 오류: ${error.message}`, 'error');
            console.error('Error loading members:', error);
            showError('Failed to load members');
        }
    }

    /**
     * Update member counts
     */
    function updateMemberCounts() {
        const allCount = companyMembers.length;
        const adminCount = companyMembers.filter(m => 
            m.role === 'master' || m.role === 'admin'
        ).length;
        const employeeCount = companyMembers.filter(m => 
            m.role === 'employee'
        ).length;

        document.getElementById('countAll').textContent = allCount;
        document.getElementById('countAdmins').textContent = adminCount;
        document.getElementById('countEmployees').textContent = employeeCount;
    }

    /**
     * Filter members by role
     */
    function filterMembers(filter) {
        currentFilter = filter;
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        });

        renderMembers();
    }

    /**
     * Render company members
     */
    function renderMembers() {
        const container = document.getElementById('membersList');
        
        let filteredMembers = companyMembers;
        if (currentFilter === 'admin') {
            filteredMembers = companyMembers.filter(m => 
                m.role === 'master' || m.role === 'admin'
            );
        } else if (currentFilter === 'employee') {
            filteredMembers = companyMembers.filter(m => 
                m.role === 'employee'
            );
        }

        if (filteredMembers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users-slash"></i>
                    <p>No members found</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredMembers.map(member => `
            <div class="member-card" data-member-id="${member.id}">
                <div class="member-header">
                    ${member.photoURL ? 
                        `<img src="${member.photoURL}" alt="${escapeHtml(member.username)}" class="member-avatar">` :
                        `<div class="member-avatar-placeholder">
                            <i class="fas fa-user"></i>
                        </div>`
                    }
                    <div class="member-info">
                        <strong>${escapeHtml(member.username)}</strong>
                        <small>${escapeHtml(member.email)}</small>
                        ${member.auth_provider === 'google' ? 
                            '<span class="provider-badge"><i class="fab fa-google"></i> Google</span>' : 
                            ''
                        }
                    </div>
                    <span class="role-badge role-${member.role}">
                        ${member.role === 'master' ? 'Master' : 
                          member.role === 'admin' ? 'Admin' : 'Employee'}
                    </span>
                </div>
                ${member.id !== currentUser.id && member.role !== 'master' ? `
                    <div class="member-actions">
                        ${currentUser.role === 'master' && member.role === 'employee' ? `
                            <button class="btn btn-secondary btn-sm" onclick="AdminPanel.promoteToAdmin('${member.id}')">
                                <i class="fas fa-user-shield"></i> Promote to Admin
                            </button>
                        ` : ''}
                        ${(currentUser.role === 'master') || (currentUser.role === 'admin' && member.role === 'employee') ? `
                            <button class="btn btn-danger btn-sm" onclick="AdminPanel.removeMember('${member.id}')">
                                <i class="fas fa-user-times"></i> Remove
                            </button>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    /**
     * Promote user to admin
     */
    async function promoteToAdmin(userId) {
        // 권한 체크: Master만 Admin을 임명할 수 있음
        if (currentUser.role !== 'master') {
            showError('⚠️ 권한이 없습니다. Master만 Admin을 임명할 수 있습니다.');
            return;
        }

        const member = companyMembers.find(m => m.id === userId);
        if (!member) return;

        // 이미 Admin이거나 Master인 경우
        if (member.role === 'admin') {
            showError('⚠️ 이미 Admin 권한을 가지고 있습니다.');
            return;
        }
        if (member.role === 'master') {
            showError('⚠️ Master는 Admin으로 변경할 수 없습니다.');
            return;
        }

        if (!confirm(`${member.username}님을 관리자로 임명하시겠습니까?`)) {
            return;
        }

        try {
            const db = firebase.firestore();
            
            // Update user role
            await db.collection('users').doc(userId).update({
                role: 'admin'
            });

            // Add to company admins list
            await db.collection('companies').doc(currentUser.companyId).update({
                admins: firebase.firestore.FieldValue.arrayUnion(userId)
            });

            showSuccess('사용자가 관리자로 임명되었습니다.');
            await loadCompanyMembers();
        } catch (error) {
            console.error('Error promoting user:', error);
            showError('관리자 임명 중 오류가 발생했습니다: ' + error.message);
        }
    }

    /**
     * Remove member from company
     */
    async function removeMember(userId) {
        const member = companyMembers.find(m => m.id === userId);
        if (!member) return;

        // 권한 체크
        if (currentUser.role !== 'master' && currentUser.role !== 'admin') {
            showError('⚠️ 권한이 없습니다. Master 또는 Admin만 멤버를 제거할 수 있습니다.');
            return;
        }

        // Master는 제거할 수 없음
        if (member.role === 'master') {
            showError('⚠️ Master 계정은 제거할 수 없습니다.');
            return;
        }

        // Admin은 다른 Admin을 제거할 수 없음 (Master만 가능)
        if (member.role === 'admin' && currentUser.role !== 'master') {
            showError('⚠️ Admin 계정은 Master만 제거할 수 있습니다.');
            return;
        }

        // 자기 자신은 제거할 수 없음
        if (userId === currentUser.id) {
            showError('⚠️ 자기 자신은 제거할 수 없습니다. 회사 탈퇴는 프로필 설정에서 가능합니다.');
            return;
        }

        if (!confirm(`${member.username}님을 기업에서 제거하시겠습니까?`)) {
            return;
        }

        try {
            await CompanyUtils.removeUserFromCompany(userId, currentUser.id);
            showSuccess('사용자가 제거되었습니다.');
            await loadCompanyMembers();
        } catch (error) {
            console.error('Error removing member:', error);
            showError('사용자 제거 중 오류가 발생했습니다: ' + error.message);
        }
    }

    /**
     * Create quick account (ID + name only)
     */
    async function createQuickAccount() {
        const employeeId = document.getElementById('quickAccountId').value.trim();
        const employeeName = document.getElementById('quickAccountName').value.trim();

        if (!employeeId || !employeeName) {
            alert('직원 ID와 이름을 모두 입력해주세요.');
            return;
        }

        // Validate ID format (alphanumeric only)
        if (!/^[A-Za-z0-9]+$/.test(employeeId)) {
            alert('직원 ID는 영문자와 숫자만 사용할 수 있습니다.');
            return;
        }

        if (!confirm(`다음 계정을 생성하시겠습니까?\n\nID: ${employeeId}\n이름: ${employeeName}\n\n이 계정은 즉시 활성화되며, 직원에게 ID를 배포할 수 있습니다.`)) {
            return;
        }

        try {
            const db = firebase.firestore();
            
            // Check if ID already exists
            const existingEmail = `${employeeId}@${currentUser.companyId}.local`;
            const existingUsers = await db.collection('users')
                .where('email', '==', existingEmail)
                .get();

            if (!existingUsers.empty) {
                alert('이미 존재하는 직원 ID입니다. 다른 ID를 사용해주세요.');
                return;
            }

            // Create simple account
            const newUserData = {
                username: employeeName,
                email: existingEmail,
                password: 'simple_account', // Simple accounts don't use password
                role: 'employee',
                company_id: currentUser.companyId,
                status: 'active',
                account_type: 'simple', // Mark as simple account
                employee_id: employeeId,
                created_by: currentUser.id,
                created_at: firebase.firestore.FieldValue.serverTimestamp(),
                auth_provider: 'simple'
            };

            const userRef = await db.collection('users').add(newUserData);

            showSuccess(`계정이 생성되었습니다!\n\n직원 ID: ${employeeId}\n이름: ${employeeName}\n\n이 ID를 직원에게 배포하세요.`);

            // Clear form
            document.getElementById('quickAccountId').value = '';
            document.getElementById('quickAccountName').value = '';

            // Reload members list
            await loadCompanyMembers();
        } catch (error) {
            console.error('계정 생성 에러:', error);
            showError('계정 생성 중 오류가 발생했습니다: ' + error.message);
        }
    }

    /**
     * Copy invite code to clipboard
     */
    function copyInviteCode() {
        const codeElement = document.getElementById('adminInviteCode');
        const code = codeElement.textContent;

        if (navigator.clipboard) {
            navigator.clipboard.writeText(code).then(() => {
                showSuccess('초대 코드가 복사되었습니다: ' + code);
            }).catch(err => {
                console.error('Copy failed:', err);
                fallbackCopy(code);
            });
        } else {
            fallbackCopy(code);
        }
    }

    /**
     * Fallback copy method
     */
    function fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            document.execCommand('copy');
            showSuccess('초대 코드가 복사되었습니다: ' + text);
        } catch (err) {
            alert('초대 코드: ' + text);
        }
        
        document.body.removeChild(textarea);
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Show success message
     */
    function showSuccess(message) {
        alert('✅ ' + message);
    }

    /**
     * Show error message
     */
    function showError(message) {
        alert('❌ ' + message);
    }

    // Public API
    return {
        init,
        approveRequest,
        rejectRequest,
        promoteToAdmin,
        removeMember,
        loadPendingRequests,
        loadCompanyMembers
    };
})();
