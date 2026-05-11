"use client";

import { useState } from "react";
import { Copy, Check, Users } from "lucide-react";

export function InvitePartnerCard({ inviteCode }: { inviteCode: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-zinc-900 border border-indigo-500/30 rounded-xl p-3 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center space-x-3 w-full md:w-auto">
        <div className="w-10 h-10 bg-indigo-600/20 text-indigo-400 rounded-full flex items-center justify-center flex-shrink-0">
          <Users size={20} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Convidar Parceiro(a)</h3>
          <p className="text-xs text-zinc-400">Seu grupo precisa de mais uma pessoa.</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2 bg-zinc-950 border border-zinc-800 p-1.5 rounded-lg w-full md:w-auto">
        <span className="px-3 text-lg font-bold tracking-widest text-indigo-400 select-all">{inviteCode}</span>
        <button 
          onClick={handleCopy}
          className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md transition-colors flex items-center justify-center"
        >
          {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  );
}
