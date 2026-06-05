export default (items) => (`
  <ul>
    ${items.map(item => `<li>${item.id}</li>`).join('')}
  </ul>
`)
