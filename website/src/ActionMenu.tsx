import { useState } from 'react';
import { ActionMenuProps } from 'components-sdk/src/polyfills/ActionMenu';
import { useButtonActions, ButtonActionType } from './ButtonActionsContext';
import Styles from './ActionMenu.module.css';

export function ActionMenuComponent({ closeCallback, customId }: ActionMenuProps) {
    const { actions, setAction } = useButtonActions();
    const existing = actions[customId];
    const [type, setType] = useState<ButtonActionType>(existing?.type ?? 'reply');
    const [content, setContent] = useState(existing?.content ?? '');

    const save = () => {
        if (content.trim()) {
            setAction(customId, { type, content: content.trim() });
        }
        closeCallback();
    };

    const clear = () => {
        setAction(customId, null);
        closeCallback();
    };

    return (
        <div className={Styles.menu}>
            <div className={Styles.header}>
                <span>Button Action</span>
                <button className={Styles.close} onClick={closeCallback}>✕</button>
            </div>
            <div className={Styles.body}>
                <p className={Styles.label}>When clicked, bot will:</p>
                <select
                    className={Styles.select}
                    value={type}
                    onChange={e => setType(e.target.value as ButtonActionType)}
                >
                    <option value="reply">Reply with a message</option>
                    <option value="ephemeral">Reply with an ephemeral message (only visible to clicker)</option>
                    <option value="channel">Send message to channel</option>
                </select>
                <p className={Styles.label}>Message content:</p>
                <textarea
                    className={Styles.textarea}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Enter the bot's reply message..."
                />
                <div className={Styles.buttons}>
                    {existing && (
                        <button className={Styles.clearBtn} onClick={clear}>Remove</button>
                    )}
                    <button className={Styles.saveBtn} onClick={save}>Save</button>
                </div>
            </div>
        </div>
    );
}
