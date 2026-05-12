"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function addTransaction(formData: FormData) {
  const cookieStore = await cookies();
  // @ts-expect-error - auth-helpers expects a sync return
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    throw new Error("Não autenticado");
  }

  // Obter o couple_id do usuário logado
  const { data: profile } = await supabase
    .from("profiles")
    .select("couple_id")
    .eq("id", session.user.id)
    .single();

  if (!profile || !profile.couple_id) {
    throw new Error("Grupo não encontrado");
  }

  const amount = parseFloat(formData.get("amount") as string);
  const type = formData.get("type") as string;
  const category = formData.get("category") as string;
  const description = formData.get("description") as string;
  const date = formData.get("date") as string;
  const is_shared = formData.get("is_shared") === "true";

  const { error } = await supabase.from("transactions").insert({
    couple_id: profile.couple_id,
    user_id: session.user.id,
    amount,
    type,
    category,
    description,
    date,
    is_shared,
  });

  if (error) {
    console.error("Erro ao adicionar transação:", error);
    throw new Error("Erro ao adicionar transação");
  }

  revalidatePath("/");
}

export async function seedDummyData() {
  const cookieStore = await cookies();
  // @ts-expect-error - auth-helpers expects a sync return
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("couple_id")
    .eq("id", session.user.id)
    .single();

  if (!profile || !profile.couple_id) return;

  const dummyTransactions = [
    {
      couple_id: profile.couple_id,
      user_id: session.user.id,
      amount: 450.00,
      type: "expense",
      category: "Mercado",
      description: "Compra do Mês",
      date: new Date().toISOString().split('T')[0],
      is_shared: true,
    },
    {
      couple_id: profile.couple_id,
      user_id: session.user.id,
      amount: 150.00,
      type: "expense",
      category: "Lazer",
      description: "Jantar Sexta",
      date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
      is_shared: true,
    },
    {
      couple_id: profile.couple_id,
      user_id: session.user.id,
      amount: 5000.00,
      type: "income",
      category: "Salário",
      description: "Salário",
      date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
      is_shared: true,
    }
  ];

  await supabase.from("transactions").insert(dummyTransactions);
  revalidatePath("/");
}

export async function addGoal(formData: FormData) {
  const cookieStore = await cookies();
  // @ts-expect-error - auth-helpers expects a sync return
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    throw new Error("Não autenticado");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("couple_id")
    .eq("id", session.user.id)
    .single();

  if (!profile || !profile.couple_id) {
    throw new Error("Grupo não encontrado");
  }

  const title = formData.get("title") as string;
  const target_amount = parseFloat(formData.get("target_amount") as string);
  const emoji = formData.get("emoji") as string;
  const deadline = formData.get("deadline") as string;

  const { error } = await supabase.from("goals").insert({
    couple_id: profile.couple_id,
    title,
    target_amount,
    emoji: emoji || '🎯',
    deadline: deadline || null,
    current_amount: 0,
  });

  if (error) {
    console.error("Erro ao adicionar meta:", error);
    throw new Error("Erro ao adicionar meta");
  }

  revalidatePath("/metas");
  revalidatePath("/");
}

export async function depositToGoal(formData: FormData) {
  const cookieStore = await cookies();
  // @ts-expect-error - auth-helpers expects a sync return
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    throw new Error("Não autenticado");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("couple_id")
    .eq("id", session.user.id)
    .single();

  if (!profile || !profile.couple_id) {
    throw new Error("Grupo não encontrado");
  }

  const goalId = formData.get("goal_id") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const deductFromBalance = formData.get("deduct_from_balance") === "true";

  // Primeiro busca o current_amount da meta
  const { data: goal } = await supabase.from("goals").select("current_amount, title").eq("id", goalId).single();
  if (!goal) throw new Error("Meta não encontrada");

  const newAmount = Number(goal.current_amount) + amount;

  // Atualiza a meta
  const { error: updateError } = await supabase
    .from("goals")
    .update({ current_amount: newAmount })
    .eq("id", goalId);

  if (updateError) throw new Error("Erro ao atualizar meta");

  // Se marcar para deduzir, cria uma despesa de investimento
  if (deductFromBalance) {
    await supabase.from("transactions").insert({
      couple_id: profile.couple_id,
      user_id: session.user.id,
      amount: amount,
      type: "expense",
      category: "Investimento",
      description: `Depósito: ${goal.title}`,
      date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
      is_shared: true,
    });
  }

  revalidatePath("/metas");
  revalidatePath("/");
}

export async function withdrawFromGoal(formData: FormData) {
  const cookieStore = await cookies();
  // @ts-expect-error - auth-helpers expects a sync return
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    throw new Error("Não autenticado");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("couple_id")
    .eq("id", session.user.id)
    .single();

  if (!profile || !profile.couple_id) {
    throw new Error("Grupo não encontrado");
  }

  const goalId = formData.get("goal_id") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const addToBalance = formData.get("add_to_balance") === "true";

  if (amount <= 0) throw new Error("Valor inválido");

  // Busca o current_amount da meta
  const { data: goal } = await supabase.from("goals").select("current_amount, title").eq("id", goalId).single();
  if (!goal) throw new Error("Meta não encontrada");

  if (amount > Number(goal.current_amount)) {
    throw new Error("Saldo insuficiente na meta");
  }

  const newAmount = Number(goal.current_amount) - amount;

  // Atualiza a meta
  const { error: updateError } = await supabase
    .from("goals")
    .update({ current_amount: newAmount })
    .eq("id", goalId);

  if (updateError) throw new Error("Erro ao atualizar meta");

  // Se marcar para retornar ao saldo, cria uma receita
  if (addToBalance) {
    await supabase.from("transactions").insert({
      couple_id: profile.couple_id,
      user_id: session.user.id,
      amount: amount,
      type: "income",
      category: "Outros",
      description: `Resgate: ${goal.title}`,
      date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
      is_shared: true,
    });
  }

  revalidatePath("/metas");
  revalidatePath("/");
}
