const DOM = require("prismic-dom")

const SIMPLE_FIELDS = {
  string: 'string',
  boolean: 'boolean',
  number: 'number'
}

const LINK_TYPES = {
  media: 'media',
  web: 'web'
}

const PARSER_TYPES = {
  NONE: 'none',
  TEXT: 'text',
  HTML: 'html',
  NOT_SUPPORTED: 'not_supported'
}

const HEADERS = {
  heading1: 'heading1',
  heading2: 'heading2',
  heading3: 'heading3',
  heading4: 'heading4',
  heading5: 'heading5',
  heading6: 'heading6'
}

const getParser = (field) => {
  if (field) {
    if (SIMPLE_FIELDS[typeof field]) {
      return PARSER_TYPES.NONE
    }

    if (typeof field === 'object') {
      if (Array.isArray(field)) {
        if (field.length === 1) {
          if (HEADERS[field[0].type]) {
            return PARSER_TYPES.TEXT
          }
        }

        return PARSER_TYPES.HTML
      } else {
        if (field.dimensions || (field.link_type && LINK_TYPES[field.link_type.toLowerCase()])) {
          return PARSER_TYPES.NONE
        }
      }
    }
  }

  return PARSER_TYPES.NONE
}

const parseSocialCard = (content) => {
  return {
    title: DOM.RichText.asText(content.title),
    description: DOM.RichText.asText(content.description),
    image: content.image.url
  }
}

const documentParser = ({
  uid,
  type,
  tags,
  first_publication_date,
  last_publication_date,
  lang,
  data,
}, linkResolver, htmlSerializer) => {
  const parsedDocument = {
    id: uid,
    slug: uid,
    uid,
    type,
    tags,
    first_publication_date,
    last_publication_date,
    lang,
  }

  const parsedData = {}

  Object.keys(data).forEach((key) => {
    const parserType = getParser(data[key])

    switch (parserType) {
      case PARSER_TYPES.NONE:
        parsedData[key] = data[key]
        break
      case PARSER_TYPES.TEXT:
        parsedData[key] = DOM.RichText.asText(data[key], linkResolver, htmlSerializer)
        break
      case PARSER_TYPES.HTML:
        if(key === 'body') {
          parsedData['social_cards'] = data[key].map(slice => {
            return {
              type: slice.slice_type,
              content: {
                ...parseSocialCard(slice.primary)
              }
            }
          })
        }
        else {
          parsedData[key] = DOM.RichText.asHtml(data[key], linkResolver, htmlSerializer)
        }
        break
      default:
        break
    }
  })

  parsedDocument.data = parsedData
  return parsedDocument
}

const capitalize = (s) => {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

module.exports = { documentParser, capitalize }