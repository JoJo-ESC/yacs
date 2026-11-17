import React, { useCallback, useEffect, useRef } from "react";
import { fetchAccountSchedules, saveAccountSchedules } from "@/api";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { mergeScheduleStores, parseScheduleStore, type ScheduleStore } from "@/lib/schedule/savedSchedules";

// Which account the schedules in localStorage belong to, so logging in can
// tell this account's cached copy apart from schedules made as a guest.
const OWNER_STORAGE_KEY = "yacs:schedules:owner";
// Set while there are edits the account doesn't have yet (offline, a failed
// save, or the tab closed before the save went out). Those win over the
// account's copy on the next load instead of being overwritten by it.
const PENDING_STORAGE_KEY = "yacs:schedules:pending";

const SAVE_DELAY_MS = 1000;

function readKey(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeKey(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Storage unavailable: sync still works for this visit
  }
}

const isPending = () => readKey(PENDING_STORAGE_KEY) === "1";
const setPending = (pending: boolean) => writeKey(PENDING_STORAGE_KEY, pending ? "1" : null);

// Keeps a logged-in user's schedules in sync with their account, so they're
// the same on every device. Guests are untouched: their schedules stay in
// this browser only.
//
// - Logging in (or loading the site logged in) fetches the account's copy.
//   Nothing is saved before that finishes, so a new device's empty
//   schedules can never overwrite the account.
// - Schedules made as a guest are merged into the account on login.
// - Edits save to the account a second after the last change.
// - Coming back to the tab re-fetches, picking up edits from other devices.
// - Logging out clears this browser's copy (it's safe in the account),
//   unless it has edits that haven't saved yet.
export function useScheduleSync(store: ScheduleStore, setStore: React.Dispatch<React.SetStateAction<ScheduleStore>>) {
  const { isAuthenticated, user } = useAuth();
  const email = isAuthenticated ? user?.email : undefined;

  const emailRef = useRef(email);
  emailRef.current = email;
  const storeRef = useRef(store);
  storeRef.current = store;
  // The account's copy has been loaded for `email`; saving is allowed.
  const readyRef = useRef(false);
  // JSON of the store as the account last had it.
  const lastSyncedRef = useRef<string | null>(null);

  const save = useCallback(async (json: string) => {
    const owner = emailRef.current;
    try {
      await saveAccountSchedules(json);
    } catch {
      return; // Still pending; retried when the tab is next shown or back online
    }
    if (emailRef.current !== owner) return;
    lastSyncedRef.current = json;
    if (JSON.stringify(storeRef.current) === json) setPending(false);
  }, []);

  const load = useCallback(async () => {
    const owner = emailRef.current;
    if (!owner) return;

    let account: ScheduleStore;
    try {
      account = parseScheduleStore((await fetchAccountSchedules()).schedules);
    } catch {
      return; // Offline or session expired: keep the local copy, retry later
    }
    if (emailRef.current !== owner) return; // Logged out while loading

    const local = storeRef.current;
    let next: ScheduleStore;
    if (readKey(OWNER_STORAGE_KEY) !== owner) next = mergeScheduleStores(account, local);
    else if (isPending()) next = local;
    else next = account;

    const accountJson = JSON.stringify(account);
    const nextJson = JSON.stringify(next);
    lastSyncedRef.current = accountJson;
    readyRef.current = true;
    writeKey(OWNER_STORAGE_KEY, owner);
    // Skip identical copies, so a re-fetch with nothing new doesn't re-render
    if (nextJson !== JSON.stringify(local)) setStore(next);
    if (nextJson !== accountJson) {
      setPending(true);
      void save(nextJson);
    } else {
      setPending(false);
    }
  }, [save, setStore]);

  // Log in / log out
  const prevEmailRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const prevEmail = prevEmailRef.current;
    prevEmailRef.current = email;
    if (email === prevEmail) return;

    readyRef.current = false;
    lastSyncedRef.current = null;

    if (email) {
      void load();
    } else if (prevEmail && !isPending()) {
      writeKey(OWNER_STORAGE_KEY, null);
      setStore({});
    }
  }, [email, load, setStore]);

  // Save edits, a second after the last one
  const prevStoreRef = useRef(store);
  useEffect(() => {
    const changed = prevStoreRef.current !== store;
    prevStoreRef.current = store;
    if (!email) return;

    const json = JSON.stringify(store);
    if (json === lastSyncedRef.current) {
      setPending(false);
      return;
    }
    if (!readyRef.current) {
      // Edited before the account's copy arrived: keep these edits on load
      if (changed) setPending(true);
      return;
    }

    setPending(true);
    const timer = setTimeout(() => void save(json), SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [store, email, save]);

  // Coming back to the tab or reconnecting: finish an earlier load or save,
  // or pick up changes made on another device.
  useEffect(() => {
    if (!email) return;
    const resync = () => {
      if (document.visibilityState !== "visible") return;
      if (!readyRef.current || !isPending()) void load();
      else void save(JSON.stringify(storeRef.current));
    };
    document.addEventListener("visibilitychange", resync);
    window.addEventListener("online", resync);
    return () => {
      document.removeEventListener("visibilitychange", resync);
      window.removeEventListener("online", resync);
    };
  }, [email, load, save]);
}
