import { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import ForcePasswordChange from '../features/auth/ForcePasswordChange';
import { supabase } from '../lib/supabase';
import AdminLayout from '../layouts/AdminLayout';

// Módulos
import DashboardView from '../features/dashboard/DashboardView';
import ClientsForm from '../features/clients/ClientsForm';
import ClientsList from '../features/clients/ClientsList';
import ProductsForm from '../features/catalog/ProductsForm';
import ProductsList from '../features/catalog/ProductsList';
import QuoteBuilder from '../features/quotes/QuoteBuilder';
import QuotesList from '../features/quotes/QuotesList';
import UsersManagement from '../features/users/UsersManagement';
import UserProfile from '../features/profile/UserProfile';

import ClientStatsBoard from '../features/clients/ClientStats';
import ClientHistoryModal from '../features/clients/ClientHistoryModal';
import ClientDetailsModal from '../features/clients/ClientDetailsModal'; 
import { useClients } from '../hooks/useClients';
import type { Client } from '../types/client';
import type { Product } from '../types/product';