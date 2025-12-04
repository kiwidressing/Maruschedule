/**
 * Profile Management Module
 * Handles user profile editing and company withdrawal
 */

const ProfileManager = (function() {
    'use strict';

    let currentUser = null;

    /**
     * Initialize profile manager
     */
    function init() {
        currentUser = Auth.getCurrentUser();
        setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Profile button
        const profileBtn = document.getElementById('profileBtn');
        if (profileBtn) {
            profileBtn.addEventListener('click', showProfileModal);
        }

        // Close modal
        const closeBtn = document.getElementById('closeProfileModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', hideProfileModal);
        }

        // Save profile
        const saveBtn = document.getElementById('saveProfileBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', saveProfile);
        }

        // Withdraw from company
        const withdrawBtn = document.getElementById('withdrawBtn');
        if (withdrawBtn) {
            withdrawBtn.addEventListener('click', withdrawFromCompany);
        }

        // Close modal on outside click
        const modal = document.getElementById('profileModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    hideProfileModal();
                }
            });
        }
    }

    /**
     * Show profile modal
     */
    function showProfileModal() {
        currentUser = Auth.getCurrentUser();
        if (!currentUser) {
            alert('로그인이 필요합니다.');
            return;
        }

        // Fill in current data
        document.getElementById('profileName').value = currentUser.username || '';
        document.getElementById('profileEmail').value = currentUser.email || '';
        document.getElementById('profileCompany').value = currentUser.companyName || 'N/A';
        
        const roleMap = {
            'master': 'Master',
            'admin': 'Admin',
            'employee': 'Employee'
        };
        document.getElementById('profileRole').value = roleMap[currentUser.role] || 'Employee';

        // Show modal
        document.getElementById('profileModal').style.display = 'flex';
    }

    /**
     * Hide profile modal
     */
    function hideProfileModal() {
        document.getElementById('profileModal').style.display = 'none';
    }

    /**
     * Save profile changes
     */
    async function saveProfile() {
        const newName = document.getElementById('profileName').value.trim();
        
        if (!newName) {
            alert('이름을 입력해주세요.');
            return;
        }

        if (!db) {
            alert('Firestore가 초기화되지 않았습니다.');
            return;
        }

        try {
            // Update in Firestore
            await db.collection('users').doc(currentUser.id).update({
                username: newName
            });

            // Update local storage
            currentUser.username = newName;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            // Update UI
            document.getElementById('currentUserName').textContent = newName;

            alert('프로필이 업데이트되었습니다!');
            hideProfileModal();
        } catch (error) {
            console.error('프로필 업데이트 에러:', error);
            alert('프로필 업데이트 중 오류가 발생했습니다: ' + error.message);
        }
    }

    /**
     * Withdraw from company
     */
    async function withdrawFromCompany() {
        const confirmMsg = `정말로 ${currentUser.companyName}에서 탈퇴하시겠습니까?\n\n` +
                          '탈퇴 후에는 더 이상 이 회사의 데이터에 접근할 수 없습니다.\n' +
                          '다시 가입하려면 관리자의 승인이 필요합니다.';
        
        if (!confirm(confirmMsg)) {
            return;
        }

        // Double confirmation
        const finalConfirm = prompt('탈퇴를 진행하려면 "탈퇴"라고 입력해주세요:');
        if (finalConfirm !== '탈퇴') {
            alert('탈퇴가 취소되었습니다.');
            return;
        }

        try {
            if (!db) {
                throw new Error('Firestore not initialized');
            }

            // Update user status to self_removed
            await db.collection('users').doc(currentUser.id).update({
                status: 'self_removed',
                company_id: null,
                removed_at: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert('회사에서 탈퇴했습니다. 다시 로그인해주세요.');
            
            // Logout
            if (typeof auth !== 'undefined' && auth && auth.currentUser) {
                await auth.signOut();
            }
            
            localStorage.removeItem('currentUser');
            window.location.reload();
        } catch (error) {
            console.error('탈퇴 에러:', error);
            alert('탈퇴 처리 중 오류가 발생했습니다: ' + error.message);
        }
    }

    // Public API
    return {
        init,
        showProfileModal
    };
})();
