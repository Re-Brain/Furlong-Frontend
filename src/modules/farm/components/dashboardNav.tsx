import { Home, List, CalendarClock, Users, Heart, Settings } from 'lucide-react'

export type Section =
  | 'farm-info'
  | 'horse-management'
  | 'availability'
  | 'visitor-management'
  | 'donations'
  | 'settings'

// Sections that stay locked until the farm is approved (active) — they need
// a live, public farm to be useful, and their backend endpoints 403 until then.
export const gatedSections: Section[] = ['horse-management', 'availability', 'visitor-management', 'donations']

export const navItems: { key: Section; label: string; icon: React.ReactNode }[] = [
  { key: 'farm-info', label: 'Farm Info', icon: <Home size={18} /> },
  { key: 'horse-management', label: 'Horse Management', icon: <List size={18} /> },
  { key: 'availability', label: 'Visit Availability', icon: <CalendarClock size={18} /> },
  { key: 'visitor-management', label: 'Visitor Management', icon: <Users size={18} /> },
  { key: 'donations', label: 'Donations', icon: <Heart size={18} /> },
  { key: 'settings', label: 'Settings', icon: <Settings size={18} /> },
]
