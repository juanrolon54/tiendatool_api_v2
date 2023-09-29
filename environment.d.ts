declare module "bun" {
    interface Env {
        WOOCOMMERCE_URL: string;
        WOOCOMMERCE_CONSUMERKEY: string;
        WOOCOMMERCE_CONSUMERSECRET: string;
        DRAGONFISH_URL: string;
        DRAGONFISH_CLIENTID: string;
        DRAGONFISH_AUTHTOKEN: string;
        DRAGONFISH_REFRESHTOKEN: string;
    }
  }
  