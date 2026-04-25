  let allData = [];
  let filtered = [];
  let page = 1;
  const perPage = 6;

  // ── Tema claro/oscuro ─────────────────────
  function toggleTheme() {
    const isLight = document.body.classList.toggle('light');
    document.getElementById('themeIcon').className = isLight ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
    localStorage.setItem('tema', isLight ? 'light' : 'dark');
  }
  // Restaurar tema guardado
  if (localStorage.getItem('tema') === 'light') {
    document.body.classList.add('light');
    document.getElementById('themeIcon').className = 'bi bi-sun-fill';
  }

  // ── Validaciones en tiempo real ───────────
  function soloLetras(id) {
    document.getElementById(id).addEventListener('input', function() {
      this.value = this.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/g, '');
    });
  }
  function soloNumeros(id, maxLen) {
    document.getElementById(id).addEventListener('input', function() {
      this.value = this.value.replace(/\D/g, '').slice(0, maxLen);
    });
  }

  soloLetras('fNombre');
  soloLetras('fApellido');
  soloLetras('fCarrera');
  soloLetras('fInstitucion');
  soloNumeros('fTelefono', 9);
  soloNumeros('fDni', 8);

  function validarFormCrear() {
    const nombre      = document.getElementById('fNombre').value.trim();
    const apellido    = document.getElementById('fApellido').value.trim();
    const dni         = document.getElementById('fDni').value.trim();
    const carrera     = document.getElementById('fCarrera').value.trim();
    const institucion = document.getElementById('fInstitucion').value.trim();
    const correo      = document.getElementById('fCorreo').value.trim();
    const contrasenia = document.getElementById('fContrasenia').value;
    const telefono    = document.getElementById('fTelefono').value.trim();

    if (!nombre || !apellido || !dni || !carrera || !institucion || !correo || !contrasenia) {
      Swal.fire({ icon: 'warning', title: 'Campos requeridos', text: 'Completa todos los campos obligatorios.', background: document.body.classList.contains('light') ? '#fff' : '#111827', color: document.body.classList.contains('light') ? '#0f172a' : '#f1f5f9' });
      return false;
    }
    if (dni.length !== 8) {
      Swal.fire({ icon: 'warning', title: 'DNI inválido', text: 'El DNI debe tener exactamente 8 dígitos.', background: document.body.classList.contains('light') ? '#fff' : '#111827', color: document.body.classList.contains('light') ? '#0f172a' : '#f1f5f9' });
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      Swal.fire({ icon: 'warning', title: 'Correo inválido', text: 'Ingresa un correo con formato válido (ejemplo@correo.com).', background: document.body.classList.contains('light') ? '#fff' : '#111827', color: document.body.classList.contains('light') ? '#0f172a' : '#f1f5f9' });
      return false;
    }
    if (telefono && telefono.length !== 9) {
      Swal.fire({ icon: 'warning', title: 'Teléfono inválido', text: 'El teléfono debe tener exactamente 9 dígitos.', background: document.body.classList.contains('light') ? '#fff' : '#111827', color: document.body.classList.contains('light') ? '#0f172a' : '#f1f5f9' });
      return false;
    }
    return true;
  }

  const CRITERIOS = [
    'Asistencia y puntualidad',
    'Responsabilidad',
    'Actitud y comportamiento',
    'Trabajo en equipo',
    'Calidad del trabajo',
    'Cumplimiento de normas',
    'Aprendizaje y adaptación',
  ];

  let puntajes = new Array(CRITERIOS.length).fill(0);

  async function cargar() {
    try {
      const res = await fetch('/api/estudiantes');
      allData = await res.json();
      filtered = [...allData];
      updateStats();
      renderTabla();
    } catch(e) {
      document.getElementById('tablaBody').innerHTML =
        `<tr><td colspan="6" class="loading" style="color:#fb7185;">Error al cargar datos</td></tr>`;
    }
  }

  function updateStats() {
    const total = allData.length;
    const conNota = allData.filter(e => e.nota !== null);
    const aprobados = conNota.filter(e => e.nota >= 11).length;
    const promedio = conNota.length
      ? (conNota.reduce((s, e) => s + parseFloat(e.nota), 0) / conNota.length).toFixed(1)
      : '—';
    document.getElementById('statTotal').textContent = total;
    document.getElementById('statAprobados').textContent = aprobados;
    document.getElementById('statPromedio').textContent = promedio;
  }

  function renderTabla() {
    const tbody = document.getElementById('tablaBody');
    const start = (page - 1) * perPage;
    const slice = filtered.slice(start, start + perPage);
    const total = filtered.length;

    if (total === 0) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><i class="bi bi-inbox"></i> No hay estudiantes registrados</div></td></tr>`;
      document.getElementById('pagInfo').textContent = 'Sin resultados';
      document.getElementById('pagControls').innerHTML = '';
      return;
    }

    tbody.innerHTML = slice.map(e => `
      <tr>
        <td class="id-cell">${e.id_estudiante}</td>
        <td class="name-cell">${e.nombre} ${e.apellido}<small>${e.carrera}</small></td>
        <td class="dni-cell">${e.dni}</td>
        <td class="inst-cell">${e.institucion}</td>
        <td>${notaBadge(e.nota)}</td>
        <td>
          <div class="actions">
            <button class="btn-icon edit" title="Editar" onclick="editar(${e.id_estudiante})"><i class="bi bi-pencil"></i></button>
            <button class="btn-icon del" title="Eliminar" onclick="eliminar(${e.id_estudiante}, '${e.nombre} ${e.apellido}')"><i class="bi bi-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');

    const totalPages = Math.ceil(total / perPage);
    document.getElementById('pagInfo').textContent =
      `Mostrando ${start + 1}–${Math.min(start + perPage, total)} de ${total} registros`;

    let pagHTML = `<button class="pag-btn" onclick="goPage(${page-1})" ${page===1?'disabled':''}><i class="bi bi-chevron-left"></i></button>`;
    for (let i = 1; i <= totalPages; i++) {
      pagHTML += `<button class="pag-btn ${i===page?'active':''}" onclick="goPage(${i})">${i}</button>`;
    }
    pagHTML += `<button class="pag-btn" onclick="goPage(${page+1})" ${page===totalPages?'disabled':''}><i class="bi bi-chevron-right"></i></button>`;
    document.getElementById('pagControls').innerHTML = pagHTML;
  }

  function notaBadge(nota) {
    if (nota === null || nota === undefined) return `<span class="nota-badge nota-none">S/N</span>`;
    const n = parseFloat(nota);
    const cls = n >= 14 ? 'nota-high' : n >= 11 ? 'nota-mid' : 'nota-low';
    return `<span class="nota-badge ${cls}">${n.toFixed(1)}</span>`;
  }

  function goPage(p) {
    const max = Math.ceil(filtered.length / perPage);
    if (p < 1 || p > max) return;
    page = p;
    renderTabla();
  }

  document.getElementById('searchInput').addEventListener('input', function() {
    const q = this.value.toLowerCase();
    filtered = allData.filter(e =>
      `${e.nombre} ${e.apellido}`.toLowerCase().includes(q) ||
      e.dni.toLowerCase().includes(q) ||
      e.carrera.toLowerCase().includes(q)
    );
    page = 1;
    renderTabla();
  });

  // ── Modal Editar / Crear ──────────────────
  const CAMPOS_BLOQUEABLES = ['fNombre','fApellido','fDni','fCarrera','fInstitucion','fCorreo','fContrasenia'];
  const LABELS_BLOQUEABLES = ['lbNombre','lbApellido','lbDni','lbCarrera','lbInstitucion','lbCorreo','lbContrasenia'];
  const NOMBRES_LABEL      = ['Nombre','Apellido','DNI','Carrera','Institución','Correo (acceso app Android)','Contraseña (acceso app Android)'];

  function setModoEditar(esEditar) {
    CAMPOS_BLOQUEABLES.forEach((id, i) => {
      const el = document.getElementById(id);
      const lb = document.getElementById(LABELS_BLOQUEABLES[i]);
      if (esEditar) {
        el.readOnly = true;
        el.classList.add('field-locked');
        lb.innerHTML = `<i class="bi bi-lock-fill lock-icon"></i> ${NOMBRES_LABEL[i]}`;
      } else {
        el.readOnly = false;
        el.classList.remove('field-locked');
        lb.textContent = NOMBRES_LABEL[i];
      }
    });
    document.getElementById('btnEditarNota').style.display = esEditar ? 'flex' : 'none';
    document.getElementById('modalTitle').textContent = esEditar ? 'Editar estudiante' : 'Crear estudiante';
    // botón guardar
    const btnGuardar = document.querySelector('#modalOverlay .btn-primary');
    btnGuardar.setAttribute('onclick', esEditar ? 'guardarTelefono()' : 'guardar()');
  }

  function openModal(data = null) {
    const esEditar = !!data;
    document.getElementById('editId').value       = data?.id_estudiante || '';
    document.getElementById('fNombre').value      = data?.nombre || '';
    document.getElementById('fApellido').value    = data?.apellido || '';
    document.getElementById('fDni').value         = data?.dni || '';
    document.getElementById('fCarrera').value     = data?.carrera || '';
    document.getElementById('fInstitucion').value = data?.institucion || '';
    document.getElementById('fCorreo').value      = data?.correo || '';
    document.getElementById('fTelefono').value    = data?.telefono || '';
    document.getElementById('fContrasenia').value = esEditar ? '••••••••' : '';
    setModoEditar(esEditar);
    document.getElementById('modalOverlay').classList.add('open');
  }

  function closeModal() {
    document.getElementById('modalOverlay').classList.remove('open');
  }

  document.getElementById('modalOverlay').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });

  async function editar(id) {
    const est = allData.find(e => e.id_estudiante === id);
    if (est) openModal(est);
  }

  // Crear nuevo estudiante
  async function guardar() {
    if (!validarFormCrear()) return;
    const body = {
      nombre:      document.getElementById('fNombre').value.trim(),
      apellido:    document.getElementById('fApellido').value.trim(),
      dni:         document.getElementById('fDni').value.trim(),
      carrera:     document.getElementById('fCarrera').value.trim(),
      institucion: document.getElementById('fInstitucion').value.trim(),
      correo:      document.getElementById('fCorreo').value.trim(),
      contrasenia: document.getElementById('fContrasenia').value,
      telefono:    document.getElementById('fTelefono').value.trim(),
    };

    if (!body.nombre || !body.apellido || !body.dni || !body.carrera || !body.institucion || !body.correo || !body.contrasenia) {
      Swal.fire({ icon: 'warning', title: 'Campos requeridos', text: 'Completa todos los campos obligatorios.', background: '#111827', color: '#f1f5f9' });
      return;
    }

    try {
      const res = await fetch('/api/estudiantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        closeModal();
        await cargar();
        Swal.fire({ icon: 'success', title: '¡Registrado!', timer: 1500, showConfirmButton: false, background: '#111827', color: '#f1f5f9' });
      }
    } catch(e) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar.', background: '#111827', color: '#f1f5f9' });
    }
  }

  // Editar: solo guarda el teléfono
  async function guardarTelefono() {
    const id = document.getElementById('editId').value;
    if (!id) return;
    const telefono = document.getElementById('fTelefono').value.trim();
    if (telefono && telefono.length !== 9) {
      Swal.fire({ icon: 'warning', title: 'Teléfono inválido', text: 'El teléfono debe tener exactamente 9 dígitos.', background: '#111827', color: '#f1f5f9' });
      return;
    }
    try {
      const res = await fetch(`/api/estudiantes/${id}/telefono`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefono })
      });
      const data = await res.json();
      if (data.success) {
        closeModal();
        await cargar();
        Swal.fire({ icon: 'success', title: '¡Actualizado!', timer: 1500, showConfirmButton: false, background: '#111827', color: '#f1f5f9' });
      }
    } catch(e) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar.', background: '#111827', color: '#f1f5f9' });
    }
  }

  async function eliminar(id, nombre) {
    const result = await Swal.fire({
      title: '¿Eliminar estudiante?',
      text: `Se eliminará a ${nombre} permanentemente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#f43f5e',
      background: '#111827',
      color: '#f1f5f9'
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`/api/estudiantes/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await cargar();
        Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1200, showConfirmButton: false, background: '#111827', color: '#f1f5f9' });
      }
    } catch(e) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar.', background: '#111827', color: '#f1f5f9' });
    }
  }

  // ── Modal Evaluación ──────────────────────
  function renderCriterios() {
    const container = document.getElementById('criteriosList');
    container.innerHTML = CRITERIOS.map((nombre, i) => {
      const miniStars = puntajes[i] > 0 ? '★'.repeat(puntajes[i]) + '☆'.repeat(5 - puntajes[i]) : '☆☆☆☆☆';
      return `
        <div class="criterio-item">
          <div class="criterio-header" id="header-${i}" onclick="toggleCriterio(${i})">
            <span class="criterio-nombre">${nombre}</span>
            <div class="criterio-preview">
              <span class="mini-stars" id="mini-${i}">${miniStars}</span>
              <span class="chevron">▼</span>
            </div>
          </div>
          <div class="criterio-panel" id="panel-${i}">
            <div class="stars" id="stars-${i}">
              ${[1,2,3,4,5].map(v => `<span class="star ${puntajes[i] >= v ? 'activa' : ''}" onclick="setPuntaje(${i}, ${v}, event)">★</span>`).join('')}
            </div>
          </div>
        </div>
      `;
    }).join('');
    actualizarNota();
  }

  function toggleCriterio(idx) {
    const header = document.getElementById(`header-${idx}`);
    const panel  = document.getElementById(`panel-${idx}`);
    const isOpen = panel.classList.contains('open');
    // cerrar todos
    document.querySelectorAll('.criterio-panel').forEach(p => p.classList.remove('open'));
    document.querySelectorAll('.criterio-header').forEach(h => h.classList.remove('open'));
    // abrir el clickeado si estaba cerrado
    if (!isOpen) {
      panel.classList.add('open');
      header.classList.add('open');
    }
  }

  function setPuntaje(criterioIdx, valor, event) {
    if (event) event.stopPropagation();
    puntajes[criterioIdx] = valor;
    // actualizar estrellas grandes
    const starsEl = document.getElementById(`stars-${criterioIdx}`);
    starsEl.innerHTML = [1,2,3,4,5].map(v =>
      `<span class="star ${puntajes[criterioIdx] >= v ? 'activa' : ''}" onclick="setPuntaje(${criterioIdx}, ${v}, event)">★</span>`
    ).join('');
    // actualizar mini-estrellas en el header
    const mini = document.getElementById(`mini-${criterioIdx}`);
    mini.textContent = '★'.repeat(valor) + '☆'.repeat(5 - valor);
    actualizarNota();
  }

  function actualizarNota() {
    const promedio = puntajes.reduce((a, b) => a + b, 0) / CRITERIOS.length;
    const nota = promedio === 0 ? '—' : (promedio * 4).toFixed(2);
    document.getElementById('notaResultado').textContent = nota;
  }

  function abrirEval() {
    const id = document.getElementById('editId').value;
    if (!id) return;
    const est = allData.find(e => e.id_estudiante == id);
    if (est) {
      puntajes = new Array(CRITERIOS.length).fill(0);
      document.getElementById('fComentario').value = est.comentario || '';
    } else {
      puntajes = new Array(CRITERIOS.length).fill(0);
      document.getElementById('fComentario').value = '';
    }
    renderCriterios();
    document.getElementById('evalOverlay').classList.add('open');
  }

  function closeEval() {
    document.getElementById('evalOverlay').classList.remove('open');
  }

  document.getElementById('evalOverlay').addEventListener('click', function(e) {
    if (e.target === this) closeEval();
  });

  async function guardarEval() {
    const id = document.getElementById('editId').value;
    if (!id) return;
    if (puntajes.every(p => p === 0)) {
      Swal.fire({ icon: 'warning', title: 'Sin calificar', text: 'Debes calificar al menos un criterio.', background: '#111827', color: '#f1f5f9' });
      return;
    }
    const promedio = puntajes.reduce((a, b) => a + b, 0) / CRITERIOS.length;
    const nota = parseFloat((promedio * 4).toFixed(2));
    const comentario = document.getElementById('fComentario').value.trim();
    try {
      const res = await fetch(`/api/estudiantes/${id}/nota`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nota, comentario })
      });
      const data = await res.json();
      if (data.success) {
        closeEval();
        closeModal();
        await cargar();
        Swal.fire({ icon: 'success', title: '¡Evaluación guardada!', text: `Nota: ${nota}`, timer: 2000, showConfirmButton: false, background: '#111827', color: '#f1f5f9' });
      }
    } catch(e) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar la evaluación.', background: '#111827', color: '#f1f5f9' });
    }
  }

  cargar();
