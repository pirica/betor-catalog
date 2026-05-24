export default ({ title } = {}) => `<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title || 'Catálogo BeTor'}</title>
</head>
<body>
  <footer>
    <ul>
      <li><a href="https://betor.top" target="_blank">BeTor</a></li>
      <li><a href="https://grafana.betor.top/public-dashboards/1019100df7a84d9daca507137f3b3e51" target="_blank">Status</a></li>
    </ul>
    <ul>
      <li><a href="/guia/prowlarr/">Guia Prowlarr</a></li>
      <li><a href="/data/">Baixar Dados</a></li>
    </ul>
    <ul>
      <li><a href="https://github.com/dougppaz/betor" target="_blank">Github - betor</a></li>
      <li><a href="https://github.com/dougppaz/betor-catalog" target="_blank">Github - betor-catalog</a></li>
    </ul>
    <p><strong>Contato/Dúvidas:</strong> betor@betor.top</p>
  </footer>
</body>
</html>`
