  let allData = [];
  let filtered = [];
  let page = 1;
  const perPage = 10;

  // ── Cargar datos ─────────────────────────
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
      tbody.innerHTML = `
        <tr><td colspan="6">
          <div class="empty-state">
            <i class="bi bi-inbox"></i>
            No hay estudiantes registrados
          </div>
        </td></tr>`;
      document.getElementById('pagInfo').textContent = 'Sin resultados';
      document.getElementById('pagControls').innerHTML = '';
      return;
    }

    tbody.innerHTML = slice.map(e => `
      <tr>
        <td class="id-cell">${e.id_estudiante}</td>
        <td class="name-cell">
          ${e.nombre} ${e.apellido}
          <small>${e.carrera}</small>
        </td>
        <td class="dni-cell">${e.dni}</td>
        <td class="inst-cell">${e.institucion}</td>
        <td>${notaBadge(e.nota)}</td>
        <td>
          <div class="actions">
            <button class="btn-icon edit" title="Editar" onclick="editar(${e.id_estudiante})">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn-icon del" title="Eliminar" onclick="eliminar(${e.id_estudiante}, '${e.nombre} ${e.apellido}')">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    // Paginación
    const totalPages = Math.ceil(total / perPage);
    document.getElementById('pagInfo').textContent =
      `Mostrando ${start + 1}–${Math.min(start + perPage, total)} de ${total} registros`;

    let pagHTML = `
      <button class="pag-btn" onclick="goPage(${page-1})" ${page===1?'disabled':''}>
        <i class="bi bi-chevron-left"></i>
      </button>`;
    for (let i = 1; i <= totalPages; i++) {
      pagHTML += `<button class="pag-btn ${i===page?'active':''}" onclick="goPage(${i})">${i}</button>`;
    }
    pagHTML += `
      <button class="pag-btn" onclick="goPage(${page+1})" ${page===totalPages?'disabled':''}>
        <i class="bi bi-chevron-right"></i>
      </button>`;
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

  // ── Búsqueda ─────────────────────────────
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

  // ── Modal ─────────────────────────────────
  function openModal(data = null) {
    document.getElementById('editId').value = data?.id_estudiante || '';
    document.getElementById('fNombre').value = data?.nombre || '';
    document.getElementById('fApellido').value = data?.apellido || '';
    document.getElementById('fDni').value = data?.dni || '';
    document.getElementById('fNota').value = data?.nota ?? '';
    document.getElementById('fCarrera').value = data?.carrera || '';
    document.getElementById('fInstitucion').value = data?.institucion || '';
    document.getElementById('fCorreo').value = data?.correo || '';
    document.getElementById('fContrasenia').value = '';
    document.getElementById('modalTitle').textContent = data ? 'Editar estudiante' : 'Nuevo estudiante';
    document.getElementById('modalOverlay').classList.add('open');
  }

  function closeModal() {
    document.getElementById('modalOverlay').classList.remove('open');
  }

  document.getElementById('modalOverlay').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });

  // ── CRUD ──────────────────────────────────
  async function editar(id) {
    const est = allData.find(e => e.id_estudiante === id);
    if (est) openModal(est);
  }

  async function guardar() {
    const id = document.getElementById('editId').value;
    const body = {
      nombre: document.getElementById('fNombre').value.trim(),
      apellido: document.getElementById('fApellido').value.trim(),
      dni: document.getElementById('fDni').value.trim(),
      nota: document.getElementById('fNota').value || null,
      carrera: document.getElementById('fCarrera').value.trim(),
      institucion: document.getElementById('fInstitucion').value.trim(),
      correo: document.getElementById('fCorreo').value.trim(),
      contrasenia: document.getElementById('fContrasenia').value,
    };

    if (!body.nombre || !body.apellido || !body.dni || !body.carrera || !body.institucion || !body.correo) {
      Swal.fire({ icon: 'warning', title: 'Campos requeridos', text: 'Completa todos los campos obligatorios.', background: '#111827', color: '#f1f5f9' });
      return;
    }

    const url = id ? `/api/estudiantes/${id}` : '/api/estudiantes';
    const method = id ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (data.success) {
        closeModal();
        await cargar();
        Swal.fire({ icon: 'success', title: id ? '¡Actualizado!' : '¡Registrado!', timer: 1500, showConfirmButton: false, background: '#111827', color: '#f1f5f9' });
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

  cargar();