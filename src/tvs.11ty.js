import renderTorrents from './render/pages/torrents.js'

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
    return renderTorrents(pagination, 'Séries - Catálogo BeTor')
  }
}
