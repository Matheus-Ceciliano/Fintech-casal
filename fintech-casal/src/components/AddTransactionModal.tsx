"use client";

import { useState, useRef } from "react";
import { Plus, X, Loader2, Paperclip, ChevronDown } from "lucide-react";
import { NumericFormat } from "react-number-format";
import { addTransaction } from "@/app/actions";

const CATEGORIES = [
  { value: 'Alimentação', label: '🍔 Alimentação' },
  { value: 'Mercado', label: '🛒 Mercado' },
  { value: 'Moradia', label: '🏠 Moradia' },
  { value: 'Transporte', label: '⛽ Transporte' },
  { value: 'Saúde', label: '💊 Saúde' },
  { value: 'Lazer', label: '🍿 Lazer' },
  { value: 'Viagem', label: '✈️ Viagem' },
  { value: 'Salário', label: '💰 Salário' },
  { value: 'Investimento', label: '📈 Investimento' },
  { value: 'Reserva', label: '🐷 Reserva' },
  { value: 'Dívida', label: '📉 Dívida' },
  { value: 'Empréstimo', label: '🏦 Empréstimo' },
  { value: 'Outros', label: '📦 Outros' },
];

export function AddTransactionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [txType, setTxType] = useState<"expense" | "income">("expense");
  const [responsible, setResponsible] = useState<"me" | "partner" | "both">("both");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.set("responsible", responsible);
      // Map responsible to is_shared
      formData.set("is_shared", responsible === "both" ? "true" : "false");
      await addTransaction(formData);
      setIsOpen(false);
      setAmount("");
      setTxType("expense");
      setResponsible("both");
    } catch {
      alert("Erro ao adicionar transação. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // OCR: simulate receipt parsing
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrLoading(true);
    setOcrError("");
    try {
      // Simulate OCR delay — in production, call an OCR API here
      await new Promise(r => setTimeout(r, 1800));
      // Mock extracted data
      const mockData = { amount: "245.90", description: "Supermercado Extra", date: new Date().toISOString().split('T')[0] };
      setAmount(mockData.amount);
      if (formRef.current) {
        const descInput = formRef.current.querySelector<HTMLInputElement>('[name="description"]');
        if (descInput) descInput.value = mockData.description;
        const dateInput = formRef.current.querySelector<HTMLInputElement>('[name="date"]');
        if (dateInput) dateInput.value = mockData.date;
      }
    } catch {
      setOcrError("Não foi possível ler o comprovante. Preencha manualmente.");
    } finally {
      setOcrLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--bg-secondary)',
    border: '1.5px solid var(--border-color)',
    borderRadius: 14,
    padding: '14px 16px',
    color: 'var(--text-primary)',
    fontFamily: 'inherit',
    fontSize: 15,
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-muted)',
    marginBottom: 6,
    display: 'block',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  return (
    <>
      {/* FAB */}
      <button onClick={() => setIsOpen(true)} className="fab" aria-label="Adicionar transação">
        <Plus size={24} />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="backdrop-enter"
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)', zIndex: 49,
          }}
        />
      )}

      {/* Bottom Sheet */}
      {isOpen && (
        <div
          className="sheet-enter"
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: 'var(--bg-card)',
            borderRadius: '24px 24px 0 0',
            padding: '0 0 max(env(safe-area-inset-bottom, 16px), 16px)',
            zIndex: 50,
            maxHeight: '92dvh',
            overflowY: 'auto',
          }}
        >
          {/* Handle */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-color)' }} />
          </div>

          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 20px 0',
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Nova Transação
            </h2>
            <button onClick={() => setIsOpen(false)} style={{
              background: 'var(--border-subtle)', border: 'none', borderRadius: '50%',
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-muted)',
            }}>
              <X size={16} />
            </button>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} style={{ padding: '16px 20px' }}>

            {/* OCR Upload Button */}
            <label style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px',
              background: 'linear-gradient(135deg, rgba(255,107,107,0.08), rgba(200,80,192,0.08), rgba(65,88,208,0.08))',
              border: '1.5px dashed var(--violet-400)',
              borderRadius: 14,
              cursor: 'pointer',
              marginBottom: 18,
            }}>
              <input type="file" accept="image/*,application/pdf" onChange={handleReceiptUpload} style={{ display: 'none' }} />
              {ocrLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" style={{ color: '#C850C0' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#C850C0' }}>Analisando comprovante...</span>
                </>
              ) : (
                <>
                  <Paperclip size={18} style={{ color: '#C850C0' }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#C850C0' }}>📎 Importar Comprovante</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>IA extrai valor, descrição e data automaticamente</div>
                  </div>
                </>
              )}
            </label>
            {ocrError && <p style={{ fontSize: 12, color: '#fb7185', marginBottom: 12, marginTop: -10 }}>{ocrError}</p>}

            {/* Type toggle */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Tipo</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { val: 'expense', label: '↓ Despesa', activeColor: '#fb7185', activeBg: 'rgba(251,113,133,0.12)' },
                  { val: 'income', label: '↑ Receita', activeColor: '#34d399', activeBg: 'rgba(52,211,153,0.12)' },
                ].map(opt => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setTxType(opt.val as "expense" | "income")}
                    style={{
                      flex: 1,
                      padding: '12px 8px',
                      borderRadius: 14,
                      border: `1.5px solid ${txType === opt.val ? opt.activeColor : 'var(--border-color)'}`,
                      background: txType === opt.val ? opt.activeBg : 'var(--bg-secondary)',
                      color: txType === opt.val ? opt.activeColor : 'var(--text-muted)',
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <input type="hidden" name="type" value={txType} />
            </div>

            {/* Amount */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Valor</label>
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
                onValueChange={v => setAmount(v.value)}
                style={{ ...inputStyle, fontSize: 24, fontWeight: 800 }}
              />
              <input type="hidden" name="amount" value={amount} />
            </div>

            {/* Description */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Descrição</label>
              <input type="text" name="description" required placeholder="Ex: Almoço no restaurante"
                style={inputStyle} />
            </div>

            {/* Category + Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Categoria</label>
                <div style={{ position: 'relative' }}>
                  <select name="category" required style={{ ...inputStyle, appearance: 'none', paddingRight: 36, cursor: 'pointer' }}>
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Data</label>
                <input
                  type="date"
                  name="date"
                  required
                  defaultValue={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Responsible */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Responsável</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { val: 'me', label: '👤 Eu' },
                  { val: 'partner', label: '👥 Parceiro(a)' },
                  { val: 'both', label: '💑 Ambos' },
                ].map(opt => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setResponsible(opt.val as "me" | "partner" | "both")}
                    style={{
                      flex: 1,
                      padding: '10px 4px',
                      borderRadius: 12,
                      border: `1.5px solid ${responsible === opt.val ? '#a78bfa' : 'var(--border-color)'}`,
                      background: responsible === opt.val ? 'rgba(167,139,250,0.12)' : 'var(--bg-secondary)',
                      color: responsible === opt.val ? '#a78bfa' : 'var(--text-muted)',
                      fontWeight: 700,
                      fontSize: 11,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-gradient"
              style={{ width: '100%', padding: '16px', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : '✓ Adicionar Transação'}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
