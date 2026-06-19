'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Music, BookOpen, Search, ChevronRight, Printer } from 'lucide-react'
import { format } from 'date-fns'

interface Props { services: any[]; songs: any[] }

const ITEM_TYPES = [
  { value: 'song',         label: 'Song' },
  { value: 'scripture',    label: 'Scripture' },
  { value: 'prayer',       label: 'Prayer' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'offering',     label: 'Offering' },
  { value: 'sermon',       label: 'Sermon' },
  { value: 'other',        label: 'Other' },
]

const KEYS = ['A','Bb','B','C','C#','D','Eb','E','F','F#','G','Ab']

export function WorshipDashboard({ services: initialServices, songs: initialSongs }: Props) {
  const [tab, setTab] = useState<'services' | 'songs'>('services')
  const [services, setServices] = useState(initialServices)
  const [songs, setSongs] = useState(initialSongs)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [serviceItems, setServiceItems] = useState<any[]>([])
  const [selectedSong, setSelectedSong] = useState<any>(null)
  const [songSearch, setSongSearch] = useState('')

  // New service form
  const [newServiceOpen, setNewServiceOpen] = useState(false)
  const [serviceForm, setServiceForm] = useState({ name: 'Sunday Service', service_date: new Date().toISOString().split('T')[0], service_time: '10:00', notes: '' })

  // New song form
  const [newSongOpen, setNewSongOpen] = useState(false)
  const [songForm, setSongForm] = useState({ title: '', author: '', ccli_number: '', default_key: '', tempo: '', themes: '', lyrics: '', chord_chart: '', notes: '' })

  // Add item form
  const [addItemOpen, setAddItemOpen] = useState(false)
  const [itemForm, setItemForm] = useState({ type: 'song', title: '', song_id: '', duration_minutes: '', notes: '' })

  const [loading, setLoading] = useState(false)

  async function createService(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.from('worship_services')
      .insert({ ...serviceForm, service_time: serviceForm.service_time || null })
      .select('*, service_items(count)').single()
    if (!error && data) {
      setServices(s => [data, ...s])
      setNewServiceOpen(false)
      openService(data)
    }
    setLoading(false)
  }

  async function openService(service: any) {
    setSelectedService(service)
    setSelectedSong(null)
    const supabase = createClient()
    const { data } = await supabase.from('service_items')
      .select('*, songs(title, author, default_key)')
      .eq('worship_service_id', service.id)
      .order('sort_order')
    setServiceItems(data ?? [])
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedService) return
    setLoading(true)
    const supabase = createClient()
    const payload = {
      worship_service_id: selectedService.id,
      type: itemForm.type,
      title: itemForm.title,
      song_id: itemForm.song_id || null,
      duration_minutes: itemForm.duration_minutes ? parseInt(itemForm.duration_minutes) : null,
      notes: itemForm.notes || null,
      sort_order: serviceItems.length,
    }
    const { data, error } = await supabase.from('service_items')
      .insert(payload).select('*, songs(title, author, default_key)').single()
    if (!error && data) {
      setServiceItems(i => [...i, data])
      setAddItemOpen(false)
      setItemForm({ type: 'song', title: '', song_id: '', duration_minutes: '', notes: '' })
    }
    setLoading(false)
  }

  async function removeItem(id: string) {
    const supabase = createClient()
    await supabase.from('service_items').delete().eq('id', id)
    setServiceItems(i => i.filter(x => x.id !== id))
  }

  async function createSong(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.from('songs').insert({
      title: songForm.title,
      author: songForm.author || null,
      ccli_number: songForm.ccli_number || null,
      default_key: songForm.default_key || null,
      tempo: songForm.tempo || null,
      themes: songForm.themes ? songForm.themes.split(',').map(t => t.trim()) : [],
      lyrics: songForm.lyrics || null,
      chord_chart: songForm.chord_chart || null,
      notes: songForm.notes || null,
    }).select().single()
    if (!error && data) {
      setSongs(s => [...s, data].sort((a, b) => a.title.localeCompare(b.title)))
      setNewSongOpen(false)
      setSelectedSong(data)
      setTab('songs')
      setSongForm({ title: '', author: '', ccli_number: '', default_key: '', tempo: '', themes: '', lyrics: '', chord_chart: '', notes: '' })
    }
    setLoading(false)
  }

  const filteredSongs = songs.filter(s =>
    s.title.toLowerCase().includes(songSearch.toLowerCase()) ||
    s.author?.toLowerCase().includes(songSearch.toLowerCase())
  )

  const totalMinutes = serviceItems.reduce((sum, i) => sum + (i.duration_minutes ?? 0), 0)

  function printRunSheet() {
    if (!selectedService) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><head><title>${selectedService.name} — Run Sheet</title>
      <style>
        body { font-family: sans-serif; max-width: 700px; margin: 40px auto; color: #111; }
        h1 { font-size: 22px; margin-bottom: 4px; }
        p.meta { color: #666; font-size: 14px; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; border-bottom: 2px solid #000; padding: 8px 6px; font-size: 13px; }
        td { padding: 10px 6px; border-bottom: 1px solid #ddd; font-size: 14px; vertical-align: top; }
        .type { color: #666; font-size: 12px; text-transform: uppercase; }
        .dur { color: #666; font-size: 12px; }
        @media print { body { margin: 20px; } }
      </style></head><body>
      <h1>${selectedService.name}</h1>
      <p class="meta">${format(new Date(selectedService.service_date), 'EEEE, MMMM d, yyyy')}${selectedService.service_time ? ' · ' + selectedService.service_time : ''}${totalMinutes ? ' · ~' + totalMinutes + ' min' : ''}</p>
      <table>
        <thead><tr><th>#</th><th>Item</th><th>Details</th><th>Time</th></tr></thead>
        <tbody>
          ${serviceItems.map((item, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>
                <div>${item.title}</div>
                <div class="type">${item.type}</div>
              </td>
              <td>${item.songs ? `${item.songs.author ?? ''} · Key of ${item.songs.default_key ?? '?'}` : item.notes ?? ''}</td>
              <td class="dur">${item.duration_minutes ? item.duration_minutes + ' min' : ''}</td>
            </tr>`).join('')}
        </tbody>
      </table>
      </body></html>`)
    win.document.close()
    win.print()
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Worship</h2>
        <div className="flex gap-2">
          <Dialog open={newSongOpen} onOpenChange={setNewSongOpen}>
            <DialogTrigger>
              <Button variant="outline" size="sm" className="gap-2"><Music className="w-4 h-4" /> Add Song</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Add Song to Library</DialogTitle></DialogHeader>
              <form onSubmit={createSong} className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 col-span-2">
                    <Label>Title *</Label>
                    <Input value={songForm.title} onChange={e => setSongForm(f => ({ ...f, title: e.target.value }))} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Author / Artist</Label>
                    <Input value={songForm.author} onChange={e => setSongForm(f => ({ ...f, author: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>CCLI #</Label>
                    <Input value={songForm.ccli_number} onChange={e => setSongForm(f => ({ ...f, ccli_number: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Default Key</Label>
                    <Select value={songForm.default_key} onValueChange={v => setSongForm(f => ({ ...f, default_key: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select key" /></SelectTrigger>
                      <SelectContent>{KEYS.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tempo</Label>
                    <Input value={songForm.tempo} onChange={e => setSongForm(f => ({ ...f, tempo: e.target.value }))} placeholder="e.g. 72 BPM, Slow" />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label>Themes (comma separated)</Label>
                    <Input value={songForm.themes} onChange={e => setSongForm(f => ({ ...f, themes: e.target.value }))} placeholder="worship, praise, communion" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Lyrics</Label>
                  <Textarea value={songForm.lyrics} onChange={e => setSongForm(f => ({ ...f, lyrics: e.target.value }))} rows={6} placeholder="Paste full lyrics here…" className="font-mono text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label>Chord Chart / Notes</Label>
                  <Textarea value={songForm.chord_chart} onChange={e => setSongForm(f => ({ ...f, chord_chart: e.target.value }))} rows={4} placeholder="Chord progressions, key changes, etc." className="font-mono text-sm" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Saving…' : 'Add to Library'}</Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={newServiceOpen} onOpenChange={setNewServiceOpen}>
            <DialogTrigger>
              <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> New Service</Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle>Create Service Plan</DialogTitle></DialogHeader>
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
                  <Label>Notes</Label>
                  <Textarea value={serviceForm.notes} onChange={e => setServiceForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating…' : 'Create Service'}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {(['services', 'songs'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
            {t === 'services' ? `Service Plans (${services.length})` : `Song Library (${songs.length})`}
          </button>
        ))}
      </div>

      {/* SERVICES TAB */}
      {tab === 'services' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Service list */}
          <div className="space-y-2">
            {services.length === 0 ? (
              <p className="text-sm text-slate-400 px-1">No service plans yet.</p>
            ) : services.map(s => (
              <button key={s.id} onClick={() => openService(s)}
                className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${selectedService?.id === s.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'}`}>
                <p className="font-medium">{s.name}</p>
                <p className="text-xs opacity-70 mt-0.5">{format(new Date(s.service_date), 'MMM d, yyyy')} · {s.service_items?.[0]?.count ?? 0} items</p>
              </button>
            ))}
          </div>

          {/* Service builder */}
          <div className="lg:col-span-2">
            {!selectedService ? (
              <div className="flex items-center justify-center h-64 text-slate-400 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-center">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Select a service to build the order</p>
                </div>
              </div>
            ) : (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{selectedService.name}</CardTitle>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {format(new Date(selectedService.service_date), 'MMMM d, yyyy')}
                        {selectedService.service_time && ` · ${selectedService.service_time}`}
                        {totalMinutes > 0 && ` · ~${totalMinutes} min`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={printRunSheet} className="gap-1.5">
                        <Printer className="w-3.5 h-3.5" /> Print
                      </Button>
                      <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
                        <DialogTrigger>
                          <Button size="sm" className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Item</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-sm">
                          <DialogHeader><DialogTitle>Add to Service</DialogTitle></DialogHeader>
                          <form onSubmit={addItem} className="space-y-4 mt-2">
                            <div className="space-y-1.5">
                              <Label>Type *</Label>
                              <Select value={itemForm.type} onValueChange={v => {
                                const song = songs.find(s => s.id === itemForm.song_id)
                                setItemForm(f => ({ ...f, type: v, title: v === 'song' ? '' : v.charAt(0).toUpperCase() + v.slice(1), song_id: v !== 'song' ? '' : f.song_id }))
                              }}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{ITEM_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            {itemForm.type === 'song' ? (
                              <div className="space-y-1.5">
                                <Label>Song *</Label>
                                <Select value={itemForm.song_id} onValueChange={v => {
                                  const song = songs.find(s => s.id === v)
                                  setItemForm(f => ({ ...f, song_id: v, title: song?.title ?? '' }))
                                }}>
                                  <SelectTrigger><SelectValue placeholder="Select a song" /></SelectTrigger>
                                  <SelectContent>
                                    {songs.map(s => <SelectItem key={s.id} value={s.id}>{s.title}{s.default_key ? ` (${s.default_key})` : ''}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                <Label>Title *</Label>
                                <Input value={itemForm.title} onChange={e => setItemForm(f => ({ ...f, title: e.target.value }))} required />
                              </div>
                            )}
                            <div className="space-y-1.5">
                              <Label>Duration (minutes)</Label>
                              <Input type="number" min="1" value={itemForm.duration_minutes} onChange={e => setItemForm(f => ({ ...f, duration_minutes: e.target.value }))} placeholder="Optional" />
                            </div>
                            <div className="space-y-1.5">
                              <Label>Notes</Label>
                              <Input value={itemForm.notes} onChange={e => setItemForm(f => ({ ...f, notes: e.target.value }))} />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading || (itemForm.type === 'song' && !itemForm.song_id)}>
                              {loading ? 'Adding…' : 'Add to Service'}
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {serviceItems.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm">No items yet — add songs, scripture, and more.</div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {serviceItems.map((item, i) => (
                        <div key={item.id} className="flex items-center gap-3 px-4 py-3 group">
                          <span className="text-xs text-slate-400 w-5 shrink-0">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{item.title}</p>
                            <p className="text-xs text-slate-400">
                              {item.type}
                              {item.songs?.author && ` · ${item.songs.author}`}
                              {item.songs?.default_key && ` · Key of ${item.songs.default_key}`}
                              {item.duration_minutes && ` · ${item.duration_minutes} min`}
                            </p>
                          </div>
                          <button onClick={() => removeItem(item.id)}
                            className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-600 transition-opacity shrink-0">
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* SONGS TAB */}
      {tab === 'songs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search songs…" value={songSearch} onChange={e => setSongSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="space-y-1">
              {filteredSongs.length === 0 ? (
                <p className="text-sm text-slate-400 px-1">No songs yet. Add one above.</p>
              ) : filteredSongs.map(song => (
                <button key={song.id} onClick={() => setSelectedSong(song)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${selectedSong?.id === song.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-100 text-slate-700'}`}>
                  <p className="font-medium">{song.title}</p>
                  <p className="text-xs opacity-70">{song.author ?? 'Unknown'}{song.default_key ? ` · ${song.default_key}` : ''}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            {!selectedSong ? (
              <div className="flex items-center justify-center h-64 text-slate-400 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-center">
                  <Music className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Select a song to view details</p>
                </div>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{selectedSong.title}</CardTitle>
                      <p className="text-sm text-slate-500 mt-1">
                        {selectedSong.author && `${selectedSong.author} · `}
                        {selectedSong.default_key && `Key of ${selectedSong.default_key} · `}
                        {selectedSong.tempo && `${selectedSong.tempo} · `}
                        {selectedSong.ccli_number && `CCLI #${selectedSong.ccli_number}`}
                      </p>
                      {selectedSong.themes?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {selectedSong.themes.map((t: string) => (
                            <span key={t} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedSong.lyrics && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Lyrics</p>
                      <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed bg-slate-50 rounded-md p-4">{selectedSong.lyrics}</pre>
                    </div>
                  )}
                  {selectedSong.chord_chart && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Chords / Notes</p>
                      <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono bg-slate-50 rounded-md p-4">{selectedSong.chord_chart}</pre>
                    </div>
                  )}
                  {selectedSong.notes && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Notes</p>
                      <p className="text-sm text-slate-600">{selectedSong.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
