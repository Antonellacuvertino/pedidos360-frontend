export const environment = {
  production: false,
  apiBaseUrl: 'https://2iguro8kei.execute-api.us-east-1.amazonaws.com',
  azure: {
    clientId: 'ad02ca6f-9972-496e-837c-98c92a43220e',
    tenantId: 'e5372bf0-c5e3-4286-887c-79069f209c1f',
    redirectUri: 'http://localhost:4200',
    authority: 'https://login.microsoftonline.com/e5372bf0-c5e3-4286-887c-79069f209c1f',
    apiScopes: [
      'api://7d7e6f82-35dc-4fd2-b580-7776c558d963/pedidos.read',
      'api://7d7e6f82-35dc-4fd2-b580-7776c558d963/pedidos.escribe'
    ]
  }
};
