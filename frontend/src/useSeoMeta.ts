import { useEffect } from 'react';
import { libs } from '../libs.config';

interface SeoMeta {
    title: string;
    description: string;
    canonical: string;
}

const BASE_URL = 'https://discord.builders';

const DEFAULT_META: SeoMeta = {
    title: 'OpenEmbedded · Discord Component Builder',
    description: 'Build and send Discord UI components like buttons, dropdowns and containers with a visual drag-and-drop builder. Generate ready-to-use code for discord.js, discord.py, JDA, DPP, and more.',
    canonical: BASE_URL + '/',
};

function getMetaForPage(page: string): SeoMeta {
    if (page === '200.home' || !page) return DEFAULT_META;
    if (page === '404.not-found') {
        return {
            title: '404 — Page Not Found · OpenEmbedded',
            description: 'This page could not be found.',
            canonical: BASE_URL + '/not-found',
        };
    }

    const lib = libs[page];
    if (!lib) return DEFAULT_META;

    const langLabel = lib.language.charAt(0).toUpperCase() + lib.language.slice(1);
    const title = `${lib.name} Code Generator · OpenEmbedded`;
    const description = `Generate Discord component code for ${lib.name} (${langLabel}). Visual builder with buttons, select menus, action rows, and more — ready to copy into your bot.`;
    const canonical = BASE_URL + lib.path;

    return { title, description, canonical };
}

function setMeta(name: string, content: string) {
    let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
}

function setOgMeta(property: string, content: string) {
    let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', property);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
}

function setCanonical(href: string) {
    let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', 'canonical');
        document.head.appendChild(el);
    }
    el.setAttribute('href', href);
}

export function useSeoMeta(page: string) {
    useEffect(() => {
        const meta = getMetaForPage(page);

        document.title = meta.title;
        setMeta('description', meta.description);
        setCanonical(meta.canonical);

        setOgMeta('og:title', meta.title);
        setOgMeta('og:description', meta.description);
        setOgMeta('og:url', meta.canonical);

        setOgMeta('twitter:title', meta.title);
        setOgMeta('twitter:description', meta.description);
    }, [page]);
}
