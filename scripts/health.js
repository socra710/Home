// health-room page logic: class table management only
(function(){
  // simple client-side auth check: if not logged in (authUser not set), redirect to index
  const checkAuth = () => {
    const local = localStorage.getItem('authUser');
    const sess = sessionStorage.getItem('authUser');
    return (local === 'jasper' || sess === 'jasper');
  };
  if(!checkAuth()){
    window.location.href = 'index.html';
    return;
  }

  let savedTables = JSON.parse(localStorage.getItem('health_table_records') || '{}');
  let savedGrades = JSON.parse(localStorage.getItem('health_grades') || '[]');
  let savedNames = JSON.parse(localStorage.getItem('health_names') || '[]');
  let savedInjuries = JSON.parse(localStorage.getItem('health_injuries') || '[]');
  let savedTreatments = JSON.parse(localStorage.getItem('health_treatments') || '[]');
  
  /* Class table functions (학급 보건 기록) */
  const classTable = document.getElementById('class-table');
  const addRowBtn = document.getElementById('add-row');
  const saveTableBtn = document.getElementById('save-table');
  const gradeList = document.getElementById('grade-list');
  const nameList = document.getElementById('name-list');
  const injuryList = document.getElementById('injury-list');
  const treatmentList = document.getElementById('treatment-list');

  function updateDataLists(){
    // 학년 반 datalist 업데이트
    gradeList.innerHTML = '';
    savedGrades.forEach(grade => {
      const option = document.createElement('option');
      option.value = grade;
      gradeList.appendChild(option);
    });
    
    // 이름 datalist 업데이트
    nameList.innerHTML = '';
    savedNames.forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      nameList.appendChild(option);
    });

    // 아픈 위치 datalist 업데이트
    injuryList.innerHTML = '';
    savedInjuries.forEach(injury => {
      const option = document.createElement('option');
      option.value = injury;
      injuryList.appendChild(option);
    });

    // 처치방법 datalist 업데이트
    treatmentList.innerHTML = '';
    savedTreatments.forEach(treatment => {
      const option = document.createElement('option');
      option.value = treatment;
      treatmentList.appendChild(option);
    });
  }

  function addGradeToList(grade){
    grade = grade.trim();
    if(grade && !savedGrades.includes(grade)){
      savedGrades.unshift(grade);
      if(savedGrades.length > 20) savedGrades.length = 20; // 최대 20개 유지
      localStorage.setItem('health_grades', JSON.stringify(savedGrades));
      updateDataLists();
    }
  }

  function addNameToList(name){
    name = name.trim();
    if(name && !savedNames.includes(name)){
      savedNames.unshift(name);
      if(savedNames.length > 50) savedNames.length = 50; // 최대 50개 유지
      localStorage.setItem('health_names', JSON.stringify(savedNames));
      updateDataLists();
    }
  }

  function addInjuryToList(injury){
    injury = injury.trim();
    if(injury && !savedInjuries.includes(injury)){
      savedInjuries.unshift(injury);
      if(savedInjuries.length > 30) savedInjuries.length = 30; // 최대 30개 유지
      localStorage.setItem('health_injuries', JSON.stringify(savedInjuries));
      updateDataLists();
    }
  }

  function addTreatmentToList(treatment){
    treatment = treatment.trim();
    if(treatment && !savedTreatments.includes(treatment)){
      savedTreatments.unshift(treatment);
      if(savedTreatments.length > 30) savedTreatments.length = 30; // 최대 30개 유지
      localStorage.setItem('health_treatments', JSON.stringify(savedTreatments));
      updateDataLists();
    }
  }

  function addTableRow(data){
    if(!classTable) return;
    const tbody = classTable.querySelector('tbody');
    const tr = document.createElement('tr');
    tr.style.background = data && data.saved ? '#f0fdf4' : '#fff';
    tr.innerHTML = `
      <td style="padding:8px"><input class="col-grade" value="${(data && data.grade) || ''}" style="padding:6px;border:1px solid #e6e9ef;border-radius:4px;width:100%" autocomplete="off" /></td>
      <td style="padding:8px"><input class="col-name" value="${(data && data.name) || ''}" style="padding:6px;border:1px solid #e6e9ef;border-radius:4px;width:100%" autocomplete="off" /></td>
      <td style="padding:8px"><input class="col-injury" value="${(data && data.injury) || ''}" style="padding:6px;border:1px solid #e6e9ef;border-radius:4px;width:100%" autocomplete="off" /></td>
      <td style="padding:8px"><input class="col-treatment" value="${(data && data.treatment) || ''}" style="padding:6px;border:1px solid #e6e9ef;border-radius:4px;width:100%" autocomplete="off" /></td>
      <td style="padding:8px"><input class="col-other" value="${(data && data.other) || ''}" style="padding:6px;border:1px solid #e6e9ef;border-radius:4px;width:100%" /></td>
      <td style="padding:8px;text-align:center"><button class="del-row" style="background:#ef4444;color:white;border:0;padding:6px 8px;border-radius:4px;cursor:pointer;font-size:0.9rem">삭제</button></td>
    `;
    tbody.appendChild(tr);
    
    // 학년 반 필드 - 화살표 버튼 추가
    const gradeInput = tr.querySelector('.col-grade');
    setupCombobox(gradeInput, savedGrades, addGradeToList);
    
    // 이름 필드 - 화살표 버튼 추가
    const nameInput = tr.querySelector('.col-name');
    setupCombobox(nameInput, savedNames, addNameToList);

    // 아픈 위치 필드 - 화살표 버튼 추가
    const injuryInput = tr.querySelector('.col-injury');
    setupCombobox(injuryInput, savedInjuries, addInjuryToList);

    // 처치방법 필드 - 화살표 버튼 추가
    const treatmentInput = tr.querySelector('.col-treatment');
    setupCombobox(treatmentInput, savedTreatments, addTreatmentToList);
    
    const del = tr.querySelector('.del-row');
    del.addEventListener('click', function(){ tr.remove(); });
    return tr;
  }

  function setupCombobox(input, dataList, addToListFunc){
    const td = input.parentElement;
    td.style.position = 'relative';
    
    // 화살표 버튼 생성
    const arrow = document.createElement('button');
    arrow.innerHTML = '▼';
    arrow.style.cssText = 'position:absolute;right:9px;top:50%;transform:translateY(-50%);background:#f3f4f6;border:1px solid #d1d5db;padding:4px 6px;border-radius:3px;cursor:pointer;font-size:0.7rem;line-height:1';
    arrow.type = 'button';
    
    // 드롭다운 목록 생성 (body에 추가)
    const dropdown = document.createElement('div');
    dropdown.style.cssText = 'display:none;position:fixed;background:white;border:1px solid #e6e9ef;border-radius:4px;max-height:250px;overflow-y:auto;z-index:10000;box-shadow:0 4px 6px rgba(0,0,0,0.1)';
    dropdown.className = 'combobox-dropdown';
    document.body.appendChild(dropdown);
    
    // 화살표 클릭 이벤트
    arrow.addEventListener('click', function(e){
      e.stopPropagation();
      const isVisible = dropdown.style.display === 'block';
      
      // 모든 드롭다운 닫기
      document.querySelectorAll('.combobox-dropdown').forEach(d => d.style.display = 'none');
      
      if(!isVisible){
        // 드롭다운 업데이트 및 표시
        dropdown.innerHTML = '';
        if(dataList.length === 0){
          dropdown.innerHTML = '<div style="padding:8px;color:#9ca3af;text-align:center">저장된 항목 없음</div>';
        } else {
          dataList.forEach(item => {
            const option = document.createElement('div');
            option.textContent = item;
            option.style.cssText = 'padding:6px 10px;cursor:pointer;transition:background 0.15s';
            option.addEventListener('mouseenter', function(){ this.style.background = '#f3f4f6'; });
            option.addEventListener('mouseleave', function(){ this.style.background = 'white'; });
            option.addEventListener('click', function(){
              input.value = item;
              dropdown.style.display = 'none';
            });
            dropdown.appendChild(option);
          });
        }
        
        // 드롭다운 위치 계산
        const rect = input.getBoundingClientRect();
        dropdown.style.left = rect.left + 'px';
        dropdown.style.top = (rect.bottom + 2) + 'px';
        dropdown.style.width = rect.width + 'px';
        dropdown.style.display = 'block';
      }
    });
    
    // 입력 변경시 저장
    input.addEventListener('change', function(){
      addToListFunc(this.value);
    });
    input.addEventListener('blur', function(){
      addToListFunc(this.value);
    });
    
    td.appendChild(arrow);
  }

  // 전역 클릭 이벤트로 모든 콤보박스 드롭다운 닫기
  document.addEventListener('click', function(){
    document.querySelectorAll('.combobox-dropdown').forEach(d => d.style.display = 'none');
  });

  function collectTableRows(){
    const out = [];
    if(!classTable) return out;
    const rows = classTable.querySelectorAll('tbody tr');
    rows.forEach(r => {
      const grade = r.querySelector('.col-grade').value || '';
      const name = r.querySelector('.col-name').value || '';
      const injury = r.querySelector('.col-injury').value || '';
      const treatment = r.querySelector('.col-treatment').value || '';
      const other = r.querySelector('.col-other').value || '';
      // 최소 하나 이상의 데이터가 있는 행만 저장
      if(grade || name || injury || treatment || other){
        out.push({ grade, name, injury, treatment, other });
      }
    });
    return out;
  }

  function saveClassTable(){
    const rows = collectTableRows();
    if(rows.length === 0){
      alert('저장할 데이터가 없습니다');
      return;
    }
    
    // 모달과 프로그레스 바 요소 가져오기
    const modal = document.getElementById('save-modal');
    const progressBar = document.getElementById('progress-bar');
    
    // 모달 표시
    modal.style.display = 'flex';
    
    // 프로그레스 바 초기화
    progressBar.style.width = '0%';
    
    // 1.5초 동안 프로그레스 바 채우기
    let progress = 0;
    const duration = 1500; // 1.5초
    const interval = 20; // 20ms마다 업데이트
    const increment = 100 / (duration / interval);
    
    const progressInterval = setInterval(() => {
      progress += increment;
      if(progress >= 100){
        progress = 100;
        progressBar.style.width = '100%';
        clearInterval(progressInterval);
        
        // 프로그레스 완료 후 실제 저장
        const id = Date.now().toString();
        const timestamp = new Date().toLocaleString('ko-KR');
        savedTables[id] = { id, savedAt: timestamp, rows };
        localStorage.setItem('health_table_records', JSON.stringify(savedTables));
        
        // 100ms 후 모달 닫기
        setTimeout(() => {
          modal.style.display = 'none';
          alert(`${rows.length}명의 기록을 저장했습니다`);
        }, 100);
      } else {
        progressBar.style.width = progress + '%';
      }
    }, interval);
  }

  function loadTableRecord(id){
    const record = savedTables[id];
    if(!record) return;
    // 현재 테이블 비우기
    const tbody = classTable.querySelector('tbody');
    tbody.innerHTML = '';
    // 저장된 행 불러오기
    (record.rows || []).forEach(r => addTableRow(r));
  }

  function updateRecordsList(){
    const recordsList = document.getElementById('records-list');
    if(!recordsList) return;
    
    recordsList.innerHTML = '';
    const keys = Object.keys(savedTables).sort((a,b) => b - a);
    
    if(keys.length === 0){
      recordsList.innerHTML = '<div style="padding:1rem;text-align:center;color:#6b7280">저장된 기록이 없습니다</div>';
      recordsList.style.display = 'block';
      return;
    }
    
    // 가로 스크롤 없이 wrap으로 표시
    recordsList.style.display = 'flex';
    recordsList.style.flexDirection = 'row';
    recordsList.style.flexWrap = 'wrap';
    recordsList.style.gap = '0.5rem';
    
    keys.forEach(key => {
      const record = savedTables[key];
      const card = document.createElement('div');
      card.style.cssText = 'min-width:250px;padding:0.75rem;border:1px solid #e6e9ef;border-radius:6px;cursor:pointer;transition:all 0.2s';
      card.innerHTML = `
        <div style="font-weight:600;color:#1f2937;margin-bottom:0.25rem">${record.savedAt}</div>
        <div style="font-size:0.85rem;color:#6b7280">${record.rows.length}개 기록</div>
      `;
      
      card.addEventListener('mouseenter', function(){
        this.style.background = '#f9fafb';
        this.style.borderColor = '#3b82f6';
      });
      card.addEventListener('mouseleave', function(){
        this.style.background = 'white';
        this.style.borderColor = '#e6e9ef';
      });
      card.addEventListener('click', function(){
        loadTableRecord(key);
        document.getElementById('load-dropdown').style.display = 'none';
      });
      
      recordsList.appendChild(card);
    });
  }
  
  function initClassTable(){
    // datalist 초기화
    updateDataLists();
    
    // 저장 기록 리스트 초기화
    updateRecordsList();
    
    // 드롭다운 토글
    const loadToggle = document.getElementById('load-toggle');
    const loadDropdown = document.getElementById('load-dropdown');
    
    if(loadToggle && loadDropdown){
      loadToggle.addEventListener('click', function(e){
        e.stopPropagation();
        const isVisible = loadDropdown.style.display === 'block';
        loadDropdown.style.display = isVisible ? 'none' : 'block';
        if(!isVisible) updateRecordsList();
      });
      
      // 외부 클릭시 드롭다운 닫기
      document.addEventListener('click', function(){
        loadDropdown.style.display = 'none';
      });
      
      loadDropdown.addEventListener('click', function(e){
        e.stopPropagation();
      });
    }
    
    // wire events
    addRowBtn && addRowBtn.addEventListener('click', function(){ addTableRow(); });
    saveTableBtn && saveTableBtn.addEventListener('click', function(){ saveClassTable(); });
    
    // 초기화 - 자동으로 최신 기록 불러오기
    const keys = Object.keys(savedTables).sort((a,b) => b - a);
    if(keys.length > 0){
      // 가장 최근 기록 자동 로드
      const latest = savedTables[keys[0]];
      (latest.rows || []).forEach(r => addTableRow(r));
    } else {
      // 저장된 기록이 없으면 빈 행 5개 추가
      for(let i=0;i<5;i++) addTableRow();
    }
  }

  // Initialize on load
  initClassTable();
})();
