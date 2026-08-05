import { Table } from '../components/Table.js'
import { Form } from '../components/Form.js'
import { Modal } from '../components/Modal.js'
import { ConfirmDialog } from '../components/ConfirmDialog.js'
import { Toast } from '../components/Toast.js'
import { Loader } from '../components/Loader.js'
import { formatDate } from '../utils/formatters.js'

export class AttendanceView {
  constructor() {
    this._container = null
    this._table = null
    this._formModal = null
    this._loader = new Loader({ message: 'Cargando asistencias...' })
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
    tableWrapper.className = 'attendance-table-wrapper'
    container.appendChild(tableWrapper)

    this._table = new Table({
      columns: this._getColumns(),
      emptyMessage: 'No hay registros de asistencia'
    })

    tableWrapper.appendChild(this._table.render())
  }

  _createToolbar() {
    const toolbar = document.createElement('div')
    toolbar.className = 'toolbar'

    const title = document.createElement('h2')
    title.className = 'toolbar__title'
    title.textContent = 'Asistencias'

    const searchGroup = document.createElement('div')
    searchGroup.className = 'toolbar__search'

    const searchInput = document.createElement('input')
    searchInput.className = 'toolbar__input'
    searchInput.type = 'text'
    searchInput.placeholder = 'Buscar por miembro o fecha...'
    searchInput.setAttribute('aria-label', 'Buscar asistencias')

    searchInput.addEventListener('input', () => {
      clearTimeout(this._searchTimeout)
      this._searchTimeout = setTimeout(() => {
        if (this._onSearchCb) {
          this._onSearchCb(searchInput.value)
        }
      }, 300)
    })

    searchGroup.appendChild(searchInput)

    const createBtn = document.createElement('button')
    createBtn.className = 'btn btn--primary'
    createBtn.textContent = '+ Nueva Asistencia'
    createBtn.addEventListener('click', () => {
      if (this._onCreateCb) this._onCreateCb()
    })

    toolbar.appendChild(title)
    toolbar.appendChild(searchGroup)
    toolbar.appendChild(createBtn)

    return toolbar
  }

  _getColumns() {
    return [
      { key: 'memberName', label: 'Miembro' },
      { key: 'date', label: 'Fecha', width: '110px', render: (v) => formatDate(v) },
      { key: 'time', label: 'Hora', width: '80px' },
      { key: 'createdAt', label: 'Creado', width: '160px', render: (v) => formatDate(v) },
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

  renderAttendances(attendances) {
    this._table.setData(attendances)
  }

  showForm(attendance, onSubmit, onCancel, options = {}) {
    const isEditing = !!attendance
    const memberOptions = (options.members || []).map(member => ({
      value: member.id,
      label: `${member.name} (${member.documentId})`
    }))
    const form = new Form({
      fields: [
        { name: 'memberId', label: 'Miembro', type: 'combobox', required: true, placeholder: 'Buscar miembro por nombre o documento...', options: memberOptions },
        { name: 'date', label: 'Fecha', type: 'date', required: true, value: isEditing ? (attendance.date || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0] },
        { name: 'time', label: 'Hora', type: 'time', required: true, value: isEditing ? (attendance.time || '08:00') : '08:00' }
      ],
      onSubmit,
      submitText: isEditing ? 'Actualizar' : 'Guardar',
      cancelText: 'Cancelar',
      onCancel
    })

    form.render()

    if (isEditing) {
      form.setValues({
        memberId: attendance.memberId || '',
        date: attendance.date || new Date().toISOString().split('T')[0],
        time: attendance.time || '08:00'
      })
    }

    this._formModal = new Modal({
      title: isEditing ? 'Editar Asistencia' : 'Nueva Asistencia',
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
      title: 'Eliminar Asistencia',
      message: '¿Está seguro de eliminar este registro de asistencia? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      danger: true
    })

    return dialog.confirm()
  }
}