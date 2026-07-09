import type { DbData } from './types';
import rawData from '../data/db.json';

export const db: DbData = rawData as DbData;

export function formatDate(date: string | number): string {
  return new Date(date).toLocaleDateString('no-NO', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function pct(value: number): string {
  return (value * 100).toFixed(1) + '%';
}

export function rating(value: number): string {
  return value.toFixed(1);
}
