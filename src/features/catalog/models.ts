// src/features/catalog/models.ts
export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
  placeholder?: string;
}

export const CATEGORY_MODELS: Record<string, FieldConfig[]> = {
  sensor: [
    { name: 'sensor_type', label: 'Tipo de Sensor', type: 'select', options: ['Temperatura', 'Humedad', 'Presión', 'Vibración'] },
    { name: 'accuracy', label: 'Precisión', type: 'text', placeholder: '±0.5°C' },
    { name: 'sampling_rate', label: 'Tasa de Muestreo', type: 'text' }
  ],
  gateway: [
    { name: 'max_devices', label: 'Capacidad Máxima Dispositivos', type: 'number' },
    { name: 'uplink_type', label: 'Tipo de Uplink', type: 'select', options: ['Ethernet', '4G/LTE', 'Wi-Fi'] },
    { name: 'protocols_supported', label: 'Protocolos Soportados', type: 'text' }
  ]
};