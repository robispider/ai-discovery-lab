import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { AppRoutes } from './App';
import { TURN_LIMIT } from '../engines/rl/robot';
import { useRobot } from '../lessons/robot/store';
import { useLab } from '../store/useLab';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe('lab shell', () => {
  it('offers all four NVIDIA reference types from the References index', async () => {
    renderAt('/references?tab=models');
    const user = userEvent.setup();
    const tabs = screen.getByRole('navigation', { name: 'Reference sections' });
    const nvidia = within(tabs).getByRole('link', { name: 'NVIDIA' });
    await user.click(nvidia);
    expect(nvidia).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('status')).toHaveTextContent('31 results');

    const filter = screen.getByRole('combobox', { name: 'Reference type' });
    await user.selectOptions(filter, 'projects');
    expect(screen.getByRole('status')).toHaveTextContent('8 results');
    expect(screen.getByRole('link', { name: /Build a digital twin of one junction/ })).toBeInTheDocument();

    await user.selectOptions(filter, 'cases');
    expect(screen.getByRole('status')).toHaveTextContent('3 results');
    expect(screen.getByRole('link', { name: /Kaohsiung AI Lighthouse, Taiwan/ })).toHaveAttribute(
      'href',
      'https://www.nvidia.com/en-in/customer-stories/linker-vision-ai-smart-city-solutions/',
    );

    await user.selectOptions(filter, 'models');
    expect(screen.getByRole('status')).toHaveTextContent('8 results');
    const search = screen.getByRole('searchbox', { name: 'Search references' });
    await user.type(search, 'Cosmos');
    expect(screen.getByRole('status')).toHaveTextContent('1 result');
    await user.clear(search);

    await user.selectOptions(filter, 'stack');
    expect(screen.getByRole('status')).toHaveTextContent('12 results');
    expect(screen.getByRole('link', { name: /NIM, AI Enterprise and licensing/ })).toBeInTheDocument();
  });

  it('opens the separate Reference Projects index from the main navigation', async () => {
    renderAt('/');
    expect(screen.queryByRole('heading', { name: 'Reference Projects' })).not.toBeInTheDocument();
    const user = userEvent.setup();
    const rail = screen.getByRole('navigation', { name: 'Main' });
    const references = within(rail).getByRole('link', { name: 'References' });
    await user.click(references);

    expect(references).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('heading', { level: 1, name: 'Reference Projects' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('12 results');
    expect(screen.getByRole('link', { name: /Automatic pothole detection/ })).toHaveAttribute(
      'href',
      'https://github.com/sekilab/RoadDamageDetector',
    );
    expect(screen.getAllByRole('link', { name: 'Related lesson 13' })[0]).toHaveAttribute('href', '/lesson/13');
  });

  it('filters and switches reference sections and results layouts', async () => {
    renderAt('/references?tab=models&topic=traffic&view=list');
    const user = userEvent.setup();
    expect(screen.getByRole('button', { name: 'List' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('10 results');
    await user.type(screen.getByRole('searchbox', { name: 'Search references' }), 'counting');
    expect(screen.getByRole('status')).toHaveTextContent('1 result');
    const byteTrack = screen.getByRole('link', { name: /ByteTrack/ });
    expect(byteTrack).toHaveAttribute('href', 'https://github.com/ifzhang/ByteTrack');
    expect(byteTrack).toHaveAttribute('target', '_blank');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Topic' }), 'water');
    expect(screen.getByText('No references match your filters.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByRole('status')).toHaveTextContent('89 results');
    await user.click(screen.getByRole('link', { name: 'Demo ideas' }));
    expect(screen.getByRole('status')).toHaveTextContent('6 results');
    expect(screen.getByRole('button', { name: 'List' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows a lesson with its panel and all 15 lessons in the strip', () => {
    renderAt('/lesson/3');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Predict waterlogging (decision tree)' }),
    ).toBeInTheDocument();
    const strip = screen.getByRole('navigation', { name: 'Lessons' });
    expect(within(strip).getAllByRole('link')).toHaveLength(15);
    expect(within(strip).getByRole('link', { current: 'page' })).toHaveTextContent('Waterlogging tree');
    expect(useLab.getState().visited).toEqual([3]);
  });

  it('opens 8B from the traffic lesson and records a manual drive', async () => {
    const user = userEvent.setup();
    renderAt('/lesson/8');
    await user.click(screen.getByRole('link', { name: 'Try 8B · Waste robot' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Waste-collection robot (Q-learning)' })).toBeInTheDocument();
    expect(useLab.getState().visited).toEqual([8, '8b']);
    const driving = screen.getByRole('group', { name: 'Driving controls' });
    for (let move = 0; move < 3; move++) await user.click(within(driving).getByRole('button', { name: 'East' }));
    expect(screen.getByRole('status')).toHaveTextContent('Carrying waste');
    for (let move = 0; move < 2; move++) await user.click(within(driving).getByRole('button', { name: 'West' }));
    expect(screen.getByRole('status')).toHaveTextContent('Battery ran out');
    expect(screen.getByRole('link', { name: 'Try 8A · Traffic signal' })).toHaveAttribute('href', '/lesson/8');
    await user.click(within(driving).getByRole('button', { name: 'Restart drive' }));
  });

  it('trains and replays the two robot routes with matching starting batteries', () => {
    vi.useFakeTimers();
    try {
      renderAt('/lesson/8b');
      fireEvent.click(screen.getByRole('button', { name: 'Open training' }));
      fireEvent.click(screen.getByRole('button', { name: 'Watch next action' }));
      expect(screen.getByRole('columnheader', { name: 'Q-value update' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Train 600 attempts' }));
      act(() => vi.advanceTimersByTime(2400));
      expect(useRobot.getState().training.completed).toBe(600);

      fireEvent.click(screen.getByRole('button', { name: 'Open comparison' }));
      fireEvent.click(screen.getByRole('button', { name: 'Compare routes' }));
      for (let move = 0; move < TURN_LIMIT; move++) act(() => vi.advanceTimersByTime(400));
      const direct = screen.getByRole('heading', { name: 'Direct route' }).closest('section')!;
      const learned = screen.getByRole('heading', { name: 'Learned route' }).closest('section')!;
      expect(within(direct).getByText('Battery ran out')).toBeInTheDocument();
      expect(within(learned).getByText('Delivered to depot')).toBeInTheDocument();
      expect(useRobot.getState().training.completed).toBe(600);

      fireEvent.click(screen.getByRole('button', { name: '12' }));
      expect(within(direct).getByRole('meter')).toHaveAttribute('value', '12');
      expect(within(learned).getByRole('meter')).toHaveAttribute('value', '12');
    } finally {
      vi.useRealTimers();
      act(() => useRobot.getState().resetTraining());
    }
  });

  it('links the Break it step to the Break it tab', async () => {
    const user = userEvent.setup();
    renderAt('/lesson/3');
    await user.click(screen.getByRole('button', { name: /Break it/ }));
    expect(screen.getByRole('tab', { name: 'Break it' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('memorised');
  });

  it('switches the whole shell to Bangla', async () => {
    const user = userEvent.setup();
    renderAt('/lesson/3');
    await user.click(screen.getByRole('button', { name: 'বাংলা' }));
    expect(
      screen.getByRole('heading', { level: 1, name: 'জলাবদ্ধতার পূর্বাভাস (ডিসিশন ট্রি)' }),
    ).toBeInTheDocument();
    expect(screen.getByText('পাঠ ৩')).toBeInTheDocument();
    // Ported lessons carry their tab text and step briefs in Bangla too.
    await user.click(screen.getByRole('tab', { name: 'কীভাবে কাজ করে' }));
    expect(screen.getByRole('tabpanel')).toHaveTextContent('ট্রি সেই একটি প্রশ্ন বাছে');
    expect(screen.queryByText('আপাতত শুধু ইংরেজি')).not.toBeInTheDocument();
  });

  it('runs a ported lesson on the stage with step briefs and panel controls', async () => {
    const user = userEvent.setup();
    renderAt('/lesson/2');
    expect(screen.getByText(/An officer writes the knowledge as IF/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Next step/ }));
    expect(useLab.getState().step).toBe('explore');
    // A Break it preset in the panel loads a tricky complaint and moves the cycle to Break it.
    await user.click(screen.getByRole('button', { name: /Street light says/ }));
    expect(useLab.getState().step).toBe('break');
    expect(screen.getByText(/Conflict: rules point to different departments/)).toBeInTheDocument();
  });

  it('offers the online tool for online lessons', () => {
    renderAt('/lesson/10');
    const links = screen.getAllByRole('link', { name: /Open Transformer Explainer/ });
    expect(links[0]).toHaveAttribute('href', 'https://poloclub.github.io/transformer-explainer/');
    expect(document.querySelector('iframe')).toBeNull();
  });

  it('runs lesson 7 waste recogniser across all 6 steps with Teachable Machine reference and Bangla support', async () => {
    const user = userEvent.setup();
    renderAt('/lesson/7');

    expect(
      screen.getByRole('heading', { level: 1, name: 'Train an image recogniser with the webcam' }),
    ).toBeInTheDocument();

    // Preserves Google Teachable Machine external reference in both Overview References and Controls
    const refs = screen.getByRole('region', { name: 'References' });
    expect(within(refs).getByRole('link', { name: /Google Teachable Machine/ })).toHaveAttribute(
      'href',
      'https://teachablemachine.withgoogle.com/train/image',
    );
    expect(screen.getByRole('link', { name: /Open Teachable Machine/ })).toHaveAttribute(
      'href',
      'https://teachablemachine.withgoogle.com/train/image',
    );

    // Click CNN BACKBONE callout pin on the animated sorting conveyor scene and switch 3×3 filter
    await user.click(screen.getByRole('button', { name: 'CNN BACKBONE' }));
    expect(screen.getByText(/Frozen CNN Backbone/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Vertical edges' }));

    // Explore: toggle From scratch vs Transfer learning
    await user.click(screen.getByRole('button', { name: /2\. Frozen Backbone/ }));
    expect(screen.getByText(/Why 15 photos are enough: Transfer Learning/)).toBeInTheDocument();

    // Train: collect samples and trigger imbalanced-data warning
    await user.click(screen.getByRole('button', { name: /3\. Train Head/ }));
    await user.click(screen.getByRole('button', { name: /Imbalanced trap/ }));
    expect(screen.getByText(/Class imbalance warning/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Balanced \(12\)/ }));

    // Evaluate: unseen waste cards and 3×3 confusion matrix
    await user.click(screen.getByRole('button', { name: /4\. Unseen Belt/ }));
    expect(screen.getByText(/Test on 6 unseen waste items/)).toBeInTheDocument();

    // Break it: unseen aluminum metal can preset
    await user.click(screen.getByRole('button', { name: /Unseen metal can/ }));
    expect(useLab.getState().step).toBe('break');
    expect(screen.getByText(/High confidence ≠ correctness/)).toBeInTheDocument();

    // Apply: match civic setup and keep primary Teachable Machine handoff
    await user.click(screen.getByRole('button', { name: /Apply/ }));
    const tmLinks = screen.getAllByRole('link', { name: /Open Teachable Machine/ });
    expect(tmLinks.length).toBeGreaterThanOrEqual(2);
    for (const link of tmLinks) {
      expect(link).toHaveAttribute('href', 'https://teachablemachine.withgoogle.com/train/image');
    }

    // Switch to Bangla and verify full translation without English fallback tags
    await user.click(screen.getByRole('button', { name: 'বাংলা' }));
    expect(
      screen.getByRole('heading', { level: 1, name: 'ওয়েবক্যাম দিয়ে ছবি চেনার মডেল তৈরি' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'কীভাবে কাজ করে' }));
    expect(screen.queryByText('আপাতত শুধু ইংরেজি')).not.toBeInTheDocument();
  });

  it('lets learners change a neuron, train on examples and predict a held-back record', () => {
    renderAt('/lesson/6');
    expect(screen.getByRole('status')).toHaveTextContent('Output11');
    expect(screen.getByRole('heading', { name: 'Human neuron' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Inspect input A calculation' }));
    expect(screen.getByText('2 × 3 = 6')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Increase selected weight' }));
    expect(screen.getByText('2 × 4 = 8')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Decrease selected weight' }));
    fireEvent.click(screen.getByRole('button', { name: 'Increase Input A' }));
    expect(screen.getByRole('status')).toHaveTextContent('Output14');
    fireEvent.change(screen.getByRole('slider', { name: /^Weight A/ }), { target: { value: '-1' } });
    expect(screen.getByRole('status')).toHaveTextContent('Output2');
    fireEvent.click(screen.getByRole('button', { name: 'Inspect the sum' }));
    expect(screen.getByText('−3 + 4 + 1 = 2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Live training' }));
    const train = screen.getByRole('button', { name: 'Train one step' });
    fireEvent.click(train);
    expect(screen.getByText('2 → 2.25')).toBeInTheDocument();
    expect(screen.getByText('2 → 1.5')).toBeInTheDocument();
    for (let step = 0; step < 3; step++) fireEvent.click(train);
    expect(train).toBeDisabled();
    expect(screen.getByText('All three guesses match.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Evaluate/ }));
    expect(screen.getByText('4 × 3 = 12')).toBeInTheDocument();
    expect(screen.queryByText('Actual sacks')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reveal actual count' }));
    expect(screen.getByRole('status')).toHaveTextContent('Actual sacks12');
  });

  it('shows the hand-built hidden layer and connects the dot puzzle to TensorFlow Playground', () => {
    renderAt('/lesson/6');
    fireEvent.click(screen.getByRole('button', { name: 'Hidden layer' }));
    expect(screen.getByRole('status')).toHaveTextContent('Send one crew');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Street B reports' }));
    expect(screen.getByRole('status')).toHaveTextContent('Send to coordination');
    fireEvent.click(screen.getByRole('button', { name: 'Inspect the crew decision' }));
    expect(screen.getByText('1 − 1 = 0')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Street A reports' }));
    expect(screen.getByRole('status')).toHaveTextContent('Send one crew');

    fireEvent.click(screen.getByRole('button', { name: /Apply/ }));
    expect(screen.getByRole('status')).toHaveTextContent('3 of 4 cases match.');
    fireEvent.click(screen.getByRole('button', { name: 'Two hidden units' }));
    expect(screen.getByRole('status')).toHaveTextContent('4 of 4 cases match.');
    const links = screen.getAllByRole('link', { name: /Open TensorFlow Playground/ });
    expect(links).toHaveLength(2);
    for (const link of links) expect(link).toHaveAttribute('href', 'https://playground.tensorflow.org/');
  });

  it('explains when a lesson number does not exist', () => {
    renderAt('/lesson/40');
    expect(screen.getByText('There is no lesson 40. Choose a lesson from the home page.')).toBeInTheDocument();
  });

  it('runs both IoT & sensing lessons (13 and 14) with selectable AI brains, hardware pins and Bangla support', async () => {
    const user = userEvent.setup();
    renderAt('/lesson/13');
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Smart drain sensors: noisy streams & early flood warning',
      }),
    ).toBeInTheDocument();

    const refs13 = screen.getByRole('region', { name: 'References' });
    expect(within(refs13).getByRole('link', { name: /Learn Arduino/ })).toHaveAttribute(
      'href',
      'https://learn-arduino-red.vercel.app/',
    );
    expect(within(refs13).getByRole('link', { name: /Learn ESP32/ })).toHaveAttribute(
      'href',
      'https://learn-esp32.vercel.app/',
    );

    // Click HC-SR04P hardware callout pin on the SVG scene and switch AI brain to Decision Tree
    await user.click(screen.getByRole('button', { name: 'HC-SR04P' }));
    expect(screen.getByText(/HC-SR04P Ultrasonic/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Decision Tree/ }));

    // Jump to Break it via the mud-covered stuck sensor preset
    await user.click(screen.getByRole('button', { name: 'Mud-covered stuck sensor' }));
    expect(useLab.getState().step).toBe('break');
    expect(screen.getByText('Sensor stuck (flatline)!')).toBeInTheDocument();

    // Switch to sibling Lesson 14 (Pump Edge AI) via panel alternative link & test Tiny Neural Net brain
    await user.click(screen.getByRole('link', { name: 'Try 14 · Pump Edge AI' }));
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Stormwater pump health: vibration sensing & Edge AI',
      }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Overview' }));
    const refs14 = screen.getByRole('region', { name: 'References' });
    expect(within(refs14).getByRole('link', { name: /Learn Arduino/ })).toHaveAttribute(
      'href',
      'https://learn-arduino-red.vercel.app/',
    );
    expect(within(refs14).getByRole('link', { name: /Learn ESP32/ })).toHaveAttribute(
      'href',
      'https://learn-esp32.vercel.app/',
    );
    await user.click(screen.getByRole('button', { name: /Tiny Neural Net/ }));
    expect(screen.getByText(/MLP\(256B\)/)).toBeInTheDocument();

    // Switch to Bangla and verify full translation without English fallback tags
    await user.click(screen.getByRole('button', { name: 'বাংলা' }));
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'পাম্পের স্বাস্থ্য নির্ণয়: ভাইব্রেশন সেন্সর ও এজ এআই',
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'রেফারেন্স' })).toBeInTheDocument();
    expect(screen.queryByText('আপাতত শুধু ইংরেজি')).not.toBeInTheDocument();
  });
});
