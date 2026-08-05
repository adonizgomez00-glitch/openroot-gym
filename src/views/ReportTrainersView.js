import { Table } from '../components/Table.js'
import { formatCurrency, formatDate } from '../utils/formatters.js'

export class ReportTrainersView {
  render(container, report) {
    container.innerHTML = ''

    const summary = document.createElement('div')
    summary.className = 'report-summary-bar'

    const addStat = (label, value) => {
      const span = document.createElement('span')
      span.className = 'report-stat'
      const strong = document.createElement('strong')
      strong.textContent = label + ':'
      span.appendChild(strong)
      span.appendChild(document.createTextNode(' ' + value))
      summary.appendChild(span)
    }

    addStat('Total entrenadores', String(report.summary.total))
    addStat('Activos', String(report.summary.active))
    addStat('Inactivos', String(report.summary.inactive))
    summary.appendChild(document.createElement('br'))

    for (const [specialty, count] of Object.entries(report.summary.bySpecialty)) {
      addStat(specialty, String(count))
    }

    container.appendChild(summary)

    const table = new Table({
      columns: [
        { key: 'documentId', label: 'Documento', width: '130px' },
        { key: 'name', label: 'Nombre' },
        { key: 'email', label: 'Email' },
        { key: 'specialty', label: 'Especialidad', width: '150px' },
        {
          key: 'active', label: 'Activo', width: '80px',
          render: (v) => v ? 'Sí' : 'No'
        }
      ],
      emptyMessage: 'No hay entrenadores registrados'
    })

    table.setData(report.items)
    container.appendChild(table.render())
  }
}