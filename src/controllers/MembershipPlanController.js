import { handleError } from '../utils/errors.js'

export class MembershipPlanController {
  constructor(membershipPlanService, membershipPlanView) {
    this._service = membershipPlanService
    this._view = membershipPlanView
    this._editingId = null
  }

  async init(container) {
    this._view.render(container)
    this._view.onSearch((query) => this.handleSearch(query))
    this._view.onCreate(() => this.showCreateForm())
    this._view.onEdit((id) => this.showEditForm(id))
    this._view.onDelete((id) => this.handleDelete(id))
    await this.loadPlans()
  }

  async loadPlans() {
    this._view.showLoading()
    try {
      const plans = await this._service.getAll()
      this._view.renderPlans(plans)
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }

  async handleSearch(query) {
    this._view.showLoading()
    try {
      const plans = await this._service.search(query)
      this._view.renderPlans(plans)
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
      const plan = await this._service.getById(id)
      this._editingId = id
      this._view.showForm(plan, async (data) => this.handleSave(data), () => this._view.closeForm())
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
        this._view.showSuccess('Plan actualizado correctamente')
      } else {
        await this._service.create(data)
        this._view.showSuccess('Plan creado correctamente')
      }
      this._view.closeForm()
      await this.loadPlans()
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
      this._view.showSuccess('Plan eliminado correctamente')
      await this.loadPlans()
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }
}