import renderBase from '../base.js'
import renderItemsPaginated from '../components/itemsPaginated.js'

export default (pagination) => renderBase({
  content: `
    <section>
      ${renderItemsPaginated(pagination.items, pagination.href.previous, pagination.href.next)}
    </section>
  `
})
