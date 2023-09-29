import { Elysia } from "elysia";
import { html as html } from '@elysiajs/html'
import * as elements from 'typed-html'
import WooCommerce from "@woocommerce/woocommerce-rest-api";
import { logger } from '@bogeychan/elysia-logger';

function Page({ children }: elements.Children) {
  return <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>TiendaTool [TEST]</title>
      <script src="https://unpkg.com/htmx.org@1.9.6"></script>
      <link href="./styles.css" rel="stylesheet" />
    </head>
    <body hx-boost="true" class="p-8">
      {children}
    </body>
  </html>
}

async function dragonFishAuthenticate() {
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'insomnia/2023.5.8' },
    body: JSON.stringify({
      IdCliente: Bun.env.DRAGONFISH_CLIENTID,
      JWToken: Bun.env.DRAGONFISH_AUTHTOKEN
    })
  };

  let response = await fetch(Bun.env.DRAGONFISH_URL + '/api.Dragonfish/Autenticar', options);
  let json = await response.json()
  return json
}
try {
  await dragonFishAuthenticate()
} catch (e) {
  console.error(e)
  throw new Error('Hubo un error al autenticar')
}

async function getDragonFishStockYPrecio(articulo: string) {
  const options = {
    method: 'GET',
    headers: {
      "IdCliente": Bun.env.DRAGONFISH_CLIENTID,
      "Authorization": Bun.env.DRAGONFISH_REFRESHTOKEN
    }
  };

  let response = await fetch(Bun.env.DRAGONFISH_URL + '/api.Dragonfish/ConsultaStockYPrecios?preciocero=true&stockcero=true&exact=true&limit=1&query=' + articulo, options)
  let json = await response.json()

  return json as StockYPrecioResponse
}

async function updateProduct(sku: string, body: any) {
  let woocommerce = new WooCommerce({
    url: Bun.env.WOOCOMMERCE_URL ?? "",
    consumerKey: Bun.env.WOOCOMMERCE_CONSUMERKEY ?? "",
    consumerSecret: Bun.env.WOOCOMMERCE_CONSUMERSECRET ?? "",
    version: "wc/v3"
  })
  let productBySKU: any = await woocommerce.get('products', { sku, per_page: 1 })
  await woocommerce.put(`products/${productBySKU.data[0].id}`, body)

  return productBySKU.data[0]
}


const app = new Elysia()
  .use(logger({ level: 'debug', enabled: true, }))
  .use(html())
  .derive(() => {
    return {
      woocommerce: new WooCommerce({
        url: Bun.env.WOOCOMMERCE_URL ?? "",
        consumerKey: Bun.env.WOOCOMMERCE_CONSUMERKEY ?? "",
        consumerSecret: Bun.env.WOOCOMMERCE_CONSUMERSECRET ?? "",
        version: "wc/v3"
      })
    }
  })
  .get("/", () => {

    return <Page>
      <a class="hover:underline underline-offset-2" href='/productos'>productos</a>
      <hr />
      <div class="text-center mt-[30vh]">
        <h1 class="text-6xl mb-4 font-thin">Api de TiendaTool</h1>
        <h2 class="text-lg font-bold tracking-wide mb-32">Hecha por juan@Krak.com.ar</h2>
      </div>
    </Page>
  })
  .get("/productos", async ({ woocommerce }) => {

    let products = await woocommerce.get('products', { per_page: 100 })

    return (<Page>
      <a class="hover:underline underline-offset-2" href='/'>inicio</a>
      <hr />
      <table class="m-8">
        <thead class="h-16">
          <tr class="font-bold tracking-widest">
            <td>ID</td>
            <td>SKU</td>
            <td>NOMBRE</td>
            <td class="pr-4 pl-4 text-left">STOCK</td>
            <td class="pr-4 pl-4 text-left">PRECIO</td>
          </tr>
        </thead>
        <tbody>
          {products.data.map((product: any) =>
            <tr class=" gap-4">
              <form class="" method="POST">
                <td class="pr-4">{product.id}</td>
                <td class="pr-4">{product.sku}</td>
                <td class="pr-4">{product.name}</td>
                <td class="pr-4">
                  <input
                    hx-put={`/productos/${product.sku}`}
                    hx-trigger="change changed delay:500ms, search"
                    name="stock_quantity"
                    type="number"
                    class="pl-4 text-right w-full bg-transparent mt-2 hover:border border border-transparent hover:border-black p-1"
                    hx-indicator={"#" + "stock_quantity" + product.id}
                    value={product.stock_quantity} />
                  <span id={"stock_quantity" + product.id} class="htmx-indicator text-xs">espere...</span>
                </td>
                <td class="pr-4">
                  <input
                    hx-put={`/productos/${product.sku}`}
                    hx-trigger="change changed delay:500ms, search"
                    name="regular_price"
                    type="number"
                    class="pl-4 text-right w-full bg-transparent mt-2 hover:border border border-transparent hover:border-black p-1"
                    hx-indicator={"#" + "regular_price" + product.id}
                    value={product.regular_price} />
                  <span id={"regular_price" + product.id} class="htmx-indicator text-xs">espera...</span>
                </td>
              </form>
            </tr>
          )}
        </tbody>
      </table>
    </Page>)
  })
  .put("/productos", async ({ set, body, woocommerce }) => {

    set.redirect = "/productos"
  })
  .put("/productos/:sku", async ({ set, body, params: { sku }, woocommerce }) => {
    console.log(sku, body)
    updateProduct(sku, body)
    set.redirect = "/productos"
  })

  .group("/api", app =>
    app
      .post('/webhook', async ({ set, body, woocommerce }) => {
        let webhookBody = body as DragonFishWebhookEvent
        if (webhookBody.Evento === 'Prueba') {
          console.log("Se recibio un mensaje de prueba exitosamente!")
        }
        if (webhookBody.Evento === 'MODIFICAR') {
          console.log(`\nSe recibio una peticion para modificar un articulo \nCODIGO: ${webhookBody.Codigo}`)
          try {
            const sku = webhookBody.Codigo
            let stockYPrecio = await getDragonFishStockYPrecio(sku)

            let stock_quantity = String(stockYPrecio.Resultados[0].Stock)
            let regular_price = String(stockYPrecio.Resultados[0].Precios.find(i => i.Lista === 'PUBLICO $')?.Precio)

            console.log("Nuevo Precio Publico: ", regular_price)
            console.log("Stock: ", stock_quantity)

            const newProduct = {
              regular_price,
              stock_quantity
            }
            console.log(sku, newProduct)
            let oldProduct = await updateProduct(sku, newProduct)

            console.log("Stock y precio de: \n -- ", oldProduct.name, "\nActualizado Correctamente.\n\n")

            set.status = 'OK'
          } catch (e) {
            console.error(e)
            set.status = 'Bad Request'
          }
        }
      })
  )

  .get("/styles.css", () => Bun.file("./tailwind-gen/styles.css"))
  .listen(Bun.env.PORT ?? 5173);

console.clear();
console.log(
  `Integracion Dragofish->WooCommerce esta andando en ${app.server?.hostname}:${app.server?.port}`
)