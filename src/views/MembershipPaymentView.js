import { Table } from '../components/Table.js'
import { Form } from '../components/Form.js'
import { Modal } from '../components/Modal.js'
import { ConfirmDialog } from '../components/ConfirmDialog.js'
import { Toast } from '../components/Toast.js'
import { Loader } from '../components/Loader.js'
import { formatDate } from '../utils/formatters.js'

export class MembershipPaymentView {
  constructor() {
    this._container = null
    this._table = null
    this._formModal = null
    this._loader = new Loader({ message: 'Cargando pagos...' })
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
    tableWrapper.className = 'membership-payments-table-wrapper'
    container.appendChild(tableWrapper)

    this._table = new Table({
      columns: this._getColumns(),
      emptyMessage: 'No hay pagos registrados'
    })

    tableWrapper.appendChild(this._table.render())
  }

  _createToolbar() {
    const toolbar = document.createElement('div')
    toolbar.className = 'toolbar'

    const title = document.createElement('h2')
    title.className = 'toolbar__title'
    title.textContent = 'Pagos de Membresías'

    const searchGroup = document.createElement('div')
    searchGroup.className = 'toolbar__search'

    const searchInput = document.createElement('input')
    searchInput.className = 'toolbar__input'
    searchInput.type = 'text'
    searchInput.placeholder = 'Buscar por membresía, miembro o método...'
    searchInput.setAttribute('aria-label', 'Buscar pagos')

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
    createBtn.textContent = '+ Nuevo Pago'
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
      { key: 'membershipId', label: 'ID Membresía', width: '110px' },
      { key: 'memberId', label: 'ID Miembro', width: '100px' },
      { key: 'amount', label: 'Monto', width: '100px', render: (value) => `Q ${(value || 0).toFixed(2)}` },
      { key: 'method', label: 'Método', width: '100px' },
      { key: 'date', label: 'Fecha', width: '110px', render: (v) => formatDate(v) },
      { key: 'notes', label: 'Notas' },
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

  renderPayments(payments) {
    this._table.setData(payments)
  }

  showForm(payment, onSubmit, onCancel) {
    const isEditing = !!payment
    const form = new Form({
      fields: [
        { name: 'membershipId', label: 'ID Membresía', type: 'number', required: true, placeholder: 'ID de la membresía' },
        { name: 'memberId', label: 'ID Miembro', type: 'number', required: true, placeholder: 'ID del miembro' },
        { name: 'amount', label: 'Monto (Q)', type: 'number', step: '0.01', required: true, placeholder: '0.00' },
        { name: 'method', label: 'Método de Pago', type: 'select', options: ['cash', 'transfer', 'card', 'digital', 'other'], value: isEditing ? (payment.method || 'cash') : 'cash' },
        { name: 'date', label: 'Fecha', type: 'date', required: true, value: isEditing ? (payment.date || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0] },
        { name: 'notes', label: 'Notas', type: 'textarea', placeholder: 'Observaciones del pago', rows: 3, value: isEditing ? (payment.notes || '') : '' }
      ],
      onSubmit,
      submitText: isEditing ? 'Actualizar' : 'Guardar',
      cancelText: 'Cancelar',
      onCancel
    })

    form.render()

    if (isEditing) {
      form.setValues({
        membershipId: payment.membershipId || '',
        memberId: payment.memberId || '',
        amount: payment.amount || 0,
        method: payment.method || 'cash',
        date: payment.date || new Date().toISOString().split('T')[0],
        notes: payment.notes || ''
      })
    }

    this._formModal = new Modal({
      title: isEditing ? 'Editar Pago' : 'Nuevo Pago de Membresía',
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
      title: 'Eliminar Pago',
      message: '¿Está seguro de eliminar este pago? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      danger: true
    })

    return dialog.confirm()
  }
}