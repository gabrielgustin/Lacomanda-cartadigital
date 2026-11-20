// La carta vive bajo lacomandaa.com.ar/carta: toda ruta escrita a mano (fetch, iframe, fondos) lleva este prefijo.
// next/link y next/router lo agregan solos; next/image lo toma de lib/image-loader.ts.
export const BASE_PATH = '/carta'

export const withBase = (path: string) => (path.startsWith('/') && !path.startsWith('//') && !path.startsWith(`${BASE_PATH}/`) ? BASE_PATH + path : path)
