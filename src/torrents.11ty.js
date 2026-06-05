import renderTorrents from './render/pages/torrents.js'

export default class Index {
  data () {
    return {
      pagination: {
        data: 'items',
        size: 50,
        alias: 'item'
      },
      permalink: ({ pagination }) => {
        if (pagination.pageNumber > 0) {
          return `torrents/${pagination.pageNumber + 1}/index.html`
        }
        return 'torrents/index.html'
      }
    }
  }

  render ({ pagination }) {
    return renderTorrents(pagination)
  }
}
