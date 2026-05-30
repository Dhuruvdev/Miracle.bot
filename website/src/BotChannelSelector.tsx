import { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import { select_styles } from './Select';
import AppStyles from './App.module.css';

type Guild   = { id: string; name: string; icon: string | null };
type Channel = { id: string; name: string; type: number; parent_id: string | null; position: number };

type SelectOpt   = { value: string; label: string; icon?: string | null };
type GroupedOpt  = { label: string; options: SelectOpt[] };

const TEXT_TYPES = new Set([0, 5]); // GUILD_TEXT + GUILD_ANNOUNCEMENT

async function discordGet(path: string, token: string) {
    const res = await fetch(`https://discord.com/api/v10${path}`, {
        headers: { Authorization: `Bot ${token.trim()}` },
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || `Discord API ${res.status}`);
    }
    return res.json();
}

export function BotChannelSelector({
    botToken,
    channelId,
    onChannelChange,
}: {
    botToken: string;
    channelId: string;
    onChannelChange: (id: string) => void;
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

    /* ── fetch channels whenever guild selection changes ── */
    useEffect(() => {
        if (!selectedGuildId || !botToken.trim()) { setChannels([]); return; }
        setChLoading(true);
        setError(null);
        discordGet(`/guilds/${selectedGuildId}/channels`, botToken)
            .then((data: Channel[]) =>
                setChannels(data.sort((a, b) => a.position - b.position))
            )
            .catch((e: any) => setError(e.message || 'Failed to load channels'))
            .finally(() => setChLoading(false));
    }, [selectedGuildId]);      // intentionally NOT re-run on token change mid-session

    /* ── load guilds button ── */
    const loadGuilds = async () => {
        if (!tokenRef.current.trim()) return;
        setGuildsLoading(true);
        setError(null);
        try {
            const data: Guild[] = await discordGet('/users/@me/guilds', tokenRef.current);
            setGuilds(data.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (e: any) {
            setError(e.message || 'Failed to load servers');
        } finally {
            setGuildsLoading(false);
        }
    };

    /* ── guild select options ── */
    const guildOptions: SelectOpt[] = guilds.map(g => ({
        value: g.id,
        label: g.name,
        icon:  g.icon,
    }));

    /* ── channel select options (grouped by category) ── */
    const categories  = channels.filter(c => c.type === 4);
    const channelOpts: GroupedOpt[] = [];

    const uncategorized = channels.filter(c => !c.parent_id && TEXT_TYPES.has(c.type));
    if (uncategorized.length)
        channelOpts.push({ label: 'Channels', options: uncategorized.map(c => ({ value: c.id, label: `# ${c.name}` })) });

    for (const cat of categories) {
        const kids = channels.filter(c => c.parent_id === cat.id && TEXT_TYPES.has(c.type));
        if (kids.length)
            channelOpts.push({ label: cat.name.toUpperCase(), options: kids.map(c => ({ value: c.id, label: `# ${c.name}` })) });
    }

    const allChannelFlat: SelectOpt[] = channelOpts.flatMap(g => g.options);

    const selectedGuild   = guildOptions.find(g => g.value === selectedGuildId) || null;
    const selectedChannel = channelId
        ? (allChannelFlat.find(o => o.value === channelId) || { value: channelId, label: channelId })
        : null;

    const handleGuildChange = (opt: SelectOpt | null) => {
        const id = opt?.value || '';
        setSelectedGuildId(id);
        localStorage.setItem('discord.builders__guildId', id);
        setChannels([]);
        onChannelChange('');
    };

    const handleChannelChange = (opt: SelectOpt | null) => {
        onChannelChange(opt?.value || '');
    };

    if (!botToken.trim()) {
        return (
            <p style={{ color: '#72767d', fontSize: 13, fontStyle: 'italic', margin: '0 0 2rem' }}>
                Enter your bot token above to load servers and channels.
            </p>
        );
    }

    return (
        <div>
            {/* ── Server ── */}
            <p style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontSize: 13, color: '#dcddde', fontWeight: '500' }}>Server</span>
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <Select
                        styles={{
                            ...select_styles,
                            groupHeading: (p) => ({
                                ...p,
                                color: '#72767d',
                                fontSize: 11,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                padding: '4px 16px',
                            }),
                        }}
                        options={guildOptions}
                        value={selectedGuild}
                        onChange={opt => handleGuildChange(opt as SelectOpt | null)}
                        isLoading={guildsLoading}
                        placeholder={guilds.length === 0 ? 'Click Load to fetch servers…' : 'Select a server…'}
                        isDisabled={guildsLoading}
                        noOptionsMessage={() => 'Click Load to fetch servers'}
                        formatOptionLabel={(opt: any) => (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                {opt.icon
                                    ? <img
                                        src={`https://cdn.discordapp.com/icons/${opt.value}/${opt.icon}.png?size=32`}
                                        style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0 }}
                                      />
                                    : <div style={{
                                        width: 24, height: 24, borderRadius: '50%',
                                        background: '#5865f2', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
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
                <button
                    className={AppStyles.button}
                    onClick={loadGuilds}
                    disabled={guildsLoading}
                    style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                    {guildsLoading ? '…' : guilds.length > 0 ? 'Reload' : 'Load'}
                </button>
            </div>

            {/* ── Channel (shown only after a guild is picked) ── */}
            {selectedGuildId && (
                <>
                    <p style={{ marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: 13, color: '#dcddde', fontWeight: '500' }}>Channel</span>
                    </p>
                    <div style={{ marginBottom: '0.5rem' }}>
                        <Select
                            styles={{
                                ...select_styles,
                                groupHeading: (p) => ({
                                    ...p,
                                    color: '#72767d',
                                    fontSize: 11,
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    padding: '4px 16px 2px',
                                }),
                            }}
                            options={channelOpts as any}
                            value={selectedChannel}
                            onChange={opt => handleChannelChange(opt as SelectOpt | null)}
                            isLoading={chLoading}
                            placeholder={chLoading ? 'Loading channels…' : 'Select a channel…'}
                            isDisabled={chLoading}
                            noOptionsMessage={() => 'No text channels found'}
                        />
                    </div>
                </>
            )}

            {error && (
                <p style={{ color: '#dd9898', fontSize: 12, marginTop: '0.25rem', marginBottom: '0.5rem' }}>
                    ⚠ {error}
                </p>
            )}
        </div>
    );
}
