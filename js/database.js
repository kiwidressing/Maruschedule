// 데이터베이스 API 관리 모듈
const Database = {
  // 사용자의 시프트 데이터 가져오기
  async getUserShifts(userId, weekStart) {
    try {
      const response = await fetch(`tables/shifts?search=${weekStart}`);
      const result = await response.json();
      
      if (result.data) {
        return result.data.filter(shift => 
          shift.user_id === userId && shift.week_start === weekStart
        );
      }
      return [];
    } catch (error) {
      console.error('시프트 데이터 가져오기 에러:', error);
      return [];
    }
  },

  // 시프트 데이터 저장 또는 업데이트
  async saveShift(shiftData) {
    try {
      // 기존 데이터 확인
      const existing = await this.findShift(
        shiftData.user_id, 
        shiftData.week_start, 
        shiftData.day_key
      );

      if (existing) {
        // 업데이트
        const response = await fetch(`tables/shifts/${existing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(shiftData)
        });
        return await response.json();
      } else {
        // 새로 생성
        const response = await fetch('tables/shifts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(shiftData)
        });
        return await response.json();
      }
    } catch (error) {
      console.error('시프트 저장 에러:', error);
      throw error;
    }
  },

  // 특정 시프트 찾기
  async findShift(userId, weekStart, dayKey) {
    try {
      const response = await fetch(`tables/shifts?search=${weekStart}`);
      const result = await response.json();
      
      if (result.data) {
        return result.data.find(shift => 
          shift.user_id === userId && 
          shift.week_start === weekStart && 
          shift.day_key === dayKey
        );
      }
      return null;
    } catch (error) {
      console.error('시프트 찾기 에러:', error);
      return null;
    }
  },

  // 아카이브 저장
  async saveArchive(archiveData) {
    try {
      const response = await fetch('tables/archives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(archiveData)
      });
      return await response.json();
    } catch (error) {
      console.error('아카이브 저장 에러:', error);
      throw error;
    }
  },

  // 사용자의 아카이브 목록 가져오기
  async getUserArchives(userId) {
    try {
      const response = await fetch(`tables/archives?search=${userId}&sort=-archived_at`);
      const result = await response.json();
      
      if (result.data) {
        return result.data.filter(archive => archive.user_id === userId);
      }
      return [];
    } catch (error) {
      console.error('아카이브 가져오기 에러:', error);
      return [];
    }
  },

  // 특정 주의 모든 사용자 시프트 가져오기
  async getAllShiftsByWeek(weekStart) {
    try {
      const response = await fetch(`tables/shifts?search=${weekStart}&limit=1000`);
      const result = await response.json();
      
      if (result.data) {
        return result.data.filter(shift => shift.week_start === weekStart);
      }
      return [];
    } catch (error) {
      console.error('전체 시프트 가져오기 에러:', error);
      return [];
    }
  },

  // 모든 사용자 목록 가져오기
  async getAllUsers() {
    try {
      const response = await fetch('tables/users?limit=1000');
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('사용자 목록 가져오기 에러:', error);
      return [];
    }
  },

  // 특정 아카이브 삭제
  async deleteArchive(archiveId) {
    try {
      const response = await fetch(`tables/archives/${archiveId}`, {
        method: 'DELETE'
      });
      return response.ok;
    } catch (error) {
      console.error('아카이브 삭제 에러:', error);
      return false;
    }
  },

  // 사용자 이름으로 사용자 찾기
  async getUserById(userId) {
    try {
      const response = await fetch(`tables/users/${userId}`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('사용자 찾기 에러:', error);
      return null;
    }
  }
};
