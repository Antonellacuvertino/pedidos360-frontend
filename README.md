# Pedidos360 · Frontend EP6

Aplicación Angular para consultar productos, agregar artículos al carrito y simular el pago. En Analítica mostramos la actividad y las sugerencias que devuelve el backend.

- [Aplicación en AWS](https://100-52-32-209.sslip.io)
- [Backend](https://github.com/Antonellacuvertino/pedidos360-backend)
- [Informe EP6](https://github.com/Antonellacuvertino/pedidos360-backend/blob/main/docs/INFORME_EP6.md)
- [Guía de presentación y Postman](https://github.com/Antonellacuvertino/pedidos360-backend/blob/main/docs/PRESENTACION_EP6.md)

## Recorrido

1. Inicia sesión con Microsoft y abre **Productos**.
2. Agrega un artículo. **Para ti** aparece debajo del catálogo cuando llega una sugerencia.
3. En **Carrito**, usa `0000 0000 0000 0001` para probar una aprobación y ver el comprobante. Con `0000 0000 0000 0002` puedes ensayar rechazos sin perder el carrito.
4. La demo bloquea esa tarjeta durante 60 segundos al tercer intento en menos de 10 segundos. No hay cobro real y no se aceptan tarjetas reales.

## Configuración

MSAL inicia sesión con Microsoft Entra y adjunta el access token a las solicitudes a la API. [environment.prod.ts](src/environments/environment.prod.ts) define el Gateway y la URI de retorno. El [Dockerfile](Dockerfile) compila Angular y [Caddy](Caddyfile) sirve los archivos por HTTPS en EC2.

Para compilar con Node.js 22:

```bash
npm ci
npm run build
```

Las [imágenes del catálogo](src/assets/catalogo/) son ilustrativas. El comprobante es de una operación de prueba, no una boleta fiscal.
