'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, CheckSquare, Search, Check } from 'lucide-react'
import { format } from 'date-fns'

interface Props {
  services: any[]
  people: any[]
}

export function AttendanceView({ services: initialServices, people }: Props) {
  const [services, setServices] = useState(initialServices)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [attendance, setAttendance] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [newServiceOpen, setNewServiceOpen] = useState(false)
  const [serviceForm, setServiceForm] = useState({
    name: 'Sunday Service', service_date: new Date().toISOString().split('T')[0],
    service_time: '10:00', type: 'sunday_am',
  })

  async function createService(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    const { data, error } = await supabase
      .from('services')
      .insert({ ...serviceForm, service_time: serviceForm.service_time || null })
      .select()
      .single()
    if (!error && data) {
      setServices(s => [{ ...data, attendance: [{ count: 0 }] }, ...s])
      setNewServiceOpen(false)
      openService({ ...data, attendance: [{ count: 0 }] })
    }
  }

  async function openService(service: any) {
    setSelectedService(service)
    setSearch('')
    const supabase = createClient()
    const { data } = await supabase
      .from('attendance')
      .select('person_id')
      .eq('service_id', service.id)
    setAttendance(new Set(data?.map((a: any) => a.person_id) ?? []))
  }

  async function toggleAttendance(personId: string) {
    if (!selectedService) return
    setLoadingId(personId)
    const supabase = createClient()
    const checked = attendance.has(personId)

    if (checked) {
      await supabase.from('attendance').delete()
        .eq('service_id', selectedService.id).eq('person_id', personId)
      setAttendance(a => { const n = new Set(a); n.delete(personId); return n })
    } else {
      await supabase.from('attendance').insert({ service_id: selectedService.id, person_id: personId })
      setAttendance(a => new Set(a).add(personId))
    }
    setLoadingId(null)
  }

  const filteredPeople = people.filter(p =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Attendance</h2>
          <p className="text-sm text-slate-500">{services.length} services</p>
        </div>
        <Dialog open={newServiceOpen} onOpenChange={setNewServiceOpen}>
          <DialogTrigger>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> New Service</Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Create Service</DialogTitle></DialogHeader>
            <form onSubmit={createService} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Service Name *</Label>
                <Input value={serviceForm.name} onChange={e => setServiceForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Date *</Label>
                  <Input type="date" value={serviceForm.service_date} onChange={e => setServiceForm(f => ({ ...f, service_date: e.target.value }))} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Time</Label>
                  <Input type="time" value={serviceForm.service_time} onChange={e => setServiceForm(f => ({ ...f, service_time: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={serviceForm.type} onValueChange={v => setServiceForm(f => ({ ...f, type: v as 'sunday_am' | 'sunday_pm' | 'wednesday' | 'special' | 'other' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sunday_am">Sunday AM</SelectItem>
                    <SelectItem value="sunday_pm">Sunday PM</SelectItem>
                    <SelectItem value="wednesday">Wednesday</SelectItem>
                    <SelectItem value="special">Special Event</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Create &amp; Take Attendance</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Services list */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-1">Services</p>
          {services.length === 0 ? (
            <p className="text-sm text-slate-400 px-1">No services yet.</p>
          ) : services.map(s => (
            <button
              key={s.id}
              onClick={() => openService(s)}
              className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                selectedService?.id === s.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <p className="font-medium">{s.name}</p>
              <p className="text-xs opacity-70 mt-0.5">
                {format(new Date(s.service_date), 'MMM d, yyyy')} · {s.attendance?.[0]?.count ?? 0} attended
              </p>
            </button>
          ))}
        </div>

        {/* Check-in panel */}
        <div className="lg:col-span-2">
          {!selectedService ? (
            <div className="flex items-center justify-center h-64 text-slate-400 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-center">
                <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Select a service to take attendance</p>
              </div>
            </div>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{selectedService.name}</CardTitle>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {format(new Date(selectedService.service_date), 'MMMM d, yyyy')} · {attendance.size} checked in
                    </p>
                  </div>
                </div>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input placeholder="Search people…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[480px] overflow-y-auto divide-y divide-slate-100">
                  {filteredPeople.map(p => {
                    const checked = attendance.has(p.id)
                    const loading = loadingId === p.id
                    return (
                      <button
                        key={p.id}
                        onClick={() => toggleAttendance(p.id)}
                        disabled={loading}
                        className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                          checked ? 'bg-green-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <span className={`font-medium ${checked ? 'text-green-700' : 'text-slate-900'}`}>
                          {p.first_name} {p.last_name}
                        </span>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          checked ? 'bg-green-500 border-green-500' : 'border-slate-300'
                        }`}>
                          {checked && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
