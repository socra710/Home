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
      <td style="padding:8px"><input class="col-grade" list="grade-list" value="${(data && data.grade) || ''}" style="padding:6px;border:1px solid #e6e9ef;border-radius:4px;width:100%" /></td>
      <td style="padding:8px"><input class="col-name" list="name-list" value="${(data && data.name) || ''}" style="padding:6px;border:1px solid #e6e9ef;border-radius:4px;width:100%" /></td>
      <td style="padding:8px"><input class="col-injury" list="injury-list" value="${(data && data.injury) || ''}" style="padding:6px;border:1px solid #e6e9ef;border-radius:4px;width:100%" /></td>
      <td style="padding:8px"><input class="col-treatment" list="treatment-list" value="${(data && data.treatment) || ''}" style="padding:6px;border:1px solid #e6e9ef;border-radius:4px;width:100%" /></td>
      <td style="padding:8px"><input class="col-other" value="${(data && data.other) || ''}" style="padding:6px;border:1px solid #e6e9ef;border-radius:4px;width:100%" /></td>
      <td style="padding:8px;text-align:center"><button class="del-row" style="background:#ef4444;color:white;border:0;padding:6px 8px;border-radius:4px;cursor:pointer;font-size:0.9rem">삭제</button></td>
    `;
    tbody.appendChild(tr);
    
    // 학년 반 필드 변경시 저장
    const gradeInput = tr.querySelector('.col-grade');
    gradeInput.addEventListener('change', function(){
      addGradeToList(this.value);
    });
    gradeInput.addEventListener('blur', function(){
      addGradeToList(this.value);
    });
    
    // 이름 필드 변경시 저장
    const nameInput = tr.querySelector('.col-name');
    nameInput.addEventListener('change', function(){
      addNameToList(this.value);
    });
    nameInput.addEventListener('blur', function(){
      addNameToList(this.value);
    });

    // 아픈 위치 필드 변경시 저장
    const injuryInput = tr.querySelector('.col-injury');
    injuryInput.addEventListener('change', function(){
      addInjuryToList(this.value);
    });
    injuryInput.addEventListener('blur', function(){
      addInjuryToList(this.value);
    });

    // 처치방법 필드 변경시 저장
    const treatmentInput = tr.querySelector('.col-treatment');
    treatmentInput.addEventListener('change', function(){
      addTreatmentToList(this.value);
    });
    treatmentInput.addEventListener('blur', function(){
      addTreatmentToList(this.value);
    });
    
    const del = tr.querySelector('.del-row');
    del.addEventListener('click', function(){ tr.remove(); });
    return tr;
  }

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
    const id = Date.now().toString();
    const timestamp = new Date().toLocaleString('ko-KR');
    savedTables[id] = { id, savedAt: timestamp, rows };
    localStorage.setItem('health_table_records', JSON.stringify(savedTables));
    alert(`${rows.length}명의 기록을 저장했습니다`);
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

  function initClassTable(){
    // datalist 초기화
    updateDataLists();
    
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
