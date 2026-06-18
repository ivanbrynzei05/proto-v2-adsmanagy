// Demo-only catalogue of the public connect-link states. The whole app is a
// prototype with mocked data, so these named tokens let you open every state of
// /connect/ads/:token without a backend. Shared between the connect page's own
// switcher and the header's "Джерела даних" dropdown. Remove once a real invite
// API is wired up.
export type ConnectAdsDemoState = { label: string; to: string }

export const CONNECT_ADS_DEMO_STATES: ConnectAdsDemoState[] = [
  { label: "Активне запрошення", to: "/connect/ads/demo-active" },
  { label: "Підключення недоступне", to: "/connect/ads/demo-unavailable" },
  { label: "Термін минув", to: "/connect/ads/demo-expired" },
  { label: "Недійсне посилання", to: "/connect/ads/demo-invalid" },
  {
    label: "Успіх (повернення)",
    to: "/connect/ads/demo-active?status=connected&provider=facebook",
  },
  {
    label: "Помилка (повернення)",
    to: `/connect/ads/demo-active?status=error&reason=${encodeURIComponent(
      "Facebook відхилив запит"
    )}`,
  },
]
