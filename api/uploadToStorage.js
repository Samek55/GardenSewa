import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../lib/supabase';

const PUBLIC_BUCKET = 'uploads';
// Citizenship/NID is sensitive government ID, so it goes in a private bucket
// and is never exposed as a public URL — see
// supabase/migrations/0001_create_gardener_table.sql. Viewing it later must
// go through a service-role Edge Function that generates a short-lived
// signed URL for an authenticated Admin/BDM/Call Center session.
const PRIVATE_BUCKET = 'id-documents';

const getMimeType = (uri, fileName) => {
    const name = (fileName || uri || '').toLowerCase();
    if (name.endsWith('.pdf')) return 'application/pdf';
    if (name.endsWith('.png')) return 'image/png';
    if (name.endsWith('.gif')) return 'image/gif';
    if (name.endsWith('.webp')) return 'image/webp';
    return 'image/jpeg';
};

const getExtension = (mimeType) => {
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType === 'image/png') return 'png';
    if (mimeType === 'image/gif') return 'gif';
    if (mimeType === 'image/webp') return 'webp';
    return 'jpg';
};

const base64ToArrayBuffer = (base64) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
};

const buildUploadPath = (uri, fileName) => {
    const mimeType = getMimeType(uri, fileName);
    const ext = getExtension(mimeType);
    const uniquePrefix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const safeName = fileName ? fileName.replace(/[^a-zA-Z0-9._-]/g, '') : `file.${ext}`;
    return { mimeType, path: `${uniquePrefix}-${safeName}` };
};

const readFileAsArrayBuffer = async (uri) => {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
    return base64ToArrayBuffer(base64);
};

export const uploadPublicFile = async (uri, fileName) => {
    const { mimeType, path } = buildUploadPath(uri, fileName);
    const arrayBuffer = await readFileAsArrayBuffer(uri);

    const { error } = await supabase.storage
        .from(PUBLIC_BUCKET)
        .upload(path, arrayBuffer, { contentType: mimeType, upsert: false });

    if (error) throw new Error(`Upload failed: ${error.message}`);

    const { data } = supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(path);
    return data.publicUrl;
};

export const uploadPrivateDocument = async (uri, fileName) => {
    const { mimeType, path } = buildUploadPath(uri, fileName);
    const arrayBuffer = await readFileAsArrayBuffer(uri);

    const { error } = await supabase.storage
        .from(PRIVATE_BUCKET)
        .upload(path, arrayBuffer, { contentType: mimeType, upsert: false });

    if (error) throw new Error(`Upload failed: ${error.message}`);

    return path;
};
