"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, ChevronLeft, ChevronRight, Clock, MapPin, RefreshCw, ExternalLink, XCircle, AlertCircle, Settings, Link2 } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  start: string;
  end: string;
  isAllDay: boolean;
  color: string | null;
  status: string;
  organizer: string;
  attendees: any[];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Event colors from Google Calendar
const EVENT_COLORS: Record<string, string> = {
  '1': 'bg-red-500',
  '2': 'bg-orange-500',
  '3': 'bg-yellow-500',
  '4': 'bg-green-500',
  '5': 'bg-teal-500',
  '6': 'bg-blue-500',
  '7': 'bg-purple-500',
  '8': 'bg-pink-500',
  '9': 'bg-gray-500',
  '10': 'bg-cyan-500',
  '11': 'bg-lime-500',
  'default': 'bg-blue-500'
};

export default function SchedulePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const [composioConnected, setComposioConnected] = useState<boolean | null>(null);
  const [noEventsMessage, setNoEventsMessage] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  // Check Composio connection status
  const checkConnection = useCallback(async () => {
    try {
      const res = await fetch('/api/composio/mcp-status');
      if (res.ok) {
        const data = await res.json();
        setComposioConnected(data.connected || false);
      }
    } catch {
      setComposioConnected(false);
    }
  }, []);

  // Fetch events from Google Calendar
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    setErrorHint(null);
    
    try {
      const response = await fetch(`/api/composio/calendar-events?year=${year}&month=${month}`);
      
      if (!response.ok) {
        const data = await response.json();
        
        // Set helpful error messages based on the error
        if (data.error?.includes('not configured') || data.error?.includes('not found')) {
          setError('Composio API Key belum di-setup');
          setErrorHint('Silakan masuk ke Settings → Composio Integration untuk menghubungkan akun Composio kamu.');
        } else if (data.error?.includes('Google Calendar') || data.error?.includes('Calendar')) {
          setError('Google Calendar belum terhubung');
          setErrorHint('Buka Settings → Composio Integration, lalu reconnect dengan memilih Google Calendar.');
        } else if (data.details?.includes('401') || data.details?.includes('403')) {
          setError('Composio Authentication failed');
          setErrorHint('API key mungkin expired. Coba reconnect di Settings page.');
        } else {
          setError(data.error || 'Failed to fetch events');
          setErrorHint(data.hint || null);
        }
        return;
      }

      const data = await response.json();
      console.log('Fetch events response:', data);
      setEvents(data.events || []);
      setNoEventsMessage(data.message || null);
    } catch (err) {
      console.error('Fetch events error:', err);
      setError('Gagal mengambil data dari Google Calendar');
      setErrorHint('Coba refresh atau hubungi admin.');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    if (status === "authenticated") {
      checkConnection();
    }
  }, [status, checkConnection]);

  useEffect(() => {
    if (status === "authenticated" && composioConnected === true) {
      fetchEvents();
    } else if (composioConnected === false) {
      setLoading(false);
      setError('Composio belum terhubung');
      setErrorHint('Silakan hubungkan Composio di Settings page terlebih dahulu.');
    }
  }, [status, composioConnected, fetchEvents]);

  // Navigate months
  const prevMonth = () => {
    setCurrentDate(new Date(year, currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Build calendar grid
  const buildCalendarGrid = () => {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const daysInPrevMonth = new Date(year, month - 1, 0).getDate();
    
    const grid: Array<{ day: number; month: 'prev' | 'current' | 'next'; date: Date }> = [];

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      grid.push({
        day,
        month: 'prev',
        date: new Date(year, month - 2, day)
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      grid.push({
        day,
        month: 'current',
        date: new Date(year, month - 1, day)
      });
    }

    // Next month days
    const remainingDays = 42 - grid.length;
    for (let day = 1; day <= remainingDays; day++) {
      grid.push({
        day,
        month: 'next',
        date: new Date(year, month, day)
      });
    }

    return grid;
  };

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      if (event.isAllDay) {
        return event.start.split('T')[0] === dateStr;
      }
      return event.start.startsWith(dateStr);
    });
  };

  // Format time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Check if today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  const calendarGrid = buildCalendarGrid();

  // Show setup prompt if Composio not connected
  if (composioConnected === false) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Schedule</h1>
              <p className="text-muted-foreground">
                Google Calendar Sync
              </p>
            </div>
          </div>
        </div>

        {/* Setup Card */}
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-900/20">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="p-4 rounded-full bg-amber-100 dark:bg-amber-900/50">
                <AlertCircle className="w-12 h-12 text-amber-600" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">
                  Composio Integration Required
                </h2>
                <p className="text-muted-foreground max-w-md">
                  Untuk menampilkan jadwal dari Google Calendar, kamu perlu menghubungkan Composio terlebih dahulu.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 text-left w-full max-w-lg space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-blue-600" />
                  Langkah-langkah:
                </h3>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">1</span>
                    <span>Buka menu <strong>Settings</strong> di sidebar</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">2</span>
                    <span>Cari bagian <strong>Composio Integration</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">3</span>
                    <span>Masukkan <strong>Consumer API Key</strong> dari composio.dev</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">4</span>
                    <span>Klik <strong>Connect to Composio</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">5</span>
                    <span>Pastikan <strong>Google Calendar</strong> dicentang saat diminta</span>
                  </li>
                </ol>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => router.push('/settings')} className="gap-2">
                  <Settings className="w-4 h-4" />
                  Open Settings
                </Button>
                <Button variant="outline" onClick={checkConnection} className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Check Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Schedule</h1>
            <p className="text-muted-foreground">
              Google Calendar Sync • {events.length} events this month
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={prevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={fetchEvents} disabled={loading || composioConnected !== true}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Sync
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardContent className="py-4 px-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-600 dark:text-red-400">{error}</p>
                  {errorHint && (
                    <p className="text-sm text-red-500 dark:text-red-300 mt-1">{errorHint}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" size="sm" onClick={fetchEvents}>
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
                <Button variant="outline" size="sm" onClick={() => router.push('/settings')}>
                  <Settings className="w-3 h-3 mr-1" />
                  Settings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Month/Year Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">
          {MONTHS[month - 1]} {year}
        </h2>
      </div>

      {/* Calendar Grid */}
      <Card className="overflow-hidden">
        <div className="divide-y divide-border">
          {/* Day Headers */}
          <div className="grid grid-cols-7 bg-muted/50">
            {DAYS.map(day => (
              <div key={day} className="py-3 text-center text-sm font-semibold text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {loading || composioConnected === null ? (
              <div className="col-span-7 flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-muted-foreground">Checking connection...</p>
              </div>
            ) : (
              calendarGrid.map((cell, index) => {
                const dayEvents = getEventsForDay(cell.date);
                const isCurrentMonth = cell.month === 'current';
                
                return (
                  <div
                    key={index}
                    className={`
                      min-h-[120px] p-2 border-r border-b border-border
                      ${!isCurrentMonth ? 'bg-muted/30' : 'bg-background'}
                      ${isToday(cell.date) ? 'ring-2 ring-inset ring-blue-500' : ''}
                    `}
                  >
                    {/* Day Number */}
                    <div className={`
                      text-sm font-medium mb-1
                      ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}
                      ${isToday(cell.date) ? 'w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center' : ''}
                    `}>
                      {cell.day}
                    </div>

                    {/* Events */}
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map(event => (
                        <button
                          key={event.id}
                          onClick={() => setSelectedEvent(event)}
                          className={`
                            w-full text-left text-xs px-2 py-1 rounded-md truncate
                            text-white font-medium hover:opacity-90 transition-opacity
                            ${EVENT_COLORS[event.color || 'default']}
                          `}
                          title={event.title}
                        >
                          {event.isAllDay ? '📅 ' : '🕐 '}
                          {event.title}
                        </button>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-muted-foreground pl-2">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Card>

      {/* Empty State */}
      {events.length === 0 && !loading && !error && composioConnected === true && (
        <Card className="border-dashed border-2 border-muted-foreground/30">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="text-6xl">📅</div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Tidak ada event di bulan ini</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {noEventsMessage || 'Calendar kamu kosong untuk ' + MONTHS[month - 1] + ' ' + year}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={prevMonth}>
                ← Bulan Sebelumnya
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Bulan Ini
              </Button>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                Bulan Berikutnya →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <CardContent className="py-3 px-4">
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="font-medium">Syncs from:</span>
            <Badge variant="outline" className="font-normal">
              📅 Google Calendar
            </Badge>
            <span className="text-xs">Automatically fetches all events from your primary calendar</span>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => router.push('/settings')}>
              <Settings className="w-3 h-3 mr-1" />
              Manage Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className={`
                  w-4 h-4 rounded-full mt-1
                  ${EVENT_COLORS[selectedEvent.color || 'default']}
                `} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEvent(null)}
                  className="ml-auto"
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>

              <div>
                <h3 className="text-xl font-bold">{selectedEvent.title}</h3>
                <Badge variant="outline" className="mt-2">
                  {selectedEvent.isAllDay ? 'All Day' : `${formatTime(selectedEvent.start)} - ${formatTime(selectedEvent.end)}`}
                </Badge>
              </div>

              {selectedEvent.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}

              {selectedEvent.description && (
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Description:</p>
                  <p className="whitespace-pre-wrap">{selectedEvent.description}</p>
                </div>
              )}

              {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                <div className="text-sm">
                  <p className="font-medium mb-2">Attendees:</p>
                  <div className="space-y-1">
                    {selectedEvent.attendees.slice(0, 5).map((attendee, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-muted-foreground">
                        <span>{attendee.displayName || attendee.email}</span>
                        {attendee.responseStatus && (
                          <Badge variant="outline" className="text-xs">
                            {attendee.responseStatus === 'accepted' ? '✓' : attendee.responseStatus}
                          </Badge>
                        )}
                      </div>
                    ))}
                    {selectedEvent.attendees.length > 5 && (
                      <p className="text-xs text-muted-foreground">
                        +{selectedEvent.attendees.length - 5} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedEvent(null)}
                >
                  Close
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    window.open(
                      `https://calendar.google.com/calendar/event?eid=${btoa(selectedEvent.id)}`,
                      '_blank'
                    );
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in Calendar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
