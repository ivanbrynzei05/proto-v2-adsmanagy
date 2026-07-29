import { PLATFORMS, type PlatformId } from "./data"

// ---- platform (ad-account) badge ----
export function PlatformBadge({
  id,
  size = 15,
}: {
  id: PlatformId
  size?: number
}) {
  const p = PLATFORMS.find((x) => x.id === id)
  if (!p) return null
  const logos: Record<PlatformId, React.ReactNode> = {
    facebook: (
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
        <path
          fill="#1877F2"
          d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.234 2.686.234v2.953H15.83c-1.49 0-1.955.925-1.955 1.874V12h3.328l-.532 3.469h-2.796v8.385C19.612 22.954 24 17.99 24 12z"
        />
      </svg>
    ),
    google: (
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
        <path
          fill="#4285F4"
          d="M23.52 12.273c0-.851-.076-1.67-.218-2.455H12v4.642h6.458a5.52 5.52 0 0 1-2.394 3.622v3.011h3.878c2.269-2.09 3.578-5.165 3.578-8.82z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.956-1.075 7.942-2.907l-3.878-3.01c-1.075.72-2.45 1.145-4.064 1.145-3.125 0-5.77-2.11-6.714-4.948H1.276v3.11A11.997 11.997 0 0 0 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.286 14.28A7.213 7.213 0 0 1 4.91 12c0-.79.137-1.558.376-2.28V6.61H1.276A11.997 11.997 0 0 0 0 12c0 1.937.464 3.769 1.276 5.39l4.01-3.11z"
        />
        <path
          fill="#EA4335"
          d="M12 4.773c1.762 0 3.343.605 4.587 1.794l3.44-3.44C17.952 1.19 15.235 0 12 0A11.997 11.997 0 0 0 1.276 6.61l4.01 3.11C6.23 6.882 8.875 4.773 12 4.773z"
        />
      </svg>
    ),
    tiktok: (
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
        <path
          className="fill-foreground"
          d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z"
        />
        <path
          fill="#25F4EE"
          d="M5.633 16.42a2.895 2.895 0 0 1 3.183-4.51V8.39a6.33 6.33 0 0 0-5.394 10.692 6.33 6.33 0 0 1 2.211-2.662z"
        />
        <path
          fill="#FE2C55"
          d="M20.592 6.79V6.686a4.793 4.793 0 0 1-2.767-.869 4.793 4.793 0 0 0 2.767.973z"
        />
      </svg>
    ),
  }
  return (
    <span
      className="inline-grid shrink-0 place-items-center leading-none"
      title={"Кабінет: " + p.label}
      style={{ width: size, height: size }}
    >
      {logos[id]}
    </span>
  )
}
