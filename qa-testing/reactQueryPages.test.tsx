import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
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

const form = {
  id: 4,
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
  '/analytics/forms/4/responses': { totalResponses: 0, demographic: [], feedback: [] },
  '/analytics/forms/4/themes': {
    ...window_,
    title: 'Canteen themes',
    totalMentions: 0,
    totalResponders: 0,
    responderDelta: 0,
    responderDeltaLabel: '',
    demographicFilters: [],
    sentiment: { score: 0, outOf: 5, negative: 0, neutral: 0, positive: 0 },
    highIntenseTopics: [],
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
  it('dashboard loads every source once and shows the themes title', async () => {
    renderAt('/forms/4/dashboard', '/forms/:projectId/dashboard', <FormDashboardPage />)
    expect(await screen.findByText('Canteen themes')).toBeInTheDocument()
    await waitFor(() => expect(count('/analytics/forms/4/trend')).toBe(1))
    expect(count('/forms/4')).toBe(1)
    expect(count('/analytics/forms/4/responses')).toBe(1)
    expect(count('/analytics/forms/4/themes')).toBe(1)
  })

  it('edit page seeds the editor from the form query', async () => {
    renderAt('/forms/4', '/forms/:projectId', <EditFormPage />)
    expect(await screen.findByDisplayValue('Canteen survey')).toBeInTheDocument()
    expect(count('/forms/4')).toBe(1)
  })

  it('public page renders the form from its token', async () => {
    renderAt('/f/tok123', '/f/:token', <PublicFormPage />)
    expect(await screen.findByText('Canteen survey')).toBeInTheDocument()
    expect(count('/forms/public/tok123')).toBe(1)
  })

  it('Home and the sidebar tree share one /forms request', async () => {
    renderAt(
      '/',
      '/',
      <>
        <TreeProbe />
        <HomePage onMoveItem={() => {}} />
      </>,
    )
    expect(await screen.findByText('tree ready 1')).toBeInTheDocument()
    expect(await screen.findByText('Canteen survey')).toBeInTheDocument()
    expect(count('/forms')).toBe(1)
    expect(count('/folders')).toBe(1)
  })
})
