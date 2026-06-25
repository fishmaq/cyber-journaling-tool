export function apiUrl(endpoint: string = '') {
  // TODO: dockerize this url
  return 'http://localhost:3000/' + endpoint;
}
