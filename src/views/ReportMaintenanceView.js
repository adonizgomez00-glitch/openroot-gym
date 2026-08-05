import { Table } from '../components/Table.js'
import { formatCurrency, formatDate } from '../utils/formatters.js'

export class ReportMaintenanceView {
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

    addStat('Total', String(report.summary.total))
    addStat('Pendiente', String(report.summary.pending))
    addStat('En progreso', String(report.summary.inProgress))
    addStat('Completado', String(report.summary.completed))
    addStat('Cancelado', String(report.summary.cancelled))
    summary.appendChild(document.createElement('br'))
    addStat('Costo total', formatCurrency(report.summary.totalCost))

    container.appendChild(summary)

    const table = new Table({
      columns: [
        { key: 'assetId', label: 'ID Activo', width: '90px' },
        { key: 'date', label: 'Fecha', width: '120px', render: (v) => formatDate(v) },
        { key: 'type', label: 'Tipo', width: '140px' },
        {
          key: 'cost', label: 'Costo', width: '100px',
          render: (v) => formatCurrency(v)
        },
        { key: 'description', label: 'Descripción' },
        { key: 'nextDate', label: 'Próximo', width: '120px', render: (v) => v || '-' },
        { key: 'status', label: 'Estado', width: '100px' }
      ],
      emptyMessage: 'No hay registros de mantenimiento en el período seleccionado'
    })

    table.setData(report.items)
    container.appendChild(table.render())
  }
}