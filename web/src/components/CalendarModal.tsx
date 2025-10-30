import { useEffect, useState } from 'react';
import { getCalendarAuthUrl, getAvailability, createCalendarEvent, deleteCalendarEvent } from '../api/client';

interface Props {
  open: boolean;
  onClose: () => void;
}

const isoNow = () => new Date().toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm

const CalendarModal = ({ open, onClose }: Props): JSX.Element | null => {
  const [from, setFrom] = useState(isoNow());
  const [to, setTo] = useState(isoNow());
  const [busy, setBusy] = useState<Array<{ start: string; end: string }>>([]);
  const [summary, setSummary] = useState('Cita');
  const [startISO, setStartISO] = useState(isoNow());
  const [endISO, setEndISO] = useState(isoNow());
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStatus(null);
    setError(null);
  }, [open]);

  if (!open) return null;

  const handleAuth = async () => {
    try {
      const { url } = await getCalendarAuthUrl();
      window.open(url, '_blank');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo abrir autorización');
    }
  };

  const handleAvailability = async () => {
    try {
      setError(null);
      const res = await getAvailability({ from: new Date(from).toISOString(), to: new Date(to).toISOString() });
      setBusy(res.busy);
      setStatus(`Ventana ${res.timeMin} → ${res.timeMax}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error consultando disponibilidad');
    }
  };

  const handleCreate = async () => {
    try {
      setError(null);
      const attendees = email ? [{ email }] : [];
      const ev = await createCalendarEvent({ summary, startISO: new Date(startISO).toISOString(), endISO: new Date(endISO).toISOString(), attendees });
      setStatus(`Evento creado: ${ev.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error creando evento');
    }
  };

  const handleCancel = async () => {
    const id = prompt('ID de evento a cancelar');
    if (!id) return;
    try {
      await deleteCalendarEvent(id);
      setStatus('Evento cancelado');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cancelando evento');
    }
  };

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="cal-title">
      <div className="modal__card">
        <header className="modal__header">
          <h3 id="cal-title">Agendar cita (Google Calendar)</h3>
          <button className="modal__close" onClick={onClose} aria-label="Cerrar">×</button>
        </header>
        <div className="modal__body">
          {status ? <p className="modal__status">{status}</p> : null}
          {error ? <p className="modal__error">{error}</p> : null}

          <section className="modal__section">
            <h4>1) Autorizar cuenta</h4>
            <button type="button" onClick={handleAuth}>Abrir consentimiento</button>
          </section>

          <section className="modal__section">
            <h4>2) Disponibilidad</h4>
            <label>Desde<input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
            <label>Hasta<input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} /></label>
            <button type="button" onClick={handleAvailability}>Consultar</button>
            {busy.length ? (
              <ul className="busy__list">
                {busy.map((b, i) => (
                  <li key={i}>{b.start} — {b.end}</li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className="modal__section">
            <h4>3) Crear cita</h4>
            <label>Título<input value={summary} onChange={(e) => setSummary(e.target.value)} /></label>
            <label>Inicio<input type="datetime-local" value={startISO} onChange={(e) => setStartISO(e.target.value)} /></label>
            <label>Fin<input type="datetime-local" value={endISO} onChange={(e) => setEndISO(e.target.value)} /></label>
            <label>Email invitado (opcional)<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <div className="modal__row">
              <button type="button" onClick={handleCreate}>Crear</button>
              <button type="button" onClick={handleCancel}>Cancelar por ID</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CalendarModal;


