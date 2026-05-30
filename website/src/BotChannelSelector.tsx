import { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import { select_styles } from './Select';

type Guild   = { id: string; name: string; icon: string | null };
type Channel = { id: string; name: string; type: number; parent_id: string | null; position: number };

type SelectOpt  = { value: string; label: string; icon?: string | null };
type GroupedOpt = { label: string; options: SelectOpt[] };

const TEXT_TYPES = new Set([0, 5]); // GUILD_TEXT + GUILD_ANNOUNCEMENT

async function discordGet(path: string, token: string) {
    const res = await fetch(`https://discord.com/api/v10${path}`, {
        headers: { Authorization: `Bot ${token.trim()}` },
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || `Discord API error ${res.status}`);
    }
    return res.json();
}

const groupHeadingStyles = (p: any) => ({
    ...p,
    color: '#72767d',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    padding: '4px 16px',
});

export function BotChannelSelector({
    botToken,
    channelId,
    onChannelChange,
    startTrigger,
    onLoadingChange,
    onConnected,
}: {
    botToken: string;
    channelId: string;
    onChannelChange: (id: string) => void;
    startTrigger: number;
    onLoadingChange?: (loading: boolean) => void;
    onConnected?: (connected: boolean) => void;
}) {
    const [guilds,          setGuilds]          = useState<Guild[]>([]);
    const [selectedGuildId, setSelectedGuildId] = useState<string>(
        () => localStorage.getItem('discord.builders__guildId') || ''
    );
    const [channels,        setChannels]        = useState<Channel[]>([]);
    const [guildsLoading,   setGuildsLoading]   = useState(false);
    const [chLoading,       setChLoading]       = useState(false);
    const [error,           setError]           = useState<string | null>(null);

    const tokenRef = useRef(botToken);
    tokenRef.current = botToken;

    /* ── load guilds (called by parent via startTrigger) ── */
    const loadGuilds = async () => {
        const token = tokenRef.current;
        if (!token.trim()) return;
        setGuildsLoading(true);
        setError(null);
        onLoadingChange?.(true);
        onConnected?.(false);
        try {
            const data: Guild[] = await discordGet('/users/@me/guilds', token);
            const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
            setGuilds(sorted);
            onConnected?.(true);
        } catch (e: any) {
            setError(e.message || 'Failed to connect. Check your bot token.');
            onConnected?.(false);
        } finally {
            setGuildsLoading(false);
            onLoadingChange?.(false);
        }
    };

    /* ── trigger load whenever parent fires startTrigger ── */
    useEffect(() => {
        if (startTrigger > 0) loadGuilds();
    }, [startTrigger]);

    /* ── fetch channels when guild is selected ── */
    useEffect(() => {
        if (!selectedGuildId || !tokenRef.current.trim()) { setChannels([]); return; }
        setChLoading(true);
        setError(null);
        discordGet(`/guilds/${selectedGuildId}/channels`, tokenRef.current)
            .then((data: Channel[]) => setChannels(data.sort((a, b) => a.position - b.position)))
            .catch((e: any) => setError(e.message || 'Failed to load channels'))
            .finally(() => setChLoading(false));
    }, [selectedGuildId]);

    /* ── options ── */
    const guildOptions: SelectOpt[] = guilds.map(g => ({
        value: g.id, label: g.name, icon: g.icon,
    }));

    const categories = channels.filter(c => c.type === 4);
    const channelOpts: GroupedOpt[] = [];
    const uncategorized = channels.filter(c => !c.parent_id && TEXT_TYPES.has(c.type));
    if (uncategorized.length)
        channelOpts.push({ label: 'Channels', options: uncategorized.map(c => ({ value: c.id, label: `# ${c.name}` })) });
    for (const cat of categories) {
        const kids = channels.filter(c => c.parent_id === cat.id && TEXT_TYPES.has(c.type));
        if (kids.length)
            channelOpts.push({ label: cat.name.toUpperCase(), options: kids.map(c => ({ value: c.id, label: `# ${c.name}` })) });
    }
    const allFlat: SelectOpt[] = channelOpts.flatMap(g => g.options);

    const selectedGuild   = guildOptions.find(g => g.value === selectedGuildId) || null;
    const selectedChannel = channelId
        ? (allFlat.find(o => o.value === channelId) || { value: channelId, label: channelId })
        : null;

    const handleGuildChange = (opt: SelectOpt | null) => {
        const id = opt?.value || '';
        setSelectedGuildId(id);
        localStorage.setItem('discord.builders__guildId', id);
        setChannels([]);
        onChannelChange('');
    };

    /* ── nothing to show until started ── */
    if (guilds.length === 0 && !guildsLoading && !error) return null;

    return (
        <div style={{ marginTop: '1rem' }}>
            {guildsLoading && (
                <p style={{ color: '#72767d', fontSize: 13, fontStyle: 'italic', marginBottom: '0.5rem' }}>
                    Connecting to Discord…
                </p>
            )}

            {error && (
                <p style={{ color: '#dd9898', fontSize: 13, marginBottom: '0.75rem' }}>
                    ⚠ {error}
                </p>
            )}

            {guilds.length > 0 && (
                <>
                    {/* Server */}
                    <p style={{ marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: 13, color: '#dcddde', fontWeight: '500' }}>Server</span>
                    </p>
                    <div style={{ marginBottom: '0.75rem' }}>
                        <Select
                            styles={{ ...select_styles, groupHeading: groupHeadingStyles }}
                            options={guildOptions}
                            value={selectedGuild}
                            onChange={opt => handleGuildChange(opt as SelectOpt | null)}
                            placeholder="Select a server…"
                            noOptionsMessage={() => 'No servers found'}
                            formatOptionLabel={(opt: any) => (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                    {opt.icon
                                        ? <img src={`https://cdn.discordapp.com/icons/${opt.value}/${opt.icon}.png?size=32`}
                                               style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0 }} />
                                        : <div style={{
                                            width: 24, height: 24, borderRadius: '50%', background: '#5865f2',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 10, color: '#fff', flexShrink: 0, fontWeight: 700,
                                          }}>
                                            {opt.label.charAt(0).toUpperCase()}
                                          </div>
                                    }
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {opt.label}
                                    </span>
                                </div>
                            )}
                        />
                    </div>

                    {/* Channel */}
                    {selectedGuildId && (
                        <>
                            <p style={{ marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: 13, color: '#dcddde', fontWeight: '500' }}>Channel</span>
                            </p>
                            <div style={{ marginBottom: '0.5rem' }}>
                                <Select
                                    styles={{ ...select_styles, groupHeading: groupHeadingStyles }}
                                    options={channelOpts as any}
                                    value={selectedChannel}
                                    onChange={opt => onChannelChange((opt as SelectOpt | null)?.value || '')}
                                    isLoading={chLoading}
                                    placeholder={chLoading ? 'Loading channels…' : 'Select a channel…'}
                                    isDisabled={chLoading}
                                    noOptionsMessage={() => 'No text channels found'}
                                />
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}
