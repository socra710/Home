// health-room page logic: drawing canvas, boxes, snippet saves
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

  const upload = document.getElementById('upload-image');
  const img = document.getElementById('health-image');
  const canvas = document.getElementById('draw-canvas');
  const ctx = canvas.getContext && canvas.getContext('2d');
  const addBoxBtn = document.getElementById('add-box');
  const boxesContainer = document.getElementById('boxes');
  const toggleDrawBtn = document.getElementById('toggle-draw');
  const toggleStraightBtn = document.getElementById('toggle-straight');
  const cellTextInput = document.getElementById('cell-text');
  const saveTextBtn = document.getElementById('save-text');
  const snippetList = document.getElementById('snippet-list');
  const savedSnippetsEl = document.getElementById('saved-snippets');
  const rotateLeftBtn = document.getElementById('rotate-left');
  const rotateRightBtn = document.getElementById('rotate-right');
  const rotateSlider = document.getElementById('rotate-slider');
  const toggleFitBtn = document.getElementById('toggle-fit');
  const snippetButton = document.getElementById('snippet-button');
  const savePatientBtn = document.getElementById('save-patient');
  const savePatientRecordBtn = document.getElementById('save-patient-record');
  const exportRecordBtn = document.getElementById('export-record');
  const showRecordsBtn = document.getElementById('show-records');
  const recordList = document.getElementById('record-list');
  const patientNameInput = document.getElementById('patient-name');
  const patientDateInput = document.getElementById('patient-date');
  const patientTimeInput = document.getElementById('patient-time');
  const newRecordBtn = document.getElementById('new-record');

  if(!canvas || !ctx) return;

  let isDrawing = false;
  let drawEnabled = false;
  let straighten = false;
  let startPoint = null;
  let lastPoint = null;
  let rotation = 0;
  let boxes = [];
  let selectedBox = null;
  let savedSnippets = JSON.parse(localStorage.getItem('health_snippets') || '[]');
  let savedRecords = JSON.parse(localStorage.getItem('health_records') || '{}');
  let savedTables = JSON.parse(localStorage.getItem('health_table_records') || '{}');
  let currentPatientKey = null;
  let currentRecordId = null;

  function getImageDataURL(imgEl){
    return new Promise((resolve) => {
      if(!imgEl || !imgEl.src) return resolve('');
      if(imgEl.src.startsWith('data:')) return resolve(imgEl.src);
      const tmp = new Image();
      tmp.crossOrigin = 'Anonymous';
      tmp.onload = function(){
        try{
          const t = document.createElement('canvas');
          t.width = tmp.naturalWidth || tmp.width;
          t.height = tmp.naturalHeight || tmp.height;
          const tctx = t.getContext('2d');
          tctx.drawImage(tmp, 0, 0, t.width, t.height);
          resolve(t.toDataURL());
        }catch(e){ resolve(imgEl.src); }
      };
      tmp.onerror = function(){ resolve(imgEl.src); };
      tmp.src = imgEl.src;
    });
  }

  function resizeCanvas(){
    canvas.width = img.clientWidth;
    canvas.height = img.clientHeight;
    canvas.style.width = img.clientWidth + 'px';
    canvas.style.height = img.clientHeight + 'px';
    // Keep canvas and boxes transform origin synced
    canvas.style.transformOrigin = 'center center';
    boxesContainer.style.transformOrigin = 'center center';
    // redraw not implemented for simplicity
  }

  function applyRotation(){
    // apply CSS rotation to image, canvas and boxes container
    img.style.transform = `rotate(${rotation}deg)`;
    canvas.style.transform = `rotate(${rotation}deg)`;
    boxesContainer.style.transform = `rotate(${rotation}deg)`;
  }

  function placeDefaultBox(){
    const rect = img.getBoundingClientRect();
    const c = document.createElement('div');
    c.className = 'cell';
    c.style.left = '10%';
    c.style.top = (10 + boxes.length * 7) + '%';
    c.style.width = '20%';
    c.style.height = '12%';
    c.dataset.index = boxes.length;

    const text = document.createElement('div');
    text.className = 'cell-text';
    text.textContent = '';
    c.appendChild(text);

    // Arrow button (appears on save)
    const arrowBtn = document.createElement('button');
    arrowBtn.className = 'arrow-btn';
    arrowBtn.setAttribute('aria-hidden','true');
    arrowBtn.textContent = '▶';
    arrowBtn.style.display = 'none';
    c.appendChild(arrowBtn);

    // delete button
    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.textContent = '✕';
    c.appendChild(delBtn);

    // resize handle
    const handle = document.createElement('div');
    handle.className = 'handle';
    c.appendChild(handle);

    c.addEventListener('click', function(e){
      e.stopPropagation();
      // select this box
      selectBox(c);
    });

    arrowBtn.addEventListener('click', function(e){
      e.stopPropagation();
      // show saved snippet options for this box
      showSnippetListForBox(c);
      if(snippetList) snippetList.style.display = 'block';
    });

    delBtn.addEventListener('click', function(e){
      e.stopPropagation();
      // remove box
      const idx = boxes.indexOf(c);
      if(idx > -1){
        boxes.splice(idx,1);
        boxesContainer.removeChild(c);
      }
    });

    // drag/resize pointer handlers
    addBoxDragAndResize(c, handle);

    boxesContainer.appendChild(c);
    boxes.push(c);
  }

  function selectBox(boxEl){
    if(selectedBox) selectedBox.classList.remove('selected');
    selectedBox = boxEl;
    selectedBox.classList.add('selected');

    // Toggle filled when first clicked
    // if it's filled, allow editing
    if(!selectedBox.classList.contains('filled')){
      // Fill with black (toggle)
      selectedBox.classList.add('filled');
      selectedBox.querySelector('.cell-text').setAttribute('contenteditable','true');
      selectedBox.querySelector('.cell-text').focus();
    } else {
      // Already filled - allow editing
      selectedBox.querySelector('.cell-text').setAttribute('contenteditable','true');
    }
  }

  // Save text to snippet list, and show arrow for selected box
  function saveCurrentText(){
    if(!selectedBox) return;
    const textEl = selectedBox.querySelector('.cell-text');
    const value = (cellTextInput.value || textEl.textContent || '').trim();
    if(!value) return;
    // add to saved snippets
    savedSnippets.unshift(value);
    if(savedSnippets.length > 50) savedSnippets.length = 50;
    localStorage.setItem('health_snippets', JSON.stringify(savedSnippets));
    renderSnippetList();

    // show arrow on selectedBox
    const arrowBtn = selectedBox.querySelector('.arrow-btn');
    if(arrowBtn){ arrowBtn.style.display = 'block'; arrowBtn.setAttribute('aria-hidden','false'); }

    // Also update selected box metadata so it persists in records
    selectedBox.dataset.savedText = value;

    // Clear input
    cellTextInput.value = '';
  }

  function renderSnippetList(){
    snippetList.innerHTML = '';
    savedSnippets.forEach((s, i) => {
      const li = document.createElement('li');
      li.textContent = s;
      li.setAttribute('data-index', i);
      li.addEventListener('click', function(){
        // insert snippet into selected box; if none, create one
        if(!selectedBox){
          placeDefaultBox();
          selectBox(boxes[boxes.length - 1]);
        }
        if(selectedBox){
          const textEl = selectedBox.querySelector('.cell-text');
          textEl.textContent = s;
          // keep selected box filled
          selectedBox.classList.add('filled');
          textEl.setAttribute('contenteditable','false');
        }
        // close the list after choosing
        if(snippetList) snippetList.style.display = 'none';
      });
      snippetList.appendChild(li);
    });
  }

  /* Record storage and management */
  function getPatientKey(requireAll = false){
    const name = (patientNameInput && patientNameInput.value || '').trim();
    const date = (patientDateInput && patientDateInput.value || '').trim();
    const time = (patientTimeInput && patientTimeInput.value || '').trim();
    if(requireAll && (!name || !date)) return null;
    if(!name && !date && !time) return null;
    return `${name}|${date}|${time}`.replace(/\s+/g,'_');
  }

  function collectBoxes(){
    return boxes.map(b => ({
      left: b.style.left,
      top: b.style.top,
      width: b.style.width,
      height: b.style.height,
      text: b.querySelector('.cell-text')?.textContent || '',
      savedText: b.dataset.savedText || ''
    }));
  }

  async function saveRecord(){
    const name = (patientNameInput && patientNameInput.value || '').trim();
    const date = (patientDateInput && patientDateInput.value || '').trim();
    const time = (patientTimeInput && patientTimeInput.value || '').trim();
    const injury = document.getElementById('injury-location')?.value || '';
    const treatment = document.getElementById('treatment-method')?.value || '';
    const other = document.getElementById('other-notes')?.value || '';
    if(!name){ alert('환자명을 입력하세요'); return; }
    const id = currentRecordId || Date.now().toString();
    const imageDataForRecord = await getImageDataURL(img);
    const record = {
      id,
      patientName: name,
      date, time,
      injury, treatment, other,
      imageSrc: imageDataForRecord || img.src || '',
      rotation: rotation || 0,
      boxes: collectBoxes(),
      canvasData: (canvas && canvas.toDataURL && canvas.toDataURL()) || null
    };
    savedRecords[id] = record;
    localStorage.setItem('health_records', JSON.stringify(savedRecords));
    renderRecordList();
    currentPatientKey = getPatientKey();
    currentRecordId = id;
    alert('기록을 저장했습니다');
  }

  function renderRecordList(){
    if(!recordList) return;
    recordList.innerHTML = '';
    const keys = Object.keys(savedRecords).sort((a,b) => b - a);
    keys.forEach(k => {
      const r = savedRecords[k];
      const li = document.createElement('li');
      li.style.display = 'flex'; li.style.justifyContent = 'space-between'; li.style.alignItems='center'; li.style.padding='0.4rem 0.3rem';
      const meta = document.createElement('div');
      meta.innerHTML = `<strong>${r.patientName}</strong> ${r.date || ''} ${r.time || ''}<div style='color:#6b7280;font-size:0.9rem'>${r.injury || ''} · ${r.treatment || ''}</div>`;
      const actions = document.createElement('div');
      const viewBtn = document.createElement('button'); viewBtn.className='btn'; viewBtn.textContent='불러오기';
      const delBtn = document.createElement('button'); delBtn.className='btn'; delBtn.textContent='삭제'; delBtn.style.background='#ef4444'; delBtn.style.color='white';
      viewBtn.addEventListener('click', function(){ loadRecord(r.id); });
      delBtn.addEventListener('click', function(){ if(confirm('정말 삭제하시겠습니까?')){ deleteRecord(r.id); } });
      actions.appendChild(viewBtn); actions.appendChild(delBtn);
      li.appendChild(meta); li.appendChild(actions);
      recordList.appendChild(li);
    });
  }

  function deleteRecord(id){
    delete savedRecords[id];
    if(currentRecordId === id) currentRecordId = null;
    localStorage.setItem('health_records', JSON.stringify(savedRecords));
    renderRecordList();
  }

  function loadRecord(id){
    const r = savedRecords[id];
    if(!r) return;
    // load fields
    if(patientNameInput) patientNameInput.value = r.patientName || '';
    if(patientDateInput) patientDateInput.value = r.date || '';
    if(patientTimeInput) patientTimeInput.value = r.time || '';
    if(document.getElementById('injury-location')) document.getElementById('injury-location').value = r.injury || '';
    if(document.getElementById('treatment-method')) document.getElementById('treatment-method').value = r.treatment || '';
    if(document.getElementById('other-notes')) document.getElementById('other-notes').value = r.other || '';
    // image
    if(r.imageSrc) img.src = r.imageSrc;
    rotation = r.rotation || 0; applyRotation();
    // clear boxes and re-add
    boxes.forEach(b => b.remove()); boxes = [];
    (r.boxes || []).forEach(b => {
      const el = document.createElement('div'); el.className = 'cell';
      el.style.left = b.left || '10%'; el.style.top = b.top || '10%'; el.style.width = b.width || '20%'; el.style.height = b.height || '12%';
      const text = document.createElement('div'); text.className = 'cell-text'; text.textContent = b.text || '';
      el.dataset.savedText = b.savedText || '';
      el.appendChild(text);
      const arrowBtn = document.createElement('button'); arrowBtn.className = 'arrow-btn'; arrowBtn.textContent = '▶'; arrowBtn.style.display='block'; el.appendChild(arrowBtn);
      const delBtn = document.createElement('button'); delBtn.className = 'delete-btn'; delBtn.textContent='✕'; el.appendChild(delBtn);
      const handle = document.createElement('div'); handle.className = 'handle'; el.appendChild(handle);
      addBoxDragAndResize(el, handle);
      boxesContainer.appendChild(el); boxes.push(el);
      arrowBtn.addEventListener('click', function(e){ e.stopPropagation(); showSnippetListForBox(el); if(snippetList) snippetList.style.display = 'block'; });
      delBtn.addEventListener('click', function(e){ e.stopPropagation(); const i = boxes.indexOf(el); if(i>-1){ boxes.splice(i,1); boxesContainer.removeChild(el); } });
      el.addEventListener('click', function(e){ e.stopPropagation(); selectBox(el); });
    });
    // restore canvas drawing if present
    if(r.canvasData){
      const tmp = new Image();
      tmp.onload = function(){
        // Wait briefly to ensure canvas and image sizes are updated
        setTimeout(function(){
          try{ ctx.clearRect(0,0,canvas.width,canvas.height); }catch(e){}
          ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height);
        }, 200);
      };
      tmp.src = r.canvasData;
    } else {
      try{ ctx.clearRect(0,0,canvas.width,canvas.height); }catch(e){}
    }

    currentPatientKey = getPatientKey();
    currentRecordId = r.id;
    renderRecordList();
  }

  function exportCurrentRecord(){
    const id = Date.now();
    const data = {records: savedRecords, exportedAt: (new Date()).toISOString()};
    const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `health-records-${Date.now()}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }


  function showSnippetListForBox(boxEl){
    // highlight current selection
    selectBox(boxEl);
    // ensure list exists; open UI is simply visible
    savedSnippetsEl.scrollIntoView();
    // show snippet list
    if(snippetList) snippetList.style.display = 'block';
  }

  // Drawing events
  function getLocalCoords(e){
    const r = img.getBoundingClientRect();
    // center of element
    const cx = r.left + r.width/2;
    const cy = r.top + r.height/2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const theta = -rotation * Math.PI / 180; // inverse rotate input coords
    const xPrime = dx * Math.cos(theta) - dy * Math.sin(theta);
    const yPrime = dx * Math.sin(theta) + dy * Math.cos(theta);
    const x = xPrime + r.width/2;
    const y = yPrime + r.height/2;
    return {x, y};
  }

  function onPointerDown(e){
    if(!drawEnabled) return;
    isDrawing = true;
    startPoint = getLocalCoords(e);
    lastPoint = startPoint;
    if(!straighten){
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
    }
  }
  function onPointerMove(e){
    if(!isDrawing) return;
    const p = getLocalCoords(e);
    if(straighten){
      // temporary preview: clear canvas and draw a straight line
      // For simplicity we draw directly
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = '#d33';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      // smooth with quadratic curve between lastPoint and current
      const midX = (lastPoint.x + p.x) / 2;
      const midY = (lastPoint.y + p.y) / 2;
      ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, midX, midY);
      ctx.strokeStyle = '#d33';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      lastPoint = p;
    }
  }
  function onPointerUp(e){
    if(!isDrawing) return;
    isDrawing = false;
    if(straighten){
      const p = getLocalCoords(e);
      // finalize straight line
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = '#d33';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      // nothing special
    }
  }

  function attachCanvasEvents(){
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerUp);
  }

  function addBoxDragAndResize(boxEl, handle){
    let dragging = false;
    let resizing = false;
    let startX, startY, startLeft, startTop, startW, startH;

    boxEl.addEventListener('pointerdown', function(e){
      if(e.target === handle || e.target.classList.contains('handle')) return; // let handle handle resize
      if(e.target.classList && e.target.classList.contains('delete-btn')) return; // delete stop
      // start dragging
      dragging = true;
      boxEl.setPointerCapture(e.pointerId);
      const r = boxEl.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      startLeft = parseFloat(boxEl.style.left);
      startTop = parseFloat(boxEl.style.top);
    });

    boxEl.addEventListener('pointermove', function(e){
      if(!dragging) return;
      e.preventDefault();
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      // convert pixel delta to percent relative to image area
      const rect = img.getBoundingClientRect();
      const leftPx = (startLeft/100) * rect.width + dx;
      const topPx = (startTop/100) * rect.height + dy;
      const leftPct = Math.max(0, Math.min(100, 100 * leftPx / rect.width));
      const topPct = Math.max(0, Math.min(100, 100 * topPx / rect.height));
      boxEl.style.left = leftPct + '%';
      boxEl.style.top = topPct + '%';
    });

    boxEl.addEventListener('pointerup', function(e){
      dragging = false;
      try { boxEl.releasePointerCapture(e.pointerId); } catch(e){}
    });

    // resize
    handle.addEventListener('pointerdown', function(e){
      e.stopPropagation();
      resizing = true;
      handle.setPointerCapture(e.pointerId);
      startX = e.clientX; startY = e.clientY;
      const rect = boxEl.getBoundingClientRect();
      const imgRect = img.getBoundingClientRect();
      startW = rect.width/ imgRect.width * 100;
      startH = rect.height/ imgRect.height * 100;
    });
    handle.addEventListener('pointermove', function(e){
      if(!resizing) return;
      e.preventDefault();
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const imgRect = img.getBoundingClientRect();
      const wPx = (startW/100) * imgRect.width + dx;
      const hPx = (startH/100) * imgRect.height + dy;
      const wPct = Math.max(5, Math.min(100, 100 * wPx / imgRect.width));
      const hPct = Math.max(5, Math.min(100, 100 * hPx / imgRect.height));
      boxEl.style.width = wPct + '%';
      boxEl.style.height = hPct + '%';
    });
    handle.addEventListener('pointerup', function(e){
      resizing = false;
      try { handle.releasePointerCapture(e.pointerId); } catch(e){}
    });
  }

  // Upload image
  upload.addEventListener('change', function(e){
    const f = this.files && this.files[0];
    if(!f) return;
    const url = URL.createObjectURL(f);
    img.src = url;
    setTimeout(resizeCanvas, 200);
  });

  img.addEventListener('load', function(){
    resizeCanvas();
    applyRotation();
  })

  window.addEventListener('resize', resizeCanvas);
  attachCanvasEvents();

  rotateLeftBtn && rotateLeftBtn.addEventListener('click', function(){
    rotation -= 5;
    rotateSlider && (rotateSlider.value = rotation);
    applyRotation();
  });
  rotateRightBtn && rotateRightBtn.addEventListener('click', function(){
    rotation += 5;
    rotateSlider && (rotateSlider.value = rotation);
    applyRotation();
  });
  rotateSlider && rotateSlider.addEventListener('input', function(){
    rotation = parseFloat(this.value || 0);
    applyRotation();
  });
  toggleFitBtn && toggleFitBtn.addEventListener('click', function(){
    img.classList.toggle('fit-cover');
    toggleFitBtn.classList.toggle('active', img.classList.contains('fit-cover'));
  });

  snippetButton && snippetButton.addEventListener('click', function(){
    // toggle snippet list
    const open = snippetList.style.display !== 'block';
    snippetList.style.display = open ? 'block' : 'none';
  });

  addBoxBtn.addEventListener('click', function(){
    placeDefaultBox();
  });

  // Save patient (set current context)
  savePatientBtn && savePatientBtn.addEventListener('click', function(){
    currentPatientKey = getPatientKey(true);
    if(!currentPatientKey){ alert('이름과 날짜를 입력하세요'); return; }
    alert('환자 컨텍스트가 설정되었습니다');
  });

  // Save current record (include boxes and image)
  savePatientRecordBtn && savePatientRecordBtn.addEventListener('click', function(){
    saveRecord();
  });

  // export
  exportRecordBtn && exportRecordBtn.addEventListener('click', function(){
    exportCurrentRecord();
  });

  showRecordsBtn && showRecordsBtn.addEventListener('click', function(){
    // toggle visibility
    if(recordList) recordList.style.display = (recordList.style.display === 'block' ? 'none' : 'block');
    // ensure list is rendered
    renderRecordList();
  });

  newRecordBtn && newRecordBtn.addEventListener('click', function(){
    // Clear fields and boxes to create new record
    if(patientNameInput) patientNameInput.value = '';
    if(patientDateInput) patientDateInput.value = '';
    if(patientTimeInput) patientTimeInput.value = '';
    if(document.getElementById('injury-location')) document.getElementById('injury-location').value = '';
    if(document.getElementById('treatment-method')) document.getElementById('treatment-method').value = '';
    if(document.getElementById('other-notes')) document.getElementById('other-notes').value = '';
    img.src = 'assets/sample1.svg';
    rotation = 0; applyRotation();
    boxes.forEach(b => b.remove()); boxes = []; placeDefaultBox();
    currentPatientKey = null;
    currentRecordId = null;
    try{ ctx.clearRect(0,0,canvas.width,canvas.height); }catch(e){}
  });

  toggleDrawBtn.addEventListener('click', function(){
    drawEnabled = !drawEnabled;
    toggleDrawBtn.classList.toggle('active', drawEnabled);
    toggleDrawBtn.textContent = drawEnabled ? '그리기 (켜짐)' : '그리기';
    // When drawing, unset box selection
    if(drawEnabled && selectedBox){
      selectedBox.classList.remove('selected');
      selectedBox.querySelector('.cell-text')?.setAttribute('contenteditable','false');
      selectedBox = null;
    }
  });

  toggleStraightBtn.addEventListener('click', function(){
    straighten = !straighten;
    toggleStraightBtn.classList.toggle('active', straighten);
    toggleStraightBtn.textContent = straighten ? '직선 고정 (켜짐)' : '직선 고정';
  });

  document.body.addEventListener('click', function(e){
    // clicking outside boxes should deselect
    if(!e.target.closest('.cell')){
      if(selectedBox){
        selectedBox.classList.remove('selected');
        selectedBox.querySelector('.cell-text')?.setAttribute('contenteditable','false');
        selectedBox = null;
      }
    }
    // hide snippet list when clicking outside the saved snippets
    if(!e.target.closest('#saved-snippets')){
      if(snippetList) snippetList.style.display = 'none';
    }
  });

  // Allow typing text into the box contenteditable
  boxesContainer.addEventListener('input', function(e){
    // sync the content to input? not necessary
  });

  saveTextBtn.addEventListener('click', saveCurrentText);

  // Load saved snippets on startup
  function init(){
    renderSnippetList();
    // Place a default box so user isn't empty
    placeDefaultBox();
    // Ensure rotation is applied on init
    applyRotation();

    // load records if patient inputs provided
    const defaultKey = getPatientKey( /* allow empty */ true );
    if(defaultKey){
      currentPatientKey = defaultKey;
    }
    // Always render any saved records in sidebar
    renderRecordList();

    // initialize class table UI
    initClassTable();
  }

  /* Class table functions (학급 보건 기록) */
  const classTable = document.getElementById('class-table');
  const addRowBtn = document.getElementById('add-row');
  const saveTableBtn = document.getElementById('save-table');

  function addTableRow(data){
    if(!classTable) return;
    const tbody = classTable.querySelector('tbody');
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input class="col-grade" value="${(data && data.grade) || ''}" /></td>
      <td><input class="col-name" value="${(data && data.name) || ''}" /></td>
      <td><input class="col-injury" value="${(data && data.injury) || ''}" /></td>
      <td><input class="col-treatment" value="${(data && data.treatment) || ''}" /></td>
      <td><input class="col-other" value="${(data && data.other) || ''}" /></td>
      <td><button class="del-row">삭제</button></td>
    `;
    tbody.appendChild(tr);
    const del = tr.querySelector('.del-row');
    del.addEventListener('click', function(){ tr.remove(); });
    return tr;
  }

  function collectTableRows(){
    const out = [];
    if(!classTable) return out;
    const rows = classTable.querySelectorAll('tbody tr');
    rows.forEach(r => {
      out.push({
        grade: r.querySelector('.col-grade').value || '',
        name: r.querySelector('.col-name').value || '',
        injury: r.querySelector('.col-injury').value || '',
        treatment: r.querySelector('.col-treatment').value || '',
        other: r.querySelector('.col-other').value || ''
      });
    });
    return out;
  }

  function saveClassTable(){
    const rows = collectTableRows();
    const id = Date.now().toString();
    savedTables[id] = { id, savedAt: new Date().toISOString(), rows };
    localStorage.setItem('health_table_records', JSON.stringify(savedTables));
    alert('표를 저장했습니다');
  }

  function initClassTable(){
    // wire events
    addRowBtn && addRowBtn.addEventListener('click', function(){ addTableRow(); });
    saveTableBtn && saveTableBtn.addEventListener('click', function(){ saveClassTable(); });
    // render latest if exists
    const keys = Object.keys(savedTables).sort((a,b) => b - a);
    if(keys.length){
      const latest = savedTables[keys[0]];
      (latest.rows || []).forEach(r => addTableRow(r));
    } else {
      // show a few empty rows by default
      for(let i=0;i<6;i++) addTableRow();
    }
  }

  init();
})();
