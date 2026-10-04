# Frontend Pedidos360

Aplicacion desplegada en:

```text
https://main.d1ipad4fvqyxdz.amplifyapp.com
```

Consume el backend exclusivamente mediante:

```text
https://2iguro8kei.execute-api.us-east-1.amazonaws.com
```

En Microsoft Entra ID, la aplicacion SPA `ad02ca6f-9972-496e-837c-98c92a43220e` debe mantener registradas estas URI de redireccion:

```text
http://localhost:4200
https://main.d1ipad4fvqyxdz.amplifyapp.com
```

La URL productiva debe estar configurada en **Authentication > Single-page application**, no como aplicacion web.

La API registrada en Entra ID usa el client ID `7d7e6f82-35dc-4fd2-b580-7776c558d963` y expone los permisos delegados `pedidos.read` y `pedidos.write`.

Aplicacion Angular para Pedidos360. Implementa login con Microsoft Entra ID usando MSAL, rutas protegidas, catalogo de productos, carrito y pantalla para ver/copiar el access token.

## Tecnologias

- Angular 21
- MSAL Angular
- Microsoft Entra ID
- API Gateway como URL unica de backend

## Configuracion

Editar `src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  apiBaseUrl: 'https://TU_API_ID.execute-api.us-east-1.amazonaws.com',
  azure: {
    clientId: 'CLIENT_ID_DE_AZURE',
    tenantId: 'TENANT_ID_DE_AZURE',
    redirectUri: 'https://URL_PUBLICA_DEL_FRONTEND',
    authority: 'https://login.microsoftonline.com/TENANT_ID_DE_AZURE',
    apiScopes: [
      'api://API_CLIENT_ID/pedidos.read',
      'api://API_CLIENT_ID/pedidos.write'
    ]
  }
};
```

Los scopes deben existir en la aplicacion de API registrada en Microsoft Entra ID. El `clientId` del frontend corresponde a la aplicacion SPA y puede ser distinto del client ID de la API.

## Ejecutar

```bash
npm install
npm start
```

## Compilar

```bash
npm run build
```

## Pantallas

- Login con boton "Iniciar sesion con Microsoft".
- Dashboard con resumen consumido desde API Gateway.
- Productos con GET y POST protegido.
- Carrito con publicacion asincrona de pedidos y respuesta `202 Accepted`.
- Mi cuenta con claims, token JWT y banco de pruebas API.

## Flujo de autenticacion

1. El usuario presiona el boton de Microsoft.
2. MSAL redirige a Microsoft Entra ID.
3. Azure valida al usuario y devuelve tokens.
4. Angular guarda la sesion en MSAL.
5. `MsalInterceptor` adjunta `Authorization: Bearer <access_token>` en llamadas al API Gateway.
6. API Gateway y Spring Security validan el JWT.

## Flujo de compra

1. El usuario agrega productos al carrito.
2. Angular envia el pedido al BFF a traves de API Gateway.
3. El backend responde que el evento fue aceptado.
4. RabbitMQ distribuye el evento para guardar la orden, descontar stock, notificar y auditar.

La interfaz no espera a que todos los consumidores terminen. Por eso muestra que el pedido fue aceptado para procesamiento.
