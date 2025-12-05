// PDF 및 Excel 내보내기 모듈
const ExportManager = {
  // Excel 다운로드
  async downloadWeekAsExcel() {
    const weekData = ShiftManager.getCurrentWeekData();
    
    if (!weekData.weekStart) {
      alert('Week start date not set.');
      return;
    }

    const user = Auth.getCurrentUser();
    
    // 영어 날짜 라벨
    const d = new Date(weekData.weekStart + 'T00:00:00');
    const englishLabel = `Week of ${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    // 워크북 생성
    const wb = XLSX.utils.book_new();
    
    // 데이터 배열 생성
    const data = [];
    
    // 헤더
    data.push([englishLabel]);
    data.push([`Employee: ${user.name || user.username || user.email || 'Unknown'}`]);
    data.push([]);
    
    // 테이블 헤더
    data.push([
      'Day',
      'LN Start', 'LN End', 'LN Hours',
      'DN Start', 'DN End', 'DN Hours',
      'Daily Total'
    ]);

    // 영어 요일 이름
    const dayNamesEn = {
      mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
      fri: 'Friday', sat: 'Saturday', sun: 'Sunday'
    };

    // 각 요일 데이터
    ShiftManager.dayKeys.forEach(key => {
      const d = weekData.days[key] || {};
      const lnH = d.lnHours || 0;
      const dnH = d.dnHours || 0;
      const total = lnH + dnH;

      data.push([
        dayNamesEn[key],
        d.lnStart || '',
        d.lnEnd || '',
        lnH,
        d.dnStart || '',
        d.dnEnd || '',
        dnH,
        total
      ]);
    });

    // 합계
    const totals = ShiftManager.updateWeekTotals();
    data.push([]);
    data.push(['Weekday Total (h)', totals.weekdayTotal]);
    data.push(['Saturday Total (h)', totals.saturdayTotal]);
    data.push(['Sunday Total (h)', totals.sundayTotal]);
    data.push(['Total Hours (h)', totals.all]);

    // 워크시트 생성
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // 열 너비 설정
    ws['!cols'] = [
      { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 12 },
      { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Shift Schedule');

    // 파일 다운로드
    XLSX.writeFile(wb, `Shift_${weekData.weekStart}.xlsx`);
  },

  // PDF 다운로드
  async downloadWeekAsPDF() {
    const weekData = ShiftManager.getCurrentWeekData();
    
    if (!weekData.weekStart) {
      alert('Week start date not set.');
      return;
    }

    const user = Auth.getCurrentUser();
    
    // 영어 날짜 라벨
    const d = new Date(weekData.weekStart + 'T00:00:00');
    const englishLabel = `Week of ${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    // jsPDF 인스턴스 생성
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // 제목
    doc.setFontSize(16);
    doc.text(englishLabel, 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Employee: ${user.name || user.username || user.email || 'Unknown'}`, 105, 30, { align: 'center' });

    // 테이블 데이터 준비
    const dayNamesEn = {
      mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
      fri: 'Friday', sat: 'Saturday', sun: 'Sunday'
    };
    
    const tableData = [];
    ShiftManager.dayKeys.forEach(key => {
      const d = weekData.days[key] || {};
      const lnH = (d.lnHours || 0).toFixed(2);
      const dnH = (d.dnHours || 0).toFixed(2);
      const total = (parseFloat(lnH) + parseFloat(dnH)).toFixed(2);

      tableData.push([
        dayNamesEn[key],
        d.lnStart || '-',
        d.lnEnd || '-',
        lnH + 'h',
        d.dnStart || '-',
        d.dnEnd || '-',
        dnH + 'h',
        total + 'h'
      ]);
    });

    // 테이블 생성
    doc.autoTable({
      startY: 40,
      head: [[
        'Day',
        'LN Start', 'LN End', 'LN Hours',
        'DN Start', 'DN End', 'DN Hours',
        'Daily Total'
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

    // 합계 정보
    const totals = ShiftManager.updateWeekTotals();
    const finalY = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(11);
    doc.text(`Weekday Total: ${totals.weekdayTotal.toFixed(2)}h`, 20, finalY);
    doc.text(`Saturday Total: ${totals.saturdayTotal.toFixed(2)}h`, 20, finalY + 7);
    doc.text(`Sunday Total: ${totals.sundayTotal.toFixed(2)}h`, 20, finalY + 14);
    doc.setFont(undefined, 'bold');
    doc.text(`Total Hours: ${totals.all.toFixed(2)}h`, 20, finalY + 21);

    // 생성 날짜
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    const now = new Date().toLocaleString('en-US');
    doc.text(`Generated: ${now}`, 20, finalY + 35);

    // PDF 저장
    doc.save(`Shift_${weekData.weekStart}.pdf`);
  },

  // 전체 근무자 Excel 다운로드
  async downloadAllShiftsAsExcel(weekStart, shiftsData) {
    if (!shiftsData || shiftsData.length === 0) {
      alert('No data to download.');
      return;
    }

    // 사용자별로 그룹화
    const userShifts = {};
    for (const shift of shiftsData) {
      if (!userShifts[shift.user_id]) {
        // 사용자 정보 가져오기
        const user = await Database.getUserById(shift.user_id);
        userShifts[shift.user_id] = {
          username: user?.username || user?.name || 'Unknown',
          shifts: {}
        };
      }
      userShifts[shift.user_id].shifts[shift.day_key] = shift;
    }

    // 워크북 생성
    const wb = XLSX.utils.book_new();
    
    // 하나의 시트에 세로로 정리 (직원별로 블록 구성)
    const data = [];
    
    // 제목
    const d = new Date(weekStart + 'T00:00:00');
    const label = `Week of ${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    data.push([label]);
    data.push([]);
    
    // 요일 이름
    const dayNames = {
      mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
      fri: 'Friday', sat: 'Saturday', sun: 'Sunday'
    };
    
    // 각 직원별로 블록 생성
    const userList = Object.entries(userShifts);
    
    userList.forEach(([userId, userData], index) => {
      // 직원 이름 헤더 (강조)
      data.push([`Employee: ${userData.username}`]);
      data.push([]);
      
      // 테이블 헤더
      data.push(['Day', 'LN Start', 'LN End', 'LN Hours', 'DN Start', 'DN End', 'DN Hours', 'Daily Total']);
      
      let weekdayTotal = 0, satTotal = 0, sunTotal = 0;
      
      // 각 요일 데이터
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
        
        data.push([
          dayNames[key],
          shift.ln_start || '-',
          shift.ln_end || '-',
          lnH > 0 ? `${lnH}h` : '-',
          shift.dn_start || '-',
          shift.dn_end || '-',
          dnH > 0 ? `${dnH}h` : '-',
          total > 0 ? `${total}h` : '-'
        ]);
      });
      
      // 합계 행
      data.push([]);
      data.push(['Weekday Total', '', '', '', '', '', '', `${weekdayTotal.toFixed(2)}h`]);
      data.push(['Saturday Total', '', '', '', '', '', '', `${satTotal.toFixed(2)}h`]);
      data.push(['Sunday Total', '', '', '', '', '', '', `${sunTotal.toFixed(2)}h`]);
      data.push(['Total Hours', '', '', '', '', '', '', `${(weekdayTotal + satTotal + sunTotal).toFixed(2)}h`]);
      
      // 직원 간 구분선 (마지막 직원 제외)
      if (index < userList.length - 1) {
        data.push([]);
        data.push(['─'.repeat(80)]);
        data.push([]);
      }
    });
    
    // 워크시트 생성
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // 열 너비 설정
    ws['!cols'] = [
      { wch: 15 }, // Day
      { wch: 10 }, // LN Start
      { wch: 10 }, // LN End
      { wch: 10 }, // LN Hours
      { wch: 10 }, // DN Start
      { wch: 10 }, // DN End
      { wch: 10 }, // DN Hours
      { wch: 12 }  // Daily Total
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'All Staff Shifts');

    // 파일 다운로드
    XLSX.writeFile(wb, `AllStaff_${weekStart}.xlsx`);
  },

  // 전체 근무자 PDF 다운로드
  async downloadAllShiftsAsPDF(weekStart, shiftsData) {
    if (!shiftsData || shiftsData.length === 0) {
      alert('No data to download.');
      return;
    }

    // 사용자별로 그룹화
    const userShifts = {};
    for (const shift of shiftsData) {
      if (!userShifts[shift.user_id]) {
        const user = await Database.getUserById(shift.user_id);
        userShifts[shift.user_id] = {
          username: user?.name || user?.username || user?.email || 'Unknown',
          shifts: {}
        };
      }
      userShifts[shift.user_id].shifts[shift.day_key] = shift;
    }

    // jsPDF 인스턴스 생성
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let isFirstPage = true;

    // 영어 요일 이름
    const dayNamesEn = {
      mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
      fri: 'Friday', sat: 'Saturday', sun: 'Sunday'
    };
    
    // 각 사용자별로 페이지 생성
    for (const [userId, userData] of Object.entries(userShifts)) {
      if (!isFirstPage) {
        doc.addPage();
      }
      isFirstPage = false;

      const d = new Date(weekStart + 'T00:00:00');
      const englishLabel = `Week of ${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      // 제목
      doc.setFontSize(16);
      doc.text(`${userData.username} - ${englishLabel}`, 105, 20, { align: 'center' });

      // 테이블 데이터 준비
      const tableData = [];
      let weekdayTotal = 0, satTotal = 0, sunTotal = 0;

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

        tableData.push([
          dayNamesEn[key],
          shift.ln_start || '-',
          shift.ln_end || '-',
          lnH.toFixed(2) + 'h',
          shift.dn_start || '-',
          shift.dn_end || '-',
          dnH.toFixed(2) + 'h',
          total.toFixed(2) + 'h'
        ]);
      });

      // 테이블 생성
      doc.autoTable({
        startY: 30,
        head: [[
          'Day',
          'LN Start', 'LN End', 'LN Hours',
          'DN Start', 'DN End', 'DN Hours',
          'Daily Total'
        ]],
        body: tableData,
        theme: 'grid',
        styles: {
          font: 'helvetica',
          fontSize: 9,
          halign: 'center'
        },
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: 255,
          fontStyle: 'bold'
        }
      });

      // 합계 정보
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(11);
      doc.text(`Weekday: ${weekdayTotal.toFixed(2)}h | Saturday: ${satTotal.toFixed(2)}h | Sunday: ${sunTotal.toFixed(2)}h | Total: ${(weekdayTotal + satTotal + sunTotal).toFixed(2)}h`, 20, finalY);
    }

    // 생성 날짜
    doc.setFontSize(9);
    const now = new Date().toLocaleString('en-US');
    doc.text(`Generated: ${now}`, 20, doc.internal.pageSize.height - 10);

    // PDF 저장
    doc.save(`AllStaff_${weekStart}.pdf`);
  }
};
