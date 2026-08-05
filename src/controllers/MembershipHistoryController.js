import { handleError } from '../utils/errors.js'

export class MembershipHistoryController {
  constructor(membershipHistoryService, membershipHistoryView) {
    this._service = membershipHistoryService
    this._view = membershipHistoryView
    this._editingId = null
  }

  async init(container) {
    this._view.render(container)
    this._view.onSearch((query) => this.handleSearch(query))
    this._view.onCreate(() => this.showCreateForm())
    this._view.onEdit((id) => this.showEditForm(id))
    this._view.onDelete((id) => this.handleDelete(id))
    await this.loadHistory()
  }

  async loadHistory() {
    this._view.showLoading()
    try {
      const history = await this._service.getAll()
      this._view.renderHistory(history)
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }

  async handleSearch(query) {
    this._view.showLoading()
    try {
      const history = await this._service.search(query)
      this._view.renderHistory(history)
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }

  async showCreateForm() {
    this._editingId = null
    this._view.showForm(null, async (data) => this.handleSave(data), () => this._view.closeForm())
  }

  async showEditForm(id) {
    this._view.showLoading()
    try {
      const history = await this._service.getById(id)
      this._editingId = id
      this._view.showForm(history, async (data) => this.handleSave(data), () => this._view.closeForm())
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }

  async handleSave(data) {
    this._view.showSaving()
    try {
      if (this._editingId) {
        await this._service.update(this._editingId, data)
        this._view.showSuccess('Registro de historial actualizado correctamente')
      } else {
        await this._service.create(data)
        this._view.showSuccess('Registro de historial creado correctamente')
      }
      this._view.closeForm()
      await this.loadHistory()
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideSaving()
    }
  }

  async handleDelete(id) {
    const confirmed = await this._view.confirmDelete()
    if (!confirmed) return

    this._view.showLoading()
    try {
      await this._service.delete(id)
      this._view.showSuccess('Registro de historial eliminado correctamente')
      await this.loadHistory()
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }
}