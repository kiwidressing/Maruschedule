# Firestore Security Rules Setup Instructions

## Overview
This document provides instructions for setting up Firestore security rules for the multi-company Maru Schedule application.

## Prerequisites
- Firebase project created (`maruschedule-ccf5a`)
- Firestore Database activated
- Firebase Authentication enabled

## Step 1: Access Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `maruschedule-ccf5a`
3. Navigate to **Firestore Database** in the left sidebar

## Step 2: Update Security Rules

1. Click on the **Rules** tab
2. Copy the entire contents of `firestore.rules` file from this repository
3. Paste it into the Firebase Console Rules editor
4. Click **Publish** to deploy the rules

## Security Rules Explanation

### Collections

#### `companies`
- **Read**: Public (anyone can look up companies by invite code)
- **Create**: Authenticated users only
- **Update**: Only the master who created the company
- **Delete**: Not allowed

#### `users`
- **Read**: Users can read their own data + company members can read each other
- **Create**: Public (for signup)
- **Update**: Users can update their own data + admins can update users in their company
- **Delete**: Not allowed

#### `pendingInvites`
- **Read**: Users can read their own requests + admins can read requests for their company
- **Create**: Public (for signup process)
- **Update**: Admins can approve/reject requests for their company
- **Delete**: Not allowed

#### `shifts`
- **Read**: Users can read their own shifts + company members can read each other's shifts
- **Create**: Users can create their own shifts (must be in same company)
- **Update**: Users can update their own shifts + admins can update any shift in their company
- **Delete**: Users can delete their own shifts + admins can delete any shift in their company

#### `archives`
- **Read**: Users can read their own archives + company members can read each other's archives
- **Create**: Users can create their own archives (must be in same company)
- **Update**: Users can update their own archives
- **Delete**: Users can delete their own archives + admins can delete any archive in their company

### Helper Functions

- `isAuthenticated()`: Checks if user is logged in
- `getUserData()`: Retrieves current user's document data
- `isUserActive()`: Checks if user status is 'active'
- `isMaster()`: Checks if user role is 'master'
- `isAdmin()`: Checks if user role is 'admin' or 'master'
- `isSameCompany(companyId)`: Checks if user belongs to the specified company
- `isOwner(userId)`: Checks if authenticated user ID matches the specified user ID

## Step 3: Test Security Rules

After deploying the rules, test the following scenarios:

### Test 1: Public Signup
- Try creating a new user account
- Should succeed without authentication

### Test 2: Company Lookup
- Try reading a company document by invite code
- Should succeed even without authentication

### Test 3: User Data Access
- Login as a user
- Try reading your own user document
- Should succeed
- Try reading another user's document in your company
- Should succeed
- Try reading a user document from a different company
- Should fail

### Test 4: Shift Management
- Create a shift for yourself
- Should succeed
- Try creating a shift for another user
- Should fail (unless you're an admin)
- Read shifts from your company
- Should succeed
- Try reading shifts from another company
- Should fail

### Test 5: Admin Functions
- Login as admin/master
- Approve a pending invite
- Should succeed
- Try approving a pending invite from another company
- Should fail
- Update another user's role in your company
- Should succeed
- Try updating a user from another company
- Should fail

## Step 4: Monitor Rules

1. In Firebase Console, go to **Firestore Database** → **Rules** → **Rules Playground**
2. Test different operations with different user contexts
3. Check the **Rules** tab regularly for any security warnings

## Important Notes

⚠️ **Security Considerations**:

1. **Password Storage**: Current implementation stores hashed passwords in Firestore. For production, consider:
   - Using Firebase Authentication's native email/password
   - Implementing server-side authentication with Cloud Functions
   - Never storing plain text passwords

2. **Data Validation**: Add more validation rules for:
   - Email format validation
   - Required field checks
   - Data type validation

3. **Rate Limiting**: Consider implementing rate limiting for:
   - Signup requests
   - Failed login attempts
   - Invite code lookups

4. **Audit Logging**: For production, consider logging:
   - User role changes
   - Member removals
   - Approval/rejection actions

## Troubleshooting

### Error: "Missing or insufficient permissions"
- Check if user is authenticated
- Verify user's company_id matches the resource
- Ensure user has the required role (master/admin)

### Error: "PERMISSION_DENIED"
- User doesn't have access to the resource
- Check security rules are published
- Verify user data is correctly stored in Firestore

### Rules Not Working
- Clear browser cache
- Wait 1-2 minutes for rules to propagate
- Check Firebase Console for rule syntax errors
- Test in Rules Playground

## Production Checklist

Before going to production:

- [ ] Review all security rules
- [ ] Test all user roles (master, admin, employee)
- [ ] Test cross-company access restrictions
- [ ] Implement server-side authentication
- [ ] Add data validation rules
- [ ] Set up backup and recovery
- [ ] Configure Firebase App Check (optional)
- [ ] Enable Firebase Security Rules monitoring
- [ ] Set up alerts for suspicious activity

## Additional Resources

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore Security Rules Reference](https://firebase.google.com/docs/reference/security/database)
- [Security Rules Unit Testing](https://firebase.google.com/docs/rules/unit-tests)

---

Last Updated: 2025-12-04
Version: 1.0
