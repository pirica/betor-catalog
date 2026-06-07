import renderBase from '../base.js'
import renderCatalogItemsPaginated from '../components/catalogItemsPaginated.js'

export default (pagination, title = null) => renderBase({
  title,
  content: `
    <section>
      ${renderCatalogItemsPaginated(pagination.items, pagination.href.previous, pagination.href.next)}
    </section>
  `
})
