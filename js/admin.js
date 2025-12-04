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
     * Initialize admin panel
     */
    async function init(user) {
        currentUser = user;
        
        // Show/hide admin tab based on role
        const adminTabBtn = document.getElementById('adminTabBtn');
        if (user.role === 'master' || user.role === 'admin') {
            adminTabBtn.style.display = 'block';
        } else {
            adminTabBtn.style.display = 'none';
            return;
        }

        // Load company data
        if (user.companyId) {
            await loadCompanyData();
            await loadPendingRequests();
            await loadCompanyMembers();
        }

        setupEventListeners();
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
            currentCompany = await CompanyUtils.getCompanyById(currentUser.companyId);
            
            if (currentCompany) {
                document.getElementById('adminCompanyName').textContent = currentCompany.name;
                document.getElementById('adminInviteCode').textContent = currentCompany.invite_code;
                document.getElementById('adminUserRole').textContent = 
                    currentUser.role === 'master' ? 'Master' : 'Admin';
                document.getElementById('adminUserRole').className = 
                    `role-badge role-${currentUser.role}`;
            }
        } catch (error) {
            console.error('Error loading company data:', error);
        }
    }

    /**
     * Load pending approval requests
     */
    async function loadPendingRequests() {
        try {
            pendingRequests = await CompanyUtils.getPendingRequests(currentUser.companyId);
            renderPendingRequests();
        } catch (error) {
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
            const db = firebase.firestore();
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

            updateMemberCounts();
            renderMembers();
        } catch (error) {
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
                ${currentUser.role === 'master' && member.id !== currentUser.id ? `
                    <div class="member-actions">
                        ${member.role !== 'admin' ? `
                            <button class="btn btn-secondary btn-sm" onclick="AdminPanel.promoteToAdmin('${member.id}')">
                                <i class="fas fa-user-shield"></i> Promote to Admin
                            </button>
                        ` : ''}
                        <button class="btn btn-danger btn-sm" onclick="AdminPanel.removeMember('${member.id}')">
                            <i class="fas fa-user-times"></i> Remove
                        </button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    /**
     * Promote user to admin
     */
    async function promoteToAdmin(userId) {
        if (!confirm('이 사용자를 관리자로 임명하시겠습니까?')) {
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
