// src/lib/downloadUtils.ts

import type { DownloadFile } from '@/types/slides';

/**
 * Configuration for download service
 */
interface DownloadConfig {
  endpoint: string;  // Supabase Edge Function URL
}

// Default config - update with your Supabase project URL
const config: DownloadConfig = {
  endpoint: '/functions/v1/get-download-url',
};

/**
 * Configure the download service
 */
export function configureDownloads(newConfig: Partial<DownloadConfig>): void {
  Object.assign(config, newConfig);
}

/**
 * Show a toast notification
 */
function showToast(message: string): void {
  window.dispatchEvent(new CustomEvent('show-toast', { detail: message }));
}

/**
 * Get a pre-signed download URL for a file
 */
export async function getDownloadUrl(filePath: string): Promise<string> {
  try {
    const response = await fetch(`${config.endpoint}?file=${encodeURIComponent(filePath)}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get download URL: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error getting download URL:', error);
    throw error;
  }
}

/**
 * Trigger a file download
 */
export async function downloadFile(file: DownloadFile): Promise<void> {
  showToast(`Preparing ${file.label}...`);
  
  try {
    const url = await getDownloadUrl(file.path);
    
    // Open in new tab to trigger download
    window.open(url, '_blank');
    
    showToast(`Downloading ${file.label}`);
  } catch (error) {
    showToast(`Failed to download ${file.label}`);
    console.error('Download error:', error);
  }
}

/**
 * Mock download for testing (when backend isn't configured)
 */
export function mockDownloadFile(file: DownloadFile): void {
  showToast(`[Test Mode] Would download: ${file.label}`);
  console.log('Mock download:', file);
  
  // In test mode, just show what would happen
  setTimeout(() => {
    showToast(`File path: ${file.path}`);
  }, 1500);
}
