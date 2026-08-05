import { Table } from '../components/Table.js'
import { Form } from '../components/Form.js'
import { Modal } from '../components/Modal.js'
import { ConfirmDialog } from '../components/ConfirmDialog.js'
import { Toast } from '../components/Toast.js'
import { Loader } from '../components/Loader.js'
import { formatDate } from '../utils/formatters.js'

export class PhysicalEvolutionView {
  constructor() {
    this._container = null
    this._table = null
    this._formModal = null
    this._loader = new Loader({ message: 'Cargando evoluciones...' })
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
    tableWrapper.className = 'physical-evolutions-table-wrapper'
    container.appendChild(tableWrapper)

    this._table = new Table({
      columns: this._getColumns(),
      emptyMessage: 'No hay registros de evolución física'
    })

    tableWrapper.appendChild(this._table.render())
  }

  _createToolbar() {
    const toolbar = document.createElement('div')
    toolbar.className = 'toolbar'

    const title = document.createElement('h2')
    title.className = 'toolbar__title'
    title.textContent = 'Evolución Física'

    const searchGroup = document.createElement('div')
    searchGroup.className = 'toolbar__search'

    const searchInput = document.createElement('input')
    searchInput.className = 'toolbar__input'
    searchInput.type = 'text'
    searchInput.placeholder = 'Buscar por miembro, fecha o notas...'
    searchInput.setAttribute('aria-label', 'Buscar evolución')

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
    return [
      { key: 'memberId', label: 'ID Miembro', width: '100px' },
      { key: 'date', label: 'Fecha', width: '110px', render: (v) => formatDate(v) },
      { key: 'weight', label: 'Peso (kg)', width: '100px', render: (value) => `${value} kg` },
      { key: 'height', label: 'Altura (cm)', width: '110px', render: (value) => `${value} cm` },
      { key: 'imc', label: 'IMC', width: '70px', render: (value) => value.toFixed(1) },
      { key: 'bodyFat', label: '% Grasa', width: '80px', render: (value) => `${value}%` },
      { key: 'muscle', label: '% Músculo', width: '90px', render: (value) => `${value}%` },
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

  renderEvolutions(evolutions) {
    this._table.setData(evolutions)
  }

  showForm(evolution, onSubmit, onCancel) {
    const isEditing = !!evolution
    const form = new Form({
      fields: [
        { name: 'memberId', label: 'ID Miembro', type: 'number', required: true, placeholder: 'ID del miembro' },
        { name: 'date', label: 'Fecha', type: 'date', required: true, value: isEditing ? (evolution.date || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0] },
        { name: 'weight', label: 'Peso (kg)', type: 'number', step: '0.1', required: true, placeholder: '70.5' },
        { name: 'height', label: 'Altura (cm)', type: 'number', step: '0.1', required: true, placeholder: '175' },
        { name: 'bodyFat', label: '% Grasa', type: 'number', step: '0.1', placeholder: '15' },
        { name: 'muscle', label: '% Músculo', type: 'number', step: '0.1', placeholder: '40' },
        { name: 'waist', label: 'Cintura (cm)', type: 'number', step: '0.1', placeholder: '80' },
        { name: 'chest', label: 'Pecho (cm)', type: 'number', step: '0.1', placeholder: '100' },
        { name: 'arm', label: 'Brazo (cm)', type: 'number', step: '0.1', placeholder: '35' },
        { name: 'leg', label: 'Pierna (cm)', type: 'number', step: '0.1', placeholder: '55' },
        { name: 'notes', label: 'Notas', type: 'textarea', placeholder: 'Observaciones', rows: 3 },
        { name: 'photos', label: 'Fotos (URLs)', type: 'text', placeholder: 'URLs separadas por coma' }
      ],
      onSubmit,
      submitText: isEditing ? 'Actualizar' : 'Guardar',
      cancelText: 'Cancelar',
      onCancel
    })

    form.render()

    if (isEditing) {
      form.setValues({
        memberId: evolution.memberId || '',
        date: evolution.date || new Date().toISOString().split('T')[0],
        weight: evolution.weight || 0,
        height: evolution.height || 0,
        bodyFat: evolution.bodyFat || 0,
        muscle: evolution.muscle || 0,
        waist: evolution.waist || 0,
        chest: evolution.chest || 0,
        arm: evolution.arm || 0,
        leg: evolution.leg || 0,
        notes: evolution.notes || '',
        photos: (evolution.photos || []).join(',') || ''
      })
    }

    this._formModal = new Modal({
      title: isEditing ? 'Editar Registro' : 'Nuevo Registro de Evolución',
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
      message: '¿Está seguro de eliminar este registro de evolución? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      danger: true
    })

    return dialog.confirm()
  }
}