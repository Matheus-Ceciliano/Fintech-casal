"use client";

import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { addGoal } from "@/app/actions";
import { NumericFormat } from "react-number-format";

const EMOJI_OPTIONS = ["💍", "✈️", "🚗", "🏠", "📚", "🛡️", "💊", "💻", "👶", "🐾", "🎉", "🎁", "🔨", "💼", "🐷"];

function inferGoalEmoji(title: string) {
  const normalized = title.toLowerCase();
  if (/(casamento|noivado|aliança|alianca)/.test(normalized)) return "💍";
  if (/(viagem|férias|ferias|trip|voo)/.test(normalized)) return "✈️";
  if (/(carro|veículo|veiculo|moto)/.test(normalized)) return "🚗";
  if (/(casa|apartamento|imóvel|imovel|moradia)/.test(normalized)) return "🏠";
  if (/(educação|educacao|curso|faculdade|escola)/.test(normalized)) return "📚";
  if (/(emergência|emergencia|reserva|segurança|seguranca)/.test(normalized)) return "🛡️";
  if (/(saúde|saude|médico|medico|hospital)/.test(normalized)) return "💊";
  if (/(tecnologia|celular|computador|eletrônico|eletronico)/.test(normalized)) return "💻";
  if (/(bebê|bebe|filho|criança|crianca)/.test(normalized)) return "👶";
  if (/(pet|cachorro|gato|animal)/.test(normalized)) return "🐾";
  if (/(festa|aniversário|aniversario|celebração|celebracao)/.test(normalized)) return "🎉";
  if (/(presente|gift|mimo)/.test(normalized)) return "🎁";
  if (/(reforma|construção|construcao)/.test(normalized)) return "🔨";
  if (/(negócio|negocio|empresa|investimento)/.test(normalized)) return "💼";
  return "🐷";
}

export function NewGoalModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [targetAmount, setTargetAmount] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("🐷");
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [manualEmoji, setManualEmoji] = useState(false);

  const reset = () => {
    setTargetAmount("");
    setSelectedEmoji("🐷");
    setIsEmojiPickerOpen(false);
    setManualEmoji(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      formData.set("emoji", selectedEmoji);
      await addGoal(formData);
      setIsOpen(false);
      reset();
    } catch (error) {
      console.error(error);
      alert("Erro ao adicionar meta.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="btn-primary" style={{ fontSize: 14 }}>
        <Plus size={16} />
        Novo Cofrinho
      </button>

      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
        >
          <div
            className="sheet-enter"
            style={{
              width: "100%",
              maxWidth: 480,
              background: "var(--bg-card)",
              borderRadius: "24px 24px 0 0",
              padding: 28,
              boxShadow: "0 -8px 48px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                🐷 Novo Cofrinho
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  Nome do Cofrinho
                  <span style={{ fontSize: 18, lineHeight: 1 }}>{selectedEmoji}</span>
                  <button
                    type="button"
                    onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                    style={{ border: "none", background: "transparent", color: "var(--brand-primary)", fontSize: 11, fontWeight: 700, cursor: "pointer", padding: 0 }}
                  >
                    trocar
                  </button>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="Ex: Viagem para Paris"
                  className="input-field"
                  onChange={(e) => {
                    if (!manualEmoji) setSelectedEmoji(inferGoalEmoji(e.target.value));
                  }}
                />
                <input type="hidden" name="emoji" value={selectedEmoji} />
                {isEmojiPickerOpen && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setSelectedEmoji(emoji);
                          setManualEmoji(true);
                          setIsEmojiPickerOpen(false);
                        }}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          border: emoji === selectedEmoji ? "1.5px solid var(--brand-primary)" : "1px solid var(--border-color)",
                          background: emoji === selectedEmoji ? "var(--brand-active-bg)" : "var(--bg-secondary)",
                          cursor: "pointer",
                          fontSize: 18,
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                  Valor Alvo (R$)
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
                  onValueChange={(values) => setTargetAmount(values.value)}
                  className="input-field"
                  style={{ fontSize: 18, fontWeight: 700 }}
                />
                <input type="hidden" name="target_amount" value={targetAmount} />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                  Data Limite (Opcional)
                </label>
                <input type="date" name="deadline" className="input-field" />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", padding: "14px", fontSize: 15, marginTop: 4 }}
              >
                {isLoading ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : "Criar Cofrinho"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
