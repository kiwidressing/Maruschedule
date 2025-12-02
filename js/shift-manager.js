// 시프트 관리 모듈
const ShiftManager = {
  currentWeekData: {
    weekStart: null,
    days: {}
  },

  dayKeys: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
  dayNamesKo: {
    mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu',
    fri: 'Fri', sat: 'Sat', sun: 'Sun'
  },

  // 초기화
  init() {
    this.setupEventListeners();
    this.buildWeekTableHeaders();
  },

  // 이벤트 리스너 설정
  setupEventListeners() {
    document.getElementById('weekStart').addEventListener('change', () => {
      this.setWeekStartFromInput();
    });

    document.getElementById('applyDayBtn').addEventListener('click', () => {
      this.applyDayInput();
    });

    document.getElementById('clearDayInputsBtn').addEventListener('click', () => {
      this.clearDayInputs();
    });

    document.getElementById('saveWeekBtn').addEventListener('click', () => {
      this.saveCurrentWeekToArchive();
    });

    // 날짜 선택 시 요일 자동 설정
    document.getElementById('dayDate').addEventListener('change', (e) => {
      const date = new Date(e.target.value + 'T00:00:00');
      const dayOfWeek = date.getDay(); // 0 = 일요일, 1 = 월요일, ...
      const dayKeyMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      document.getElementById('dayOfWeek').value = dayKeyMap[dayOfWeek];
    });
  },

  // 시간을 시간 단위로 변환
  parseTimeToHours(timeStr) {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return h + m / 60;
  },

  // 근무시간 계산 (15분 단위 반올림)
  calcHours(startStr, endStr) {
    const s = this.parseTimeToHours(startStr);
    const e = this.parseTimeToHours(endStr);
    if (s === null || e === null) return 0;
    
    let start = s;
    let end = e;
    
    // 자정을 넘는 경우 처리
    if (end < start) {
      end += 24;
    }
    
    const rawHours = end - start;
    const rounded = Math.round(rawHours * 4) / 4; // 0.25 단위 반올림
    return rounded;
  },

  // 주 시작 날짜 설정
  async setWeekStartFromInput() {
    const input = document.getElementById('weekStart');
    const val = input.value;
    
    if (!val) {
      this.currentWeekData.weekStart = null;
      document.getElementById('weekHeaderLabel').textContent = '주 시작 날짜를 선택해주세요.';
      this.buildWeekTableHeaders();
      this.renderWeekTable();
      this.updateWeekTotals();
      return;
    }

    this.currentWeekData.weekStart = val;
    this.updateWeekHeaderLabel();
    this.buildWeekTableHeaders();
    
    // 서버에서 데이터 로드
    await this.loadWeekDataFromServer();
    
    this.renderWeekTable();
    this.updateWeekTotals();
  },

  // 서버에서 주간 데이터 로드
  async loadWeekDataFromServer() {
    const user = Auth.getCurrentUser();
    if (!user || !this.currentWeekData.weekStart) return;

    try {
      const shifts = await Database.getUserShifts(user.id, this.currentWeekData.weekStart);
      
      // 데이터 초기화
      this.currentWeekData.days = {};
      
      // 서버 데이터를 로컬 구조로 변환
      shifts.forEach(shift => {
        this.currentWeekData.days[shift.day_key] = {
          dateStr: shift.date_str,
          lnStart: shift.ln_start || '',
          lnEnd: shift.ln_end || '',
          dnStart: shift.dn_start || '',
          dnEnd: shift.dn_end || '',
          lnHours: shift.ln_hours || 0,
          dnHours: shift.dn_hours || 0
        };
      });
    } catch (error) {
      console.error('데이터 로드 에러:', error);
    }
  },

  // 주 헤더 라벨 업데이트
  updateWeekHeaderLabel() {
    if (!this.currentWeekData.weekStart) {
      document.getElementById('weekHeaderLabel').textContent = 'Please select week start date.';
      return;
    }

    const d = new Date(this.currentWeekData.weekStart + 'T00:00:00');
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    
    document.getElementById('weekHeaderLabel').textContent = 
      `Week starting ${m}/${day}/${y}`;
  },

  // 주간 테이블 헤더 생성
  buildWeekTableHeaders() {
    const headerRow = document.getElementById('weekHeaderRow');
    headerRow.innerHTML = '<th></th>';

    if (!this.currentWeekData.weekStart) {
      this.dayKeys.forEach(key => {
        const th = document.createElement('th');
        th.textContent = this.dayNamesKo[key];
        headerRow.appendChild(th);
      });
      this.buildWeekTableBodyCells();
      return;
    }

    const start = new Date(this.currentWeekData.weekStart + 'T00:00:00');
    this.dayKeys.forEach((key, idx) => {
      const d = new Date(start.getTime() + idx * 86400000);
      const dayNum = d.getDate();
      const th = document.createElement('th');
      th.textContent = `${this.dayNamesKo[key]}(${dayNum})`;
      headerRow.appendChild(th);
    });

    this.buildWeekTableBodyCells();
  },

  // 테이블 바디 셀 생성
  buildWeekTableBodyCells() {
    const lnRow = document.querySelector('tr[data-row="ln"]');
    const dnRow = document.querySelector('tr[data-row="dn"]');
    
    lnRow.innerHTML = '<td class="row-label"><strong>LN</strong></td>';
    dnRow.innerHTML = '<td class="row-label"><strong>DN</strong></td>';

    this.dayKeys.forEach(key => {
      const lnTd = document.createElement('td');
      lnTd.className = 'ln-cell';
      lnTd.dataset.dayKey = key;
      lnRow.appendChild(lnTd);

      const dnTd = document.createElement('td');
      dnTd.className = 'dn-cell';
      dnTd.dataset.dayKey = key;
      dnRow.appendChild(dnTd);
    });
  },

  // 주간 테이블 렌더링
  renderWeekTable() {
    const lnCells = document.querySelectorAll('.ln-cell');
    const dnCells = document.querySelectorAll('.dn-cell');

    lnCells.forEach(td => {
      const key = td.dataset.dayKey;
      const data = this.currentWeekData.days[key];
      
      if (!data || !data.lnStart || !data.lnEnd) {
        td.textContent = '';
      } else {
        const h = (data.lnHours || 0).toFixed(2).replace(/\.00$/, '');
        td.textContent = `${data.lnStart}~${data.lnEnd} / ${h}h`;
      }
    });

    dnCells.forEach(td => {
      const key = td.dataset.dayKey;
      const data = this.currentWeekData.days[key];
      
      if (!data || !data.dnStart || !data.dnEnd) {
        td.textContent = '';
      } else {
        const h = (data.dnHours || 0).toFixed(2).replace(/\.00$/, '');
        td.textContent = `${data.dnStart}~${data.dnEnd} / ${h}h`;
      }
    });
  },

  // 주간 합계 업데이트
  updateWeekTotals() {
    let weekdayTotal = 0;
    let saturdayTotal = 0;
    let sundayTotal = 0;

    this.dayKeys.forEach(key => {
      const d = this.currentWeekData.days[key];
      if (!d) return;
      
      const ln = d.lnHours || 0;
      const dn = d.dnHours || 0;
      const total = ln + dn;

      if (['mon', 'tue', 'wed', 'thu', 'fri'].includes(key)) {
        weekdayTotal += total;
      } else if (key === 'sat') {
        saturdayTotal += total;
      } else if (key === 'sun') {
        sundayTotal += total;
      }
    });

    const all = weekdayTotal + saturdayTotal + sundayTotal;
    const div = document.getElementById('weekTotals');
    div.textContent = 
      `Weekday: ${weekdayTotal.toFixed(2).replace(/\.00$/, '')}h | ` +
      `Saturday: ${saturdayTotal.toFixed(2).replace(/\.00$/, '')}h | ` +
      `Sunday: ${sundayTotal.toFixed(2).replace(/\.00$/, '')}h | ` +
      `Total: ${all.toFixed(2).replace(/\.00$/, '')}h`;

    return { weekdayTotal, saturdayTotal, sundayTotal, all };
  },

  // 하루 입력 적용
  async applyDayInput() {
    if (!this.currentWeekData.weekStart) {
      alert('먼저 "주 시작 날짜"를 설정해주세요.');
      return;
    }

    const user = Auth.getCurrentUser();
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    const dayDate = document.getElementById('dayDate').value;
    const dayOfWeek = document.getElementById('dayOfWeek').value;
    const lnStart = document.getElementById('lnStart').value;
    const lnEnd = document.getElementById('lnEnd').value;
    const dnStart = document.getElementById('dnStart').value;
    const dnEnd = document.getElementById('dnEnd').value;

    if (!dayDate) {
      alert('날짜를 선택해주세요.');
      return;
    }

    // 날짜가 현재 주 범위에 있는지 확인
    const start = new Date(this.currentWeekData.weekStart + 'T00:00:00').getTime();
    const target = new Date(dayDate + 'T00:00:00').getTime();
    const diffDays = Math.round((target - start) / 86400000);

    if (diffDays < 0 || diffDays > 6) {
      alert('입력한 날짜가 현재 주 범위를 벗어났습니다.\n같은 주에 해당하는 날짜를 입력해주세요.');
      return;
    }

    const key = dayOfWeek;
    const lnHours = this.calcHours(lnStart, lnEnd);
    const dnHours = this.calcHours(dnStart, dnEnd);

    // 로컬 데이터 업데이트
    if (!this.currentWeekData.days[key]) {
      this.currentWeekData.days[key] = {};
    }
    
    const dObj = this.currentWeekData.days[key];
    dObj.dateStr = dayDate;
    dObj.lnStart = lnStart || '';
    dObj.lnEnd = lnEnd || '';
    dObj.dnStart = dnStart || '';
    dObj.dnEnd = dnEnd || '';
    dObj.lnHours = lnHours;
    dObj.dnHours = dnHours;

    // 서버에 저장
    try {
      const shiftData = {
        user_id: user.id,
        week_start: this.currentWeekData.weekStart,
        day_key: key,
        date_str: dayDate,
        ln_start: lnStart || '',
        ln_end: lnEnd || '',
        ln_hours: lnHours,
        dn_start: dnStart || '',
        dn_end: dnEnd || '',
        dn_hours: dnHours
      };

      await Database.saveShift(shiftData);
      
      this.renderWeekTable();
      this.updateWeekTotals();
      
      alert('근무가 입력되었습니다!');
    } catch (error) {
      console.error('저장 에러:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  },

  // 입력값 초기화
  clearDayInputs() {
    document.getElementById('dayDate').value = '';
    document.getElementById('lnStart').value = '';
    document.getElementById('lnEnd').value = '';
    document.getElementById('dnStart').value = '';
    document.getElementById('dnEnd').value = '';
  },

  // 아카이브에 저장
  async saveCurrentWeekToArchive() {
    if (!this.currentWeekData.weekStart) {
      alert('주 시작 날짜가 설정되지 않았습니다.');
      return;
    }

    const user = Auth.getCurrentUser();
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    const totals = this.updateWeekTotals();
    const label = this.getWeekLabelForArchive(this.currentWeekData.weekStart);

    const dayParts = [];
    this.dayKeys.forEach(key => {
      const d = this.currentWeekData.days[key];
      const ln = d?.lnHours || 0;
      const dn = d?.dnHours || 0;
      const total = ln + dn;
      const hStr = total.toFixed(2).replace(/\.00$/, '');
      dayParts.push(`${this.dayNamesKo[key]} ${hStr}h`);
    });

    const summaryString = 
      `${label} | ${dayParts.join(' ')} | ` +
      `총근무 평일 ${totals.weekdayTotal.toFixed(2).replace(/\.00$/, '')}h ` +
      `토요일 ${totals.saturdayTotal.toFixed(2).replace(/\.00$/, '')}h ` +
      `일요일 ${totals.sundayTotal.toFixed(2).replace(/\.00$/, '')}h`;

    try {
      const archiveData = {
        user_id: user.id,
        username: user.username,
        week_start: this.currentWeekData.weekStart,
        label: label,
        summary: summaryString,
        weekday_total: totals.weekdayTotal,
        saturday_total: totals.saturdayTotal,
        sunday_total: totals.sundayTotal,
        total_hours: totals.all,
        archived_at: new Date().toISOString()
      };

      await Database.saveArchive(archiveData);
      alert('이번 주 근무표가 아카이브에 저장되었습니다!');
      
      // 아카이브 탭 새로고침
      if (window.App) {
        window.App.loadMyArchives();
      }
    } catch (error) {
      console.error('아카이브 저장 에러:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  },

  // 아카이브 라벨 생성
  getWeekLabelForArchive(weekStart) {
    if (!weekStart) return '날짜 미설정 주';
    
    const d = new Date(weekStart + 'T00:00:00');
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const weekInMonth = Math.floor((day - 1) / 7) + 1;
    
    return `${month}월 ${weekInMonth}째주 ${year} (시작: ${month}월 ${day}일)`;
  },

  // 현재 주간 데이터 가져오기
  getCurrentWeekData() {
    return this.currentWeekData;
  }
};
