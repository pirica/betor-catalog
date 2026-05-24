import fs from 'fs'
import { Eleventy } from '@11ty/eleventy'
import PQueue from 'p-queue'

const CACHE_DIR = '.cache'

const ITEMS_PATH = 'src/_data/items.json'
const CATALOG_ITEMS_PATH = 'src/_data/catalogItems.json'
const MOVIES_PATH = 'src/_data/movies.json'
const TVS_PATH = 'src/_data/tvs.json'
const TVS_BY_SEASON_PATH = 'src/_data/tvsBySeason.json'

class BetorCatalog {
  constructor (options) {
    this.options = options
    this.env = {
      tmdbApiKey: process.env.TMDB_API_KEY
    }
    this.tmdbApiQueue = new PQueue({ intervalCap: 2, interval: 1000 })
  }

  /*
    IO Utils
  */

  read (path) {
    const data = fs.readFileSync(path, 'utf-8')
    return JSON.parse(data)
  }

  write (path, data) {
    fs.writeFileSync(path, JSON.stringify(data, null, 2))
  }

  /*
    Cache Utils
  */

  getInfoCache (imdbId) {
    try {
      const cacheValue = fs.readFileSync(`${CACHE_DIR}/info-${imdbId}.json`)
      return JSON.parse(cacheValue)
    } catch (err) {
      return null
    }
  }

  setInfoCache (imdbId, info) {
    try {
      if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true })
      }
      this.write(`${CACHE_DIR}/info-${imdbId}.json`, info)
      console.info(`${imdbId} cached!`)
    } catch (err) {
      console.error(`fail to cache item info ${imdbId}: ${err.message}`)
    }
  }

  /*
    TMDB API
  */

  async getInfoFromTmdbAPI (itemType, imdbId) {
    if (!this.env.tmdbApiKey) {
      throw new Error('TMDB_API_KEY environment variable is not set')
    }
    const url = `https://api.themoviedb.org/3/find/${imdbId}?external_source=imdb_id&language=pt-BR`
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${this.env.tmdbApiKey}`
      }
    }
    const res = await this.tmdbApiQueue.add(() => {
      console.log(`fetching from tmdb imdb_id:${imdbId} data: ${url}`)
      return fetch(url, options)
    })
    if (!res.ok) {
      throw new Error(`Error to fetch ${url}: ${res.status}`)
    }
    const findData = await res.json()
    if (itemType === 'movie' && !findData.movie_results) {
      throw new Error(`Movie not found at TMDB with imdb_id ${imdbId}`)
    }
    if (itemType === 'tv' && !findData.tv_results) {
      throw new Error(`TV Show not found at TMDB with imdb_id ${imdbId}`)
    }
    return (itemType === 'movie' && findData.movie_results[0]) || (itemType === 'tv' && findData.tv_results[0])
  }

  /*
    Enrich catalog items
  */

  async enrichCatalogItems (catalogItems) {
    return Promise.all(catalogItems.map(item => (this.enrichCatalogItem(item))))
  }

  async enrichCatalogItem (catalogItem) {
    const infoCache = this.getInfoCache(catalogItem.imdb_id)
    if (infoCache) {
      console.info(`Item info loaded from cache ${catalogItem.imdb_id}`)
      return { ...infoCache, ...catalogItem }
    }
    if (catalogItem.imdb_id) {
      try {
        const info = await this.getInfoFromTmdbAPI(catalogItem.item_type, catalogItem.imdb_id)
        if (info) {
          this.setInfoCache(catalogItem.imdb_id, info)
        } else {
          console.warn(`No info found at TMDB for item ${catalogItem.imdb_id}`)
        }
        return { ...info, ...catalogItem }
      } catch (err) {
        console.warn(`Failed to enrich item ${catalogItem.imdb_id}: ${err.message}`)
        return catalogItem
      }
    }
    return catalogItem
  }

  /*
    Data: Fetch Items
  */

  async dataFetchItems () {
    console.log('fetching items from Betor API...')

    const items = await this.fetchItems()
    console.log(`${items.length} items found`)
    this.write(ITEMS_PATH, items)

    console.log(`items fetched and written to file: ${ITEMS_PATH}`)
  }

  async fetchItems (page = 1, attempt = 1, items = []) {
    const url = `${this.options.betorApiUrl}/v1/items/?sort=inserted_at&size=100&page=${page}`
    console.log(`fetching items page ${page}: ${url}`)
    const res = await fetch(url, {
      headers: this.options.betorApiAuthorization ? { Authorization: `Basic ${this.options.betorApiAuthorization}` } : {}
    })
    if (!res.ok) {
      if (attempt <= 5) {
        console.warn(`Error to fetch page ${page}: ${res.status}, retrying... (attempt ${attempt})`)
        return this.fetchItems(page, attempt + 1, items)
      }
      throw new Error(`Error to fetch page ${page}: ${res.status}`)
    }
    const data = await res.json()
    if (!data.items || !Array.isArray(data.items)) {
      throw new Error('Unexpected body!')
    }
    const newItems = [...items, ...data.items]
    if (page >= data.pages) {
      return newItems
    }
    if (this.options.pagesLimit && page >= this.options.pagesLimit) {
      console.log(`Reached page limit of ${this.options.pagesLimit} pages`)
      return newItems
    }
    return this.fetchItems(page + 1, 1, newItems)
  }

  /*
    Data: Build Catalog Items
  */

  async dataCatalogItems () {
    console.log('building catalog items data...')

    const items = this.read(ITEMS_PATH)
    console.log(`${items.length} items loaded`)

    const validItems = items.filter(item => (
      item.item_type != null &&
      item.updated_at != null &&
      item.imdb_id != null &&
      item.tmdb_id != null
    ))
    console.log(`${validItems.length} valid items`)

    const catalogItemsByImdbId = {}
    validItems.forEach(item => {
      const catalogKey = item.imdb_id
      if (!catalogItemsByImdbId[catalogKey]) {
        catalogItemsByImdbId[catalogKey] = {
          item_type: item.item_type,
          imdb_id: item.imdb_id,
          tmdb_id: item.tmdb_id,
          inserted_at: item.inserted_at,
          last_updated: item.updated_at,
          items: [item]
        }
      } else {
        const catalogItem = catalogItemsByImdbId[catalogKey]
        if (catalogItem.inserted_at > item.inserted_at) {
          catalogItem.inserted_at = item.inserted_at
        }
        if (catalogItem.last_updated < item.updated_at) {
          catalogItem.last_updated = item.updated_at
        }
        catalogItem.items.push(item)
      }
    })

    const catalogItems = await this.enrichCatalogItems(Object.values(catalogItemsByImdbId))
    const catalogMoviesItems = catalogItems.filter(({ item_type: itemType }) => (itemType === 'movie'))
    const catalogTvItems = catalogItems.filter(({ item_type: itemType }) => (itemType === 'tv'))
    console.log(`${catalogItems.length} catalog items generated`)

    this.write(CATALOG_ITEMS_PATH, catalogItems)
    console.log(`catalog items built and written to file: ${CATALOG_ITEMS_PATH}`)

    this.write(MOVIES_PATH, catalogMoviesItems)
    console.log(`movies data written to file: ${MOVIES_PATH}`)

    this.write(TVS_PATH, catalogTvItems)
    console.log(`tv shows data written to file: ${TVS_PATH}`)

    const catalogTvItemsBySeason = catalogTvItems.map(item => {
      const seasons = [
        ...new Set(item.items.flatMap(i => i.seasons))
      ]
      return seasons.map(season => ({
        ...item,
        season
      }))
    }).flat()
    this.write(TVS_BY_SEASON_PATH, catalogTvItemsBySeason)
    console.log(`tv shows by season data written to file: ${TVS_BY_SEASON_PATH}`)
  }

  /*
    Eleventy
  */

  async serve () {
    const elev = new Eleventy()
    await elev.init()
    await elev.watch()
    await elev.serve()
  }

  async build () {
    const elev = new Eleventy()
    await elev.init()
    await elev.write()
  }

  /*
    Deprecated

  async buildItems () {
    console.log('building items data...')

    const rawItems = this.read(RAW_ITEMS_PATH)
    console.log(`${rawItems.length} raw items loaded`)

    const catalogItems = this.buildCatalogItems(rawItems)
    console.log(`${catalogItems.length} catalog items generated`)

    const enrichedItems = await this.enrichItems(catalogItems)
    console.log('catalog items enriched with TMDB metadata')

    this.write(ITEMS_PATH, enrichedItems)
    this.write(MOVIES_PATH, enrichedItems.filter(({ item_type: itemType }) => (itemType === 'movie')))
    this.write(TVS_PATH, enrichedItems.filter(({ item_type: itemType }) => (itemType === 'tv')))
    const itemsByImdb = await this.groupBy(enrichedItems, 'imdb_id')
    this.write(ITEMS_GROUP_BY_IMDB_ID_PATH, itemsByImdb)
    const itemsByImdbAndSeason = await this.groupBySeason(enrichedItems, 'imdb_id')
    this.write(ITEMS_GROUP_BY_IMDB_ID_AND_SEASON_PATH, itemsByImdbAndSeason)
  }

  buildCatalogItems (rawItems) {
    const filteredItems = rawItems.filter(item => (
      item.item_type != null &&
      item.updated_at != null &&
      item.imdb_id != null &&
      item.tmdb_id != null
    ))

    const providerGroups = {}
    filteredItems.forEach(item => {
      const providerKey = [
        item.item_type,
        item.imdb_id,
        item.tmdb_id,
        item.provider_slug,
        item.provider_url
      ].join('|')

      if (!providerGroups[providerKey]) {
        providerGroups[providerKey] = {
          item_type: item.item_type,
          imdb_id: item.imdb_id,
          tmdb_id: item.tmdb_id,
          provider_slug: item.provider_slug,
          provider_url: item.provider_url,
          last_updated: item.updated_at,
          torrents: []
        }
      }

      const providerGroup = providerGroups[providerKey]
      if (providerGroup.last_updated < item.updated_at) {
        providerGroup.last_updated = item.updated_at
      }

      providerGroup.torrents.push({
        magnet_uri: item.magnet_uri,
        languages: item.languages,
        torrent_name: item.torrent_name ?? item.magnet_dn,
        torrent_size: item.torrent_size,
        torrent_files: item.torrent_files,
        download_path: item.download_path,
        torrent_num_peers: item.torrent_num_peers,
        torrent_num_seeds: item.torrent_num_seeds,
        seasons: item.seasons,
        inserted_at: item.inserted_at
      })
    })

    const catalogGroups = {}
    Object.values(providerGroups).forEach(providerGroup => {
      const catalogKey = [
        providerGroup.item_type,
        providerGroup.imdb_id,
        providerGroup.tmdb_id
      ].join('|')

      if (!catalogGroups[catalogKey]) {
        catalogGroups[catalogKey] = {
          item_type: providerGroup.item_type,
          imdb_id: providerGroup.imdb_id,
          tmdb_id: providerGroup.tmdb_id,
          last_updated: providerGroup.last_updated,
          providers: []
        }
      }

      const catalogGroup = catalogGroups[catalogKey]
      if (catalogGroup.last_updated < providerGroup.last_updated) {
        catalogGroup.last_updated = providerGroup.last_updated
      }

      catalogGroup.providers.push({
        slug: providerGroup.provider_slug,
        url: providerGroup.provider_url,
        torrents: providerGroup.torrents
      })
    })

    return Object.values(catalogGroups)
  }

  groupBy (items, attr) {
    const groups = {}
    items.forEach(item => {
      if (!Object.keys(groups).includes(item[attr])) {
        groups[item[attr]] = []
      }
      groups[item[attr]].push(item)
    })
    return Object.keys(groups).map(k => ({ key: k, items: groups[k] }))
  }

  itemSeason (item, season) {
    const newItem = structuredClone(item)
    newItem.providers = newItem.providers
      .map(provider => ({
        ...provider,
        torrents: provider.torrents.filter(t => t.seasons.includes(season))
      }))
      .filter(provider => provider.torrents.length > 0)
    return newItem
  }

  groupBySeason (items, attr) {
    const groups = {}
    items.forEach(item => {
      const seasons = [
        ...new Set(item.providers.flatMap(p => p.torrents).flatMap(t => t.seasons))
      ]
      seasons.forEach(season => {
        const key = [item[attr], season].join('|')
        if (!Object.keys(groups).includes(key)) {
          groups[key] = []
        }
        groups[key].push(this.itemSeason(item, season))
      })
    })
    return Object.keys(groups).map(v => {
      const [k, season] = v.split('|', 2)
      return { key: k, season, items: groups[v] }
    })
  }
  */
}

export default BetorCatalog
