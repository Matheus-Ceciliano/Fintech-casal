"use client";

import { useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";
import { addDebt } from "@/app/actions";

export function AddDebtModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      await addDebt(formData);
      setIsOpen(false);
      setAmount("");
      toast.success("Dívida adicionada com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao adicionar dívida. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button type="button" className="btn-primary" onClick={() => setIsOpen(true)}>
        <Plus size={16} />
        Nova Dívida
      </button>

      {isOpen && (
        <div
          className="backdrop-enter"
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            className="sheet-enter"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 420,
              background: "var(--bg-card)",
              borderRadius: 20,
              padding: 24,
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              border: "1px solid var(--border-color)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>
                Nova Dívida
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{ background: "none", border: 0, color: "var(--text-muted)", cursor: "pointer", padding: 4 }}
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                  Descrição
                </label>
                <input
                  name="title"
                  required
                  placeholder="Ex: Parcela do cartão"
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                  Valor
                </label>
                <NumericFormat
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="R$ "
                  decimalScale={2}
                  fixedDecimalScale
                  allowNegative={false}
                  inputMode="numeric"
                  placeholder="R$ 0,00"
                  required
                  value={amount}
                  onValueChange={(values) => setAmount(values.value)}
                  className="input-field"
                  style={{ fontSize: 20, fontWeight: 800 }}
                />
                <input type="hidden" name="amount" value={amount} />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                  Vencimento
                </label>
                <input
                  type="date"
                  name="due_date"
                  required
                  className="input-field"
                  defaultValue={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0]}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", padding: "13px", marginTop: 4 }}
              >
                {isLoading ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : "Adicionar Dívida"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
