import { Elysia } from "elysia";
import { html as html } from '@elysiajs/html'
import * as elements from 'typed-html'
import WooCommerce from "@woocommerce/woocommerce-rest-api";

const woocommerce = new WooCommerce({
  url: Bun.env.WOOCOMMERCE_URL ?? "",
  consumerKey: Bun.env.WOOCOMMERCE_CONSUMERKEY ?? "",
  consumerSecret: Bun.env.WOOCOMMERCE_CONSUMERSECRET ?? "",
  version: "wc/v3"
});

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



const app = new Elysia()
  .use(html())
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

  .get("/productos", async () => {

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

  .put("/productos", async ({ set, body }) => {

    set.redirect = "/productos"
  })

  .put("/productos/:sku", async ({ set, body, params: { sku } }) => {

    let productBySKU: any = await woocommerce.get('products', { sku, per_page: 1 })
    await woocommerce.put(`products/${productBySKU.data[0].id}`, body)

    set.redirect = "/productos"
  })
  .group("/api", app =>
    app.get('/', () => {
      return "Esta es la api!"
    }))
  .get("/styles.css", () => Bun.file("./tailwind-gen/styles.css"))
  .listen(Bun.env.PORT ?? 5173);




console.log(
  `Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
