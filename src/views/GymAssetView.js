import { Table } from '../components/Table.js'
import { Form } from '../components/Form.js'
import { Modal } from '../components/Modal.js'
import { ConfirmDialog } from '../components/ConfirmDialog.js'
import { Toast } from '../components/Toast.js'
import { Loader } from '../components/Loader.js'
import { formatDate } from '../utils/formatters.js'
import { APP_CONFIG } from '../config/app.js'

export class GymAssetView {
  constructor() {
    this._container = null
    this._table = null
    this._formModal = null
    this._loader = new Loader({ message: 'Cargando activos...' })
    this._onSearchCb = null
    this._onCreateCb = null
    this._onEditCb = null
    this._onDeleteCb = null
    this._searchTimeout = null
    this.nextCode = ''
  }

  render(container) {
    this._container = container
    container.innerHTML = ''

    const toolbar = this._createToolbar()
    container.appendChild(toolbar)

    const tableWrapper = document.createElement('div')
    tableWrapper.className = 'gym-assets-table-wrapper'
    container.appendChild(tableWrapper)

    this._table = new Table({
      columns: this._getColumns(),
      emptyMessage: 'No hay activos registrados'
    })

    tableWrapper.appendChild(this._table.render())
  }

  _createToolbar() {
    const toolbar = document.createElement('div')
    toolbar.className = 'toolbar'

    const title = document.createElement('h2')
    title.className = 'toolbar__title'
    title.textContent = 'Activos del Gimnasio'

    const searchGroup = document.createElement('div')
    searchGroup.className = 'toolbar__search'

    const searchInput = document.createElement('input')
    searchInput.className = 'toolbar__input'
    searchInput.type = 'text'
    searchInput.placeholder = 'Buscar por código, nombre, marca, modelo...'
    searchInput.setAttribute('aria-label', 'Buscar activos')

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
    createBtn.textContent = '+ Nuevo Activo'
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
      { key: 'code', label: 'Código', width: '110px' },
      { key: 'name', label: 'Nombre' },
      { key: 'type', label: 'Tipo', width: '120px' },
      { key: 'brand', label: 'Marca', width: '110px' },
      { key: 'model', label: 'Modelo', width: '110px' },
      { key: 'serial', label: 'Serie', width: '120px' },
      { key: 'warrantyUntil', label: 'Garantía', width: '110px', render: (v) => formatDate(v) },
      {
        key: 'purchasePrice',
        label: 'Precio',
        width: '100px',
        render: (value) => `Q ${(value || 0).toFixed(2)}`
      },
      { key: 'status', label: 'Estado', width: '100px' },
      { key: 'location', label: 'Ubicación', width: '120px' },
      { key: 'responsible', label: 'Responsable', width: '120px' },
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

  renderAssets(assets) {
    this._table.setData(assets)
  }

  showForm(asset, onSubmit, onCancel) {
    const isEditing = !!asset
    const form = new Form({
      fields: [
        { name: 'code', label: 'Código', type: 'text', required: true, readonly: true, value: this.nextCode || '', placeholder: 'Ej: Gym-0001' },
        { name: 'name', label: 'Nombre', type: 'text', required: true, placeholder: 'Nombre del activo' },
        { name: 'type', label: 'Tipo', type: 'text', placeholder: 'Ej: Cardio, Fuerza, Accesorios' },
        { name: 'serial', label: 'Serie', type: 'text', placeholder: 'Número de serie' },
        { name: 'brand', label: 'Marca', type: 'text', placeholder: 'Ej: NordicTrack, PowerBlock' },
        { name: 'model', label: 'Modelo', type: 'text', placeholder: 'Modelo del activo' },
        { name: 'warrantyUntil', label: 'Garantía hasta', type: 'date' },
        { name: 'purchaseDate', label: 'Fecha de compra', type: 'date' },
        { name: 'purchasePrice', label: 'Precio de compra', type: 'number', step: '0.01', placeholder: 'Q 0.00' },
        { name: 'status', label: 'Estado', type: 'select', options: ['active', 'inactive', 'maintenance', 'retired'], value: isEditing ? (asset.status || 'active') : 'active' },
        { name: 'location', label: 'Ubicación', type: 'text', placeholder: 'Ej: Sala Cardio, Sala Fuerza' },
        { name: 'responsible', label: 'Responsable', type: 'text', placeholder: 'Nombre del responsable' },
        { name: 'notes', label: 'Notas', type: 'textarea', placeholder: 'Observaciones', rows: 3 },
        { name: 'manual', label: 'Manual (URL)', type: 'text', placeholder: 'URL del manual digital' }
      ],
      onSubmit,
      submitText: isEditing ? 'Actualizar' : 'Guardar',
      cancelText: 'Cancelar',
      onCancel
    })

    form.render()

    if (isEditing) {
      form.setValues({
        code: asset.code || this.nextCode || '',
        name: asset.name || '',
        type: asset.type || '',
        serial: asset.serial || '',
        brand: asset.brand || '',
        model: asset.model || '',
        warrantyUntil: asset.warrantyUntil || '',
        purchaseDate: asset.purchaseDate || '',
        purchasePrice: asset.purchasePrice || 0,
        status: asset.status || 'active',
        location: asset.location || '',
        responsible: asset.responsible || '',
        notes: asset.notes || '',
        manual: asset.manual || ''
      })
    }

    this._formModal = new Modal({
      title: isEditing ? 'Editar Activo' : 'Nuevo Activo',
      content: form._element,
      size: 'lg'
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
      title: 'Eliminar Activo',
      message: '¿Está seguro de eliminar este activo? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      danger: true
    })

    return dialog.confirm()
  }
}