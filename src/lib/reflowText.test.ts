import { describe, expect, it } from 'vitest';
import { reflowText } from './reflowText';

const MIT = [
  'Permission is hereby granted, free of charge, to any person obtaining a copy',
  'of this software and associated documentation files (the "Software"), to deal',
  'in the Software without restriction.',
  '',
  'The above copyright notice shall be included.'
].join('\n');

describe('reflowText', () => {
  it('joins the hard-wrapped lines of a paragraph and keeps paragraphs apart', () => {
    expect(reflowText(MIT)).toBe(
      'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction.\n\nThe above copyright notice shall be included.'
    );
  });

  it('leaves short lines, such as a title over its text, on their own', () => {
    expect(reflowText('MIT License\nCopyright (c) 2024 Someone')).toBe('MIT License\nCopyright (c) 2024 Someone');
  });

  it('keeps list items, rules and package lines on lines of their own', () => {
    const text = [
      'windows-sys 0.59.0 (MIT OR Apache-2.0) https://github.com/microsoft/windows-rs',
      'windows-targets 0.52.6 (MIT OR Apache-2.0) https://github.com/microsoft/windows-rs',
      '========================================',
      'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR',
      '  (a) You must give any other recipients of the Work or Derivative Works a copy',
      '      of this License; and'
    ].join('\n');
    expect(reflowText(text).split('\n')).toEqual([
      'windows-sys 0.59.0 (MIT OR Apache-2.0) https://github.com/microsoft/windows-rs',
      'windows-targets 0.52.6 (MIT OR Apache-2.0) https://github.com/microsoft/windows-rs',
      '========================================',
      'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR',
      '  (a) You must give any other recipients of the Work or Derivative Works a copy of this License; and'
    ]);
  });
});
