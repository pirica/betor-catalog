import renderItems from './render/pages/items.js'

export default class Index {
  data () {
    return {
      pagination: {
        data: 'tvs',
        size: 50,
        alias: 'item'
      },
      permalink: ({ pagination }) => {
        if (pagination.pageNumber > 0) {
          return `series/${pagination.pageNumber + 1}/index.html`
        }
        return 'series/index.html'
      }
    }
  }

  render ({ pagination }) {
    return renderItems(pagination, 'Séries - Catálogo BeTor')
  }
}
