import renderTorrents from './render/pages/torrents.js'

export default class Index {
  data () {
    return {
      pagination: {
        data: 'movies',
        size: 50,
        alias: 'item'
      },
      permalink: ({ pagination }) => {
        if (pagination.pageNumber > 0) {
          return `filmes/${pagination.pageNumber + 1}/index.html`
        }
        return 'filmes/index.html'
      }
    }
  }

  render ({ pagination }) {
    return renderTorrents(pagination, 'Filmes - Catálogo BeTor')
  }
}
