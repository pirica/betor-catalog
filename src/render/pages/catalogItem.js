import renderBase from '../base.js'
import renderCatalogFullItem from '../components/catalogFullItem.js'

export default (item) => renderBase({
  title: `${item.title || item.name} - Catálogo BeTor`,
  content: `
    <section>
      ${renderCatalogFullItem(item)}
    </section>
  `
})
