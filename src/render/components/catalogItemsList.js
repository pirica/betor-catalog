export default (catalogItems) => (`
  <ul>
    ${catalogItems.map(item => `<li>${item.title || item.name} - ${item.imdb_id}</li>`).join('')}
  </ul>
`)
