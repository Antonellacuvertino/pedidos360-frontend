# Frontend Pedidos360

## Despliegue EP6 (25-11-2026)

Aplicacion publicada en EC2: https://100-52-32-209.sslip.io

Backend mediante API Gateway: https://l9xrwlo874.execute-api.us-east-1.amazonaws.com

Produccion usa `environment.prod.ts` con Kafka habilitado. La usuaria confirmo
inicio de sesion Microsoft, catalogo y Streaming en este laboratorio.
La SPA debe registrar `https://100-52-32-209.sslip.io` en Entra.
El dominio y los destinos privados de los paneles se configuran mediante `.env`
en EC2; ver `.env.example`. RabbitMQ usa su autenticacion nativa y Kafka UI
usa Basic Auth en Caddy, ambos por HTTPS. No guardar claves en Git.

La [guia EP6 del backend](https://github.com/Antonellacuvertino/pedidos360-backend/blob/main/docs/DEMO_EP6_AWS.md)
contiene arquitectura, pruebas, paneles y guion de presentacion.

### Revision visual del catalogo

El catalogo se carga al entrar. Se elimino el aviso tecnico de carga en
Productos y Dashboard; si falla la consulta se muestra un error breve.
Tras agregar al carrito, Angular publica la accion CARRITO y consulta por un
tiempo acotado a analytics. Cuando llega el resultado de esa seleccion,
**Para ti** aparece debajo del catalogo, sin productos que ya esten en el carrito.
Abrir un detalle por si solo no activa el bloque.

El pago de prueba esta solo en **Carrito**. La tarjeta rechazada permite
reintentar sin vaciarlo ni generar un comprobante. Un tercer intento en menos
de diez segundos devuelve 429. **Analitica** muestra actividad y complementos
con foto, nombre y precio; no tiene formulario de pago.

Las [imagenes de referencia](src/assets/catalogo/) son simuladas: una plancha
generada con la herramienta integrada de imagenes y exportada a tres JPEG.
Prompt: fotografias de estudio, fondo gris claro, notebook negro abierto,
monitor de 27 pulgadas y mouse ergonomico oscuro, sin logotipos ni texto.

La recomendacion tiene su propia distribucion de dos columnas, distinta de la
tarjeta del catalogo. Los nombres pueden ocupar varias lineas y, en pantallas
angostas, el formulario pasa debajo del catalogo. No se altero el flujo Kafka.

`scripts/check-product-layout.cjs` comprueba solapamientos y desbordamientos en
360, 390, 768, 1024, 1280 y 1440 px, con nombres normales y largos. Usa el HTML y
CSS reales con datos de prueba; no sustituye las pruebas de login o de compras.
Requiere Chrome y Playwright. Desde esta carpeta:

```powershell
npm install --prefix ../.tools/ui-check --no-audit --no-fund playwright
$env:NODE_PATH = (Resolve-Path ../.tools/ui-check/node_modules).Path
node scripts/check-product-layout.cjs
```

Las capturas quedan en `.artifacts/product-layout`, fuera de Git y Docker.

## Ensayo local

Con los servicios de `backend-pedidos360/deploy/compose.recorrido-local.yml`
iniciados, ejecutar `npm run start:local` y abrir http://localhost:4200.
Este perfil usa `environment.local.ts` y `proxy.local.json`, habilita
recomendaciones y analitica, y mantiene el login Microsoft. No usa AWS
API Gateway: es solo una prueba previa al despliegue, no la entrega cloud.
Ver `backend-pedidos360/docs/RECORRIDO_LOCAL.md` para el paso a paso.
Las direcciones siguientes corresponden al laboratorio anterior.

Direccion HTTPS configurada para el frontend en EC2:

```text
https://100-48-142-195.sslip.io
```

Consume el backend exclusivamente mediante:

```text
https://2iguro8kei.execute-api.us-east-1.amazonaws.com
```

En Microsoft Entra ID, la aplicacion SPA `ad02ca6f-9972-496e-837c-98c92a43220e` debe mantener registradas estas URI de redireccion:

```text
http://localhost:4200
https://100-48-142-195.sslip.io
```

La URL productiva debe estar configurada en **Authentication > Single-page application**, no como aplicacion web.

La API registrada en Entra ID usa el client ID `7d7e6f82-35dc-4fd2-b580-7776c558d963` y expone los permisos delegados `pedidos.read` y `pedidos.write`.

El scope de escritura debe solicitarse con su nombre tecnico `pedidos.write`. El navegador puede mostrarlo traducido como `pedidos.escribe`, pero esa traduccion no es una URI de permiso valida y provoca `AADSTS650053`.

Aplicacion Angular para Pedidos360. Implementa login con Microsoft Entra ID usando MSAL, rutas protegidas, catalogo de productos, carrito y pantalla para ver/copiar el access token.

## EP5 Kafka

La vista `Analitica` y el detalle de producto estan habilitados en produccion.
Las vistas y selecciones publican eventos; el backend consume Kafka y la
interfaz consulta las recomendaciones. El pago es simulado:
no cobra dinero ni acepta numeros de tarjeta. El proceso completo esta en
el [README EP5 del backend](https://github.com/Antonellacuvertino/pedidos360-backend/blob/main/docs/EP5_IMPLEMENTACION.md).

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

## Ejecutar localmente

```bash
npm install
npm start
```

## Compilar

```bash
npm run build
```

## Publicar en EC2

El `Dockerfile` compila Angular y Caddy entrega los archivos estaticos por HTTPS. El certificado se conserva en los volumenes definidos en `compose.yaml`.

1. En el security group de EC2 permitir TCP 80 y 443 desde Internet.
2. Confirmar que `100-48-142-195.sslip.io` resuelve a la IP elastica de la instancia.
3. Registrar `https://100-48-142-195.sslip.io` como URI de redireccion SPA en Entra ID.
4. Clonar este repositorio en EC2 y ejecutar:

```bash
docker compose up -d --build
docker compose ps
docker compose logs --tail=80 frontend
```

5. Comprobar `https://100-48-142-195.sslip.io` y realizar login con Microsoft. Si cambia la IP elastica, actualizar `Caddyfile`, `environment.prod.ts`, CORS y la URI de Entra ID antes de reconstruir.

## Pantallas

- Login con boton "Iniciar sesion con Microsoft".
- Dashboard con resumen consumido desde API Gateway.
- Productos con GET y POST protegido.
- Carrito con publicacion asincrona de pedidos y respuesta `202 Accepted`.
- Comprobante de pedido imprimible o guardable como PDF tras la aceptacion de todos los productos. No es boleta tributaria ni comprobante de pago.
- Mi cuenta con claims, token JWT y banco de pruebas API.

## Flujo de autenticacion

1. El usuario presiona el boton de Microsoft.
2. MSAL redirige a Microsoft Entra ID.
3. Azure valida al usuario y devuelve tokens.
4. Angular guarda la sesion en MSAL.
5. `MsalInterceptor` adjunta `Authorization: Bearer <access_token>` en llamadas al API Gateway.
6. API Gateway y Spring Security validan el JWT.

El `protectedResourceMap` usa la ruta `${apiBaseUrl}/api/*`: MSAL compara las URL de forma estricta y una clave con solo el dominio no cubre `/api/v1/productos` ni las otras rutas de la API.

Si el dashboard abre pero **Mi cuenta** no muestra el access token, revisar el codigo de error que aparece en esa pantalla. Confirmar en Entra ID que la SPA tiene los permisos delegados `pedidos.read` y `pedidos.write` de la API y que se concedio el consentimiento necesario. Despues de modificar permisos, cerrar sesion en Pedidos360 e ingresar nuevamente para solicitar un token nuevo. Para la presentacion se debe copiar el **access token** de Mi cuenta; el ID token no sirve para llamar al API Gateway.

Si Productos queda cargando, la espera termina a los 20 segundos y muestra un error. Un `401` indica token rechazado o sesion vencida; un `403`, falta de permisos; un error de conexion indica que no se pudo alcanzar el Gateway. Antes de reintentar, comprobar que las instancias EC2 y los target groups del ALB esten activos. Un frontend previamente abierto puede seguir visible aunque el backend haya sido detenido.

## Flujo de compra

1. El usuario agrega productos al carrito.
2. Angular envia el pedido al BFF a traves de API Gateway.
3. El backend responde que el evento fue aceptado.
4. RabbitMQ distribuye el evento para guardar la orden, descontar stock, notificar y auditar.
5. La pantalla muestra un comprobante con fecha, cliente, productos, total referencial e identificadores de evento. Se puede imprimir o guardar como PDF desde el navegador.

La interfaz no espera a que todos los consumidores terminen. Por eso el comprobante acredita la aceptacion de la solicitud, no la entrega ni el pago. Si alguna peticion del carrito falla, se debe revisar Pedidos recientes antes de repetir la compra porque otras peticiones pueden haberse aceptado.

## Estado del laboratorio

El 8 de octubre de 2026 se comprobo el inicio de sesion Microsoft, el access token en **Mi cuenta**, la carga del catalogo a traves de API Gateway y la confirmacion de un pedido con comprobante. El claim `aud` recibido es el ID de la API sin prefijo `api://`; API Gateway y Spring validan exactamente ese valor. Tambien se corrigio el patron del `MsalInterceptor` para que adjunte el token a `/api/*`.
