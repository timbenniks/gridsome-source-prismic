const Prismic = require('prismic-javascript')
const { documentParser, capitalize } = require('./utils')
const singlePages = ['home', 'youtube', 'about', 'page_not_found', 'writings', 'speaking'];
class PrismicSource {
  constructor(api, { prismic_token, prismic_url, collection_prefix = 'Prismic', html_serializer = null, link_resolver = null }) {
    this.token = prismic_token
    this.url = prismic_url
    this.prefix = collection_prefix
    this.prismic = null
    this.link_resolver = link_resolver
    this.html_serializer = html_serializer

    api.loadSource(async ({ addCollection }) => {
      await this.initPrismic()
      await this.loadCollections(addCollection)
    })
  }

  async initPrismic() {
    this.prismic = await Prismic.getApi(this.url, { accessToken: this.token })
  }

  async loadCollections(addCollection) {
    const { results } = await this.prismic.query('', {pageSize: 1000})

    let documentTypes = results.map((page) => {
      return singlePages.includes(page.type) ? 'singlePage' : page.type
    })

    documentTypes = [...new Set(documentTypes)]
    const collections = {}
    documentTypes.forEach((type) => {
      collections[type] = addCollection({
        typeName: `${this.prefix}${capitalize(type)}`
      })
    })

    results.forEach((document) => {
      const collection = collections[singlePages.includes(document.type) ? 'singlePage' : document.type]
      const cleanredUpDoc = documentParser(
        document,
        this.link_resolver,
        this.html_serializer
      )
      
      collection.addNode(cleanredUpDoc)
    })
  }
}

module.exports = PrismicSource