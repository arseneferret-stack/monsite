'use strict';

const DEFAULT_FEED_URL = 'https://bleedthebrain.substack.com/feed';
exports.handler = async function handler(event) {
    if (event.httpMethod && event.httpMethod !== 'GET') {
        return jsonResponse(405, { error: 'Method not allowed' });
    }

    const feedUrl = normalizeFeedUrl(event.queryStringParameters?.url);

    if (!feedUrl) {
        return jsonResponse(400, { error: 'Invalid Substack feed URL' });
    }

    try {
        const response = await fetch(feedUrl, {
            headers: {
                Accept: 'application/rss+xml, application/xml, text/xml'
            }
        });

        if (!response.ok) {
            return jsonResponse(502, {
                error: 'Unable to fetch Substack feed',
                status: response.status
            });
        }

        const xml = await response.text();
        const parsed = parseFeed(xml);

        return jsonResponse(200, {
            feedUrl,
            title: parsed.title,
            items: parsed.items
        }, {
            'Cache-Control': 'public, max-age=900'
        });
    } catch (error) {
        return jsonResponse(500, {
            error: 'Unexpected error while fetching feed',
            detail: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

function normalizeFeedUrl(input) {
    const candidate = input || DEFAULT_FEED_URL;

    try {
        const url = new URL(candidate);
        const isSubstackHost = /(^|\.)substack\.com$/i.test(url.hostname);

        if (!isSubstackHost) {
            return null;
        }

        if (url.pathname === '/' || url.pathname === '') {
            url.pathname = '/feed';
        }

        if (url.pathname !== '/feed') {
            return null;
        }

        url.search = '';
        url.hash = '';
        return url.toString();
    } catch (_error) {
        return null;
    }
}

function parseFeed(xml) {
    const channelMatch = xml.match(/<channel\b[^>]*>([\s\S]*?)<\/channel>/i);
    const channel = channelMatch ? channelMatch[1] : xml;
    const itemMatches = channel.match(/<item\b[\s\S]*?<\/item>/gi) || [];
    const items = pairTranslations(itemMatches.map(parseItem).filter((item) => item.title && item.link));

    return {
        title: cleanText(readTag(channel, 'title')),
        items
    };
}

function parseItem(itemXml) {
    const title = cleanText(readTag(itemXml, 'title'));
    const description = cleanText(readTag(itemXml, 'description'));
    const content = cleanText(readTag(itemXml, 'content:encoded'));
    const excerpt = truncateText(stripHtml(description || content), 220);
    const publishedAt = readTag(itemXml, 'pubDate');
    const enclosure = readEnclosure(itemXml);
    const link = cleanText(readTag(itemXml, 'link'));
    const slug = extractSlug(link);

    return {
        title,
        link,
        slug,
        localPath: slug ? `/articles/substack/${slug}` : null,
        publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
        excerpt,
        image: enclosure,
        language: detectLanguage(`${title} ${description} ${content}`)
    };
}

function pairTranslations(items) {
    const paired = items.map((item) => ({
        ...item,
        translationPath: null,
        translationLabel: null
    }));

    for (let index = 0; index < paired.length; index += 1) {
        if (paired[index].translationPath) {
            continue;
        }

        for (let offset = 1; offset <= 2; offset += 1) {
            const candidate = paired[index + offset];
            if (!candidate || candidate.translationPath) {
                continue;
            }

            if (!arePotentialTranslations(paired[index], candidate)) {
                continue;
            }

            paired[index].translationPath = candidate.localPath;
            paired[index].translationLabel = paired[index].language === 'fr'
                ? 'Read English version'
                : 'Lire la version française';

            candidate.translationPath = paired[index].localPath;
            candidate.translationLabel = candidate.language === 'fr'
                ? 'Read English version'
                : 'Lire la version française';
            break;
        }
    }

    return paired;
}

function arePotentialTranslations(left, right) {
    if (!left.localPath || !right.localPath) {
        return false;
    }

    if (left.language === 'unknown' || right.language === 'unknown' || left.language === right.language) {
        return false;
    }

    if (!left.publishedAt || !right.publishedAt) {
        return false;
    }

    const distance = Math.abs(new Date(left.publishedAt).getTime() - new Date(right.publishedAt).getTime());
    return distance <= 1000 * 60 * 90;
}

function detectLanguage(text) {
    const value = (text || '').toLowerCase();
    const frenchScore = scoreMatches(value, [
        /[àâçéèêëîïôûùüÿœ]/g,
        /\b(le|la|les|de|des|du|une|un|dans|pour|avec|est|plus|famille|vers|fabrique|démantèlement|anesthésie)\b/g
    ]);
    const englishScore = scoreMatches(value, [
        /\b(the|and|with|this|that|family|repetition|under|still|there|english|version|longer|play|disintegration)\b/g
    ]);

    if (frenchScore === englishScore) {
        return 'unknown';
    }

    return frenchScore > englishScore ? 'fr' : 'en';
}

function scoreMatches(value, patterns) {
    return patterns.reduce((total, pattern) => total + ((value.match(pattern) || []).length), 0);
}

function extractSlug(link) {
    if (!link) {
        return null;
    }

    try {
        const url = new URL(link);
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts[0] !== 'p' || !parts[1]) {
            return null;
        }

        return parts[1];
    } catch (_error) {
        return null;
    }
}

function readEnclosure(xml) {
    const match = xml.match(/<enclosure\b[^>]*url="([^"]+)"[^>]*>/i);
    return match ? decodeEntities(match[1]) : null;
}

function readTag(xml, tagName) {
    const escapedTag = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const cdataPattern = new RegExp(`<${escapedTag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${escapedTag}>`, 'i');
    const plainPattern = new RegExp(`<${escapedTag}[^>]*>([\\s\\S]*?)<\\/${escapedTag}>`, 'i');
    const cdataMatch = xml.match(cdataPattern);

    if (cdataMatch) {
        return cdataMatch[1].trim();
    }

    const plainMatch = xml.match(plainPattern);
    return plainMatch ? plainMatch[1].trim() : '';
}

function stripHtml(value) {
    return value
        .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
        .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function truncateText(value, maxLength) {
    if (value.length <= maxLength) {
        return value;
    }

    return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function cleanText(value) {
    return decodeEntities((value || '').replace(/<!\[CDATA\[|\]\]>/g, '').trim());
}

function decodeEntities(value) {
    return value
        .replace(/&#(\d+);/g, (_match, codePoint) => String.fromCodePoint(Number(codePoint)))
        .replace(/&#x([\da-f]+);/gi, (_match, codePoint) => String.fromCodePoint(parseInt(codePoint, 16)))
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
}

function jsonResponse(statusCode, body, extraHeaders) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            ...extraHeaders
        },
        body: JSON.stringify(body)
    };
}