import { callBackend } from "./callBackend.js";



// Récupère la clé publique sur le serveur
async function getVapidPublicKey() {
	const data = await callBackend('get-vapid-public-key', {}, true);
	return String(data['public_key']).replace(/\r\n|\n|\r/gm, '');
}


// Enregistre la souscription Push dans la BDD
async function savePushSubscription(subscription: PushSubscription) {
	console.log('sending', subscription);
	const result = await callBackend('save-push-subscription', {
		subscription: JSON.stringify(subscription)
	}, true);
	console.log('received', result);
}


// Supprime une souscription Push de la BDD
async function deletePushSubscription(subscription: PushSubscription) {
	console.log('sending', subscription);
	await callBackend('delete-push-subscription', {
		subscription: JSON.stringify(subscription)
	}, true);
}


// Renvoie la souscription Push actuelle
export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
	const sw = await navigator.serviceWorker.ready;
	return await sw.pushManager.getSubscription();
}


// Souscrit l'utilisateur aux notifications Push
export async function subscribeToPush() {
	const sw = await navigator.serviceWorker.ready;
	const publicKey = await getVapidPublicKey();

	const subscriptionParameters = {
		userVisibleOnly: true,
		applicationServerKey: urlBase64ToUint8Array(publicKey)
	};
	
	const pushSubscription = await getCurrentPushSubscription()
		?? await sw.pushManager.subscribe(subscriptionParameters);
	savePushSubscription(pushSubscription);
}


// Supprime les souscriptions de l'utilisateur aux notifications Push
export async function unsubscribeFromPush() {
	const pushSubscription = await getCurrentPushSubscription();
	if (pushSubscription) deletePushSubscription(pushSubscription);
}


// From https://github.com/Minishlink/physbook/blob/02a0d5d7ca0d5d2cc6d308a3a9b81244c63b3f14/app/Resources/public/js/app.js#L177
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (var i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}