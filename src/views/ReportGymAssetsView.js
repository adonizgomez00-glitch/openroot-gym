import { Table } from '../components/Table.js'
import { formatCurrency, formatDate } from '../utils/formatters.js'

export class ReportGymAssetsView {
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

    addStat('Total activos', String(report.summary.total))
    addStat('Activos', String(report.summary.active))
    addStat('En mantenimiento', String(report.summary.maintenance))
    addStat('Retirados', String(report.summary.retired))
    summary.appendChild(document.createElement('br'))
    addStat('Valor total', formatCurrency(report.summary.totalValue))

    container.appendChild(summary)

    const table = new Table({
      columns: [
        { key: 'code', label: 'Código', width: '110px' },
        { key: 'name', label: 'Nombre' },
        { key: 'type', label: 'Tipo', width: '120px' },
        { key: 'brand', label: 'Marca', width: '110px' },
        { key: 'model', label: 'Modelo', width: '110px' },
        {
          key: 'purchasePrice', label: 'Precio', width: '100px',
          render: (v) => formatCurrency(v)
        },
        { key: 'status', label: 'Estado', width: '100px' },
        { key: 'location', label: 'Ubicación', width: '120px' }
      ],
      emptyMessage: 'No hay activos registrados'
    })

    table.setData(report.items)
    container.appendChild(table.render())
  }
}