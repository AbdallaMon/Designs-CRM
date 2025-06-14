"use server"
import {createStorefrontApiClient} from "@shopify/storefront-api-client";
import fetch from 'node-fetch';

const client = createStorefrontApiClient({
    storeDomain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
    privateAccessToken: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN,
    apiVersion:"2025-01",
    customFetchApi: fetch,

});
export async function makeCheckout(variantId){
    try{
        const globalVariantId = `gid://shopify/ProductVariant/${variantId}`;
        const cartCreateMutation = `
      mutation {
        cartCreate(input: {
          lineItems: [{ variantId: "${globalVariantId}", quantity: 1 }]
        }) {
          userErrors {
            message
            code
            field
          }
          cart {
            id
            checkoutUrl
          }
        }
      }
    `;
        const { data, errors, extensions } = await client.request(cartCreateMutation);


    console.log(errors,"errors")
    return data
    }catch (e){
        console.log(e,"error")
    }
}