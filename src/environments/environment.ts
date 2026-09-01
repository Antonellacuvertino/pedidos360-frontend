export const environment = {
  production: false,
  apiBaseUrl: 'https://reemplazar.execute-api.us-east-1.amazonaws.com',
  azure: {
    clientId: 'REEMPLAZAR_CLIENT_ID',
    tenantId: 'REEMPLAZAR_TENANT_ID',
    redirectUri: 'http://localhost:4200',
    authority: 'https://login.microsoftonline.com/REEMPLAZAR_TENANT_ID',
    apiScope: 'api://REEMPLAZAR_API_APP_ID/write-read'
  }
};
