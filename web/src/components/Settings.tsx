interface SettingsProps {
  onClose: () => void;
}

export default function Settings({ onClose }: SettingsProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Configuración</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Prompt del Sistema</h3>
            <p className="text-sm text-gray-600">
              El prompt del sistema se carga desde el archivo <code>system-prompt.txt</code> en el servidor.
              Para modificarlo, edita ese archivo y reinicia el servidor.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2">LLM Provider</h3>
            <p className="text-sm text-gray-600">
              Configurado mediante variables de entorno (.env). 
              Soporta OpenAI (por defecto) o Generic HTTP endpoint.
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="mt-6 px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}


