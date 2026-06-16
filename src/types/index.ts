export type MemberStatus = 'visitor' | 'attendee' | 'member' | 'inactive' | 'pastor' | 'assistant_pastor' | 'elder' | 'worship_leader' | 'worship_pastor'
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say'
export type UserRole = 'super_admin' | 'pastor' | 'staff' | 'volunteer' | 'member'

export interface Person {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  mobile: string | null
  birthday: string | null
  gender: Gender | null
  photo_url: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  zip: string | null
  status: MemberStatus
  household_id: string | null
  envelope_number: string | null
  notes: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

export interface Household {
  id: string
  name: string
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  zip: string | null
  created_at: string
}

export interface Fund {
  id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
}

export interface GivingTransaction {
  id: string
  person_id: string | null
  household_id: string | null
  fund_id: string
  amount: number
  method: 'card' | 'ach' | 'cash' | 'check' | 'other'
  check_number: string | null
  stripe_payment_intent_id: string | null
  given_at: string
  notes: string | null
  created_at: string
  // joined
  person?: Pick<Person, 'id' | 'first_name' | 'last_name'>
  fund?: Pick<Fund, 'id' | 'name'>
}

export interface Group {
  id: string
  name: string
  description: string | null
  type: 'life_group' | 'ministry' | 'committee' | 'class' | 'other'
  leader_id: string | null
  is_active: boolean
  meeting_day: string | null
  meeting_time: string | null
  location: string | null
  created_at: string
}

export interface GroupMember {
  id: string
  group_id: string
  person_id: string
  role: 'leader' | 'co_leader' | 'member'
  joined_at: string
}

export interface Service {
  id: string
  name: string
  service_date: string
  service_time: string | null
  type: 'sunday_am' | 'sunday_pm' | 'wednesday' | 'special' | 'other'
  notes: string | null
  created_at: string
}

export interface AttendanceRecord {
  id: string
  person_id: string
  service_id: string
  checked_in_at: string
  checked_in_by: string | null
}

export interface CustomField {
  id: string
  entity_type: 'person' | 'group' | 'household'
  field_name: string
  field_type: 'text' | 'number' | 'date' | 'boolean' | 'select'
  options: string[] | null
  is_required: boolean
  sort_order: number
}

export interface CustomFieldValue {
  id: string
  field_id: string
  entity_id: string
  value: string | null
}
