"use client";

import { useEffect, useState } from "react";

// Type for each transaction entry
type Transaction = {
  id: number;
  deposit: number;
  spent: number;
  saved: number;
  wants: number;
  balance: number;
  timestamp: string;
  note?: string;
};

// Type for each account
type Account = {
  id: string;
  name: string;
};

export default function Home() {
  // Accounts list
  const [accounts, setAccounts] = useState<Account[]>([
    { id: "checking", name: "Checking" },
    { id: "savings", name: "Savings" },
    { id: "credit", name: "Credit Card" },
  ]);

  // Currently selected account
  const [selectedAccount, setSelectedAccount] = useState(accounts[0].id);

  // Editing existing account name
  const [editAccountName, setEditAccountName] = useState(
    accounts.find((acc) => acc.id === selectedAccount)?.name || ""
  );

  // Creating new account
  const [newAccountName, setNewAccountName] = useState("");

  // Transaction input states
  const [deposit, setDeposit] = useState(0);
  const [spent, setSpent] = useState(0);
  const [saved, setSaved] = useState(0);
  const [wants, setWants] = useState(0);
  const [note, setNote] = useState("");

  // All transactions stored by account ID
  const [allTransactions, setAllTransactions] = useState<
    Record<string, Transaction[]>
  >({});

  // Current balance stored for each account
  const [currentBalance, setCurrentBalance] = useState<Record<string, number>>(
    {}
  );

  // Update editable account name when switching accounts
  useEffect(() => {
    const acc = accounts.find((acc) => acc.id === selectedAccount);
    setEditAccountName(acc ? acc.name : "");
  }, [selectedAccount, accounts]);

  // Load transactions + balances from localStorage on first load
  useEffect(() => {
    const savedData = localStorage.getItem("money-tracker-history");
    if (savedData) {
      const parsed = JSON.parse(savedData) as Record<string, Transaction[]>;
      setAllTransactions(parsed);

      // Rebuild balance records
      const balances: Record<string, number> = {};
      for (const accountId in parsed) {
        const txs = parsed[accountId];
        balances[accountId] = txs.length > 0 ? txs[0].balance : 0;
      }
      setCurrentBalance(balances);
    }
  }, []);

  // Save transactions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(
      "money-tracker-history",
      JSON.stringify(allTransactions)
    );
  }, [allTransactions]);

  // Live balance preview before saving
  const balance =
    (currentBalance[selectedAccount] || 0) +
    deposit -
    spent -
    saved -
    wants;

  // Disable spent/saved/wants when balance is zero or below
  const disableSpentSavedWants = (currentBalance[selectedAccount] || 0) <= 0;

  // Save transaction to memory + update balance
  const handleSaveTransaction = () => {
    if (balance < 0) {
      alert("Transaction would result in negative balance. Please adjust amounts.");
      return;
    }

    const newTransaction: Transaction = {
      id: Date.now(),
      deposit,
      spent,
      saved,
      wants,
      balance,
      timestamp: new Date().toLocaleString(),
      note: note.trim() === "" ? undefined : note.trim(),
    };

    // Save new transaction to list
    setAllTransactions({
      ...allTransactions,
      [selectedAccount]: [
        newTransaction,
        ...(allTransactions[selectedAccount] || []),
      ],
    });

    // Update balance record
    setCurrentBalance({
      ...currentBalance,
      [selectedAccount]: balance,
    });

    // Reset input fields
    setDeposit(0);
    setSpent(0);
    setSaved(0);
    setWants(0);
    setNote("");
  };

  // All transactions for selected account
  const transactions = allTransactions[selectedAccount] || [];

  // Summary of totals
  const totals = transactions.reduce(
    (acc, t) => {
      acc.spent += t.spent;
      acc.saved += t.saved;
      acc.wants += t.wants;
      return acc;
    },
    { spent: 0, saved: 0, wants: 0 }
  );

  // Rename account handler
  const handleAccountNameChange = (accountId: string, newName: string) => {
    if (!newName.trim()) return;
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId ? { ...acc, name: newName.trim() } : acc
      )
    );
  };

  // Save edited account name
  const handleSaveAccountName = () => {
    const trimmed = editAccountName.trim();
    if (!trimmed) return;
    handleAccountNameChange(selectedAccount, trimmed);
  };

  // Add account
  const handleAddAccount = () => {
    const trimmed = newAccountName.trim();
    if (!trimmed) return;

    // Auto-generate unique ID
    let newId = trimmed.toLowerCase().replace(/\s+/g, "-");
    let counter = 1;
    while (accounts.find((acc) => acc.id === newId)) {
      newId = `${newId}-${counter++}`;
    }

    const newAccount: Account = { id: newId, name: trimmed };
    setAccounts([...accounts, newAccount]);
    setSelectedAccount(newId);
    setNewAccountName("");
  };

  // Delete account
  const handleDeleteAccount = () => {
    if (accounts.length === 1) {
      alert("You must keep at least one account.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this account?")) return;

    setAccounts((prev) => prev.filter((acc) => acc.id !== selectedAccount));

    // Remove its transactions & balances
    const { [selectedAccount]: _, ...restTransactions } = allTransactions;
    setAllTransactions(restTransactions);

    const { [selectedAccount]: __, ...restBalance } = currentBalance;
    setCurrentBalance(restBalance);

    // Switch to another account
    const nextAccount =
      accounts.find((acc) => acc.id !== selectedAccount)?.id || "";
    setSelectedAccount(nextAccount);
  };

  // Disable save button when no meaningful input
  const isSaveDisabled =
    (deposit === 0 && spent === 0 && saved === 0 && wants === 0) || balance < 0;

  return (
    <div className="min-h-screen bg-gradient-to-tr from-gray-100 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-gray-100 font-sans px-4 sm:px-6 lg:px-8 py-10 flex flex-col items-center">
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-8 tracking-tight text-center">
        💰 Simple Money Tracker
      </h1>

      {/* ---------- ACCOUNT CONTROLS ---------- */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 w-full max-w-4xl items-center justify-center mb-8">

        {/* Account dropdown */}
        <select
          value={selectedAccount}
          onChange={(e) => {
            setSelectedAccount(e.target.value);
            const selected = accounts.find((acc) => acc.id === e.target.value);
            setEditAccountName(selected ? selected.name : "");
          }}
          className="w-full sm:w-auto px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name}
            </option>
          ))}
        </select>

        {/* Edit account name */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <input
            type="text"
            value={editAccountName}
            onChange={(e) => setEditAccountName(e.target.value)}
            placeholder="Edit account name"
            className="w-full sm:w-44 px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {/* Save account name */}
          <button
            onClick={() => {
              const trimmedName = editAccountName.trim();
              const nameExists = accounts.some(
                (acc) =>
                  acc.name.toLowerCase() === trimmedName.toLowerCase() &&
                  acc.id !== selectedAccount
              );
              if (nameExists) {
                alert("An account with this name already exists.");
                return;
              }
              setAccounts((prev) =>
                prev.map((acc) =>
                  acc.id === selectedAccount ? { ...acc, name: trimmedName } : acc
                )
              );
              setEditAccountName("");
            }}
            disabled={
              editAccountName.trim() === "" ||
              editAccountName ===
              (accounts.find((acc) => acc.id === selectedAccount)?.name || "")
            }
            className={`px-4 py-2 rounded-md font-semibold transition-transform duration-200 transform hover:scale-[1.03] ${editAccountName.trim() === "" ||
              editAccountName ===
              (accounts.find((acc) => acc.id === selectedAccount)?.name || "")
              ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500"
              : "bg-yellow-500 hover:bg-yellow-600 text-white"
              }`}
          >
            Save
          </button>

          {/* Delete account */}
          <button
            onClick={() => {
              if (accounts.length === 1) {
                alert("You cannot delete the last account.");
                return;
              }
              setAccounts((prev) =>
                prev.filter((acc) => acc.id !== selectedAccount)
              );
              const remainingAccounts = accounts.filter(
                (acc) => acc.id !== selectedAccount
              );
              setSelectedAccount(
                remainingAccounts.length > 0 ? remainingAccounts[0].id : ""
              );
              setEditAccountName("");
            }}
            disabled={accounts.length === 1}
            className={`px-4 py-2 rounded-md font-semibold transition-transform duration-200 transform hover:scale-[1.03] ${accounts.length === 1
              ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500"
              : "bg-red-500 hover:bg-red-600 text-white"
              }`}
          >
            Delete
          </button>
        </div>

        {/* Add new account */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <input
            type="text"
            value={newAccountName}
            onChange={(e) => setNewAccountName(e.target.value)}
            placeholder="New account name"
            className="w-full sm:w-44 px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <button
            onClick={() => {
              const trimmedName = newAccountName.trim();
              const nameExists = accounts.some(
                (acc) =>
                  acc.name.toLowerCase() === trimmedName.toLowerCase()
              );
              if (nameExists) {
                alert("An account with this name already exists.");
                return;
              }
              const newAccount = {
                id: Date.now().toString(),
                name: trimmedName,
              };
              setAccounts([...accounts, newAccount]);
              setSelectedAccount(newAccount.id);
              setNewAccountName("");
              setEditAccountName(trimmedName);
            }}
            disabled={newAccountName.trim() === ""}
            className={`px-4 py-2 rounded-md font-semibold transition-transform duration-200 transform hover:scale-[1.03] ${newAccountName.trim() === ""
              ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500"
              : "bg-green-500 hover:bg-green-600 text-white"
              }`}
          >
            Add
          </button>
        </div>
      </div>

      {/* ---------- TRANSACTION INPUTS ---------- */}
      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 ring-1 ring-gray-200 dark:ring-gray-700">

        {/* Transaction numeric inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { id: "deposit", label: "Deposit", value: deposit, setter: setDeposit, disabled: false },
            { id: "spent", label: "Spent", value: spent, setter: setSpent, disabled: disableSpentSavedWants },
            { id: "saved", label: "Saved", value: saved, setter: setSaved, disabled: disableSpentSavedWants },
            { id: "wants", label: "Wants", value: wants, setter: setWants, disabled: disableSpentSavedWants },
          ].map(({ id, label, value, setter, disabled }) => (
            <div key={id} className="flex flex-col">
              <label htmlFor={id} className="mb-1 text-sm font-medium">{label}</label>
              <input
                id={id}
                type="number"
                min={0}
                value={value}
                onChange={(e) => setter(Number(e.target.value))}
                disabled={disabled}
                className={`px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${disabled ? "opacity-50 cursor-not-allowed" : ""
                  }`}
              />
            </div>
          ))}
        </div>

        {/* Optional note */}
        <div className="mb-4">
          <label htmlFor="note" className="block mb-1 text-sm font-medium">
            Note (optional)
          </label>
          <input
            id="note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Balance display + save button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">
              Balance (
              {accounts.find((acc) => acc.id === selectedAccount)?.name}):
            </p>

            <p
              className={`text-3xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"
                }`}
            >
              ${balance.toFixed(2)}
            </p>
          </div>

          <button
            onClick={handleSaveTransaction}
            disabled={isSaveDisabled}
            className={`w-full sm:w-auto px-5 py-3 rounded-md font-semibold text-white transition-transform duration-200 transform hover:scale-[1.03] ${isSaveDisabled
              ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500"
              : "bg-indigo-600 hover:bg-indigo-700"
              }`}
          >
            Save Transaction
          </button>
        </div>
      </div>

      {/* ---------- SUMMARY SECTION ---------- */}
      <section className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 ring-1 ring-gray-200 dark:ring-gray-700">
        <h2 className="text-2xl font-semibold mb-6 border-b pb-2">
          📊 Summary
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {/* Total spent */}
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-400">
            <p className="text-sm font-medium text-yellow-600">Spent</p>
            <p className="text-xl font-bold">${totals.spent.toFixed(2)}</p>
          </div>

          {/* Total saved */}
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-400">
            <p className="text-sm font-medium text-green-600">Saved</p>
            <p className="text-xl font-bold">${totals.saved.toFixed(2)}</p>
          </div>

          {/* Total wants */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-400">
            <p className="text-sm font-medium text-blue-600">Wants</p>
            <p className="text-xl font-bold">${totals.wants.toFixed(2)}</p>
          </div>
        </div>
      </section>

      {/* ---------- TRANSACTION HISTORY ---------- */}
      <section className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 ring-1 ring-gray-200 dark:ring-gray-700">
        <h2 className="text-2xl font-semibold mb-6 border-b pb-2">
          📜 Transaction History
        </h2>

        {transactions.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No transactions yet.
          </p>
        ) : (
          <ul className="space-y-4">
            {transactions.map((tx) => (
              <li
                key={tx.id}
                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm"
              >
                <div className="flex justify-between items-center mb-2">
                  {/* Timestamp */}
                  <time className="text-xs text-gray-600 dark:text-gray-300">
                    {tx.timestamp}
                  </time>

                  {/* Balance after this transaction */}
                  <p className="text-sm font-semibold text-green-600">
                    Balance: ${tx.balance.toFixed(2)}
                  </p>
                </div>

                {/* Transaction details */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span>Deposit: ${tx.deposit.toFixed(2)}</span>
                  <span>Spent: ${tx.spent.toFixed(2)}</span>
                  <span>Saved: ${tx.saved.toFixed(2)}</span>
                  <span>Wants: ${tx.wants.toFixed(2)}</span>
                </div>

                {/* Optional note */}
                {tx.note && (
                  <p className="mt-2 italic text-gray-700 dark:text-gray-300">
                    Note: {tx.note}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
