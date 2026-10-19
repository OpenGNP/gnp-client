import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { httpClient } from '../src/lib/api'
import { AuthContext, type AuthContextValue } from '../src/lib/auth'
import { useWorkspaceTree } from '../src/hooks/useWorkspaceTree'
import { EditFormPage } from '../src/pages/EditFormPage'
import { HomePage } from '../src/pages/HomePage'
import { FormDashboardPage } from '../src/pages/FormDashboardPage'
import { PublicFormPage } from '../src/pages/PublicFormPage'

// Smoke tests for the React Query migration: each page loads through the real
// query layer against a fake API, renders its data, and fetches each resource once.

// The app's URLs carry a form's urlId; the page resolves it to id 4 via /forms/ref.
const URL_ID = '6f1c2a4e-8b3d-4c5e-9f7a-1b2c3d4e5f60'

const form = {
  id: 4,
  urlId: URL_ID,
  adminId: 1,
  folderId: null,
  organizationId: 1,
  formTitle: 'Canteen survey',
  formDescription: 'Tell us about lunch',
  coverImageUrl: null,
  status: 'active',
  accessType: 'public',
  acceptingResponses: true,
  recordName: false,
  oneResponsePerPerson: false,
  startDate: null,
  endDate: null,
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
  publicToken: 'tok123',
  formFields: [],
  formAllowedUsers: [],
}

const window_ = { from: '2026-09-01T00:00:00Z', to: '2026-10-01T00:00:00Z', rangeLabel: 'All feedback' }

const fixtures: Record<string, unknown> = {
  '/forms/4': form,
  [`/forms/ref/${URL_ID}`]: { id: 4, urlId: URL_ID },
  '/analytics/forms/4/responses': { totalResponses: 0, demographic: [], feedback: [] },
  '/analytics/forms/4/themes': {
    ...window_,
    totalMentions: 0,
    totalResponders: 0,
    responderDelta: 0,
    responderDeltaLabel: '',
    demographicFilters: [],
    sentiment: { score: 0, outOf: 5, negative: 0, neutral: 0, positive: 0 },
    violationTopics: [],
    aiDiscoveredTopics: [],
  },
  '/analytics/forms/4/trend': {
    ...window_,
    bucket: 'week',
    rank: 'mentioned',
    comparisonLabel: '',
    totalMentions: 0,
    topicVolumeSeries: [],
    availableTopics: [],
    volumeSeries: [],
    sentimentSeries: [],
    risingTopics: [],
    decliningTopics: [],
    emergingIssues: [],
    timelineEvents: [],
  },
  '/forms': [{ ...form, sortOrder: 0 }],
  '/folders': [],
  '/forms/public/tok123': { ...form, alreadyResponded: false, fields: [] },
}

// jsdom has no ResizeObserver (the dashboard measures its detail-panel width).
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

let requests: string[] = []

const adapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
  const path = (config.url ?? '').split('?')[0]!
  requests.push(path)
  const data = fixtures[path]
  return {
    data: data === undefined ? { success: false, message: 'not found' } : { success: true, message: 'ok', data },
    status: data === undefined ? 404 : 200,
    statusText: 'OK',
    headers: {},
    config,
  }
}

const auth: AuthContextValue = {
  user: { id: 1, fullName: 'Admin', email: 'admin@example.com', role: 'admin', organizationId: 1 },
  status: 'ready',
  error: null,
  retry: () => {},
  login: async () => {},
  loginWithMicrosoft: async () => {},
  logout: async () => {},
  signedOut: false,
}

function renderAt(path: string, routePath: string, element: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AuthContext.Provider value={auth}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path={routePath} element={element} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  requests = []
  httpClient.defaults.adapter = adapter
})

function TreeProbe() {
  const { status, projects } = useWorkspaceTree()
  return <p>tree {status} {projects.length}</p>
}

const count = (path: string) => requests.filter((request) => request === path).length

describe('pages on React Query', () => {
  it('dashboard loads every source once and heads the page with the form name', async () => {
    renderAt(`/forms/${URL_ID}/dashboard`, '/forms/:projectId/dashboard', <FormDashboardPage />)
    expect(await screen.findByRole('heading', { level: 1, name: 'Canteen survey' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Themes Overview' })).toBeInTheDocument()
    await waitFor(() => expect(count('/analytics/forms/4/trend')).toBe(1))
    expect(count('/forms/4')).toBe(1)
    expect(count('/analytics/forms/4/responses')).toBe(1)
    expect(count('/analytics/forms/4/themes')).toBe(1)
  })

  it('edit page seeds the editor from the form query', async () => {
    renderAt(`/forms/${URL_ID}`, '/forms/:projectId', <EditFormPage />)
    expect(await screen.findByDisplayValue('Canteen survey')).toBeInTheDocument()
    expect(count('/forms/4')).toBe(1)
  })

  it('public page renders the form from its token', async () => {
    renderAt('/f/tok123', '/f/:token', <PublicFormPage />)
    expect(await screen.findByText('Canteen survey')).toBeInTheDocument()
    expect(count('/forms/public/tok123')).toBe(1)
  })

  it('Home shows names and deletions from the sidebar tree, not just the cache', async () => {
    renderAt(
      '/',
      '/',
      <HomePage
        onDeleteItem={() => {}}
        onMoveItem={() => {}}
        onRenameItem={() => {}}
        projects={[{ id: 'form-4', label: 'Renamed in sidebar', type: 'document', formId: '4' }]}
      />,
    )
    expect(await screen.findByText('Renamed in sidebar')).toBeInTheDocument()
    expect(screen.queryByText('Canteen survey')).not.toBeInTheDocument()
  })

  it('Home hides a form already deleted from the tree', async () => {
    renderAt(
      '/',
      '/',
      <HomePage
        onDeleteItem={() => {}}
        onMoveItem={() => {}}
        onRenameItem={() => {}}
        projects={[{ id: 'form-99', label: 'Another', type: 'document', formId: '99' }]}
      />,
    )
    expect(await screen.findByText('No forms yet. Create your first form to get started.')).toBeInTheDocument()
  })

  it('Home and the sidebar tree share one /forms request', async () => {
    renderAt(
      '/',
      '/',
      <>
        <TreeProbe />
        <HomePage onDeleteItem={() => {}} onMoveItem={() => {}} onRenameItem={() => {}} projects={[]} />
      </>,
    )
    expect(await screen.findByText('tree ready 1')).toBeInTheDocument()
    expect(await screen.findByText('Canteen survey')).toBeInTheDocument()
    expect(count('/forms')).toBe(1)
    expect(count('/folders')).toBe(1)
  })

  it("edit page for a form you can't open offers Back to Home, not Try again", async () => {
    renderAt('/forms/99', '/forms/:projectId', <EditFormPage />)
    expect(await screen.findByRole('link', { name: 'Back to Home' })).toHaveAttribute('href', '/')
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument()
  })

  it('Trend shows its whole filter row at once, only after trend and themes both load', async () => {
    let releaseThemes = () => {}
    const themesGate = new Promise<void>((resolve) => {
      releaseThemes = resolve
    })
    const withData: Record<string, unknown> = {
      ...fixtures,
      '/analytics/forms/4/themes': {
        ...(fixtures['/analytics/forms/4/themes'] as object),
        totalMentions: 5,
        demographicFilters: [{ label: 'Faculty', options: ['SIT'] }],
      },
      '/analytics/forms/4/trend': { ...(fixtures['/analytics/forms/4/trend'] as object), totalMentions: 5 },
    }
    httpClient.defaults.adapter = async (config) => {
      const path = (config.url ?? '').split('?')[0]!
      requests.push(path)
      if (path === '/analytics/forms/4/themes') await themesGate
      return { data: { success: true, message: 'ok', data: withData[path] }, status: 200, statusText: 'OK', headers: {}, config }
    }

    const user = userEvent.setup()
    renderAt(`/forms/${URL_ID}/dashboard`, '/forms/:projectId/dashboard', <FormDashboardPage />)
    await user.click(await screen.findByRole('tab', { name: /trend/i }))
    await waitFor(() => expect(count('/analytics/forms/4/trend')).toBeGreaterThan(0))

    // Trend has arrived, themes hasn't: no partial filter row yet.
    expect(screen.queryByText('Summarise by:')).not.toBeInTheDocument()
    expect(screen.queryByText('Filter by:')).not.toBeInTheDocument()

    await act(async () => releaseThemes())
    expect(await screen.findByText('Summarise by:')).toBeInTheDocument()
    expect(screen.getByText('Filter by:')).toBeInTheDocument()
    expect(screen.getByText('Show reports for:')).toBeInTheDocument()
  })
})
