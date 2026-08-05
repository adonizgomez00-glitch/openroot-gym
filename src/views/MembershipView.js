import { Table } from '../components/Table.js'
import { Form } from '../components/Form.js'
import { Modal } from '../components/Modal.js'
import { ConfirmDialog } from '../components/ConfirmDialog.js'
import { Toast } from '../components/Toast.js'
import { Loader } from '../components/Loader.js'
import { formatDate } from '../utils/formatters.js'

export class MembershipView {
  constructor() {
    this._container = null
    this._table = null
    this._formModal = null
    this._loader = new Loader({ message: 'Cargando membresías...' })
    this._onSearchCb = null
    this._onCreateCb = null
    this._onEditCb = null
    this._onDeleteCb = null
    this._onRenewCb = null
    this._onFreezeCb = null
    this._onUnfreezeCb = null
    this._searchTimeout = null
  }

  render(container) {
    this._container = container
    container.innerHTML = ''

    const toolbar = this._createToolbar()
    container.appendChild(toolbar)

    const tableWrapper = document.createElement('div')
    tableWrapper.className = 'memberships-table-wrapper'
    container.appendChild(tableWrapper)

    this._table = new Table({
      columns: this._getColumns(),
      emptyMessage: 'No hay membresías registradas'
    })

    tableWrapper.appendChild(this._table.render())
  }

  _createToolbar() {
    const toolbar = document.createElement('div')
    toolbar.className = 'toolbar'

    const title = document.createElement('h2')
    title.className = 'toolbar__title'
    title.textContent = 'Membresías'

    const searchGroup = document.createElement('div')
    searchGroup.className = 'toolbar__search'

    const searchInput = document.createElement('input')
    searchInput.className = 'toolbar__input'
    searchInput.type = 'text'
    searchInput.placeholder = 'Buscar por miembro, plan o estado...'
    searchInput.setAttribute('aria-label', 'Buscar membresías')

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
    createBtn.textContent = '+ Nueva Membresía'
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
      { key: 'planName', label: 'Plan' },
      { key: 'startDate', label: 'Inicio', width: '110px', render: (v) => formatDate(v) },
      { key: 'endDate', label: 'Fin', width: '110px', render: (v) => formatDate(v) },
      { key: 'status', label: 'Estado', width: '100px' },
      { key: 'price', label: 'Precio', width: '90px', render: (value) => `Q ${(value || 0).toFixed(2)}` },
      { key: 'active', label: 'Activo', width: '70px', render: (value) => value ? 'Sí' : 'No' },
      {
        key: 'id',
        label: 'Acciones',
        width: '200px',
        sortable: false,
        render: (value, row) => {
          const group = document.createElement('div')
          group.className = 'table-actions'

          const renewBtn = document.createElement('button')
          renewBtn.className = 'btn btn--sm btn--ghost'
          renewBtn.textContent = 'Renovar'
          renewBtn.addEventListener('click', (e) => {
            e.stopPropagation()
            if (this._onRenewCb) this._onRenewCb(row.id)
          })

          const freezeBtn = document.createElement('button')
          freezeBtn.className = 'btn btn--sm btn--ghost'
          freezeBtn.textContent = row.status === 'frozen' ? 'Descongelar' : 'Congelar'
          freezeBtn.addEventListener('click', (e) => {
            e.stopPropagation()
            if (row.status === 'frozen') {
              if (this._onUnfreezeCb) this._onUnfreezeCb(row.id)
            } else {
              if (this._onFreezeCb) this._onFreezeCb(row.id)
            }
          })

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

          group.appendChild(renewBtn)
          group.appendChild(freezeBtn)
          group.appendChild(editBtn)
          group.appendChild(deleteBtn)
          return group
        }
      }
    ]
  }

  renderMemberships(memberships) {
    this._table.setData(memberships)
  }

  showForm(membership, onSubmit, onCancel, options = {}) {
    const isEditing = !!membership
    const memberOptions = (options.members || []).map(member => ({
      value: member.id,
      label: `${member.name} (${member.documentId})`
    }))
    const planOptions = (options.plans || []).map(plan => ({
      value: plan.id,
      label: plan.name
    }))
    const form = new Form({
      fields: [
        { name: 'memberId', label: 'Miembro', type: 'combobox', required: true, placeholder: 'Buscar miembro por nombre o documento...', options: memberOptions },
        { name: 'planId', label: 'Plan', type: 'combobox', required: true, placeholder: 'Buscar plan...', options: planOptions },
        { name: 'startDate', label: 'Fecha de Inicio', type: 'date', required: true, value: isEditing ? (membership.startDate || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0] },
        { name: 'endDate', label: 'Fecha de Fin', type: 'date', required: true, value: isEditing ? (membership.endDate || '') : '' },
        { name: 'status', label: 'Estado', type: 'select', options: ['active', 'expired', 'suspended', 'frozen'], value: isEditing ? (membership.status || 'active') : 'active' },
        { name: 'price', label: 'Precio (Q)', type: 'number', step: '0.01', required: true, placeholder: '0.00', value: isEditing ? (membership.price || 0) : 0 },
        { name: 'active', label: 'Activo', type: 'select', options: ['true', 'false'], value: isEditing ? (membership.active ? 'true' : 'false') : 'true' }
      ],
      onSubmit,
      submitText: isEditing ? 'Actualizar' : 'Guardar',
      cancelText: 'Cancelar',
      onCancel
    })

    form.render()

    if (isEditing) {
      form.setValues({
        memberId: membership.memberId || '',
        planId: membership.planId || '',
        startDate: membership.startDate || new Date().toISOString().split('T')[0],
        endDate: membership.endDate || '',
        status: membership.status || 'active',
        price: membership.price || 0,
        active: membership.active ? 'true' : 'false'
      })
    }

    this._formModal = new Modal({
      title: isEditing ? 'Editar Membresía' : 'Nueva Membresía',
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

  onRenew(callback) {
    this._onRenewCb = callback
  }

  onFreeze(callback) {
    this._onFreezeCb = callback
  }

  onUnfreeze(callback) {
    this._onUnfreezeCb = callback
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
      title: 'Eliminar Membresía',
      message: '¿Está seguro de eliminar esta membresía? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      danger: true
    })

    return dialog.confirm()
  }
}