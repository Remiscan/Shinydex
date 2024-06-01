// @ts-ignore
import { queueable } from '../../../_common/js/per-function-async-queue/mod.js';
import { Params } from './Params.js';
import { getString } from './translation.js';



type BackendRequestData = {
  'session-code-verifier'?: string,
  [key: string]: any
};
let callBackend = async (request: string, data: BackendRequestData = {}, signedIn: boolean = false): Promise<any> => {
  // Prepare the data to send to the backend
  if (signedIn) data['session-code-verifier'] = Params.codeVerifier;
  const formData = new FormData();
  const dataKeys = Object.keys(data);
  const method = dataKeys.length > 0 ? 'POST' : 'GET';
  dataKeys.forEach(key => formData.append(key, data[key]));

  // Send the request to the backend
  console.log(`[REQUEST =>] Sending request to backend: ${request}`);
  const response = await fetch(`/shinydex/backend/endpoint.php?request=${request}&date=${Date.now()}`, {
    method: method,
    body: method === 'POST' ? formData : undefined
  });

  if (response.status != 200)
    throw getString('error-fetch-status').replace('{status}', String(response.status));

  const clonedResponse = response.clone();
  try {
    const responseData = await response.json();
    console.log('[=> RESPONSE]', responseData);
    if ('error' in responseData) {
      throw new Error(responseData.error);
    }
    return responseData;
  } catch (error) {
    const cause = await clonedResponse.text();
    if (error instanceof Error) {
      throw new Error(error.message, { cause });
    } else {
      console.error(cause);
      throw error;
    }
  }
};

callBackend = queueable(callBackend);
export { callBackend };

