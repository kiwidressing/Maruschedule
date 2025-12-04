// 데이터베이스 API 관리 모듈 (Firestore 기반)
const Database = {
  // 사용자의 시프트 데이터 가져오기
  async getUserShifts(userId, weekStart) {
    try {
      if (!db) {
        console.error('Firestore not initialized');
        return [];
      }

      const snapshot = await db.collection('shifts')
        .where('user_id', '==', userId)
        .where('week_start', '==', weekStart)
        .get();
      
      const shifts = [];
      snapshot.forEach(doc => {
        shifts.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return shifts;
    } catch (error) {
      console.error('시프트 데이터 가져오기 에러:', error);
      return [];
    }
  },

  // 시프트 데이터 저장 또는 업데이트
  async saveShift(shiftData) {
    try {
      if (!db) {
        throw new Error('Firestore not initialized');
      }

      // Add company_id from current user
      const currentUser = Auth.getCurrentUser();
      if (currentUser && currentUser.companyId) {
        shiftData.company_id = currentUser.companyId;
      }

      // 기존 데이터 확인
      const existing = await this.findShift(
        shiftData.user_id, 
        shiftData.week_start, 
        shiftData.day_key
      );

      if (existing) {
        // 업데이트
        await db.collection('shifts').doc(existing.id).update({
          ...shiftData,
          updated_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { success: true, id: existing.id };
      } else {
        // 새로 생성
        const docRef = await db.collection('shifts').add({
          ...shiftData,
          created_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { success: true, id: docRef.id };
      }
    } catch (error) {
      console.error('시프트 저장 에러:', error);
      throw error;
    }
  },

  // 특정 시프트 찾기
  async findShift(userId, weekStart, dayKey) {
    try {
      if (!db) {
        return null;
      }

      const snapshot = await db.collection('shifts')
        .where('user_id', '==', userId)
        .where('week_start', '==', weekStart)
        .where('day_key', '==', dayKey)
        .limit(1)
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
      console.error('시프트 찾기 에러:', error);
      return null;
    }
  },

  // 아카이브 저장
  async saveArchive(archiveData) {
    try {
      if (!db) {
        throw new Error('Firestore not initialized');
      }

      // Add company_id from current user
      const currentUser = Auth.getCurrentUser();
      if (currentUser && currentUser.companyId) {
        archiveData.company_id = currentUser.companyId;
      }

      const docRef = await db.collection('archives').add({
        ...archiveData,
        archived_at: firebase.firestore.FieldValue.serverTimestamp()
      });

      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('아카이브 저장 에러:', error);
      throw error;
    }
  },

  // 사용자의 아카이브 목록 가져오기
  async getUserArchives(userId) {
    try {
      if (!db) {
        return [];
      }

      const snapshot = await db.collection('archives')
        .where('user_id', '==', userId)
        .orderBy('archived_at', 'desc')
        .get();
      
      const archives = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        archives.push({
          id: doc.id,
          ...data,
          archived_at: data.archived_at ? data.archived_at.toDate().toISOString() : new Date().toISOString()
        });
      });
      
      return archives;
    } catch (error) {
      console.error('아카이브 가져오기 에러:', error);
      return [];
    }
  },

  // 특정 주의 모든 사용자 시프트 가져오기 (같은 회사)
  async getAllShiftsByWeek(weekStart) {
    try {
      if (!db) {
        return [];
      }

      const currentUser = Auth.getCurrentUser();
      if (!currentUser || !currentUser.companyId) {
        console.log('No company ID for current user');
        return [];
      }

      const snapshot = await db.collection('shifts')
        .where('company_id', '==', currentUser.companyId)
        .where('week_start', '==', weekStart)
        .get();
      
      const shifts = [];
      snapshot.forEach(doc => {
        shifts.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return shifts;
    } catch (error) {
      console.error('전체 시프트 가져오기 에러:', error);
      return [];
    }
  },

  // 모든 사용자 목록 가져오기 (같은 회사)
  async getAllUsers() {
    try {
      if (!db) {
        return [];
      }

      const currentUser = Auth.getCurrentUser();
      if (!currentUser || !currentUser.companyId) {
        return [];
      }

      const snapshot = await db.collection('users')
        .where('company_id', '==', currentUser.companyId)
        .where('status', '==', 'active')
        .get();
      
      const users = [];
      snapshot.forEach(doc => {
        users.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return users;
    } catch (error) {
      console.error('사용자 목록 가져오기 에러:', error);
      return [];
    }
  },

  // 특정 아카이브 삭제
  async deleteArchive(archiveId) {
    try {
      if (!db) {
        return false;
      }

      await db.collection('archives').doc(archiveId).delete();
      return true;
    } catch (error) {
      console.error('아카이브 삭제 에러:', error);
      return false;
    }
  },

  // 사용자 이름으로 사용자 찾기
  async getUserById(userId) {
    try {
      if (!db) {
        return null;
      }

      const doc = await db.collection('users').doc(userId).get();
      
      if (!doc.exists) {
        return null;
      }

      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('사용자 찾기 에러:', error);
      return null;
    }
  }
};
