/**
 * Company Management Utilities for Multi-Tenant System
 * Handles company creation, invite code generation, and company-related operations
 */

const CompanyUtils = (function() {
    'use strict';

    /**
     * Generate a random 6-character alphanumeric invite code
     * @returns {string} 6-character code (uppercase letters and numbers)
     */
    function generateInviteCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    /**
     * Check if invite code already exists in Firestore
     * @param {string} code - Invite code to check
     * @returns {Promise<boolean>} True if code exists
     */
    async function isInviteCodeExists(code) {
        try {
            const db = firebase.firestore();
            const snapshot = await db.collection('companies')
                .where('invite_code', '==', code)
                .get();
            return !snapshot.empty;
        } catch (error) {
            console.error('❌ Error checking invite code:', error);
            throw error;
        }
    }

    /**
     * Generate a unique invite code
     * @returns {Promise<string>} Unique 6-character code
     */
    async function generateUniqueInviteCode() {
        let code;
        let attempts = 0;
        const maxAttempts = 10;

        do {
            code = generateInviteCode();
            attempts++;
            
            if (attempts >= maxAttempts) {
                throw new Error('Failed to generate unique invite code after ' + maxAttempts + ' attempts');
            }
        } while (await isInviteCodeExists(code));

        return code;
    }

    /**
     * Create a new company
     * @param {string} companyName - Name of the company
     * @param {string} masterUserId - User ID of the master account creating the company
     * @param {string} customCode - Optional custom invite code (must be 6 chars)
     * @returns {Promise<object>} Created company document data
     */
    async function createCompany(companyName, masterUserId, customCode = null) {
        try {
            const db = firebase.firestore();
            
            // Generate or validate invite code
            let inviteCode;
            if (customCode) {
                // Validate custom code format
                if (!/^[A-Z0-9]{6}$/.test(customCode)) {
                    throw new Error('Invite code must be 6 alphanumeric characters (A-Z, 0-9)');
                }
                // Check if custom code already exists
                if (await isInviteCodeExists(customCode)) {
                    throw new Error('This invite code is already in use');
                }
                inviteCode = customCode;
            } else {
                inviteCode = await generateUniqueInviteCode();
            }

            // Create company document
            const companyData = {
                name: companyName,
                invite_code: inviteCode,
                created_by: masterUserId,
                admins: [masterUserId], // Master is the first admin
                created_at: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'active'
            };

            const companyRef = await db.collection('companies').add(companyData);
            
            console.log('✅ Company created:', companyRef.id);
            
            return {
                id: companyRef.id,
                ...companyData
            };
        } catch (error) {
            console.error('❌ Error creating company:', error);
            throw error;
        }
    }

    /**
     * Get company by invite code
     * @param {string} inviteCode - 6-character invite code
     * @returns {Promise<object|null>} Company data or null if not found
     */
    async function getCompanyByInviteCode(inviteCode) {
        try {
            const db = firebase.firestore();
            const snapshot = await db.collection('companies')
                .where('invite_code', '==', inviteCode.toUpperCase())
                .where('status', '==', 'active')
                .get();

            if (snapshot.empty) {
                return null;
            }

            const doc = snapshot.docs[0];
            return {
                id: doc.id,
                ...doc.data()
            };
        } catch (error) {
            console.error('❌ Error getting company by code:', error);
            throw error;
        }
    }

    /**
     * Get company by ID
     * @param {string} companyId - Company document ID
     * @returns {Promise<object|null>} Company data or null if not found
     */
    async function getCompanyById(companyId) {
        try {
            const db = firebase.firestore();
            const doc = await db.collection('companies').doc(companyId).get();
            
            if (!doc.exists) {
                return null;
            }

            return {
                id: doc.id,
                ...doc.data()
            };
        } catch (error) {
            console.error('❌ Error getting company by ID:', error);
            throw error;
        }
    }

    /**
     * Create a join request (pending invite)
     * @param {string} userId - User ID requesting to join
     * @param {string} companyId - Company ID to join
     * @param {string} requestedRole - 'admin' or 'employee'
     * @returns {Promise<object>} Created pending invite data
     */
    async function createJoinRequest(userId, companyId, requestedRole) {
        try {
            const db = firebase.firestore();
            
            // Check if request already exists
            const existingRequest = await db.collection('pendingInvites')
                .where('user_id', '==', userId)
                .where('company_id', '==', companyId)
                .where('status', '==', 'pending')
                .get();

            if (!existingRequest.empty) {
                throw new Error('You already have a pending request for this company');
            }

            const requestData = {
                user_id: userId,
                company_id: companyId,
                requested_role: requestedRole,
                status: 'pending',
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            };

            const requestRef = await db.collection('pendingInvites').add(requestData);
            
            console.log('✅ Join request created:', requestRef.id);
            
            return {
                id: requestRef.id,
                ...requestData
            };
        } catch (error) {
            console.error('❌ Error creating join request:', error);
            throw error;
        }
    }

    /**
     * Get all pending requests for a company
     * @param {string} companyId - Company ID
     * @returns {Promise<Array>} Array of pending requests
     */
    async function getPendingRequests(companyId) {
        try {
            const db = firebase.firestore();
            const snapshot = await db.collection('pendingInvites')
                .where('company_id', '==', companyId)
                .where('status', '==', 'pending')
                .get();

            const requests = [];
            for (const doc of snapshot.docs) {
                const data = doc.data();
                
                // Get user info
                const userDoc = await db.collection('users').doc(data.user_id).get();
                const userData = userDoc.exists ? userDoc.data() : {};

                requests.push({
                    id: doc.id,
                    ...data,
                    user_name: userData.username || 'Unknown',
                    user_email: userData.email || 'Unknown'
                });
            }

            return requests;
        } catch (error) {
            console.error('❌ Error getting pending requests:', error);
            throw error;
        }
    }

    /**
     * Approve a join request
     * @param {string} requestId - Pending invite ID
     * @param {string} approverId - User ID of approver (admin/master)
     * @returns {Promise<void>}
     */
    async function approveJoinRequest(requestId, approverId) {
        try {
            const db = firebase.firestore();
            
            // Get request data
            const requestDoc = await db.collection('pendingInvites').doc(requestId).get();
            if (!requestDoc.exists) {
                throw new Error('Join request not found');
            }

            const requestData = requestDoc.data();
            
            // Update user document with company and role
            await db.collection('users').doc(requestData.user_id).update({
                company_id: requestData.company_id,
                role: requestData.requested_role,
                status: 'active',
                approved_by: approverId,
                approved_at: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Mark request as approved
            await db.collection('pendingInvites').doc(requestId).update({
                status: 'approved',
                approved_by: approverId,
                approved_at: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log('✅ Join request approved:', requestId);
        } catch (error) {
            console.error('❌ Error approving join request:', error);
            throw error;
        }
    }

    /**
     * Reject a join request
     * @param {string} requestId - Pending invite ID
     * @param {string} rejecterId - User ID of rejecter (admin/master)
     * @returns {Promise<void>}
     */
    async function rejectJoinRequest(requestId, rejecterId) {
        try {
            const db = firebase.firestore();
            
            await db.collection('pendingInvites').doc(requestId).update({
                status: 'rejected',
                rejected_by: rejecterId,
                rejected_at: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log('✅ Join request rejected:', requestId);
        } catch (error) {
            console.error('❌ Error rejecting join request:', error);
            throw error;
        }
    }

    /**
     * Remove user from company (kick out)
     * @param {string} userId - User ID to remove
     * @param {string} removerId - User ID of remover (admin/master)
     * @returns {Promise<void>}
     */
    async function removeUserFromCompany(userId, removerId) {
        try {
            const db = firebase.firestore();
            
            await db.collection('users').doc(userId).update({
                status: 'removed',
                removed_by: removerId,
                removed_at: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log('✅ User removed from company:', userId);
        } catch (error) {
            console.error('❌ Error removing user:', error);
            throw error;
        }
    }

    /**
     * User self-withdrawal from company
     * @param {string} userId - User ID withdrawing
     * @returns {Promise<void>}
     */
    async function selfWithdraw(userId) {
        try {
            const db = firebase.firestore();
            
            await db.collection('users').doc(userId).update({
                status: 'self_removed',
                company_id: null,
                role: null,
                removed_at: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log('✅ User self-withdrew from company:', userId);
        } catch (error) {
            console.error('❌ Error during self-withdrawal:', error);
            throw error;
        }
    }

    // Public API
    return {
        generateInviteCode,
        generateUniqueInviteCode,
        createCompany,
        getCompanyByInviteCode,
        getCompanyById,
        createJoinRequest,
        getPendingRequests,
        approveJoinRequest,
        rejectJoinRequest,
        removeUserFromCompany,
        selfWithdraw
    };
})();
