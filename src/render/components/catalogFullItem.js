import renderItem from './item.js'

export default (item) => (`
  <div class="catalog-full-item">
    <div class="about">
      <img
        class="poster"
        alt="${item.title || item.name}"
        src="https://image.tmdb.org/t/p/w200${item.poster_path}" />
      <div class="content">
        <h1>${item.title || item.name}</h1>
        <p>${item.overview}</p>
      </div>
    </div>
    <h2>Torrents:</h2>
    <div class="items">
      ${item.items.map(item => renderItem(item)).join('')}
    </div>
  </div>
`)
