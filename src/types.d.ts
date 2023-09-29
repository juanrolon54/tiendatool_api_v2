type DragonFishWebhookEvent = {
  Entidad: "WebHook"|"ARTICULO",
  Evento: "Prueba"|"MODIFICAR",
  Codigo: string,
  Fecha: string,
  Hora: string,
  Version: string,
  BaseDeDatos: "BASETOOL"
}

type StockYPrecioResponse = {
  Resultados: StockYPrecio[]
}

type StockYPrecio = {
  Articulo: string,
  Stock: number,
  Precios: {
      Lista: "COSTO $" | "PUBLICO $" | "MAYOR $" | "PUBLICO U$S" | "COSTO U$S",
      Precio: number
  }[]
}