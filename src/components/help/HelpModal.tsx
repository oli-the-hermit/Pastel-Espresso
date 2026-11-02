import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { strings } from '../../constants/strings';
import { GITHUB_URL, RELEASE_STAGE, docsUrl, githubIssueUrl } from '../../constants/links';
import { openExternal } from '../../lib/desktop';
import { IconBook, IconBug, IconChevronLeft, IconGithub, IconInfo, IconKeyboard, IconLock, IconLogo, IconSparkle, IconStar, IconTimer } from '../ui/icons';
import { TextButton } from '../ui/TextButton';
import { ListRow } from '../ui/ListRow';
import { format } from '../../lib/i18n';
import { reflowText } from '../../lib/reflowText';
import { platformLabel } from '../../lib/platform';
import { EDITOR_SHORTCUTS, SHORTCUTS, modifierCaps } from '../../constants/shortcuts';

type HelpView = 'home' | 'shortcuts' | 'whatsNew' | 'about' | 'licenses';

const version = __APP_VERSION__;

/** public/third-party-notices.txt (scripts/licenses/generate.ts), loaded when it's opened. */
const ThirdPartyNotices: React.FC = () => {
  const [text, setText] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    fetch('third-party-notices.txt')
      .then(res => (res.ok ? res.text() : Promise.reject(new Error(String(res.status)))))
      .then(t => live && setText(reflowText(t.replace(/\r\n/g, '\n'))))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, []);
  if (failed) return <p className="help-note" role="alert">{strings.help.licensesError}</p>;
  if (text === null) return <p className="help-note" role="status">{strings.help.licensesLoading}</p>;
  return <pre className="licenses-text">{text}</pre>;
};

/** Help hub: tour, shortcuts, what's new, about and GitHub links. */
export const HelpModal: React.FC = () => {
  const { helpOpen, setHelpOpen, startTour } = useApp();
  const [view, setView] = useState<HelpView>('home');
  const modifiers = modifierCaps();

  // Always reopen on the list, not on the last sub-view.
  useEffect(() => {
    if (helpOpen) setView('home');
  }, [helpOpen]);

  const close = () => setHelpOpen(false);
  const open = (url: string) => void openExternal(url).catch(() => {});
  const reportProblem = () => open(githubIssueUrl(format(strings.help.reportBody, { version, platform: platformLabel() })));

  const titles: Record<HelpView, string> = {
    home: strings.help.title,
    shortcuts: strings.help.shortcutsTitle,
    whatsNew: strings.help.whatsNewTitle,
    about: strings.help.aboutTitle,
    licenses: strings.help.licensesTitle
  };

  return (
    <Modal isOpen={helpOpen} title={titles[view]} onClose={close} dismissible>
      {view !== 'home' && (
        <TextButton className="help-back" onClick={() => setView(view === 'licenses' ? 'about' : 'home')}>
          <IconChevronLeft size={16} />
          {strings.help.back}
        </TextButton>
      )}

      {view === 'home' && (
        <div className="help-list" key="home">
          <ListRow
            icon={<IconTimer size={20} />}
            title={strings.help.tourTitle}
            description={strings.help.tourDesc}
            onClick={startTour}
          />
          <ListRow
            icon={<IconKeyboard size={20} />}
            title={strings.help.shortcutsTitle}
            description={strings.help.shortcutsDesc}
            onClick={() => setView('shortcuts')}
          />
          <ListRow
            icon={<IconSparkle size={20} />}
            title={strings.help.whatsNewTitle}
            description={format(strings.help.whatsNewDesc, { version })}
            onClick={() => setView('whatsNew')}
          />
          <ListRow
            icon={<IconInfo size={20} />}
            title={strings.help.aboutTitle}
            description={strings.help.aboutDesc}
            onClick={() => setView('about')}
          />
          {GITHUB_URL && (
            <>
              <ListRow
                icon={<IconBook size={20} />}
                title={strings.help.docsTitle}
                description={strings.help.docsDesc}
                external
                onClick={() => open(docsUrl())}
              />
              <ListRow
                icon={<IconBug size={20} />}
                title={strings.help.reportTitle}
                description={strings.help.reportDesc}
                external
                onClick={reportProblem}
              />
              <ListRow
                icon={<IconStar size={20} />}
                title={strings.help.starTitle}
                description={strings.help.starDesc}
                external
                onClick={() => open(GITHUB_URL)}
              />
            </>
          )}
        </div>
      )}

      {view === 'shortcuts' && (
        <div className="help-sub" key="shortcuts">
          <h3 className="help-heading">{strings.help.shortcutsAppTitle}</h3>
          <ul className="shortcut-list">
            {SHORTCUTS.map(s => (
              <li key={s.id} className="shortcut-row">
                <span>{strings.shortcuts[s.id]}</span>
                <span className="shortcut-keys">
                  {s.caps.map(k => (
                    <kbd key={k} className="kbd">{k}</kbd>
                  ))}
                </span>
              </li>
            ))}
          </ul>
          <p className="help-note">{strings.help.shortcutsNote}</p>
          <h3 className="help-heading">{strings.help.shortcutsEditorTitle}</h3>
          <ul className="shortcut-list">
            {EDITOR_SHORTCUTS.map(s => (
              <li key={s.id} className="shortcut-row">
                <span>{strings.editorShortcuts[s.id]}</span>
                <span className="shortcut-keys">
                  {s.caps.map(k => (
                    <kbd key={k} className="kbd">{k in modifiers ? modifiers[k as keyof typeof modifiers] : k}</kbd>
                  ))}
                </span>
              </li>
            ))}
          </ul>
          <p className="help-note">{strings.help.shortcutsEditorNote}</p>
        </div>
      )}

      {view === 'whatsNew' && (
        <div className="help-sub" key="whatsNew">
          <p className="help-version">{format(strings.help.versionLabel, { version })}</p>
          <ul className="whats-new-list">
            {strings.help.whatsNew.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {view === 'about' && (
        <div className="help-sub" key="about">
          <div className="about-head">
            <span className="about-logo" aria-hidden="true">
              <IconLogo size={28} />
            </span>
            <div>
              <div className="about-name">{strings.app.title}</div>
              <div className="about-version">
                {format(strings.help.versionLabel, { version })}
                {RELEASE_STAGE && <span className="role-badge stage-badge">{strings.help.stageBadge[RELEASE_STAGE]}</span>}
              </div>
            </div>
          </div>
          {RELEASE_STAGE && (
            <div className="about-stage">
              <p>{strings.help.stageNote[RELEASE_STAGE]}</p>
              {GITHUB_URL && (
                <TextButton className="about-github" onClick={reportProblem}>
                  <IconBug size={15} />
                  {strings.help.reportTitle}
                </TextButton>
              )}
            </div>
          )}
          <p className="about-desc">{strings.app.description}</p>
          <div className="about-privacy">
            <IconLock size={18} />
            <div>
              <div className="about-privacy-title">{strings.help.privacyTitle}</div>
              <p>{strings.help.privacyBody}</p>
            </div>
          </div>
          <p className="help-note">
            {strings.help.licenseNote}
            <TextButton className="about-github" onClick={() => setView('licenses')}>
              {strings.help.licensesTitle}
            </TextButton>
          </p>
          <p className="help-note">
            {strings.help.credits}
            {GITHUB_URL && (
              <TextButton className="about-github" onClick={() => open(GITHUB_URL)}>
                <IconGithub size={15} />
                {strings.help.githubLabel}
              </TextButton>
            )}
          </p>
        </div>
      )}

      {view === 'licenses' && (
        <div className="help-sub" key="licenses">
          <p className="help-note">{strings.help.licensesIntro}</p>
          <ThirdPartyNotices />
        </div>
      )}
    </Modal>
  );
};
