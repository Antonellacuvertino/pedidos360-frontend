export const environment = {
  production: false,
  apiBaseUrl: 'https://gzcsngmfed.execute-api.us-east-1.amazonaws.com',
  azure: {
    clientId: '53818f62-6c22-49d9-a314-832e4bbce010',
    tenantId: 'e5372bf0-c5e3-4286-887c-79069f209c1f',
    redirectUri: 'http://localhost:4200',
    authority: 'https://login.microsoftonline.com/e5372bf0-c5e3-4286-887c-79069f209c1f',
    apiScopes: [
      'api://99523fae-980a-4c64-bde4-26e92c7376e9/read',
      'api://99523fae-980a-4c64-bde4-26e92c7376e9/write'
    ]
  }
};
