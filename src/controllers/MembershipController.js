import { handleError } from '../utils/errors.js'

export class MembershipController {
  constructor(membershipService, membershipView, membershipRepo, memberRepo, membershipPlanRepo) {
    this._service = membershipService
    this._view = membershipView
    this._repo = membershipRepo
    this._memberRepo = memberRepo
    this._membershipPlanRepo = membershipPlanRepo
    this._editingId = null
  }

  async init(container) {
    this._view.render(container)
    this._view.onSearch((query) => this.handleSearch(query))
    this._view.onCreate(() => this.showCreateForm())
    this._view.onEdit((id) => this.showEditForm(id))
    this._view.onDelete((id) => this.handleDelete(id))
    this._view.onRenew((id) => this.handleRenew(id))
    this._view.onFreeze((id) => this.handleFreeze(id))
    this._view.onUnfreeze((id) => this.handleUnfreeze(id))
    await this.loadMemberships()
  }

  async loadMemberships() {
    this._view.showLoading()
    try {
      const memberships = await this._service.getAll()
      this._view.renderMemberships(memberships)
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }

  async handleSearch(query) {
    this._view.showLoading()
    try {
      const memberships = await this._service.search(query)
      this._view.renderMemberships(memberships)
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }

  async _loadFormOptions() {
    const [members, plans] = await Promise.all([
      this._memberRepo.findAll(),
      this._membershipPlanRepo.findAll()
    ])
    return { members, plans }
  }

  async showCreateForm() {
    this._editingId = null
    const options = await this._loadFormOptions()
    this._view.showForm(null, async (data) => this.handleSave(data), () => this._view.closeForm(), options)
  }

  async showEditForm(id) {
    this._view.showLoading()
    try {
      const membership = await this._service.getById(id)
      this._editingId = id
      const options = await this._loadFormOptions()
      this._view.showForm(membership, async (data) => this.handleSave(data), () => this._view.closeForm(), options)
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
        this._view.showSuccess('Membresía actualizada correctamente')
      } else {
        await this._service.create(data)
        this._view.showSuccess('Membresía creada correctamente')
      }
      this._view.closeForm()
      await this.loadMemberships()
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
      this._view.showSuccess('Membresía eliminada correctamente')
      await this.loadMemberships()
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }

  async handleRenew(id) {
    this._view.showLoading()
    try {
      const membership = await this._service.getById(id)
      const additionalDays = membership.planId ? (await this._repo.findById(membership.planId))?.durationDays || 30 : 30
      await this._service.renew(id, additionalDays)
      this._view.showSuccess('Membresía renovada correctamente')
      await this.loadMemberships()
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }

  async handleFreeze(id) {
    this._view.showLoading()
    try {
      await this._service.freeze(id)
      this._view.showSuccess('Membresía congelada correctamente')
      await this.loadMemberships()
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }

  async handleUnfreeze(id) {
    this._view.showLoading()
    try {
      await this._service.unfreeze(id)
      this._view.showSuccess('Membresía descongelada correctamente')
      await this.loadMemberships()
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }
}