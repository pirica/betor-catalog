import renderHome from './render/pages/home.js'

export default class Index {
  data () {
    return {
      permalink: 'index.html'
    }
  }

  render ({ items, movies, tvs }) {
    const newlyItems = items.slice(0, 50)
    const newlyMovies = movies.sort((a, b) => new Date(b.inserted_at) - new Date(a.inserted_at)).slice(0, 12)
    const newlyTvs = tvs.sort((a, b) => new Date(b.inserted_at) - new Date(a.inserted_at)).slice(0, 12)
    return renderHome({ newlyItems, newlyMovies, newlyTvs })
  }
}
