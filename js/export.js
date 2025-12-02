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
    const label = ShiftManager.getWeekLabelForArchive(weekData.weekStart);

    // 워크북 생성
    const wb = XLSX.utils.book_new();
    
    // 데이터 배열 생성
    const data = [];
    
    // 헤더
    data.push([label]);
    data.push([`작성자: ${user.username}`]);
    data.push([]);
    
    // 테이블 헤더
    data.push([
      '요일',
      'LN 출근', 'LN 퇴근', 'LN 시간(h)',
      'DN 출근', 'DN 퇴근', 'DN 시간(h)',
      '일일 합계(h)'
    ]);

    // 각 요일 데이터
    ShiftManager.dayKeys.forEach(key => {
      const d = weekData.days[key] || {};
      const lnH = d.lnHours || 0;
      const dnH = d.dnHours || 0;
      const total = lnH + dnH;

      data.push([
        ShiftManager.dayNamesKo[key],
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
    data.push(['평일 합계(h)', totals.weekdayTotal]);
    data.push(['토요일 합계(h)', totals.saturdayTotal]);
    data.push(['일요일 합계(h)', totals.sundayTotal]);
    data.push(['전체 합계(h)', totals.all]);

    // 워크시트 생성
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // 열 너비 설정
    ws['!cols'] = [
      { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 },
      { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, '근무표');

    // 파일 다운로드
    XLSX.writeFile(wb, `근무표_${weekData.weekStart}.xlsx`);
  },

  // PDF 다운로드
  async downloadWeekAsPDF() {
    const weekData = ShiftManager.getCurrentWeekData();
    
    if (!weekData.weekStart) {
      alert('Week start date not set.');
      return;
    }

    const user = Auth.getCurrentUser();
    const label = ShiftManager.getWeekLabelForArchive(weekData.weekStart);

    // jsPDF 인스턴스 생성
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // 한글 폰트 설정을 위한 기본 설정
    doc.setLanguage("ko-KR");
    
    // 제목
    doc.setFontSize(16);
    doc.text(label, 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`작성자: ${user.username}`, 105, 30, { align: 'center' });

    // 테이블 데이터 준비
    const tableData = [];
    ShiftManager.dayKeys.forEach(key => {
      const d = weekData.days[key] || {};
      const lnH = (d.lnHours || 0).toFixed(2);
      const dnH = (d.dnHours || 0).toFixed(2);
      const total = (parseFloat(lnH) + parseFloat(dnH)).toFixed(2);

      tableData.push([
        ShiftManager.dayNamesKo[key],
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

    // 합계 정보
    const totals = ShiftManager.updateWeekTotals();
    const finalY = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(11);
    doc.text(`평일 합계: ${totals.weekdayTotal.toFixed(2)}h`, 20, finalY);
    doc.text(`토요일 합계: ${totals.saturdayTotal.toFixed(2)}h`, 20, finalY + 7);
    doc.text(`일요일 합계: ${totals.sundayTotal.toFixed(2)}h`, 20, finalY + 14);
    doc.setFont(undefined, 'bold');
    doc.text(`전체 합계: ${totals.all.toFixed(2)}h`, 20, finalY + 21);

    // 생성 날짜
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    const now = new Date().toLocaleString('ko-KR');
    doc.text(`생성일시: ${now}`, 20, finalY + 35);

    // PDF 저장
    doc.save(`근무표_${weekData.weekStart}.pdf`);
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
          username: user?.username || '알 수 없음',
          shifts: {}
        };
      }
      userShifts[shift.user_id].shifts[shift.day_key] = shift;
    }

    // 워크북 생성
    const wb = XLSX.utils.book_new();

    // 각 사용자별로 시트 생성
    for (const [userId, userData] of Object.entries(userShifts)) {
      const data = [];
      
      // 헤더
      const d = new Date(weekStart + 'T00:00:00');
      const label = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 시작 주`;
      data.push([`${userData.username} - ${label}`]);
      data.push([]);
      
      // 테이블 헤더
      data.push([
        '요일',
        'LN 출근', 'LN 퇴근', 'LN 시간(h)',
        'DN 출근', 'DN 퇴근', 'DN 시간(h)',
        '일일 합계(h)'
      ]);

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

      // 합계
      data.push([]);
      data.push(['평일 합계(h)', weekdayTotal.toFixed(2)]);
      data.push(['토요일 합계(h)', satTotal.toFixed(2)]);
      data.push(['일요일 합계(h)', sunTotal.toFixed(2)]);
      data.push(['전체 합계(h)', (weekdayTotal + satTotal + sunTotal).toFixed(2)]);

      // 워크시트 생성
      const ws = XLSX.utils.aoa_to_sheet(data);
      ws['!cols'] = [
        { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 },
        { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 }
      ];

      XLSX.utils.book_append_sheet(wb, ws, userData.username.substring(0, 31));
    }

    // 파일 다운로드
    XLSX.writeFile(wb, `전체근무표_${weekStart}.xlsx`);
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

    // 각 사용자별로 페이지 생성
    for (const [userId, userData] of Object.entries(userShifts)) {
      if (!isFirstPage) {
        doc.addPage();
      }
      isFirstPage = false;

      const d = new Date(weekStart + 'T00:00:00');
      const label = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 시작 주`;

      // 제목
      doc.setFontSize(16);
      doc.text(`${userData.username} - ${label}`, 105, 20, { align: 'center' });

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
          ShiftManager.dayNamesKo[key],
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
          '요일',
          'LN 출근', 'LN 퇴근', 'LN 시간',
          'DN 출근', 'DN 퇴근', 'DN 시간',
          '일일 합계'
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
      doc.text(`평일: ${weekdayTotal.toFixed(2)}h | 토요일: ${satTotal.toFixed(2)}h | 일요일: ${sunTotal.toFixed(2)}h | 전체: ${(weekdayTotal + satTotal + sunTotal).toFixed(2)}h`, 20, finalY);
    }

    // 생성 날짜
    doc.setFontSize(9);
    const now = new Date().toLocaleString('ko-KR');
    doc.text(`생성일시: ${now}`, 20, doc.internal.pageSize.height - 10);

    // PDF 저장
    doc.save(`전체근무표_${weekStart}.pdf`);
  }
};
