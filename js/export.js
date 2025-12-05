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
    data.push([`Employee: ${user.username}`]);
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
    doc.text(`Employee: ${user.username}`, 105, 30, { align: 'center' });

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
          username: user?.username || 'Unknown',
          shifts: {}
        };
      }
      userShifts[shift.user_id].shifts[shift.day_key] = shift;
    }

    // 워크북 생성
    const wb = XLSX.utils.book_new();
    
    // 하나의 시트에 가로로 정리
    const data = [];
    
    // 제목
    const d = new Date(weekStart + 'T00:00:00');
    const label = `Week of ${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    data.push([label]);
    data.push([]);
    
    // 헤더 행 1: 직원 이름
    const header1 = ['Day'];
    const header2 = [''];
    
    const userList = Object.entries(userShifts);
    userList.forEach(([userId, userData]) => {
      // 각 직원에 대해 LN, DN, Total 3개 열
      header1.push(userData.username, '', '');
      header2.push('LN', 'DN', 'Total');
    });
    
    data.push(header1);
    data.push(header2);
    
    // 각 요일 데이터
    const dayNames = {
      mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu',
      fri: 'Fri', sat: 'Sat', sun: 'Sun'
    };
    
    ShiftManager.dayKeys.forEach(key => {
      const row = [dayNames[key]];
      
      userList.forEach(([userId, userData]) => {
        const shift = userData.shifts[key] || {};
        const lnH = shift.ln_hours || 0;
        const dnH = shift.dn_hours || 0;
        const total = lnH + dnH;
        
        // LN 시간 (start-end)
        const lnText = shift.ln_start && shift.ln_end 
          ? `${shift.ln_start}-${shift.ln_end} (${lnH}h)`
          : lnH > 0 ? `${lnH}h` : '';
        
        // DN 시간 (start-end)
        const dnText = shift.dn_start && shift.dn_end
          ? `${shift.dn_start}-${shift.dn_end} (${dnH}h)`
          : dnH > 0 ? `${dnH}h` : '';
        
        row.push(lnText, dnText, total > 0 ? `${total}h` : '');
      });
      
      data.push(row);
    });
    
    // 합계 행
    data.push([]);
    
    // 평일 합계
    const weekdayRow = ['Weekday Total'];
    const saturdayRow = ['Saturday Total'];
    const sundayRow = ['Sunday Total'];
    const totalRow = ['Total Hours'];
    
    userList.forEach(([userId, userData]) => {
      let weekdayTotal = 0, satTotal = 0, sunTotal = 0;
      
      ShiftManager.dayKeys.forEach(key => {
        const shift = userData.shifts[key] || {};
        const total = (shift.ln_hours || 0) + (shift.dn_hours || 0);
        
        if (['mon', 'tue', 'wed', 'thu', 'fri'].includes(key)) {
          weekdayTotal += total;
        } else if (key === 'sat') {
          satTotal += total;
        } else if (key === 'sun') {
          sunTotal += total;
        }
      });
      
      weekdayRow.push('', '', `${weekdayTotal.toFixed(2)}h`);
      saturdayRow.push('', '', `${satTotal.toFixed(2)}h`);
      sundayRow.push('', '', `${sunTotal.toFixed(2)}h`);
      totalRow.push('', '', `${(weekdayTotal + satTotal + sunTotal).toFixed(2)}h`);
    });
    
    data.push(weekdayRow);
    data.push(saturdayRow);
    data.push(sundayRow);
    data.push(totalRow);
    
    // 워크시트 생성
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // 열 너비 설정 (Day + 각 직원당 3열)
    const cols = [{ wch: 15 }];
    userList.forEach(() => {
      cols.push({ wch: 18 }, { wch: 18 }, { wch: 10 });
    });
    ws['!cols'] = cols;
    
    // 머지: 직원 이름 (3열 병합)
    const merges = [];
    for (let i = 0; i < userList.length; i++) {
      merges.push({
        s: { r: 2, c: 1 + i * 3 },
        e: { r: 2, c: 3 + i * 3 }
      });
    }
    ws['!merges'] = merges;

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
          username: user?.username || '알 수 없음',
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
