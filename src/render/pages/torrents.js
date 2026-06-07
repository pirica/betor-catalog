import renderBase from '../base.js'
import renderItemsPaginated from '../components/itemsPaginated.js'

export default (pagination, title = null) => renderBase({
  title,
  content: `
    <section>
      ${renderItemsPaginated(pagination.items, pagination.href.previous, pagination.href.next)}
    </section>
  `
})
