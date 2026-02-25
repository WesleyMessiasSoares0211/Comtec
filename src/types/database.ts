export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          name: string;
          main_category: 'Gateway' | 'Sensor' | 'Servicios' | 'Software'; // Columna principal
          sensor_category: 'ambiental' | 'mecánico' | 'eléctrico' | 'seguridad' | null; // Sub-filtro
          description: string;
          price: number;
          image_url: string;
          protocol: string;
          connectivity: string;
          sensor_type: string;
          specifications: Record<string, unknown>;
          datasheet_url: string;
          case_studies: CaseStudy[];          
          featured: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          main_category: 'Gateway' | 'Sensor' | 'Servicios' | 'Software'; // Columna principal
          sensor_category: 'ambiental' | 'mecánico' | 'eléctrico' | 'seguridad' | null; // Sub-filtro
          description: string;
          price: number;
          image_url: string;
          protocol: string;
          connectivity: string;
          sensor_type: string;
          specifications: Record<string, unknown>;
          datasheet_url: string;
          case_studies: CaseStudy[];          
          featured: boolean;
          created_at: string;
        };
        Update: {
          id: string;
          name: string;
          main_category: 'Gateway' | 'Sensor' | 'Servicios' | 'Software'; // Columna principal
          sensor_category: 'ambiental' | 'mecánico' | 'eléctrico' | 'seguridad' | null; // Sub-filtro
          description: string;
          price: number;
          image_url: string;
          protocol: string;
          connectivity: string;
          sensor_type: string;
          specifications: Record<string, unknown>;
          datasheet_url: string;
          case_studies: CaseStudy[];          
          featured: boolean;
          created_at: string;
        };
      };
    };
  };
}

export interface CaseStudy {
  title: string;
  description: string;
  industry: string;
}


export type Product = Database['public']['Tables']['products']['Row'];
