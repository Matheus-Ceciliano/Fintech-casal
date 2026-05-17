"use client";

import { useState } from "react";
import { Plus, Minus, X, Loader2, Calendar, MoreVertical } from "lucide-react";
import { completeGoal, deleteGoal, depositToGoal, updateGoal, withdrawFromGoal } from "@/app/actions";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";

interface Goal {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  emoji?: string | null;
  deadline: string | null;
  completed_at?: string | null;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function inferGoalEmoji(title: string) {
  const normalized = title.toLowerCase();
  if (/(casamento|noivado)/.test(normalized)) return "💍";
  if (/(viagem|férias|ferias)/.test(normalized)) return "✈️";
  if (/(carro|moto)/.test(normalized)) return "🚗";
  if (/(casa|apartamento)/.test(normalized)) return "🏠";
  if (/(educação|educacao|curso)/.test(normalized)) return "📚";
  if (/(emergência|emergencia|reserva)/.test(normalized)) return "🛡️";
  if (/saúde|saude/.test(normalized)) return "💊";
  if (/(tecnologia|celular)/.test(normalized)) return "💻";
  if (/(bebê|bebe|filho)/.test(normalized)) return "👶";
  if (/(pet|animal)/.test(normalized)) return "🐾";
  if (/festa/.test(normalized)) return "🎉";
  if (/presente/.test(normalized)) return "🎁";
  if (/reforma/.test(normalized)) return "🔨";
  if (/(negócio|negocio|investimento)/.test(normalized)) return "💼";
  return "🐷";
}

const EMOJI_OPTIONS = ["💍", "✈️", "🚗", "🏠", "📚", "🛡️", "💊", "💻", "👶", "🐾", "🎉", "🎁", "🔨", "💼", "🐷"];

export function GoalCard({ goal }: { goal: Goal }) {
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [depositDeduct, setDepositDeduct] = useState(false);
  const [withdrawAddToBalance, setWithdrawAddToBalance] = useState(true);
  const [withdrawError, setWithdrawError] = useState("");
  const [editTitle, setEditTitle] = useState(goal.title);
  const [editEmoji, setEditEmoji] = useState(goal.emoji?.trim() || inferGoalEmoji(goal.title));
  const [editTargetAmount, setEditTargetAmount] = useState(String(goal.target_amount));
  const [editDeadline, setEditDeadline] = useState(goal.deadline || "");
  const [returnBalanceBeforeDelete, setReturnBalanceBeforeDelete] = useState(false);

  const progressPercent = goal.target_amount > 0
    ? Math.min((Number(goal.current_amount) / Number(goal.target_amount)) * 100, 100)
    : 0;
  const isComplete = progressPercent >= 100;
  const displayEmoji = goal.emoji?.trim() || inferGoalEmoji(goal.title);
  const isGoalCompleted = Boolean(goal.completed_at);

  const handleDeposit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.append("goal_id", goal.id);
      await depositToGoal(formData);
      setIsDepositOpen(false);
      toast.success("Depósito realizado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Algo deu errado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.append("goal_id", goal.id);
      formData.set("emoji", editEmoji);
      const result = await updateGoal(formData);
      if (!result.success) {
        toast.error(result.error || "Erro ao editar cofrinho. Tente novamente.");
        return;
      }
      setIsEditOpen(false);
      toast.success("Cofrinho atualizado!");
    } catch (error) {
      console.error("Erro ao editar cofrinho:", error);
      toast.error("Erro ao editar cofrinho. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("goal_id", goal.id);
      await completeGoal(formData);
      setIsCompleteOpen(false);
      toast.success("Cofrinho atualizado!");
    } catch (error) {
      console.error(error);
      toast.error("Algo deu errado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("goal_id", goal.id);
      if (returnBalanceBeforeDelete) formData.append("return_balance", "true");
      await deleteGoal(formData);
      setIsDeleteOpen(false);
      toast.success("Cofrinho excluído.");
    } catch (error) {
      console.error(error);
      toast.error("Algo deu errado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (!Number.isFinite(amount) || amount > Number(goal.current_amount)) {
      setWithdrawError(`Valor maior que o saldo disponível (${formatCurrency(Number(goal.current_amount))})`);
      return;
    }
    setWithdrawError("");
    setIsLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.append("goal_id", goal.id);
      await withdrawFromGoal(formData);
      setIsWithdrawOpen(false);
      toast.success("Resgate realizado!");
    } catch (error: unknown) {
      const err = error as Error;
      console.error(error);
      toast.error(err.message || "Algo deu errado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTimeLeft = (deadline: string | null) => {
    if (!deadline) return null;
    const end = new Date(deadline);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    if (diffTime <= 0) return "Encerrado";
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 30) {
      const months = Math.floor(diffDays / 30);
      return `Faltam ${months} ${months === 1 ? "mês" : "meses"}`;
    }
    return `Faltam ${diffDays} dias`;
  };

  const timeLeft = calculateTimeLeft(goal.deadline);

  return (
    <div
      className="card"
      style={{
        padding: 24,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        borderTop: isComplete || isGoalCompleted ? "3px solid var(--income-color)" : undefined,
      }}
    >
      {/* Completion glow */}
      {isComplete && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: "linear-gradient(90deg, #1B7A4B, #34d399)",
          }}
        />
      )}

      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: "var(--brand-active-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
            }}
          >
            {displayEmoji}
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              {goal.title}
            </h3>
            {timeLeft && (
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "4px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
                <Calendar size={11} />
                {timeLeft}
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8, position: "relative" }}>
          <button
            onClick={() => setIsWithdrawOpen(true)}
            title="Resgatar"
            disabled={isGoalCompleted}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "1px solid var(--border-color)",
              background: "var(--bg-primary)",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: isGoalCompleted ? "not-allowed" : "pointer",
              transition: "all 0.15s",
              opacity: isGoalCompleted ? 0.4 : 1,
            }}
          >
            <Minus size={15} />
          </button>
          <button
            onClick={() => setIsDepositOpen(true)}
            title="Depositar"
            disabled={isGoalCompleted}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "1px solid var(--income-color)",
              background: "var(--income-bg)",
              color: "var(--income-color)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: isGoalCompleted ? "not-allowed" : "pointer",
              transition: "all 0.15s",
              opacity: isGoalCompleted ? 0.4 : 1,
            }}
          >
            <Plus size={15} />
          </button>
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            title="Opções"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "1px solid var(--border-color)",
              background: "var(--bg-primary)",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <MoreVertical size={15} />
          </button>
          {isMenuOpen && (
            <>
              <div onClick={() => setIsMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 19 }} />
              <div
                style={{
                  position: "absolute",
                  top: 38,
                  right: 0,
                  zIndex: 20,
                  minWidth: 150,
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-color)",
                  borderRadius: 12,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                  padding: 6,
                }}
              >
                {[
                  { label: "Editar", action: () => setIsEditOpen(true), color: "var(--text-primary)" },
                  { label: "Concluir Meta", action: () => setIsCompleteOpen(true), color: "var(--text-primary)" },
                  { label: "Excluir", action: () => setIsDeleteOpen(true), color: "#DC2626" },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      item.action();
                    }}
                    style={{
                      width: "100%",
                      border: 0,
                      background: "transparent",
                      color: item.color,
                      cursor: "pointer",
                      padding: "9px 10px",
                      textAlign: "left",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: "inherit",
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Progress section */}
      <div style={{ marginTop: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: isComplete || isGoalCompleted ? "var(--income-color)" : "var(--savings-color)" }}>
            {formatCurrency(Number(goal.current_amount))}
          </span>
          <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500, alignSelf: "flex-end" }}>
            de {formatCurrency(Number(goal.target_amount))}
          </span>
        </div>

        <div className="progress-track" style={{ height: 10, marginBottom: 6 }}>
          <div
            className="progress-fill"
            style={{
              width: `${progressPercent}%`,
              background: isComplete || isGoalCompleted
                ? "linear-gradient(90deg, #1B7A4B, #34d399)"
                : "var(--brand-gradient)",
            }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: isComplete || isGoalCompleted ? "var(--income-color)" : "var(--text-muted)" }}>
            {isGoalCompleted ? "✓ Concluído" : isComplete ? "✅ Meta alcançada!" : `${progressPercent.toFixed(1)}% concluído`}
          </span>
          {(isComplete || isGoalCompleted) && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                background: "var(--income-bg)",
                color: "var(--income-color)",
                borderRadius: 100,
                padding: "2px 10px",
              }}
            >
              {isGoalCompleted ? "✓ Concluído" : "Completo"}
            </span>
          )}
        </div>
      </div>

      {/* ── Deposit overlay ── */}
      {isDepositOpen && (
        <>
        <div onClick={() => setIsDepositOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 50 }} />
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 51,
            width: 420,
            maxWidth: "90vw",
            background: "var(--bg-card)",
            borderRadius: 20,
            padding: 28,
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
            <h4 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <span>{displayEmoji}</span>
              Depositar em {goal.title}
            </h4>
            <button
              onClick={() => setIsDepositOpen(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleDeposit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, marginBottom: 2 }}>
              Saldo atual: {formatCurrency(Number(goal.current_amount))}
            </div>
            <input
              type="text"
              name="description"
              placeholder="Ex: Guardei do salário de maio"
              style={{
                width: "100%",
                background: "var(--bg-primary)",
                border: "1.5px solid var(--border-color)",
                borderRadius: 10,
                padding: "10px 12px",
                color: "var(--text-primary)",
                outline: "none",
                fontFamily: "inherit",
                fontSize: 13,
              }}
            />
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
              onValueChange={(values) => setDepositAmount(values.value)}
              style={{
                width: "100%",
                background: "var(--bg-primary)",
                border: "1.5px solid var(--border-color)",
                borderRadius: 10,
                padding: "12px 16px",
                color: "var(--text-primary)",
                fontSize: 28,
                fontWeight: 700,
                textAlign: "center",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <input type="hidden" name="amount" value={depositAmount} />

            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 12, color: "var(--text-secondary)", cursor: "pointer" }}>
              <input
                type="checkbox"
                id={`deduct_${goal.id}`}
                name="deduct_from_balance"
                value="true"
                checked={depositDeduct}
                onChange={(e) => setDepositDeduct(e.target.checked)}
                style={{ marginTop: 2, accentColor: "var(--income-color)" }}
              />
              Subtrair do Saldo Geral (cria despesa de 'Investimento')
            </label>
            {depositDeduct && (
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: -8 }}>
                Uma despesa de 'Investimento' será criada automaticamente
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%",
                background: "var(--brand-gradient)",
                color: "white",
                border: "none",
                borderRadius: 12,
                height: 48,
                padding: "0 12px",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                fontFamily: "inherit",
              }}
            >
              {isLoading ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : "Confirmar Depósito"}
            </button>
          </form>
        </div>
        </>
      )}

      {/* ── Withdraw overlay ── */}
      {isWithdrawOpen && (
        <>
        <div onClick={() => setIsWithdrawOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 50 }} />
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 51,
            width: 420,
            maxWidth: "90vw",
            background: "var(--bg-card)",
            borderRadius: 20,
            padding: 28,
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
            <h4 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <span>{displayEmoji}</span>
              Resgatar de {goal.title}
            </h4>
            <button
              onClick={() => setIsWithdrawOpen(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleWithdraw} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, marginBottom: 2 }}>
              Saldo atual: {formatCurrency(Number(goal.current_amount))}
            </div>
            <input
              type="text"
              name="description"
              placeholder="Ex: Usei para pagar entrada"
              style={{
                width: "100%",
                background: "var(--bg-primary)",
                border: "1.5px solid var(--border-color)",
                borderRadius: 10,
                padding: "10px 12px",
                color: "var(--text-primary)",
                outline: "none",
                fontFamily: "inherit",
                fontSize: 13,
              }}
            />
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
              onValueChange={(values) => {
                setWithdrawAmount(values.value);
                if ((values.floatValue || 0) > Number(goal.current_amount)) {
                  setWithdrawError(`Valor maior que o saldo disponível (${formatCurrency(Number(goal.current_amount))})`);
                } else {
                  setWithdrawError("");
                }
              }}
              style={{
                width: "100%",
                background: "var(--bg-primary)",
                border: "1.5px solid var(--border-color)",
                borderRadius: 10,
                padding: "12px 16px",
                color: "var(--text-primary)",
                fontSize: 28,
                fontWeight: 700,
                textAlign: "center",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <input type="hidden" name="amount" value={withdrawAmount} />
            {withdrawError && (
              <div style={{ fontSize: 11, color: "var(--expense-color)", marginTop: -8 }}>
                {withdrawError}
              </div>
            )}

            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 12, color: "var(--text-secondary)", cursor: "pointer" }}>
              <input
                type="checkbox"
                id={`add_${goal.id}`}
                name="add_to_balance"
                value="true"
                checked={withdrawAddToBalance}
                onChange={(e) => setWithdrawAddToBalance(e.target.checked)}
                style={{ marginTop: 2, accentColor: "var(--income-color)" }}
              />
              Devolver ao Saldo Geral (cria receita no Dashboard)
            </label>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: -8 }}>
              {withdrawAddToBalance
                ? "Uma receita será criada automaticamente no Dashboard"
                : "O valor será removido do cofrinho sem afetar o saldo geral"}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%",
                background: "var(--brand-gradient)",
                color: "white",
                border: "none",
                borderRadius: 12,
                height: 48,
                padding: "0 12px",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                fontFamily: "inherit",
              }}
            >
              {isLoading ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : "Confirmar Resgate"}
            </button>
          </form>
        </div>
        </>
      )}

      {isEditOpen && (
        <div style={{ position:"fixed", inset:0, zIndex:60, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div className="sheet-enter" style={{ width:"100%", maxWidth:480, background:"var(--bg-card)", borderRadius:"24px 24px 0 0", padding:24, boxShadow:"0 -8px 48px rgba(0,0,0,0.2)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
              <h3 style={{ margin:0, fontSize:18, fontWeight:700, color:"var(--text-primary)" }}>Editar Cofrinho</h3>
              <button onClick={() => setIsEditOpen(false)} style={{ background:"none", border:0, color:"var(--text-muted)", cursor:"pointer" }}><X size={20} /></button>
            </div>
            <form onSubmit={handleEdit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <label style={{ fontSize:12, fontWeight:600, color:"var(--text-muted)", display:"flex", gap:8, alignItems:"center" }}>
                Nome do Cofrinho <span style={{ fontSize:18 }}>{editEmoji}</span>
              </label>
              <input
                name="title"
                required
                className="input-field"
                value={editTitle}
                onChange={(e) => {
                  setEditTitle(e.target.value);
                  setEditEmoji(inferGoalEmoji(e.target.value));
                }}
              />
              <input type="hidden" name="emoji" value={editEmoji} />
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {EMOJI_OPTIONS.map((emoji) => (
                  <button key={emoji} type="button" onClick={() => setEditEmoji(emoji)} style={{ width:32, height:32, borderRadius:10, border:emoji===editEmoji?"1.5px solid var(--brand-primary)":"1px solid var(--border-color)", background:emoji===editEmoji?"var(--brand-active-bg)":"var(--bg-secondary)", cursor:"pointer", fontSize:17 }}>
                    {emoji}
                  </button>
                ))}
              </div>
              <label style={{ fontSize:12, fontWeight:600, color:"var(--text-muted)" }}>Valor Alvo (R$)</label>
              <NumericFormat
                name="target_amount_visible"
                thousandSeparator="."
                decimalSeparator=","
                prefix="R$ "
                decimalScale={2}
                fixedDecimalScale
                allowNegative={false}
                inputMode="numeric"
                required
                value={editTargetAmount}
                onValueChange={(values) => setEditTargetAmount(values.value)}
                className="input-field"
                style={{ fontSize:18, fontWeight:700 }}
              />
              <input type="hidden" name="target_amount" value={editTargetAmount} />
              <label style={{ fontSize:12, fontWeight:600, color:"var(--text-muted)" }}>Data Limite (Opcional)</label>
              <input type="date" name="deadline" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} className="input-field" />
              <button type="submit" disabled={isLoading} className="btn-primary" style={{ width:"100%", justifyContent:"center", padding:"13px", marginTop:4 }}>
                {isLoading ? <Loader2 size={18} style={{ animation:"spin 1s linear infinite" }} /> : "Salvar"}
              </button>
            </form>
          </div>
        </div>
      )}

      {isCompleteOpen && (
        <div style={{ position:"fixed", inset:0, zIndex:60, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div className="card" style={{ width:"100%", maxWidth:420, padding:22 }}>
            <h3 style={{ margin:"0 0 8px", fontSize:18, fontWeight:700, color:"var(--text-primary)" }}>Concluir Meta</h3>
            <p style={{ margin:"0 0 18px", fontSize:13, color:"var(--text-muted)" }}>Deseja marcar este cofrinho como concluído? Ele ficará visível no histórico mas não aceitará mais depósitos.</p>
            <div style={{ display:"flex", justifyContent:"flex-end", gap:10 }}>
              <button type="button" className="btn-ghost" onClick={() => setIsCompleteOpen(false)}>Cancelar</button>
              <button type="button" className="btn-primary" disabled={isLoading} onClick={handleComplete}>{isLoading ? "Concluindo..." : "Concluir"}</button>
            </div>
          </div>
        </div>
      )}

      {isDeleteOpen && (
        <div style={{ position:"fixed", inset:0, zIndex:60, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div className="card" style={{ width:"100%", maxWidth:440, padding:22 }}>
            <h3 style={{ margin:"0 0 8px", fontSize:18, fontWeight:700, color:"#DC2626" }}>Excluir Cofrinho</h3>
            <p style={{ margin:"0 0 14px", fontSize:13, color:"#DC2626", fontWeight:600 }}>Tem certeza? Esta ação não pode ser desfeita. O saldo guardado ({formatCurrency(Number(goal.current_amount))}) será perdido.</p>
            {Number(goal.current_amount) > 0 && (
              <label style={{ display:"flex", alignItems:"flex-start", gap:10, fontSize:13, color:"var(--text-secondary)", marginBottom:18, cursor:"pointer" }}>
                <input type="checkbox" checked={returnBalanceBeforeDelete} onChange={(e) => setReturnBalanceBeforeDelete(e.target.checked)} style={{ marginTop:3, accentColor:"var(--income-color)" }} />
                Devolver o saldo ao saldo geral antes de excluir
              </label>
            )}
            <div style={{ display:"flex", justifyContent:"flex-end", gap:10 }}>
              <button type="button" className="btn-ghost" onClick={() => setIsDeleteOpen(false)}>Cancelar</button>
              <button type="button" disabled={isLoading} onClick={handleDelete} style={{ border:0, borderRadius:"var(--radius-pill)", background:"#DC2626", color:"white", fontWeight:700, padding:"10px 18px", cursor:"pointer", fontFamily:"inherit" }}>
                {isLoading ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
