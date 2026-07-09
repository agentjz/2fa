import { describe, expect, it } from "vitest";
import { parseInput } from "../src/core/totp";
import { addAccounts, clearAccounts, loadAccounts, removeAccount, saveAccounts, type StorageLike } from "../src/storage/accountsStore";

class MemoryStorage implements StorageLike {
  private data = new Map<string, string>();
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
}

function fixture() {
  const result = parseInput("otpauth://totp/Acme:bob?secret=JBSWY3DPEHPK3PXP&issuer=Acme");
  if (!result.ok) throw new Error(result.message);
  return result.account;
}

describe("accounts storage", () => {
  it("saves and loads valid accounts", () => {
    const storage = new MemoryStorage();
    const account = fixture();
    saveAccounts([account], storage);
    expect(loadAccounts(storage)).toEqual([account]);
  });

  it("drops malformed storage records", () => {
    const storage = new MemoryStorage();
    storage.setItem("luckymaomi.2fa.accounts.v1", JSON.stringify([{ id: "bad" }, fixture()]));
    expect(loadAccounts(storage)).toHaveLength(1);
  });

  it("merges duplicate imports by stable id", () => {
    const storage = new MemoryStorage();
    const account = fixture();
    const merged = addAccounts([account], [account], storage);
    expect(merged).toHaveLength(1);
    expect(loadAccounts(storage)).toHaveLength(1);
  });

  it("removes and clears accounts", () => {
    const storage = new MemoryStorage();
    const account = fixture();
    saveAccounts([account], storage);
    expect(removeAccount([account], account.id, storage)).toHaveLength(0);
    saveAccounts([account], storage);
    clearAccounts(storage);
    expect(loadAccounts(storage)).toEqual([]);
  });
});
