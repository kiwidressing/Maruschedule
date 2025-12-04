// 메인 애플리케이션 모듈
const App = {
  currentTab: 'shift-input',

  // 초기화
  init() {
    console.log('🚀 App.init() 시작');
    
    this.setupTabNavigation();
    this.setupExportButtons();
    this.setupAllShiftsTab();
    
    // 시프트 매니저 초기화
    ShiftManager.init();
    
    // 아카이브 로드
    this.loadMyArchives();
    
    // Profile 매니저 초기화
    if (typeof ProfileManager !== 'undefined') {
      ProfileManager.init();
    }
    
    // Admin 패널 초기화
    const user = Auth.getCurrentUser();
    console.log('🔧 App.js - getCurrentUser:', user);
    
    if (user && (user.role === 'master' || user.role === 'admin')) {
      if (typeof AdminPanel !== 'undefined') {
        console.log('🔧 App.js - Initializing AdminPanel');
        AdminPanel.init(user);
      } else {
        console.error('❌ AdminPanel is undefined');
        alert('AdminPanel 모듈을 찾을 수 없습니다. js/admin.js 파일이 로드되었는지 확인하세요.');
      }
    } else {
      console.log('🔧 App.js - User is not admin/master or user is null');
    }
    
    // Display company name in header
    if (user && user.companyName) {
      const companyLabel = document.getElementById('currentCompanyName');
      if (companyLabel) {
        companyLabel.textContent = user.companyName;
      }
    }
  },

  // 탭 네비게이션 설정
  setupTabNavigation() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        this.switchTab(tabId);
      });
    });
  },

  // 탭 전환
  switchTab(tabId) {
    console.log('🔧 switchTab called with:', tabId);
    
    // 모든 탭 버튼 비활성화
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    // 모든 탭 컨텐츠 숨기기
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
      content.style.display = 'none'; // Force hide
      console.log('🔧 Hiding tab:', content.id);
    });

    // 선택된 탭 활성화
    const selectedBtn = document.querySelector(`[data-tab="${tabId}"]`);
    const selectedContent = document.getElementById(tabId);

    console.log('🔧 selectedBtn:', selectedBtn);
    console.log('🔧 selectedContent:', selectedContent);

    if (selectedBtn) {
      selectedBtn.classList.add('active');
      console.log('✅ Tab button activated');
    } else {
      console.error('❌ Tab button not found!');
    }
    
    if (selectedContent) {
      selectedContent.classList.add('active');
      selectedContent.style.display = 'block'; // Force show only selected tab
      console.log('✅ Tab content activated and forced visible');
    } else {
      console.error('❌ Tab content not found!');
    }

    this.currentTab = tabId;

    // 탭별 로드 처리
    if (tabId === 'my-archive') {
      this.loadMyArchives();
    } else if (tabId === 'admin-panel') {
      console.log('🔧 Admin tab switched - reloading data');
      const user = Auth.getCurrentUser();
      
      // 권한 체크: Master 또는 Admin만 접근 가능
      if (!user || (user.role !== 'master' && user.role !== 'admin')) {
        alert('⚠️ 관리자 권한이 필요합니다.\nMaster 또는 Admin 계정으로만 접근할 수 있습니다.');
        this.switchTab('shift-input'); // 첫 번째 탭으로 되돌아가기
        return;
      }
      
      if (user && typeof AdminPanel !== 'undefined') {
        try {
          AdminPanel.loadPendingRequests();
          AdminPanel.loadCompanyMembers();
        } catch (error) {
          console.error('❌ Admin tab reload error:', error);
          alert(`Admin 탭 데이터 로드 오류: ${error.message}`);
        }
      } else {
        console.error('❌ AdminPanel is undefined or user is null');
        alert('Admin 패널을 초기화할 수 없습니다. 로그인 상태를 확인하세요.');
      }
    }
  },

  // 내보내기 버튼 설정
  setupExportButtons() {
    document.getElementById('downloadExcelBtn').addEventListener('click', () => {
      ExportManager.downloadWeekAsExcel();
    });

    document.getElementById('downloadPdfBtn').addEventListener('click', () => {
      ExportManager.downloadWeekAsPDF();
    });
  },

  // 내 아카이브 로드
  async loadMyArchives() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const container = document.getElementById('archiveList');
    container.innerHTML = '<div class="loading">Loading...</div>';

    try {
      const archives = await Database.getUserArchives(user.id);

      if (archives.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-inbox"></i>
            <p>저장된 근무표가 없습니다.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = '';
      
      archives.forEach(archive => {
        const item = document.createElement('div');
        item.className = 'archive-item';
        
        const archivedDate = new Date(archive.archived_at).toLocaleString('ko-KR');
        
        item.innerHTML = `
          <div class="archive-item-header">
            <div class="archive-item-title">${archive.label}</div>
            <div class="archive-item-date">${archivedDate}</div>
          </div>
          <div class="archive-item-summary">
            ${archive.summary}
          </div>
          <div class="archive-item-actions">
            <button class="btn btn-primary btn-sm download-archive-excel" data-id="${archive.id}">
              <i class="fas fa-file-excel"></i> Excel
            </button>
            <button class="btn btn-danger btn-sm download-archive-pdf" data-id="${archive.id}">
              <i class="fas fa-file-pdf"></i> PDF
            </button>
            <button class="btn btn-secondary btn-sm delete-archive" data-id="${archive.id}">
              <i class="fas fa-trash"></i> 삭제
            </button>
          </div>
        `;
        
        container.appendChild(item);
      });

      // 아카이브 아이템 이벤트 리스너
      this.setupArchiveItemListeners(archives);

    } catch (error) {
      console.error('아카이브 로드 에러:', error);
      container.innerHTML = '<p class="error">아카이브를 불러오는 중 오류가 발생했습니다.</p>';
    }
  },

  // 아카이브 아이템 이벤트 리스너
  setupArchiveItemListeners(archives) {
    // Excel 다운로드
    document.querySelectorAll('.download-archive-excel').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const archiveId = e.currentTarget.dataset.id;
        const archive = archives.find(a => a.id === archiveId);
        if (archive) {
          await this.downloadArchiveAsExcel(archive);
        }
      });
    });

    // PDF 다운로드
    document.querySelectorAll('.download-archive-pdf').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const archiveId = e.currentTarget.dataset.id;
        const archive = archives.find(a => a.id === archiveId);
        if (archive) {
          await this.downloadArchiveAsPDF(archive);
        }
      });
    });

    // 삭제
    document.querySelectorAll('.delete-archive').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const archiveId = e.currentTarget.dataset.id;
        if (confirm('Delete this archive?')) {
          const success = await Database.deleteArchive(archiveId);
          if (success) {
            alert('Deleted.');
            this.loadMyArchives();
          } else {
            alert('An error occurred while deleting.');
          }
        }
      });
    });
  },

  // 아카이브를 Excel로 다운로드
  async downloadArchiveAsExcel(archive) {
    const user = Auth.getCurrentUser();
    const shifts = await Database.getUserShifts(user.id, archive.week_start);

    // 시프트 데이터를 요일별로 정리
    const dayData = {};
    shifts.forEach(shift => {
      dayData[shift.day_key] = shift;
    });

    // Excel 데이터 생성
    const data = [];
    data.push([archive.label]);
    data.push([`작성자: ${user.username}`]);
    data.push([]);
    data.push([
      '요일',
      'LN 출근', 'LN 퇴근', 'LN 시간(h)',
      'DN 출근', 'DN 퇴근', 'DN 시간(h)',
      '일일 합계(h)'
    ]);

    ShiftManager.dayKeys.forEach(key => {
      const shift = dayData[key] || {};
      const lnH = shift.ln_hours || 0;
      const dnH = shift.dn_hours || 0;
      const total = lnH + dnH;

      data.push([
        ShiftManager.dayNamesKo[key],
        shift.ln_start || '',
        shift.ln_end || '',
        lnH,
        shift.dn_start || '',
        shift.dn_end || '',
        dnH,
        total
      ]);
    });

    data.push([]);
    data.push(['평일 합계(h)', archive.weekday_total]);
    data.push(['토요일 합계(h)', archive.saturday_total]);
    data.push(['일요일 합계(h)', archive.sunday_total]);
    data.push(['전체 합계(h)', archive.total_hours]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [
      { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 },
      { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, '근무표');
    XLSX.writeFile(wb, `${archive.label}_근무표.xlsx`);
  },

  // 아카이브를 PDF로 다운로드
  async downloadArchiveAsPDF(archive) {
    const user = Auth.getCurrentUser();
    const shifts = await Database.getUserShifts(user.id, archive.week_start);

    const dayData = {};
    shifts.forEach(shift => {
      dayData[shift.day_key] = shift;
    });

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(archive.label, 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`작성자: ${user.username}`, 105, 30, { align: 'center' });

    const tableData = [];
    ShiftManager.dayKeys.forEach(key => {
      const shift = dayData[key] || {};
      const lnH = (shift.ln_hours || 0).toFixed(2);
      const dnH = (shift.dn_hours || 0).toFixed(2);
      const total = (parseFloat(lnH) + parseFloat(dnH)).toFixed(2);

      tableData.push([
        ShiftManager.dayNamesKo[key],
        shift.ln_start || '-',
        shift.ln_end || '-',
        lnH + 'h',
        shift.dn_start || '-',
        shift.dn_end || '-',
        dnH + 'h',
        total + 'h'
      ]);
    });

    doc.autoTable({
      startY: 40,
      head: [[
        '요일',
        'LN 출근', 'LN 퇴근', 'LN 시간',
        'DN 출근', 'DN 퇴근', 'DN 시간',
        '일일 합계'
      ]],
      body: tableData,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 10,
        halign: 'center'
      },
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        fontStyle: 'bold'
      }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.text(`평일: ${archive.weekday_total.toFixed(2)}h | 토요일: ${archive.saturday_total.toFixed(2)}h | 일요일: ${archive.sunday_total.toFixed(2)}h | 전체: ${archive.total_hours.toFixed(2)}h`, 20, finalY);

    doc.setFontSize(9);
    const now = new Date().toLocaleString('ko-KR');
    doc.text(`생성일시: ${now}`, 20, finalY + 15);

    doc.save(`${archive.label}_근무표.pdf`);
  },

  // 전체 근무자 탭 설정
  setupAllShiftsTab() {
    document.getElementById('loadAllShiftsBtn').addEventListener('click', () => {
      this.loadAllShifts();
    });

    document.getElementById('downloadAllExcelBtn').addEventListener('click', () => {
      const weekStart = document.getElementById('allShiftsWeekStart').value;
      if (this.currentAllShiftsData) {
        ExportManager.downloadAllShiftsAsExcel(weekStart, this.currentAllShiftsData);
      }
    });

    document.getElementById('downloadAllPdfBtn').addEventListener('click', () => {
      const weekStart = document.getElementById('allShiftsWeekStart').value;
      if (this.currentAllShiftsData) {
        ExportManager.downloadAllShiftsAsPDF(weekStart, this.currentAllShiftsData);
      }
    });
  },

  // 전체 근무자 로드
  async loadAllShifts() {
    const weekStart = document.getElementById('allShiftsWeekStart').value;
    
    if (!weekStart) {
      alert('Please select week start date.');
      return;
    }

    const container = document.getElementById('allShiftsContainer');
    container.innerHTML = '<div class="loading">Loading...</div>';

    try {
      const shifts = await Database.getAllShiftsByWeek(weekStart);
      this.currentAllShiftsData = shifts;

      if (shifts.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-calendar-times"></i>
            <p>No shifts registered for this week.</p>
          </div>
        `;
        document.getElementById('allShiftsActions').style.display = 'none';
        return;
      }

      // 사용자별로 그룹화
      const userShifts = {};
      for (const shift of shifts) {
        if (!userShifts[shift.user_id]) {
          const user = await Database.getUserById(shift.user_id);
          userShifts[shift.user_id] = {
            username: user?.username || 'Unknown',
            shifts: {}
          };
        }
        userShifts[shift.user_id].shifts[shift.day_key] = shift;
      }

      // UI 렌더링
      container.innerHTML = '';
      
      for (const [userId, userData] of Object.entries(userShifts)) {
        const card = document.createElement('div');
        card.className = 'user-shift-card-compact';
        
        let weekdayTotal = 0, satTotal = 0, sunTotal = 0;

        let tableHTML = `
          <h3 class="staff-name"><i class="fas fa-user"></i> ${userData.username}</h3>
          <div class="table-responsive">
            <table class="shift-table-compact">
              <thead>
                <tr>
                  <th class="name-col">Name</th>
        `;

        // 헤더: 요일들
        ShiftManager.dayKeys.forEach(key => {
          const dayName = ShiftManager.dayNamesKo[key];
          tableHTML += `<th class="day-col">${dayName}</th>`;
        });
        tableHTML += `<th class="total-col">Total</th></tr></thead><tbody>`;

        // LN 행
        tableHTML += `<tr class="ln-row"><td class="shift-type">LN</td>`;
        ShiftManager.dayKeys.forEach(key => {
          const shift = userData.shifts[key] || {};
          const lnH = shift.ln_hours || 0;
          const timeText = (shift.ln_start && shift.ln_end) 
            ? `${shift.ln_start}~${shift.ln_end}<br><span class="hours">${lnH.toFixed(1)}h</span>` 
            : '-';
          tableHTML += `<td class="shift-cell">${timeText}</td>`;
        });
        tableHTML += `<td class="total-cell">-</td></tr>`;

        // DN 행
        tableHTML += `<tr class="dn-row"><td class="shift-type">DN</td>`;
        ShiftManager.dayKeys.forEach(key => {
          const shift = userData.shifts[key] || {};
          const dnH = shift.dn_hours || 0;
          const timeText = (shift.dn_start && shift.dn_end) 
            ? `${shift.dn_start}~${shift.dn_end}<br><span class="hours">${dnH.toFixed(1)}h</span>` 
            : '-';
          tableHTML += `<td class="shift-cell">${timeText}</td>`;
        });
        tableHTML += `<td class="total-cell">-</td></tr>`;

        // 일일 합계 행
        tableHTML += `<tr class="daily-total-row"><td class="shift-type"><strong>Daily</strong></td>`;
        ShiftManager.dayKeys.forEach(key => {
          const shift = userData.shifts[key] || {};
          const lnH = shift.ln_hours || 0;
          const dnH = shift.dn_hours || 0;
          const total = lnH + dnH;

          if (['mon', 'tue', 'wed', 'thu', 'fri'].includes(key)) {
            weekdayTotal += total;
          } else if (key === 'sat') {
            satTotal += total;
          } else if (key === 'sun') {
            sunTotal += total;
          }

          tableHTML += `<td class="daily-total"><strong>${total > 0 ? total.toFixed(1) + 'h' : '-'}</strong></td>`;
        });

        const grandTotal = weekdayTotal + satTotal + sunTotal;
        tableHTML += `<td class="grand-total"><strong>${grandTotal.toFixed(1)}h</strong></td></tr>`;

        tableHTML += `</tbody></table></div>`;

        // 주간 합계
        tableHTML += `
          <div class="weekly-summary">
            <span class="summary-item"><strong>Weekday:</strong> ${weekdayTotal.toFixed(1)}h</span>
            <span class="summary-item"><strong>Sat:</strong> ${satTotal.toFixed(1)}h</span>
            <span class="summary-item"><strong>Sun:</strong> ${sunTotal.toFixed(1)}h</span>
          </div>
        `;

        card.innerHTML = tableHTML;
        container.appendChild(card);
      }

      document.getElementById('allShiftsActions').style.display = 'flex';

    } catch (error) {
      console.error('전체 근무자 로드 에러:', error);
      container.innerHTML = '<p class="error">데이터를 불러오는 중 오류가 발생했습니다.</p>';
      document.getElementById('allShiftsActions').style.display = 'none';
    }
  }
};

// Auth 모듈에서 앱 초기화 시 호출할 수 있도록 전역에 노출
window.App = App;
