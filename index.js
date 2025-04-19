import pkg from 'stremio-addon-sdk'
const { serveHTTP, addonBuilder } = pkg

import fetch from 'node-fetch'
import translate from '@vitalets/google-translate-api'

const builder = new addonBuilder({
  id: 'org.metaes.addon',
  version: '1.0.0',
  name: 'MetaES',
  description: 'Clon de Cinemeta con traducción automática al español',
  types: ['movie', 'series'],
  catalogs: [
    {
      type: 'movie',
      id: 'top',
      name: 'Películas Populares',
      extra: [{ name: 'search' }]
    },
    {
      type: 'series',
      id: 'top',
      name: 'Series Populares',
      extra: [{ name: 'search' }]
    }
  ],
  resources: ['catalog', 'meta']
})

const CINEMETA = 'https://v3-cinemeta.strem.io'

async function translateText(text) {
  try {
    const res = await translate(text, { to: 'es' })
    return res.text
  } catch (e) {
    console.error('Error traduciendo:', e)
    return text
  }
}

builder.defineCatalogHandler(async ({ type, id, extra }) => {
  const url = `${CINEMETA}/catalog/${type}/${id}.json`
  const res = await fetch(url)
  const json = await res.json()
  return { metas: json.metas }
})

builder.defineMetaHandler(async ({ type, id }) => {
  const url = `${CINEMETA}/meta/${type}/${id}.json`
  const res = await fetch(url)
  const json = await res.json()
  const meta = json.meta

  meta.name = await translateText(meta.name)
  meta.description = await translateText(meta.description)

  return { meta }
})

serveHTTP(builder.getInterface(), {
  port,
  middleware: (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
  }
})

const port = process.env.PORT || 7000
serveHTTP(builder.getInterface(), { port })
console.log("MetaES activo en http://localhost:" + port + "/manifest.json")
