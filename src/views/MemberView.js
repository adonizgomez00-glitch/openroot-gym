import { Table } from '../components/Table.js'
import { Form } from '../components/Form.js'
import { Modal } from '../components/Modal.js'
import { ConfirmDialog } from '../components/ConfirmDialog.js'
import { Toast } from '../components/Toast.js'
import { Loader } from '../components/Loader.js'
import { APP_CONFIG } from '../config/app.js'

export class MemberView {
  constructor() {
    this._container = null
    this._table = null
    this._formModal = null
    this._loader = new Loader({ message: 'Cargando miembros...' })
    this._onSearchCb = null
    this._onCreateCb = null
    this._onEditCb = null
    this._onDeleteCb = null
    this._searchTimeout = null
    this.nextDocId = ''
  }

  render(container) {
    this._container = container
    container.innerHTML = ''

    const toolbar = this._createToolbar()
    container.appendChild(toolbar)

    const tableWrapper = document.createElement('div')
    tableWrapper.className = 'members-table-wrapper'
    container.appendChild(tableWrapper)

    this._table = new Table({
      columns: this._getColumns(),
      emptyMessage: 'No hay miembros registrados'
    })

    tableWrapper.appendChild(this._table.render())
  }

  _createToolbar() {
    const toolbar = document.createElement('div')
    toolbar.className = 'toolbar'

    const title = document.createElement('h2')
    title.className = 'toolbar__title'
    title.textContent = 'Miembros'

    const searchGroup = document.createElement('div')
    searchGroup.className = 'toolbar__search'

    const searchInput = document.createElement('input')
    searchInput.className = 'toolbar__input'
    searchInput.type = 'text'
    searchInput.placeholder = 'Buscar por nombre, documento o email...'
    searchInput.setAttribute('aria-label', 'Buscar miembros')

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
    createBtn.textContent = '+ Nuevo Miembro'
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
      { key: 'documentId', label: 'Documento', width: '130px' },
      { key: 'name', label: 'Nombre' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Teléfono', width: '130px' },
      { key: 'status', label: 'Estado', width: '100px' },
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

  renderMembers(members) {
    this._table.setData(members)
  }

  showForm(member, onSubmit, onCancel) {
    const isEditing = !!member
    const form = new Form({
      fields: [
        { name: 'documentId', label: 'Documento', type: 'text', required: true, readonly: true, value: this.nextDocId || '', placeholder: 'Ej: M001' },
        { name: 'name', label: 'Nombre', type: 'text', required: true, placeholder: 'Nombre completo' },
        { name: 'email', label: 'Email', type: 'email', placeholder: 'miembro@email.com' },
        { name: 'phone', label: 'Teléfono', type: 'text', placeholder: 'Ej: 5555-0101' },
        { name: 'address', label: 'Dirección', type: 'textarea', placeholder: 'Dirección completa', rows: 3 },
        { name: 'photo', label: 'Foto', type: 'text', placeholder: 'URL o base64 de la foto' },
        { name: 'physicalGoal', label: 'Objetivo físico', type: 'text', placeholder: 'Ej: Perder peso, Ganar masa muscular' },
        { name: 'assignedTrainerId', label: 'ID Entrenador', type: 'text', placeholder: 'ID del entrenador asignado (opcional)' },
        { name: 'joinDate', label: 'Fecha de ingreso', type: 'date', value: isEditing ? (member.joinDate || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0] },
        { name: 'membershipId', label: 'ID Membresía', type: 'text', placeholder: 'ID de la membresía (opcional)' },
        { name: 'status', label: 'Estado', type: 'select', options: ['active', 'inactive', 'suspended', 'expired'], value: isEditing ? (member.status || 'active') : 'active' }
      ],
      onSubmit,
      submitText: isEditing ? 'Actualizar' : 'Guardar',
      cancelText: 'Cancelar',
      onCancel
    })

    form.render()

    if (isEditing) {
      form.setValues({
        documentId: member.documentId,
        name: member.name,
        email: member.email,
        phone: member.phone,
        address: member.address,
        photo: member.photo || '',
        physicalGoal: member.physicalGoal || '',
        assignedTrainerId: member.assignedTrainerId || '',
        joinDate: member.joinDate || new Date().toISOString().split('T')[0],
        membershipId: member.membershipId || '',
        status: member.status || 'active'
      })
    }

    this._formModal = new Modal({
      title: isEditing ? 'Editar Miembro' : 'Nuevo Miembro',
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
      title: 'Eliminar Miembro',
      message: '¿Está seguro de eliminar este miembro? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      danger: true
    })

    return dialog.confirm()
  }
}