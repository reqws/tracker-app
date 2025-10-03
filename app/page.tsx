"use client";

import { useEffect, useState } from "react";

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

type Account = {
  id: string;
  name: string;
};

export default function Home() {
  const [accounts, setAccounts] = useState<Account[]>([
    { id: "checking", name: "Checking" },
    { id: "savings", name: "Savings" },
    { id: "credit", name: "Credit Card" },
  ]);
  const [selectedAccount, setSelectedAccount] = useState(accounts[0].id);

  const [editAccountName, setEditAccountName] = useState(
    accounts.find((acc) => acc.id === selectedAccount)?.name || ""
  );
  const [newAccountName, setNewAccountName] = useState("");

  const [deposit, setDeposit] = useState(0);
  const [spent, setSpent] = useState(0);
  const [saved, setSaved] = useState(0);
  const [wants, setWants] = useState(0);
  const [note, setNote] = useState("");

  const [allTransactions, setAllTransactions] = useState<
    Record<string, Transaction[]>
  >({});
  const [currentBalance, setCurrentBalance] = useState<Record<string, number>>(
    {}
  );

  useEffect(() => {
    const acc = accounts.find((acc) => acc.id === selectedAccount);
    setEditAccountName(acc ? acc.name : "");
  }, [selectedAccount, accounts]);

  useEffect(() => {
    const savedData = localStorage.getItem("money-tracker-history");
    if (savedData) {
      const parsed = JSON.parse(savedData) as Record<string, Transaction[]>;
      setAllTransactions(parsed);

      const balances: Record<string, number> = {};
      for (const accountId in parsed) {
        const txs = parsed[accountId];
        balances[accountId] = txs.length > 0 ? txs[0].balance : 0;
      }
      setCurrentBalance(balances);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "money-tracker-history",
      JSON.stringify(allTransactions)
    );
  }, [allTransactions]);

  // Calculate the live balance including input values
  const balance =
    (currentBalance[selectedAccount] || 0) +
    deposit -
    spent -
    saved -
    wants;

  // Disable spent, saved, and wants inputs based on saved balance after last transaction
  const disableSpentSavedWants = (currentBalance[selectedAccount] || 0) <= 0;

  const handleSaveTransaction = () => {
    if (balance < 0) {
      alert(
        "Transaction would result in negative balance. Please adjust amounts."
      );
      return; // Prevent saving
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

    setAllTransactions({
      ...allTransactions,
      [selectedAccount]: [
        newTransaction,
        ...(allTransactions[selectedAccount] || []),
      ],
    });

    setCurrentBalance({
      ...currentBalance,
      [selectedAccount]: balance,
    });

    setDeposit(0);
    setSpent(0);
    setSaved(0);
    setWants(0);
    setNote("");
  };

  const transactions = allTransactions[selectedAccount] || [];
  const totals = transactions.reduce(
    (acc, t) => {
      acc.spent += t.spent;
      acc.saved += t.saved;
      acc.wants += t.wants;
      return acc;
    },
    { spent: 0, saved: 0, wants: 0 }
  );

  const handleAccountNameChange = (accountId: string, newName: string) => {
    if (!newName.trim()) return;
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId ? { ...acc, name: newName.trim() } : acc
      )
    );
  };

  const handleSaveAccountName = () => {
    const trimmed = editAccountName.trim();
    if (!trimmed) return;
    handleAccountNameChange(selectedAccount, trimmed);
  };

  const handleAddAccount = () => {
    const trimmed = newAccountName.trim();
    if (!trimmed) return;

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

  // 🗑️ Delete account
  const handleDeleteAccount = () => {
    if (accounts.length === 1) {
      alert("You must keep at least one account.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this account?")) {
      return;
    }

    setAccounts((prev) => prev.filter((acc) => acc.id !== selectedAccount));

    const { [selectedAccount]: _, ...restTransactions } = allTransactions;
    setAllTransactions(restTransactions);

    const { [selectedAccount]: __, ...restBalance } = currentBalance;
    setCurrentBalance(restBalance);

    const nextAccount =
      accounts.find((acc) => acc.id !== selectedAccount)?.id || "";
    setSelectedAccount(nextAccount);
  };

  const isSaveDisabled =
    (deposit === 0 && spent === 0 && saved === 0 && wants === 0) || balance < 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans px-3 sm:px-6 lg:px-8 flex flex-col items-center">
      <h1 className="text-2xl sm:text-3xl font-extrabold mb-6 tracking-tight text-center">
        💰 Simple Money Tracker
      </h1>

      {/* Account Controls */}
      <div className="flex flex-col sm:flex-wrap sm:flex-row gap-3 w-full max-w-4xl items-center justify-center mb-6 mx-auto">
        <select
          value={selectedAccount}
          onChange={(e) => {
            setSelectedAccount(e.target.value);
            // update editAccountName to match selected account name
            const selected = accounts.find((acc) => acc.id === e.target.value);
            setEditAccountName(selected ? selected.name : "");
          }}
          className="w-full sm:w-auto px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name}
            </option>
          ))}
        </select>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <input
            type="text"
            value={editAccountName}
            onChange={(e) => setEditAccountName(e.target.value)}
            placeholder="Edit account name"
            className="w-full sm:w-44 px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => {
              const trimmedName = editAccountName.trim();

              // Prevent renaming to an existing account name
              const nameExists = accounts.some(
                (acc) =>
                  acc.name.toLowerCase() === trimmedName.toLowerCase() &&
                  acc.id !== selectedAccount
              );
              if (nameExists) {
                alert("An account with this name already exists.");
                return;
              }

              // Proceed with renaming
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
            className={`px-4 py-2 rounded-md font-semibold transition-colors duration-200 ${editAccountName.trim() === "" ||
                editAccountName ===
                (accounts.find((acc) => acc.id === selectedAccount)?.name || "")
                ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500"
                : "bg-yellow-500 hover:bg-yellow-600 text-white"
              }`}
          >
            Save
          </button>
          <button
            onClick={() => {
              if (accounts.length === 1) {
                alert("You cannot delete the last account.");
                return;
              }
              setAccounts((prev) =>
                prev.filter((acc) => acc.id !== selectedAccount)
              );
              // Reset selection to first account or empty
              const remainingAccounts = accounts.filter(
                (acc) => acc.id !== selectedAccount
              );
              setSelectedAccount(
                remainingAccounts.length > 0 ? remainingAccounts[0].id : ""
              );
              setEditAccountName("");
            }}
            disabled={accounts.length === 1} // disable button if only one account
            className={`px-4 py-2 rounded-md font-semibold transition-colors duration-200 ${accounts.length === 1
                ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500"
                : "bg-red-500 hover:bg-red-600 text-white"
              }`}
          >
            Delete
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <input
            type="text"
            value={newAccountName}
            onChange={(e) => setNewAccountName(e.target.value)}
            placeholder="New account name"
            className="w-full sm:w-44 px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => {
              const trimmedName = newAccountName.trim();

              // Prevent duplicate new account names
              const nameExists = accounts.some(
                (acc) => acc.name.toLowerCase() === trimmedName.toLowerCase()
              );
              if (nameExists) {
                alert("An account with this name already exists.");
                return;
              }

              // Add new account
              const newAccount = { id: Date.now().toString(), name: trimmedName };
              setAccounts([...accounts, newAccount]);

              // Automatically select the new account
              setSelectedAccount(newAccount.id);

              // Clear new account name input
              setNewAccountName("");

              // Set editAccountName to new account's name for editing input
              setEditAccountName(trimmedName);
            }}
            disabled={newAccountName.trim() === ""}
            className={`px-4 py-2 rounded-md font-semibold transition-colors duration-200 ${newAccountName.trim() === ""
                ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500"
                : "bg-green-500 hover:bg-green-600 text-white"
              }`}
          >
            Add
          </button>
        </div>
      </div>

      {/* Transaction Inputs */}
      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {[
            { id: "deposit", label: "Deposit", value: deposit, setter: setDeposit, disabled: false },
            { id: "spent", label: "Spent", value: spent, setter: setSpent, disabled: disableSpentSavedWants },
            { id: "saved", label: "Saved", value: saved, setter: setSaved, disabled: disableSpentSavedWants },
            { id: "wants", label: "Wants", value: wants, setter: setWants, disabled: disableSpentSavedWants },
          ].map(({ id, label, value, setter, disabled }) => (
            <div key={id} className="flex flex-col">
              <label htmlFor={id} className="mb-1 text-sm sm:text-base font-medium">
                {label}
              </label>
              <input
                id={id}
                type="number"
                min={0}
                value={value}
                onChange={(e) => setter(Number(e.target.value))}
                disabled={disabled}
                className={`px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 ${disabled ? "opacity-50 cursor-not-allowed" : ""
                  }`}
              />
            </div>
          ))}
        </div>

        <div className="mb-4">
          <label htmlFor="note" className="block mb-1 text-sm sm:text-base font-medium">
            Note (optional)
          </label>
          <input
            id="note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm sm:text-lg font-semibold">
              Balance ({accounts.find((acc) => acc.id === selectedAccount)?.name}):
            </p>
            <p
              className={`text-2xl sm:text-3xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"
                }`}
            >
              ${balance.toFixed(2)}
            </p>
          </div>
          <button
            onClick={handleSaveTransaction}
            disabled={isSaveDisabled}
            className={`w-full sm:w-auto px-5 py-3 rounded-md font-semibold text-white transition-colors duration-200 ${isSaveDisabled
              ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500"
              : "bg-indigo-600 hover:bg-indigo-700"
              }`}
          >
            Save Transaction
          </button>
        </div>
      </div>

      {/* Summary */}
      <section className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-center sm:text-left">
          📊 Summary ({accounts.find((acc) => acc.id === selectedAccount)?.name})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
          <div>
            <p className="text-sm sm:text-base font-medium text-yellow-600">Spent</p>
            <p className="text-xl sm:text-2xl font-semibold">${totals.spent.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm sm:text-base font-medium text-green-600">Saved</p>
            <p className="text-xl sm:text-2xl font-semibold">${totals.saved.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm sm:text-base font-medium text-blue-600">Wants</p>
            <p className="text-xl sm:text-2xl font-semibold">${totals.wants.toFixed(2)}</p>
          </div>
        </div>
      </section>

      {/* History */}
      <section className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-center sm:text-left">
          📜 Transaction History
        </h2>
        {transactions.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">No transactions yet.</p>
        ) : (
          <ul className="space-y-4">
            {transactions.map((tx) => (
              <li
                key={tx.id}
                className="p-4 bg-gray-100 dark:bg-gray-700 rounded-md shadow-sm"
              >
                <div className="flex justify-between items-center mb-2">
                  <time className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                    {tx.timestamp}
                  </time>
                  <p className="text-sm sm:text-base font-semibold text-green-600">
                    Balance: ${tx.balance.toFixed(2)}
                  </p>

                </div>
                <p className="text-sm sm:text-base">
                  Deposit: ${tx.deposit.toFixed(2)} <br /> Spent: ${tx.spent.toFixed(2)} <br /> Saved: ${tx.saved.toFixed(2)} <br /> Wants: ${tx.wants.toFixed(2)}
                </p>
                {tx.note && <p className="mt-1 text-sm italic text-gray-700 dark:text-gray-300">Note: {tx.note}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
