import { supabase } from "./supabase";

function getClient() {
  if (!supabase) throw new Error("Supabase未設定です。.env.localを確認してください。");
  return supabase;
}

export async function signInAsGuest() {
  const { data, error } = await getClient().auth.signInAnonymously();
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await getClient().auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await getClient().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await getClient().auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await getClient().auth.getUser();
  return user;
}
