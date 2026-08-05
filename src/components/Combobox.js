export class Combobox {
  constructor({ options = [], placeholder = 'Buscar...' } = {}) {
    this._options = options
    this._placeholder = placeholder
    this._selectedValue = null
    this._selectedLabel = ''
    this._activeIndex = -1
    this._visibleItems = []
    this._element = null
    this._input = null
    this._list = null
    this._onChangeCb = null
  }

  render() {
    const wrapper = document.createElement('div')
    wrapper.className = 'form__combobox'

    this._input = document.createElement('input')
    this._input.className = 'form__combobox-input form__input'
    this._input.type = 'text'
    this._input.placeholder = this._placeholder
    this._input.setAttribute('role', 'combobox')
    this._input.setAttribute('aria-autocomplete', 'list')
    this._input.setAttribute('aria-expanded', 'false')

    this._list = document.createElement('ul')
    this._list.className = 'form__combobox-list'
    this._list.setAttribute('role', 'listbox')
    this._list.hidden = true

    wrapper.appendChild(this._input)
    wrapper.appendChild(this._list)
    this._element = wrapper

    this._input.addEventListener('focus', () => this._open())
    this._input.addEventListener('input', () => this._onInput())
    this._input.addEventListener('keydown', (e) => this._onKeydown(e))
    this._input.addEventListener('blur', () => this._close())

    document.addEventListener('mousedown', this._handleOutsideClick)

    this._renderItems('')
    return wrapper
  }

  _handleOutsideClick = (e) => {
    if (this._element && !this._element.contains(e.target)) {
      this._close()
    }
  }

  _onInput() {
    const text = this._input.value.trim().toLowerCase()
    if (this._selectedLabel && text !== this._selectedLabel.toLowerCase()) {
      this._selectedValue = null
      this._selectedLabel = ''
      this._notifyChange()
    }
    this._renderItems(text)
    this._open()
  }

  _onKeydown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (this._visibleItems.length === 0) return
      this._activeIndex = this._activeIndex < this._visibleItems.length - 1 ? this._activeIndex + 1 : this._visibleItems.length - 1
      this._highlight()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (this._visibleItems.length === 0) return
      this._activeIndex = this._activeIndex > 0 ? this._activeIndex - 1 : 0
      this._highlight()
    } else if (e.key === 'Enter') {
      if (!this._list.hidden) {
        e.preventDefault()
        const item = this._activeIndex >= 0
          ? this._visibleItems[this._activeIndex]
          : (this._visibleItems.length === 1 ? this._visibleItems[0] : null)
        if (item) this._select(item)
      }
    } else if (e.key === 'Escape') {
      if (!this._list.hidden) {
        e.preventDefault()
        this._close()
      }
    }
  }

  _open() {
    if (this._list.hidden) {
      this._renderItems(this._input.value.trim().toLowerCase())
    }
    this._list.hidden = false
    this._input.setAttribute('aria-expanded', 'true')
  }

  _close() {
    this._list.hidden = true
    this._input.setAttribute('aria-expanded', 'false')
    this._activeIndex = -1
  }

  _renderItems(text) {
    this._list.textContent = ''
    this._visibleItems = []
    const query = (text || '').toLowerCase()
    const matches = this._options.filter(o => o.label.toLowerCase().includes(query))
    this._activeIndex = -1

    if (matches.length === 0) {
      const empty = document.createElement('li')
      empty.className = 'form__combobox-empty'
      empty.textContent = 'Sin resultados'
      this._list.appendChild(empty)
      return
    }

    matches.forEach((option, index) => {
      const item = document.createElement('li')
      item.className = 'form__combobox-item'
      item.setAttribute('role', 'option')
      item.textContent = option.label
      item.addEventListener('mousedown', (e) => e.preventDefault())
      item.addEventListener('click', () => this._select(option))
      item.addEventListener('mouseenter', () => {
        this._activeIndex = index
        this._highlight()
      })
      this._list.appendChild(item)
      this._visibleItems.push(option)
    })
  }

  _highlight() {
    const items = this._list.querySelectorAll('.form__combobox-item')
    items.forEach((el, i) => {
      el.classList.toggle('form__combobox-item--active', i === this._activeIndex)
    })
  }

  _select(option) {
    this._selectedValue = option.value
    this._selectedLabel = option.label
    this._input.value = option.label
    this._close()
    this._notifyChange()
  }

  _notifyChange() {
    if (this._onChangeCb) this._onChangeCb(this.getValue())
  }

  setOptions(options) {
    this._options = options
    if (this._element) {
      this._renderItems(this._input.value.trim().toLowerCase())
    }
  }

  setValueById(value) {
    const option = this._options.find(o => String(o.value) === String(value))
    if (option) {
      this._selectedValue = option.value
      this._selectedLabel = option.label
      if (this._input) this._input.value = option.label
      this._close()
    } else {
      this.clear()
    }
  }

  getValue() {
    return this._selectedValue
  }

  getLabel() {
    return this._selectedLabel
  }

  clear() {
    this._selectedValue = null
    this._selectedLabel = ''
    if (this._input) this._input.value = ''
    this._close()
  }

  onChange(callback) {
    this._onChangeCb = callback
  }
}
