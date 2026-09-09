import { invokeEdgeFunction } from './functionsClient';

// Public — no session, shown to every visitor on the home screen.
export const fetchActivePopupBanner = () =>
    invokeEdgeFunction('get-active-popup-banner', {}, 'Could not load banner');

// Back-office only, from here down.
export const listPopupBanners = () =>
    invokeEdgeFunction('list-popup-banners', {}, 'Could not load banners', { requireSession: true });

export const createPopupBanner = (input) =>
    invokeEdgeFunction('popup-banner-write', { action: 'create', row: input }, 'Could not create this banner', { requireSession: true });

export const updatePopupBanner = (id, input) =>
    invokeEdgeFunction('popup-banner-write', { action: 'update', id, row: input }, 'Could not update this banner', { requireSession: true });

export const setPopupBannerActive = (id, isActive) =>
    invokeEdgeFunction('popup-banner-write', { action: 'setActive', id, isActive }, 'Could not update this banner', { requireSession: true });
