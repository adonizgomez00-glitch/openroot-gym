import { handleError } from '../utils/errors.js'

export class AttendanceController {
  constructor(attendanceService, attendanceView, memberRepo) {
    this._service = attendanceService
    this._view = attendanceView
    this._memberRepo = memberRepo
    this._editingId = null
  }

  async init(container) {
    this._view.render(container)
    this._view.onSearch((query) => this.handleSearch(query))
    this._view.onCreate(() => this.showCreateForm())
    this._view.onEdit((id) => this.showEditForm(id))
    this._view.onDelete((id) => this.handleDelete(id))
    await this.loadAttendances()
  }

  async loadAttendances() {
    this._view.showLoading()
    try {
      const attendances = await this._service.getAll()
      this._view.renderAttendances(attendances)
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }

  async handleSearch(query) {
    this._view.showLoading()
    try {
      const attendances = await this._service.search(query)
      this._view.renderAttendances(attendances)
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }

  async _loadFormOptions() {
    const members = await this._memberRepo.findAll()
    return { members }
  }

  async showCreateForm() {
    this._editingId = null
    const options = await this._loadFormOptions()
    this._view.showForm(null, async (data) => this.handleSave(data), () => this._view.closeForm(), options)
  }

  async showEditForm(id) {
    this._view.showLoading()
    try {
      const attendance = await this._service.getById(id)
      this._editingId = id
      const options = await this._loadFormOptions()
      this._view.showForm(attendance, async (data) => this.handleSave(data), () => this._view.closeForm(), options)
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
        this._view.showSuccess('Asistencia actualizada correctamente')
      } else {
        await this._service.create(data)
        this._view.showSuccess('Asistencia registrada correctamente')
      }
      this._view.closeForm()
      await this.loadAttendances()
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
      this._view.showSuccess('Asistencia eliminada correctamente')
      await this.loadAttendances()
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }
}