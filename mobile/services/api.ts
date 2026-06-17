import axios from 'axios';
import { useAuthStore } from '../store/auth';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://10.215.38.159:3000/api',
  timeout: 10000,
});

// Attach JWT token to every request when logged in
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface Category {
  id: number;
  slug: string;
  name_fr: string;
  name_ln: string | null;
}

export interface Business {
  id: string;
  name: string;
  description: string | null;
  address: string;
  commune: string;
  whatsapp_number: string;
  phone_number: string | null;
  logo_url: string | null;
  cover_url: string | null;
  latitude: number | null;
  longitude: number | null;
  view_count: number;
  whatsapp_clicks: number;
  email: string | null;
  opening_hours: Record<string, string> | null;
  social_links: Record<string, string> | null;
  is_verified: boolean;
  category_slug: string;
  category_name: string;
  owner_name?: string;
  avg_rating: number | null;
  review_count: number;
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  display_name: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string | null;
  price_usd: string | null;
  currency: string;
  image_url: string | null;
  video_url: string | null;
}

export async function fetchBusinesses(params: {
  commune?: string;
  category?: string;
  search?: string;
}) {
  const res = await api.get<{ businesses: Business[]; count: number }>('/businesses', { params });
  return res.data;
}

export async function fetchBusiness(id: string) {
  const res = await api.get<{ business: Business; products: Product[] }>(`/businesses/${id}`);
  return res.data;
}

export async function fetchCategories() {
  const res = await api.get<{ categories: Category[] }>('/businesses/categories');
  return res.data.categories;
}

export async function trackWhatsAppClick(id: string) {
  const res = await api.post<{ whatsapp_url: string }>(`/businesses/${id}/whatsapp-click`);
  return res.data.whatsapp_url;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  phone: string;
  display_name: string;
  role: string;
}

export async function loginUser(phone: string, password: string) {
  const res = await api.post<{ token: string; user: AuthUser }>('/auth/login', { phone, password });
  return res.data;
}

export async function registerUser(phone: string, display_name: string, password: string) {
  const res = await api.post<{ token: string; user: AuthUser }>('/auth/register', { phone, display_name, password });
  return res.data;
}

export async function createProduct(businessId: string, data: {
  name: string;
  description?: string;
  price?: string;
  currency?: string;
  video_url?: string;
  image_url?: string;
}) {
  const res = await api.post<{ product: Product }>(`/businesses/${businessId}/products`, data);
  return res.data.product;
}

export interface EconomyRates {
  cdf_per_usd: number;
  updated: string;
  rates: Record<string, number>;
}

export interface EconomyNewsItem {
  title: string;
  url: string;
  publishedAt: string;
  summary: string;
  category: string;
}

export async function fetchEconomyRates() {
  const res = await api.get<EconomyRates>('/economy/rates');
  return res.data;
}

export async function fetchEconomyNews() {
  const res = await api.get<{ items: EconomyNewsItem[]; source: string; fetched_at: string }>('/economy/news');
  return res.data;
}

export async function fetchReviews(businessId: string) {
  const res = await api.get<{ reviews: Review[]; avg_rating: number | null; review_count: number }>(
    `/businesses/${businessId}/reviews`
  );
  return res.data;
}

export async function submitReview(businessId: string, rating: number, comment: string) {
  const res = await api.post<{ review: Review }>(`/businesses/${businessId}/reviews`, { rating, comment });
  return res.data.review;
}

export interface MyBusiness extends Business {
  view_count: number;
  whatsapp_clicks: number;
}

export async function fetchMyBusinesses() {
  const res = await api.get<{ businesses: MyBusiness[] }>('/businesses/my');
  return res.data.businesses;
}

export async function updateBusiness(id: string, data: Partial<{
  name: string;
  description: string;
  address: string;
  commune: string;
  whatsapp_number: string;
  phone_number: string;
  opening_hours: Record<string, string>;
  cover_url: string;
  logo_url: string;
}>) {
  await api.patch(`/businesses/${id}`, data);
}

export async function fetchFavorites() {
  const res = await api.get<{ businesses: Business[] }>('/favorites');
  return res.data.businesses;
}

export async function addFavorite(businessId: string) {
  await api.post(`/favorites/${businessId}`);
}

export async function removeFavorite(businessId: string) {
  await api.delete(`/favorites/${businessId}`);
}

export async function registerPushToken(token: string, platform: string) {
  await api.post('/devices', { token, platform });
}

export async function deregisterPushToken(token: string) {
  await api.delete('/devices', { data: { token } });
}

export async function createBusiness(data: {
  name: string;
  description?: string;
  category_id: number;
  address: string;
  commune: string;
  whatsapp_number: string;
  phone_number?: string;
  opening_hours?: Record<string, string>;
}) {
  const res = await api.post<{ business: Business }>('/businesses', data);
  return res.data.business;
}
