import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useClerk } from '@clerk/clerk-react';
import { toast } from 'sonner';
import { isSessionExpiredError } from '@/lib/apiErrors';
import { listAdminEvents, type AdminEventRecord } from '@/lib/adminApi';

function formatTimestamp(value?: string) {
  if (!value) {
    return 'Unknown time';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString();
}

export function AdminAuditLogsPage() {
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const [events, setEvents] = useState<AdminEventRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const eventTypes = useMemo(() => {
    const unique = new Set(events.map((event) => event.type).filter(Boolean));
    return ['all', ...Array.from(unique).sort()];
  }, [events]);

  const filteredEvents = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return events.filter((event) => {
      const matchesType = typeFilter === 'all' || event.type === typeFilter;
      const serialized = JSON.stringify(event).toLowerCase();
      const matchesSearch = !normalizedSearch || serialized.includes(normalizedSearch);
      return matchesType && matchesSearch;
    });
  }, [events, searchQuery, typeFilter]);

  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);
      try {
        const data = await listAdminEvents(getToken);
        setEvents(data);
      } catch (error) {
        if (isSessionExpiredError(error)) {
          await signOut({ redirectUrl: '/admin/login' });
          navigate('/admin/login', { replace: true });
          return;
        }

        const message = error instanceof Error ? error.message : 'Could not load audit logs.';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadEvents();
  }, [getToken, navigate, signOut]);

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        Audit Logs
      </h2>

      <div className="bg-white border border-[#0B0B0D]/10 p-6 space-y-3">
        <div className="grid md:grid-cols-2 gap-2">
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="border border-[#0B0B0D]/20 px-3 py-2"
          >
            {eventTypes.map((type) => (
              <option key={type} value={type}>
                {type === 'all' ? 'All event types' : type}
              </option>
            ))}
          </select>
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="border border-[#0B0B0D]/20 px-3 py-2"
            placeholder="Search logs"
          />
        </div>

        {isLoading ? (
          <p className="text-[#6E6E73]">Loading audit logs...</p>
        ) : filteredEvents.length === 0 ? (
          <p className="text-[#6E6E73]">No audit events found.</p>
        ) : (
          <div className="divide-y divide-[#0B0B0D]/10">
            {filteredEvents.map((event, index) => (
              <details key={`${event.type}-${event.createdAt ?? index}-${index}`} className="py-3">
                <summary className="cursor-pointer list-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="font-medium">{event.type}</span>
                  <span className="text-sm text-[#6E6E73]">{formatTimestamp(event.createdAt)}</span>
                </summary>
                <pre className="mt-2 text-xs bg-[#F6F6F2] border border-[#0B0B0D]/10 p-3 overflow-x-auto whitespace-pre-wrap break-words">
                  {JSON.stringify(event, null, 2)}
                </pre>
              </details>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
