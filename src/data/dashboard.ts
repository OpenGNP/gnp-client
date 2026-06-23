import formArchitecture from '../assets/form-architecture.png'
import formDesk from '../assets/form-desk.png'
import formGradient from '../assets/form-gradient.png'
import formMeeting from '../assets/form-meeting.png'
import formTech from '../assets/form-tech.png'
import formVolunteer from '../assets/form-volunteer.png'
import logoGnp from '../assets/logo-gnp.png'

export type ProjectTreeItem = {
  id: string
  label: string
  type: 'folder' | 'document'
  active?: boolean
  formId?: string
  open?: boolean
  children?: ProjectTreeItem[]
}

export type RecentForm = {
  id: string
  title: string
  image: string
  updatedAt: string
}

export const brand = {
  logo: logoGnp,
  name: 'GNP',
}

export const user = {
  name: 'Penguin Yellow',
  email: 'penguin.yellow@gmail.com',
}

export const projectTree: ProjectTreeItem[] = [
  {
    id: 'sit-faculty',
    label: 'SIT Faculty',
    type: 'folder',
    open: true,
    children: [
      {
        id: 'cs-focus-group',
        label: 'CS Focus Group Feedback 2026',
        type: 'document',
        active: true,
        formId: 'cs-feedback-architecture',
      },
      {
        id: 'it-focus-group',
        label: 'IT Focus Group Feedback 2026',
        type: 'document',
        formId: 'it-feedback',
      },
      {
        id: 'dsi-focus-group',
        label: 'DSI Focus Group Feedback 2026',
        type: 'document',
        formId: 'dsi-feedback',
      },
      {
        id: 'staff-focus-group',
        label: 'SIT Staff Focus Group Feedback 2026',
        type: 'document',
        formId: 'staff-feedback',
      },
    ],
  },
  {
    id: 'kmutt',
    label: 'KMUTT',
    type: 'folder',
  },
  {
    id: 'activity-interest',
    label: 'แบบทดสอบความสนใจกิจกรรม',
    type: 'document',
    formId: 'cs-feedback-volunteer',
  },
]

export const recentForms: RecentForm[] = [
  {
    id: 'cs-feedback-architecture',
    title: 'CS Focus Group Feedback 2026',
    image: formArchitecture,
    updatedAt: '2 hours ago',
  },
  {
    id: 'dsi-feedback',
    title: 'DSI Focus Group Feedback 2026',
    image: formMeeting,
    updatedAt: '2 hours ago',
  },
  {
    id: 'it-feedback',
    title: 'IT Focus Group Feedback 2026',
    image: formTech,
    updatedAt: '2 hours ago',
  },
  {
    id: 'staff-feedback',
    title: 'SIT Staff Focus Group Feedback 2...',
    image: formDesk,
    updatedAt: '2 hours ago',
  },
  {
    id: 'cs-feedback-volunteer',
    title: 'CS Focus Group Feedback 2026',
    image: formVolunteer,
    updatedAt: '2 hours ago',
  },
  {
    id: 'cs-feedback-gradient',
    title: 'CS Focus Group Feedback 2026',
    image: formGradient,
    updatedAt: '2 hours ago',
  },
]
