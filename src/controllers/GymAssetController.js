import { handleError } from '../utils/errors.js'

export class GymAssetController {
  constructor(gymAssetService, gymAssetView, gymAssetRepo) {
    this._service = gymAssetService
    this._view = gymAssetView
    this._repo = gymAssetRepo
    this._editingId = null
  }

  async init(container) {
    this._view.render(container)
    this._view.onSearch((query) => this.handleSearch(query))
    this._view.onCreate(() => this.showCreateForm())
    this._view.onEdit((id) => this.showEditForm(id))
    this._view.onDelete((id) => this.handleDelete(id))
    await this.loadAssets()
  }

  async loadAssets() {
    this._view.showLoading()
    try {
      const assets = await this._service.getAll()
      this._view.renderAssets(assets)
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }

  async handleSearch(query) {
    this._view.showLoading()
    try {
      const assets = await this._service.search(query)
      this._view.renderAssets(assets)
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }

  async showCreateForm() {
    this._editingId = null
    this._view.nextCode = await this._repo.generateNextCode()
    this._view.showForm(null, async (data) => this.handleSave(data), () => this._view.closeForm())
  }

  async showEditForm(id) {
    this._view.showLoading()
    try {
      const asset = await this._service.getById(id)
      this._editingId = id
      this._view.showForm(asset, async (data) => this.handleSave(data), () => this._view.closeForm())
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
        const { code, ...rest } = data
        await this._service.update(this._editingId, rest)
        this._view.showSuccess('Activo actualizado correctamente')
      } else {
        const code = await this._repo.generateNextCode()
        await this._service.create({ ...data, code })
        this._view.showSuccess('Activo creado correctamente')
      }
      this._view.closeForm()
      await this.loadAssets()
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
      this._view.showSuccess('Activo eliminado correctamente')
      await this.loadAssets()
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }
}