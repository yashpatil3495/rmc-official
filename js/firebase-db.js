/* =============================================
   FIREBASE DB HELPERS
   Drop-in replacements for localStorage calls.
   Requires Firebase SDK to be loaded and exposed
   on window via the module script in the HTML.
   ============================================= */

async function fbGet(path) {
    const db = window._firebaseDB;
    const ref = window._firebaseRef;
    const get = window._firebaseGet;
    if (!db) return null;
    try {
        const snapshot = await get(ref(db, path));
        return snapshot.exists() ? snapshot.val() : null;
    } catch (err) {
        console.error('Firebase GET error:', path, err);
        return null;
    }
}

async function fbSet(path, value) {
    const db = window._firebaseDB;
    const ref = window._firebaseRef;
    const set = window._firebaseSet;
    if (!db) return;
    try {
        await set(ref(db, path), value);
    } catch (err) {
        console.error('Firebase SET error:', path, err);
    }
}

async function fbRemove(path) {
    const db = window._firebaseDB;
    const ref = window._firebaseRef;
    const remove = window._firebaseRemove;
    if (!db) return;
    try {
        await remove(ref(db, path));
    } catch (err) {
        console.error('Firebase REMOVE error:', path, err);
    }
}

function fbListen(path, callback) {
    const db = window._firebaseDB;
    const ref = window._firebaseRef;
    const onValue = window._firebaseOnValue;
    if (!db) return;
    onValue(ref(db, path), (snapshot) => {
        callback(snapshot.exists() ? snapshot.val() : null);
    });
}

window.fbGet = fbGet;
window.fbSet = fbSet;
window.fbRemove = fbRemove;
window.fbListen = fbListen;
