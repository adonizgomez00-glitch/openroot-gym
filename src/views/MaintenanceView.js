import { Table } from '../components/Table.js'
import { Form } from '../components/Form.js'
import { Modal } from '../components/Modal.js'
import { ConfirmDialog } from '../components/ConfirmDialog.js'
import { Toast } from '../components/Toast.js'
import { Loader } from '../components/Loader.js'
import { formatDate } from '../utils/formatters.js'
import { APP_CONFIG } from '../config/app.js'

export class MaintenanceView {
  constructor() {
    this._container = null
    this._table = null
    this._formModal = null
    this._loader = new Loader({ message: 'Cargando mantenimientos...' })
    this._onSearchCb = null
    this._onCreateCb = null
    this._onEditCb = null
    this._onDeleteCb = null
    this._searchTimeout = null
  }

  render(container) {
    this._container = container
    container.innerHTML = ''

    const toolbar = this._createToolbar()
    container.appendChild(toolbar)

    const tableWrapper = document.createElement('div')
    tableWrapper.className = 'maintenance-table-wrapper'
    container.appendChild(tableWrapper)

    this._table = new Table({
      columns: this._getColumns(),
      emptyMessage: 'No hay registros de mantenimiento'
    })

    tableWrapper.appendChild(this._table.render())
  }

  _createToolbar() {
    const toolbar = document.createElement('div')
    toolbar.className = 'toolbar'

    const title = document.createElement('h2')
    title.className = 'toolbar__title'
    title.textContent = 'Mantenimiento'

    const searchGroup = document.createElement('div')
    searchGroup.className = 'toolbar__search'

    const searchInput = document.createElement('input')
    searchInput.className = 'toolbar__input'
    searchInput.type = 'text'
    searchInput.placeholder = 'Buscar por tipo, descripción, estado...'
    searchInput.setAttribute('aria-label', 'Buscar mantenimiento')

    searchInput.addEventListener('input', () => {
      clearTimeout(this._searchTimeout)
      this._searchTimeout = setTimeout(() => {
        if (this._onSearchCb) {
          this._onSearchCb(searchInput.value)
        }
      }, APP_CONFIG.DEBOUNCE_MS)
    })

    searchGroup.appendChild(searchInput)

    const createBtn = document.createElement('button')
    createBtn.className = 'btn btn--primary'
    createBtn.textContent = '+ Nuevo Registro'
    createBtn.addEventListener('click', () => {
      if (this._onCreateCb) this._onCreateCb()
    })

    toolbar.appendChild(title)
    toolbar.appendChild(searchGroup)
    toolbar.appendChild(createBtn)

    return toolbar
  }

  _getColumns() {
    const typeLabels = {
      preventive: 'Preventivo',
      corrective: 'Correctivo',
      cleaning: 'Limpieza',
      lubrication: 'Lubricación',
      part_replacement: 'Cambio de pieza'
    }
    const statusLabels = {
      pending: 'Pendiente',
      in_progress: 'En progreso',
      completed: 'Completado',
      cancelled: 'Cancelado'
    }

    return [
      { key: 'assetId', label: 'ID Activo', width: '90px' },
      { key: 'date', label: 'Fecha', width: '110px', render: (v) => formatDate(v) },
      {
        key: 'type', label: 'Tipo', width: '140px',
        render: (value) => typeLabels[value] || value
      },
      {
        key: 'cost', label: 'Costo', width: '90px',
        render: (value) => `Q ${(value || 0).toFixed(2)}`
      },
      { key: 'description', label: 'Descripción' },
      {
        key: 'status', label: 'Estado', width: '120px',
        render: (value) => statusLabels[value] || value
      },
      { key: 'nextDate', label: 'Próximo', width: '110px', render: (v) => formatDate(v) },
      {
        key: 'id',
        label: 'Acciones',
        width: '140px',
        sortable: false,
        render: (value, row) => {
          const group = document.createElement('div')
          group.className = 'table-actions'

          const editBtn = document.createElement('button')
          editBtn.className = 'btn btn--sm btn--ghost'
          editBtn.textContent = 'Editar'
          editBtn.addEventListener('click', (e) => {
            e.stopPropagation()
            if (this._onEditCb) this._onEditCb(row.id)
          })

          const deleteBtn = document.createElement('button')
          deleteBtn.className = 'btn btn--sm btn--ghost-danger'
          deleteBtn.textContent = 'Eliminar'
          deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation()
            if (this._onDeleteCb) this._onDeleteCb(row.id)
          })

          group.appendChild(editBtn)
          group.appendChild(deleteBtn)
          return group
        }
      }
    ]
  }

  renderMaintenances(maintenances) {
    this._table.setData(maintenances)
  }

  showForm(maintenance, onSubmit, onCancel) {
    const isEditing = !!maintenance
    const form = new Form({
      fields: [
        { name: 'assetId', label: 'ID Activo', type: 'number', required: true, placeholder: 'ID del activo' },
        { name: 'type', label: 'Tipo', type: 'select', options: ['preventive', 'corrective', 'cleaning', 'lubrication', 'part_replacement'], value: isEditing ? (maintenance.type || 'preventive') : 'preventive' },
        { name: 'date', label: 'Fecha', type: 'date', required: true, value: isEditing ? (maintenance.date || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0] },
        { name: 'cost', label: 'Costo (Q)', type: 'number', step: '0.01', placeholder: '0.00' },
        { name: 'description', label: 'Descripción', type: 'text', placeholder: 'Detalle del mantenimiento' },
        { name: 'nextDate', label: 'Próximo mantenimiento', type: 'date' },
        { name: 'status', label: 'Estado', type: 'select', options: ['pending', 'in_progress', 'completed', 'cancelled'], value: isEditing ? (maintenance.status || 'pending') : 'pending' },
        { name: 'notes', label: 'Notas', type: 'textarea', placeholder: 'Observaciones adicionales', rows: 3 }
      ],
      onSubmit,
      submitText: isEditing ? 'Actualizar' : 'Guardar',
      cancelText: 'Cancelar',
      onCancel
    })

    form.render()

    if (isEditing) {
      form.setValues({
        assetId: maintenance.assetId || '',
        type: maintenance.type || 'preventive',
        date: maintenance.date || new Date().toISOString().split('T')[0],
        cost: maintenance.cost || 0,
        description: maintenance.description || '',
        nextDate: maintenance.nextDate || '',
        status: maintenance.status || 'pending',
        notes: maintenance.notes || ''
      })
    }

    this._formModal = new Modal({
      title: isEditing ? 'Editar Registro' : 'Nuevo Registro de Mantenimiento',
      content: form._element,
      size: 'md'
    })

    this._formModal.open()
  }

  closeForm() {
    if (this._formModal) {
      this._formModal.close()
      this._formModal = null
    }
  }

  onSearch(callback) {
    this._onSearchCb = callback
  }

  onCreate(callback) {
    this._onCreateCb = callback
  }

  onEdit(callback) {
    this._onEditCb = callback
  }

  onDelete(callback) {
    this._onDeleteCb = callback
  }

  showLoading() {
    this._loader.show()
  }

  hideLoading() {
    this._loader.hide()
  }

  showSaving() {
    const btn = document.querySelector('.modal .btn--primary')
    if (btn) {
      btn.disabled = true
      btn.textContent = 'Guardando...'
    }
  }

  hideSaving() {
    const btn = document.querySelector('.modal .btn--primary')
    if (btn) {
      btn.disabled = false
      btn.textContent = this._formModal?._title?.includes('Editar') ? 'Actualizar' : 'Guardar'
    }
  }

  showSuccess(message) {
    Toast.success(message)
  }

  showError(message) {
    Toast.error(message)
  }

  async confirmDelete() {
    const dialog = new ConfirmDialog({
      title: 'Eliminar Registro',
      message: '¿Está seguro de eliminar este registro de mantenimiento? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      danger: true
    })

    return dialog.confirm()
  }
}