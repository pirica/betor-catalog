import renderTorrentList from './render/pages/torrent-list.js'

export default class Index {
  data () {
    return {
      pagination: {
        data: 'catalogItems',
        size: 50,
        alias: 'item'
      },
      permalink: ({ pagination }) => {
        if (pagination.pageNumber > 0) {
          return `page/${pagination.pageNumber + 1}/index.html`
        }
        return 'index.html'
      }
    }
  }

  render ({ pagination }) {
    return renderTorrentList(pagination)
  }
}
