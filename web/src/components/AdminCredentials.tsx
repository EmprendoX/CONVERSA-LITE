import { useEffect, useMemo, useState } from 'react';
import { getCredentials, saveCredentialsApi, validateCredentialsApi, waSend, metaSend, type Provider } from '../api/client';
import { useEffect as useEffect2 } from 'react';

const PROVIDERS: Provider[] = ['google', 'twilio', 'meta', 'vapi', 'elevenlabs'];

const FIELDS: Record<Provider, string[]> = {
  google: ['clientId', 'clientSecret', 'redirectUri', 'calendarId'],
  // Twilio WhatsApp: mínimos y campos comunes
  twilio: ['accountSid', 'authToken', 'fromNumber', 'messagingServiceSid'],
  // Meta WhatsApp Cloud API: campos típicos
  meta: ['appId', 'appSecret', 'verifyToken', 'accessToken', 'phoneNumberId', 'businessAccountId'],
  vapi: ['apiKey'],
  elevenlabs: ['apiKey']
};

const TITLES: Record<Provider, string> = {
  google: 'Google (Calendar)',
  twilio: 'Twilio',
  meta: 'WhatsApp/Meta',
  vapi: 'Vapi (voz)',
  elevenlabs: 'ElevenLabs (voz)'
};

const CHECKLIST: Record<Provider, { items: string[]; docs?: string[] }> = {
  google: {
    items: [
      'clientId y clientSecret (OAuth app web)',
      'redirectUri: http://localhost:3000/api/calendar/callback',
      'calendarId (primary por defecto)'
    ],
    docs: ['https://console.cloud.google.com/apis/credentials']
  },
  twilio: {
    items: [
      'accountSid y authToken',
      'fromNumber (WhatsApp E.164) o messagingServiceSid',
      'Webhook inbound: /api/wa/webhook (POST x-www-form-urlencoded)'
    ],
    docs: ['https://www.twilio.com/whatsapp']
  },
  meta: {
    items: [
      'accessToken y phoneNumberId',
      'appId, appSecret (firma) y verifyToken (verificación GET)',
      'Suscribirse al webhook: /api/meta/webhook'
    ],
    docs: ['https://developers.facebook.com/docs/whatsapp/cloud-api']
  },
  vapi: { items: ['apiKey'], docs: ['https://docs.vapi.ai'] },
  elevenlabs: { items: ['apiKey'], docs: ['https://docs.elevenlabs.io'] }
};

const AdminCredentials = (): JSX.Element => {
  const [active, setActive] = useState<Provider>('google');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [values, setValues] = useState<Record<Provider, Record<string, string>>>({
    google: {}, twilio: {}, meta: {}, vapi: {}, elevenlabs: {}
  });
  const [testTo, setTestTo] = useState('');
  const [testText, setTestText] = useState('');
  const [testMediaUrl, setTestMediaUrl] = useState('');
  const [testCaption, setTestCaption] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateLang, setTemplateLang] = useState('es_MX');
  const [sends, setSends] = useState<Array<{ provider: string; to: string; type: string; ok: boolean; error?: string; ts: string }>>([]);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        const masked = await getCredentials();
        setValues((prev) => ({ ...prev, ...(masked as any) }));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error cargando credenciales');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect2(() => {
    let timer: any;
    async function fetchLogs() {
      try {
        const res = await fetch('/api/admin/logs/sends');
        if (res.ok) setSends(await res.json());
      } catch {}
      timer = setTimeout(fetchLogs, 5000);
    }
    fetchLogs();
    return () => clearTimeout(timer);
  }, []);

  const fields = useMemo(() => FIELDS[active], [active]);
  const data = values[active] || {};

  const setField = (k: string, v: string) => {
    setValues((prev) => ({ ...prev, [active]: { ...(prev[active] || {}), [k]: v } }));
  };

  const handleSave = async () => {
    try {
      setLoading(true); setError(null); setOk(null);
      await saveCredentialsApi(active, values[active] || {});
      setOk('Credenciales guardadas');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    try {
      setLoading(true); setError(null); setOk(null);
      const res = await validateCredentialsApi(active);
      setOk(res.ok ? `OK: ${res.details ?? ''}` : `Invalidas: ${res.details ?? ''}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo validar');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSend = async (mode: 'text'|'media'|'template') => {
    try {
      setLoading(true); setError(null); setOk(null);
      if (!testTo) throw new Error('Campo "to" requerido');
      if (active === 'twilio') {
        if (mode === 'media') await waSend({ to: testTo, mediaUrl: testMediaUrl, caption: testCaption });
        else if (mode === 'template') await waSend({ to: testTo, templateText: testText });
        else await waSend({ to: testTo, text: testText });
      } else if (active === 'meta') {
        if (mode === 'media') await metaSend({ to: testTo, mediaUrl: testMediaUrl, caption: testCaption, type: 'image' });
        else if (mode === 'template') await metaSend({ to: testTo, template: { name: templateName, language: templateLang, components: [] } });
        else await metaSend({ to: testTo, text: testText });
      } else {
        throw new Error('Quick send soportado sólo para Twilio/Meta');
      }
      setOk('Enviado');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="admin-credentials" aria-labelledby="creds-title">
      <h3 id="creds-title">Credenciales</h3>
      {loading ? <p className="admin__status">Procesando…</p> : null}
      {error ? <p className="admin__error">{error}</p> : null}
      {ok ? <p className="admin__ok">{ok}</p> : null}

      <div className="creds__tabs">
        {PROVIDERS.map((p) => (
          <button key={p} className={`creds__tab ${active === p ? 'is-active' : ''}`} onClick={() => setActive(p)}>
            {TITLES[p]}
          </button>
        ))}
      </div>

      <div className="creds__form">
        {fields.map((k) => (
          <label key={k} className="creds__field">
            {k}
            <input
              type={k.toLowerCase().includes('secret') || k.toLowerCase().includes('token') || k.toLowerCase().includes('key') ? 'password' : 'text'}
              value={data[k] ?? ''}
              onChange={(e) => setField(k, e.target.value)}
              placeholder={k}
            />
          </label>
        ))}
        <div className="creds__actions">
          <button type="button" onClick={handleSave}>Guardar</button>
          <button type="button" onClick={handleValidate}>Probar conexión</button>
        </div>
      </div>

      {(active === 'twilio' || active === 'meta') && (
        <div className="creds__quick">
          <h4>Prueba rápida ({active})</h4>
          <label>to<input value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="+52..." /></label>
          <label>text<input value={testText} onChange={(e) => setTestText(e.target.value)} placeholder="mensaje o plantilla" /></label>
          <div className="creds__quick-actions">
            <button type="button" onClick={() => handleQuickSend('text')}>Enviar texto</button>
            <button type="button" onClick={() => handleQuickSend('template')}>Enviar plantilla</button>
          </div>
          <label>mediaUrl<input value={testMediaUrl} onChange={(e) => setTestMediaUrl(e.target.value)} placeholder="https://..." /></label>
          <label>caption<input value={testCaption} onChange={(e) => setTestCaption(e.target.value)} placeholder="opcional" /></label>
          {active === 'meta' && (
            <>
              <label>template.name<input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="mi_template" /></label>
              <label>template.language<input value={templateLang} onChange={(e) => setTemplateLang(e.target.value)} placeholder="es_MX" /></label>
            </>
          )}
          <button type="button" onClick={() => handleQuickSend('media')}>Enviar media</button>
        </div>
      )}

      <div className="creds__logs">
        <h4>Historial de envíos (últimos 50)</h4>
        <ul>
          {sends.map((s, i) => (
            <li key={i}>
              <code>{s.ts}</code> · {s.provider} → {s.to} · {s.type} · {s.ok ? 'OK' : `ERR: ${s.error}`}
            </li>
          ))}
        </ul>
      </div>

      <div className="creds__checklist">
        <h4>Checklist de credenciales ({active})</h4>
        <ul>
          {(CHECKLIST[active]?.items || []).map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        {CHECKLIST[active]?.docs?.length ? (
          <p>
            Docs:
            {CHECKLIST[active].docs!.map((u) => (
              <>
                {' '}<a key={u} href={u} target="_blank" rel="noreferrer">{u}</a>
              </>
            ))}
          </p>
        ) : null}
      </div>
    </section>
  );
};

export default AdminCredentials;


