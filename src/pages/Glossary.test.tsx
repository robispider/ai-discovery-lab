import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AppRoutes } from '../app/App';
import { GLOSSARY } from '../data/glossary';
import { LESSONS } from '../lessons/registry';

function openAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe('glossary', () => {
  it('supports bilingual search, topic filtering and recovery from an empty result', async () => {
    openAt('/');
    const user = userEvent.setup();
    await user.click(screen.getByRole('link', { name: 'Glossary' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Glossary' })).toBeInTheDocument();

    const topic = screen.getByRole('combobox', { name: 'Topic' });
    const search = screen.getByRole('searchbox', { name: 'Search terms' });
    await user.selectOptions(topic, 'nvidia');
    await user.type(search, 'TensorRT');
    expect(screen.getByRole('status')).toHaveTextContent('1 term');
    expect(screen.getByText('TensorRT', { selector: 'dt' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /NVIDIA TensorRT documentation/ })).toHaveAttribute(
      'href',
      'https://docs.nvidia.com/deeplearning/tensorrt/latest/index.html',
    );

    await user.clear(search);
    await user.type(search, 'সেন্সর');
    expect(screen.getByText('NVIDIA Metropolis', { selector: 'dt' })).toBeInTheDocument();
    await user.type(search, ' xyzzy');
    expect(screen.getByText('No terms match these filters.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(search).toHaveValue('');
    expect(topic).toHaveValue('');
  });

  it('links the 8B lesson to its terms and back to the correct lesson', async () => {
    openAt('/lesson/8b');
    const user = userEvent.setup();
    await user.click(screen.getByRole('link', { name: 'Terms in this lesson' }));
    expect(screen.getByRole('combobox', { name: 'Lesson' })).toHaveValue('8b');
    expect(screen.queryByText('TensorRT', { selector: 'dt' })).not.toBeInTheDocument();
    const reinforcement = screen.getByRole('region', { name: 'Reinforcement learning' });
    expect(within(reinforcement).getByText('Q-learning / Q-table', { selector: 'dt' })).toBeInTheDocument();
    expect(within(reinforcement).getAllByRole('link', { name: /8B · Waste robot/ })[0]).toHaveAttribute(
      'href',
      '/lesson/8b',
    );
  });

  it('loads a shareable search and displays translated terms and definitions in Bangla', async () => {
    openAt('/glossary?topic=sensors&q=TinyML');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'বাংলা' }));
    expect(screen.getByRole('heading', { level: 1, name: 'শব্দকোষ' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'পরিভাষা খুঁজুন' })).toHaveValue('TinyML');
    expect(screen.getByText(/কম মেমোরি, প্রসেসিং ক্ষমতা/)).toBeInTheDocument();
    expect(screen.getByText('TinyML')).toHaveAttribute('lang', 'en');
  });

  it('covers each lesson with valid, bilingual entries and source URLs', () => {
    const terms = GLOSSARY.flatMap(({ terms, source }) =>
      terms.map((term) => ({ ...term, source: term.source ?? source })),
    );
    expect(new Set(terms.flatMap(({ lessons }) => lessons))).toEqual(new Set(LESSONS.map(({ n }) => n)));
    expect(new Set(terms.map(({ title }) => title.en)).size).toBe(terms.length);
    for (const term of terms) {
      expect(term.title.bn).toBeTruthy();
      expect(term.definition.bn).toBeTruthy();
      expect(new URL(term.source.url).protocol).toBe('https:');
    }
  });
});
