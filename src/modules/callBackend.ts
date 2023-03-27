import { Params } from './Params.js';



type BackendRequestData = {
  'session-code-verifier'?: string,
  [key: string]: any
};
export async function callBackend(request: string, data: BackendRequestData = {}, signedIn: boolean = false): Promise<any> {
  // Prepare the data to send to the backend
  if (signedIn) data['session-code-verifier'] = Params.codeVerifier;
  const formData = new FormData();
  const dataKeys = Object.keys(data);
  const method = dataKeys.length > 0 ? 'POST' : 'GET';
  dataKeys.forEach(key => formData.append(key, data[key]));

  // Send the request to the backend
  console.log(`Sending request to backend: ${request}`);
  const response = await fetch(`/shinydex/backend/endpoint.php?request=${request}&date=${Date.now()}`, {
    method: method,
    body: method === 'POST' ? formData : undefined
  });

  if (response.status != 200)
    throw '[:(] Erreur ' + response.status + ' lors de la requête';

  const clonedResponse = response.clone();
  try {
    const responseData = await response.json();
    if ('error' in responseData) {
      throw new Error(responseData.error);
    }
    return responseData;
  } catch (error) {
    const cause = await clonedResponse.text();
    if (error instanceof Error) {
      throw new Error(error.message, { cause });
    } else {
      console.error(await clonedResponse.text());
      throw error;
    }
  }
}