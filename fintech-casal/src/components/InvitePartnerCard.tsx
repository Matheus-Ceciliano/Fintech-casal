"use client";

import { useState } from "react";
import { Copy, Check, Users } from "lucide-react";

interface Props {
  inviteCode: string;
}

export function InvitePartnerCard({ inviteCode }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(200,80,192,0.08), rgba(65,88,208,0.08))',
      border: '1.5px solid rgba(200,80,192,0.2)',
      borderRadius: 20,
      padding: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'rgba(200,80,192,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Users size={20} color="#C850C0" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Convide seu(sua) parceiro(a)!</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Compartilhe o código abaixo</div>
        </div>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'var(--bg-secondary)', borderRadius: 14,
        border: '1px solid var(--border-color)', padding: '10px 14px',
      }}>
        <span style={{
          flex: 1, fontSize: 20, fontWeight: 800, letterSpacing: '0.15em',
          color: '#C850C0', fontFamily: 'monospace',
        }}>
          {inviteCode}
        </span>
        <button
          onClick={handleCopy}
          style={{
            background: copied ? 'rgba(52,211,153,0.12)' : 'rgba(200,80,192,0.12)',
            border: 'none', borderRadius: 10, padding: '8px 12px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            color: copied ? '#34d399' : '#C850C0', fontWeight: 700, fontSize: 13,
            transition: 'all 0.2s',
          }}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '8px 0 0', textAlign: 'center' }}>
        O código pode ser usado somente uma vez
      </p>
    </div>
  );
}
