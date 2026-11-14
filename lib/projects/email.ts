/**
 * "Open in Gmail / Outlook" links: open a new email in the user's own mailbox
 * (in the browser, already signed in) with the subject and body filled in.
 * Like the Calendar links: no OAuth and nothing is sent by Sera. The user
 * checks the draft, adds the client's address and presses Send.
 */
// encodeURIComponent (spaces as %20), not URLSearchParams: Outlook shows "+" literally.
const q = (params: Record<string, string>) =>
  Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");

type Compose = { to?: string; subject: string; body: string };

export function gmailComposeUrl({ to, subject, body }: Compose): string {
  return `https://mail.google.com/mail/?${q({ view: "cm", fs: "1", ...(to ? { to } : {}), su: subject, body })}`;
}

export function outlookComposeUrl({ to, subject, body }: Compose): string {
  return `https://outlook.office.com/mail/deeplink/compose?${q({ ...(to ? { to } : {}), subject, body })}`;
}

/** Subject line for a change request about one finding. */
export function changeRequestSubject(projectName: string, findingTitle: string): string {
  return `${projectName}: ${findingTitle}`;
}
