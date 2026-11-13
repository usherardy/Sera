// The shared demo account, so judges and teammates can look around without
// signing up. It is NOT a secret: the login page fills these in for everyone.
// Anyone can sign in to it, so never record a real client call while using it.
// /api/demo/login creates the account on first use (already confirmed, no email
// is sent) and loads the labeled sample projects when it's empty.

export const DEMO_EMAIL = "demo@example.com";
export const DEMO_PASSWORD = "sera-demo-2026";

export const isDemoEmail = (email: string) => email.trim().toLowerCase() === DEMO_EMAIL;
