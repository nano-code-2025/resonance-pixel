const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const isFormData = options.body instanceof FormData;
  const resp = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `HTTP ${resp.status}`);
  }
  return resp.json() as Promise<T>;
}

// ---- Type definitions ----

export interface PoolCandidate {
  candidate_id: string;
  age: number | null;
  city: string | null;
  gender: string | null;
  personality_tags: string[];
  score: number;
  highlights: string[];
  compatibility_bucket?: string;
}

export interface ReceivedApproach {
  approach_id: string;
  ai_message: string;
  tier: string;
  created_at: string;
  initiator: {
    user_id: string;
    age: number | null;
    city: string | null;
    gender: string | null;
    personality_tags: string[] | null;
    selfie_url: string | null;
  };
}

export interface PipelineMatch {
  match_id: string;
  round: number;
  status: string;
  other_city: string | null;
  other_gender: string | null;
  other_personality_tags: string[];
  bloom_type: string;
  days_since_activity: number;
  questions_completed: number;
  bloom_stage: number;
}

export interface SessionStateResponse {
  session_id: string;
  match_id: string;
  round_number: number;
  session_type: string;
  is_host: boolean;
  questions: { id: number; text: string }[];
  questions_completed: number[];
  selected_question_ids: number[];
  swap_count: number;
  completed_at: string | null;
  questions_answered_count?: number;
}

export interface ProfileResponse {
  user_id: string;
  phone: string;
  selfie_url: string | null;
  age: number | null;
  city: string | null;
  gender: string | null;
  education: string | null;
  work: string | null;
  life_goals: string | null;
  personality_tags: string[] | null;
  requirements: Record<string, unknown> | null;
  is_complete: boolean;
}

// ---- API methods ----

export const api = {
  // Auth
  sendOtp: (phone: string) =>
    apiFetch<{ message: string }>("/api/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ phone }),
    }),
  verifyOtp: (phone: string, otp: string) =>
    apiFetch<{ token: string; user_id: string; is_new: boolean }>("/api/auth/verify", {
      method: "POST",
      body: JSON.stringify({ phone, otp }),
    }),

  // Profile
  getProfile: () => apiFetch<ProfileResponse>("/api/profile"),
  updateProfile: (data: object) =>
    apiFetch<ProfileResponse>("/api/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  uploadSelfie: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return apiFetch<{ selfie_url: string }>("/api/profile/selfie", {
      method: "POST",
      body: form,
    });
  },

  // Pool
  getPool: () => apiFetch<PoolCandidate[]>("/api/pool"),

  // Approaches
  draftApproach: (candidate_id: string, tier: string) =>
    apiFetch<{ ai_message: string; candidate_id: string; tier: string }>("/api/approaches/draft", {
      method: "POST",
      body: JSON.stringify({ candidate_id, tier }),
    }),
  sendApproach: (candidate_id: string, tier: string, confirmed_message: string) =>
    apiFetch<{ approach_id: string; status: string }>("/api/approaches/send", {
      method: "POST",
      body: JSON.stringify({ candidate_id, tier, confirmed_message }),
    }),
  getReceivedApproaches: () =>
    apiFetch<ReceivedApproach[]>("/api/approaches/received"),
  getSentApproaches: () =>
    apiFetch<{ approach_id: string; tier: string; status: string; created_at: string }[]>(
      "/api/approaches/sent"
    ),
  respondApproach: (id: string, response: string) =>
    apiFetch<{ status: string }>(`/api/approaches/${id}/respond`, {
      method: "PATCH",
      body: JSON.stringify({ response }),
    }),

  // Pipeline
  getPipeline: () =>
    apiFetch<{ pursuing: PipelineMatch[]; being_found: PipelineMatch[] }>("/api/pipeline"),

  // Matches
  voteFormat: (match_id: string, preference: string) =>
    apiFetch<{ my_vote: string; both_voted: boolean; resolved_format: string | null }>(
      `/api/matches/${match_id}/vote`,
      { method: "POST", body: JSON.stringify({ preference }) }
    ),
  submitAvailability: (match_id: string, slots: { start: string; end: string }[]) =>
    apiFetch<{ submitted: boolean; both_submitted: boolean; scheduled_at: string | null }>(
      `/api/matches/${match_id}/availability`,
      { method: "POST", body: JSON.stringify({ slots }) }
    ),
  getSetupStatus: (match_id: string) =>
    apiFetch<{
      my_vote: string | null;
      other_voted: boolean;
      resolved_format: string | null;
      scheduled_at: string | null;
    }>(`/api/matches/${match_id}/setup-status`),

  // Sessions
  createSession: (match_id: string, session_type = "in_person") =>
    apiFetch<{ session_id: string; questions: { id: number; text: string }[]; round: number }>(
      "/api/sessions",
      { method: "POST", body: JSON.stringify({ match_id, session_type }) }
    ),
  getSessionState: (id: string) =>
    apiFetch<SessionStateResponse>(`/api/sessions/${id}/state`),
  advanceQuestion: (id: string, question_id: number) =>
    apiFetch<{ questions_completed: number[]; current_question_index: number }>(
      `/api/sessions/${id}/advance`,
      { method: "POST", body: JSON.stringify({ question_id }) }
    ),
  skipQuestion: (id: string) =>
    apiFetch<{ questions_completed: number[]; current_question_index: number }>(
      `/api/sessions/${id}/skip`,
      { method: "POST" }
    ),
  swapQuestion: (id: string, question_index: number) =>
    apiFetch<{ swapped_index: number; new_question: { id: number; text: string }; swap_count: number; swaps_remaining: number }>(
      `/api/sessions/${id}/swap`,
      { method: "POST", body: JSON.stringify({ question_index }) }
    ),
  saveAnswer: (id: string, question_id: number, answer_text: string) =>
    apiFetch<{ answer_id: string; ok: boolean }>(
      `/api/sessions/${id}/answer`,
      { method: "POST", body: JSON.stringify({ question_id, answer_text }) }
    ),
  endSession: (id: string, rating: number, advance: boolean) =>
    apiFetch<{ ok: boolean; both_rated: boolean }>(`/api/sessions/${id}/end`, {
      method: "POST",
      body: JSON.stringify({ rating, advance }),
    }),
  getRecap: (id: string) =>
    apiFetch<{ session_id: string; recap: string | null }>(`/api/sessions/${id}/recap`),
  getAnswers: (id: string) =>
    apiFetch<{ answers: { answer_id: string; question_id: number; answer_text: string; created_at: string }[] }>(
      `/api/sessions/${id}/answers`
    ),

  // Offers
  sendOffer: (match_id: string) =>
    apiFetch<{ offer_id?: string; status: string; message?: string }>("/api/offers", {
      method: "POST",
      body: JSON.stringify({ match_id }),
    }),
  respondOffer: (id: string, response: string) =>
    apiFetch<{ status: string }>(`/api/offers/${id}/respond`, {
      method: "PATCH",
      body: JSON.stringify({ response }),
    }),

  // Meetings
  scheduleMeeting: (match_id: string, start_time: string) =>
    apiFetch<{ session_id: string; meeting_url: string; scheduled_at: string }>(
      "/api/meetings/schedule",
      { method: "POST", body: JSON.stringify({ match_id, start_time }) }
    ),
};
