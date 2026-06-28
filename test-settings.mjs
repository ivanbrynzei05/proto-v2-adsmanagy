import { chromium } from "playwright"

const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } })

const base = "http://localhost:5183/proto-v2-adsmanagy/"

page.on("console", (msg) => {
  if (msg.type() === "error") console.log("CONSOLE ERROR:", msg.text())
})
page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message))

await page.goto(base + "#/settings")
await page.waitForSelector("text=Налаштування")
await page.screenshot({ path: "/tmp/settings-1.png", fullPage: true })

// Connect a CRM
await page.click("text=Додати CRM")
await page.waitForSelector("text=Підключення CRM")
await page.click("text=LP CRM")
await page.fill("input[placeholder='Введіть API ключ']", "test-key-123")
await page.fill("input[placeholder='myaccount']", "myshop")
await page.click("button:has-text('Підключити')")
await page.waitForTimeout(500)
await page.screenshot({
  path: "/tmp/settings-2-crm-connected.png",
  fullPage: true,
})

// Connect an ad account
await page.click("button:has-text('Підключити'):near(:text('Facebook Ads'))")
await page.waitForSelector("text=Підключення Facebook Ads")
await page.click("button:has-text('Підключити Facebook Ads')")
await page.waitForTimeout(500)
await page.click("button[aria-label='Закрити']").catch(() => {})
await page.screenshot({
  path: "/tmp/settings-3-ad-connected.png",
  fullPage: true,
})

// Now go to dashboard and check onboarding state reflects connections
await page.goto(base + "#/")
await page.waitForSelector("text=Огляд")
await page.screenshot({ path: "/tmp/dashboard-1.png", fullPage: true })

await browser.close()
console.log("DONE")
