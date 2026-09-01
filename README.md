# Frontend Pedidos360

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
    apiScope: 'api://CLIENT_ID_O_APP_ID_URI/write-read'
  }
};
```

El scope `write-read` debe existir en Microsoft Entra ID en la seccion **Expose an API**.

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
- Carrito con generacion de pedidos.
- Mi cuenta con claims, token JWT y banco de pruebas API.

## Flujo de autenticacion

1. El usuario presiona el boton de Microsoft.
2. MSAL redirige a Microsoft Entra ID.
3. Azure valida al usuario y devuelve tokens.
4. Angular guarda la sesion en MSAL.
5. `MsalInterceptor` adjunta `Authorization: Bearer <access_token>` en llamadas al API Gateway.
6. API Gateway y Spring Security validan el JWT.

