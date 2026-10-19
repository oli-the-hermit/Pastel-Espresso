import React, { createContext, useContext, useMemo } from 'react';

/**
 * The UI primitives' own words (screen-reader names, placeholders, tooltips).
 * This is their single source; the primitives never import app strings.
 * Wrap the app in <UiLabelsProvider labels={…}> to translate or override any of them.
 */
export const defaultUiLabels = {
  close: 'Close',
  cancel: 'Cancel',
  delete: 'Delete',
  copy: 'Copy',
  actions: 'Actions',
  moreActions: 'More actions',
  selectPlaceholder: 'Select an option',
  options: 'Options',
  search: 'Search…',
  searchOptions: 'Search options',
  noMatches: 'No matches',
  sort: 'Sort',
  noItems: 'No items found.',
  create: 'Create',
  newItemName: 'Name',
  clearDate: 'Clear date',
  clear: 'Clear',
  remove: 'Remove',
  today: 'Today',
  prevMonth: 'Previous month',
  nextMonth: 'Next month',
  chooseTime: 'Choose time',
  timePlaceholder: 'HH:MM',
  decrease: 'Decrease',
  increase: 'Increase',
  emojiSearch: 'Search emoji',
  emojiLoading: 'Loading emoji…',
  emojiNoResults: 'No emoji match that search.',
  emojiNoRecent: 'Emoji you pick show up here.',
  emojiResults: 'Search results',
  docEditor: {
    toolbar: 'Formatting',
    textStyle: 'Text style',
    paragraph: 'Normal text',
    heading1: 'Heading 1',
    heading2: 'Heading 2',
    heading3: 'Heading 3',
    bold: 'Bold',
    italic: 'Italic',
    strike: 'Strikethrough',
    code: 'Code',
    link: 'Link',
    linkAddress: 'Link address',
    linkPlaceholder: 'https://',
    linkApply: 'Apply',
    linkRemove: 'Remove link',
    bulletList: 'Bulleted list',
    orderedList: 'Numbered list',
    checklist: 'Checklist',
    quote: 'Quote',
    codeBlock: 'Code block',
    table: 'Table',
    undo: 'Undo',
    redo: 'Redo'
  },
  emojiCategories: {
    recent: 'Recent',
    smileys: 'Smileys & people',
    animals: 'Animals & nature',
    food: 'Food & drink',
    activities: 'Activities',
    travel: 'Travel & places',
    objects: 'Objects',
    symbols: 'Symbols',
    flags: 'Flags'
  }
};

export type UiLabels = typeof defaultUiLabels;

const UiLabelsContext = createContext<UiLabels>(defaultUiLabels);

export const UiLabelsProvider: React.FC<{ labels: Partial<UiLabels>; children: React.ReactNode }> = ({ labels, children }) => {
  const value = useMemo(() => ({ ...defaultUiLabels, ...labels }), [labels]);
  return <UiLabelsContext.Provider value={value}>{children}</UiLabelsContext.Provider>;
};

export const useUiLabels = (): UiLabels => useContext(UiLabelsContext);
