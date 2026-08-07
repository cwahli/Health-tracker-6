import { AsyncLocalStorage } from 'async_hooks';
const streamDebugLogStorage = new AsyncLocalStorage<(msg: string) => void>();
const addDebugLog = (msg: string) => { const log = streamDebugLogStorage.getStore(); if (log) log(msg); };

streamDebugLogStorage.run((msg) => console.log("LOG:", msg), () => {
    addDebugLog("Hello World");
});
