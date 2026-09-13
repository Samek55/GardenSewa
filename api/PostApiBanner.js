import { invokeEdgeFunction } from './functionsClient';

// Public — no session, shown to every visitor on the home screen. userType is
// whatever the caller already knows about itself locally ('Public' |
// 'Customer' | 'Workforce' | 'Admin') since there's no session for the
// function to derive it from. phone is only meaningful (and only sent) for a
// logged-in gardener session — it lets the function look up that gardener's
// own area_of_expertise to enforce Profession targeting server-side, without
// the client needing to fetch and thread its own profile through first.
export const fetchActivePopupBanner = (userType, phone) =>
    invokeEdgeFunction('get-active-popup-banner', { userType, phone }, 'Could not load banner');

// Back-office only, from here down.
export const listPopupBanners = () =>
    invokeEdgeFunction('list-popup-banners', {}, 'Could not load banners', { requireSession: true });

export const createPopupBanner = (input) =>
    invokeEdgeFunction('popup-banner-write', { action: 'create', row: input }, 'Could not create this banner', { requireSession: true });

export const updatePopupBanner = (id, input) =>
    invokeEdgeFunction('popup-banner-write', { action: 'update', id, row: input }, 'Could not update this banner', { requireSession: true });

export const setPopupBannerActive = (id, isActive) =>
    invokeEdgeFunction('popup-banner-write', { action: 'setActive', id, isActive }, 'Could not update this banner', { requireSession: true });
