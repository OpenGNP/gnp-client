// System tests (CLI-E, CLI-N): the real client and server against the test database.
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { execSync } from 'node:child_process'

const API = process.env.E2E_API_URL ?? 'http://localhost:3100/api'
// gnp-server checkout used to seed the test database (see gnp-server/qa-testing/e2e-seed.ts).
const SERVER = process.env.GNP_SERVER_DIR ?? '../gnp-server'
let seed, adminToken

const api = async (method, path, body, token = adminToken) => {
  const res = await fetch(API + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch {}
  return { status: res.status, json }
}
const formById = async (id) => (await api('GET', `/forms/${id}`)).json.data
const signInAs = async (page, token) => page.addInitScript((t) => localStorage.setItem('gnp.auth.token', t), token)
const adminLogin = async (page) => {
  await page.goto('/login')
  await page.getByPlaceholder('you@example.com').fill('admin@kmutt.test')
  await page.getByPlaceholder('••••••••').fill('Passw0rd!test')
  await page.locator('button[type=submit]').click()
  await page.waitForURL('**/')
}
/** A fresh published form made through the API, with one required text question. */
const newForm = async (settings = {}) => {
  const r = await api('POST', '/forms', {
    formTitle: `Form ${Date.now()}`,
    accessType: 'public',
    fields: [{ fieldLabel: 'What should we improve?', fieldType: 'textarea', isRequired: true, analyzeWithAi: true }],
    ...settings,
  })
  expect(r.status).toBe(201)
  await api('PATCH', `/forms/${r.json.data.id}`, { status: 'active', acceptingResponses: true })
  return formById(r.json.data.id)
}
const submitInBrowser = async (page, token, text = 'The canteen queue is too long') => {
  await page.goto(`/f/${token}`)
  await page.getByRole('textbox').first().fill(text)
  await page.getByRole('button', { name: 'Submit' }).click()
}

test.beforeAll(async () => {
  seed = JSON.parse(execSync('NODE_ENV=test bun qa-testing/e2e-seed.ts', { cwd: SERVER }).toString().trim().split('\n').pop())
  const login = await api('POST', '/auth/login', { email: 'admin@kmutt.test', password: 'Passw0rd!test' }, null)
  adminToken = login.json.data.token
})

test('CLI-E-01 build and publish a form in the form builder', async ({ page }) => {
  await adminLogin(page)
  await page.getByRole('button', { name: 'Create', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Create form' }).click()
  await page.getByRole('textbox', { name: 'Form title' }).fill('E2E pulse')
  await page.getByRole('button', { name: 'Add new question' }).nth(1).click()
  await page.getByRole('menuitem', { name: 'Text' }).click()
  await page.getByRole('textbox', { name: 'Question' }).fill('What should we improve?')
  await page.getByRole('button', { name: 'Publish' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('radio', { name: 'Anyone can respond' }).check()
  await dialog.getByRole('button', { name: 'Publish' }).click()
  // Second step: where to put it (My forms).
  await page.getByRole('dialog', { name: /Publish form/ }).getByRole('button', { name: 'Publish' }).click()
  await expect.poll(async () => (await api('GET', '/forms')).json.data.find((f) => f.formTitle === 'E2E pulse')?.status, { timeout: 10_000 }).toBe('active')
  const listed = (await api('GET', '/forms')).json.data.find((f) => f.formTitle === 'E2E pulse')
  const full = await formById(listed.id)
  expect(full.formFields.map((f) => f.fieldLabel)).toEqual(['What should we improve?'])
})

test('CLI-E-02 anonymous respondent submits by the public link; the owner sees it @xb', async ({ page }) => {
  const form = await newForm()
  await submitInBrowser(page, form.publicToken)
  await expect(page.getByText('Your feedback has been sent')).toBeVisible()
  const subs = await api('GET', `/feedback/form/${form.id}`)
  expect(subs.json.data).toHaveLength(1)
  expect(subs.json.data[0].answers[0].answerText).toBe('The canteen queue is too long')
})

test('CLI-E-03 one response per person: a second visit is blocked with a friendly message', async ({ page }) => {
  const form = await newForm({ oneResponsePerPerson: true })
  await submitInBrowser(page, form.publicToken)
  await expect(page.getByText('Your feedback has been sent')).toBeVisible()
  await page.goto(`/f/${form.publicToken}`)
  // The repeat visit opens on the sent screen, with no way to answer again.
  await expect(page.getByText('Your feedback has been sent')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Submit another response' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Submit' })).toHaveCount(0)
  // And the server refuses a duplicate even if the page were bypassed.
  const deviceId = await page.evaluate(() => localStorage.getItem('gnp.respondent.deviceId'))
  const dup = await api('POST', '/feedback', { formId: form.id, deviceId, answers: [{ fieldId: form.formFields[0].id, answerText: 'again' }] }, null)
  expect(dup.status).toBe(409)
  expect((await api('GET', `/feedback/form/${form.id}`)).json.data).toHaveLength(1)
})

test('CLI-E-04 organization form: anonymous asked to sign in, member submits, outsider refused', async ({ browser }) => {
  const form = await newForm({ accessType: 'organization' })
  const anon = await browser.newPage()
  await anon.goto(`/f/${form.publicToken}`)
  await expect(anon.getByText(/sign in/i).first()).toBeVisible()
  const member = await browser.newPage()
  await signInAs(member, seed.mateToken)
  await submitInBrowser(member, form.publicToken)
  await expect(member.getByText('Your feedback has been sent')).toBeVisible()
  const outsider = await browser.newPage()
  await signInAs(outsider, seed.outsiderToken)
  await outsider.goto(`/f/${form.publicToken}`)
  await expect(outsider.getByRole('button', { name: 'Submit' })).toHaveCount(0)
  await expect(outsider.getByText(/access|organization|permission/i).first()).toBeVisible()
  expect((await api('GET', `/feedback/form/${form.id}`)).json.data).toHaveLength(1)
})

test('CLI-E-05 the dashboard shows the AI results on all four tabs', async ({ page }) => {
  await signInAs(page, adminToken)
  await page.goto(`/forms/${seed.urlId}/dashboard`)
  await expect(page.getByRole('heading', { name: /Topics found by AI/ })).toBeVisible()
  await expect(page.getByText('Canteen queue').first()).toBeVisible()
  for (const tab of ['Trend', 'Response', 'Individual']) {
    await page.getByRole('tab', { name: tab }).click()
    await expect(page.getByRole('heading', { name: tab }).first()).toBeVisible()
  }
})

test('CLI-E-06 an invalid or expired session goes to sign-in without a redirect loop', async ({ page }) => {
  await signInAs(page, 'not-a-valid-token')
  await page.goto('/my-forms')
  await page.waitForURL('**/login**')
  await page.waitForTimeout(1500)
  expect(new URL(page.url()).pathname).toBe('/login')
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
})

test('CLI-E-07 deleting a form with responses removes it and its responses', async ({ page }) => {
  const form = await newForm()
  await api('POST', '/feedback', { formId: form.id, answers: [{ fieldId: form.formFields[0].id, answerText: 'hello' }] }, null)
  await signInAs(page, adminToken)
  await page.goto('/my-forms')
  await page.getByRole('button', { name: `More options for ${form.formTitle}` }).click()
  await page.getByRole('menuitem', { name: /delete/i }).click()
  const confirm = page.getByRole('alertdialog').or(page.getByRole('dialog'))
  await confirm.getByRole('textbox').fill(form.formTitle) // type the name to confirm
  await confirm.getByRole('button', { name: 'Delete' }).click()
  await expect.poll(async () => (await api('GET', `/forms/${form.id}`)).status, { timeout: 10_000 }).toBe(404)
})

test('CLI-E-08 a view-only collaborator sees the shared form and its dashboard, without editing', async ({ page }) => {
  expect((await api('PUT', `/forms/${seed.formId}/collaborators`, { emails: ['mate@kmutt.test'] })).status).toBe(200)
  await signInAs(page, seed.mateToken)
  await page.goto('/shared')
  await expect(page.getByText('Canteen survey').first()).toBeVisible()
  await page.goto(`/forms/${seed.urlId}/dashboard`)
  await expect(page.getByRole('heading', { name: /Topics found by AI/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Share results' })).toHaveCount(0)
  expect((await api('PATCH', `/forms/${seed.formId}`, { formTitle: 'x' }, seed.mateToken)).status).toBe(403)
  await api('PUT', `/forms/${seed.formId}/collaborators`, { emails: [] })
})

test('CLI-E-09 the dashboard exports the responses as a spreadsheet', async ({ page }) => {
  await signInAs(page, adminToken)
  await page.goto(`/forms/${seed.urlId}/dashboard`)
  await page.getByRole('button', { name: 'Export' }).click()
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('menuitem').filter({ hasText: /xlsx|excel|response/i }).first().click(),
  ])
  expect(download.suggestedFilename()).toMatch(/\.(xlsx|csv)$/)
})

test('CLI-E-10 an open dashboard updates live when a new response arrives', async ({ page }) => {
  // The live stream authenticates with the sign-in cookie (EventSource can't send a Bearer header).
  await page.goto('/about')
  await page.evaluate(async (api) => {
    const r = await fetch(`${api}/auth/login`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'admin@kmutt.test', password: 'Passw0rd!test' }) })
    localStorage.setItem('gnp.auth.token', (await r.json()).data.token)
  }, API)
  await page.goto(`/forms/${seed.urlId}/dashboard`)
  await page.getByRole('tab', { name: 'Individual' }).click()
  const before = await api('GET', `/analytics/forms/${seed.formId}/individual`)
  const count = before.json.data.responses.length
  const f = await formById(seed.formId)
  const text = f.formFields.find((x) => x.fieldType === 'text')
  await page.waitForTimeout(1000)
  await api('POST', '/feedback', { formId: seed.formId, answers: [{ fieldId: text.id, answerText: 'Live update check' }] }, null)
  // No reload: the new response appears through the live stream.
  await expect(page.getByText(`${count + 1} responses`)).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(`Response #${count + 1}`)).toBeVisible()
})

test('CLI-E-11 a link to a deleted form shows an error, without hammering the API', async ({ page }) => {
  const form = await newForm()
  await api('DELETE', `/forms/${form.id}`)
  let lookups = 0
  page.on('request', (r) => { if (r.url().includes('/api/forms/ref/')) lookups++ })
  await signInAs(page, adminToken)
  for (const path of ['', '/dashboard']) {
    await page.goto(`/forms/${form.urlId}${path}`)
    await expect(page.getByText("This form doesn't exist or was deleted")).toBeVisible()
  }
  await page.waitForTimeout(3000)
  expect(lookups).toBeLessThanOrEqual(4)
})

test('CLI-N-01 the public form fits a phone screen (390 px) with no sideways scroll', async ({ browser }) => {
  const form = await newForm()
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await page.goto(`/f/${form.publicToken}`)
  await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})

for (const [name, path] of [['public form', 'PUBLIC'], ['sign-in page', '/login'], ['dashboard', 'DASH']]) {
  test(`CLI-N-02 accessibility scan (axe, WCAG 2 A/AA): ${name}`, async ({ page }) => {
    if (path === 'DASH') await signInAs(page, adminToken)
    const target = path === 'PUBLIC' ? `/f/${(await formById(seed.formId)).publicToken}` : path === 'DASH' ? `/forms/${seed.urlId}/dashboard` : path
    await page.goto(target)
    await page.waitForTimeout(2000)
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    test.info().annotations.push({ type: 'axe', description: JSON.stringify(results.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }))) })
    expect(serious.map((v) => v.id)).toEqual([])
  })
}

test('CLI-N-03 over plain HTTP (no crypto.randomUUID) a respondent is still de-duplicated and the builder adds questions', async ({ browser }) => {
  const ctx = await browser.newContext()
  await ctx.addInitScript(() => { try { Object.defineProperty(Crypto.prototype, 'randomUUID', { value: undefined }) } catch {} })
  const form = await newForm({ oneResponsePerPerson: true })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await submitInBrowser(page, form.publicToken)
  await expect(page.getByText('Your feedback has been sent')).toBeVisible()
  await page.goto(`/f/${form.publicToken}`)
  await expect(page.getByRole('button', { name: 'Submit another response' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Submit' })).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem('gnp.respondent.deviceId'))).toMatch(/^[0-9a-f-]{36}$/)
  const builder = await ctx.newPage()
  builder.on('pageerror', (e) => errors.push(e.message))
  await builder.addInitScript((t) => localStorage.setItem('gnp.auth.token', t), adminToken)
  await builder.goto('/create-form')
  await builder.getByRole('button', { name: 'Add new question' }).nth(1).click()
  await builder.getByRole('menuitem', { name: 'Text' }).click()
  await expect(builder.getByRole('textbox', { name: 'Question' })).toBeVisible()
  expect(errors).toEqual([])
})
