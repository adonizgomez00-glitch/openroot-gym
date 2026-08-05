import { handleError } from '../utils/errors.js'

export class TrainerController {
  constructor(trainerService, trainerView, trainerRepo) {
    this._service = trainerService
    this._view = trainerView
    this._repo = trainerRepo
    this._editingId = null
  }

  async init(container) {
    this._view.render(container)
    this._view.onSearch((query) => this.handleSearch(query))
    this._view.onCreate(() => this.showCreateForm())
    this._view.onEdit((id) => this.showEditForm(id))
    this._view.onDelete((id) => this.handleDelete(id))
    await this.loadTrainers()
  }

  async loadTrainers() {
    this._view.showLoading()
    try {
      const trainers = await this._service.getAll()
      this._view.renderTrainers(trainers)
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }

  async handleSearch(query) {
    this._view.showLoading()
    try {
      const trainers = await this._service.search(query)
      this._view.renderTrainers(trainers)
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }

  async showCreateForm() {
    this._editingId = null
    this._view.nextDocId = await this._repo.generateNextDocumentId()
    this._view.showForm(null, async (data) => this.handleSave(data), () => this._view.closeForm())
  }

  async showEditForm(id) {
    this._view.showLoading()
    try {
      const trainer = await this._service.getById(id)
      this._editingId = id
      this._view.showForm(trainer, async (data) => this.handleSave(data), () => this._view.closeForm())
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
        const { documentId, ...rest } = data
        await this._service.update(this._editingId, rest)
        this._view.showSuccess('Entrenador actualizado correctamente')
      } else {
        const documentId = await this._repo.generateNextDocumentId()
        await this._service.create({ ...data, documentId })
        this._view.showSuccess('Entrenador creado correctamente')
      }
      this._view.closeForm()
      await this.loadTrainers()
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
      this._view.showSuccess('Entrenador eliminado correctamente')
      await this.loadTrainers()
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }
}