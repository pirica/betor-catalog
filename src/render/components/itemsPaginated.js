import renderItemsList from './itemsList.js'

export default (items, previousPage = null, nextPage = null) => (`
  <div>
    ${renderItemsList(items)}
    ${previousPage ? `<a href="${previousPage}"><<</a>` : ''}
    ${nextPage ? `<a href="${nextPage}">>></a>` : ''}
  </div>
`)
