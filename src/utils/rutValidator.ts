export const validateRut = (rut: string): boolean => {
  if (!rut) return false;
  
  // Limpiar puntos y guión
  const value = rut.replace(/\./g, '').replace(/-/g, '');
  
  if (value.length < 8) return false;
  
  // Separar cuerpo y dígito verificador
  const body = value.slice(0, -1);
  const dv = value.slice(-1).toUpperCase();
  
  // Validar que el cuerpo sean solo números
  if (!/^[0-9]+$/.test(body)) return false;
  
  // Calcular DV esperado
  let sum = 0;
  let multiplier = 2;
  
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const mod = sum % 11;
  const expectedDv = mod === 0 ? '0' : mod === 1 ? 'K' : (11 - mod).toString();
  
  return dv === expectedDv;
};

export const formatRut = (rut: string): string => {
  if (!rut) return '';
  
  // Limpiar cualquier caracter que no sea número o K
  let value = rut.replace(/[^\dKk]/g, '').toUpperCase();
  
  // Si es muy corto, devolver tal cual
  if (value.length <= 1) return value;
  
  // Separar DV
  const dv = value.slice(-1);
  let body = value.slice(0, -1);
  
  // Formatear cuerpo con puntos
  body = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return `${body}-${dv}`;
};

export const cleanRut = (rut: string): string => {
  return rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
};