import { render, screen } from '@testing-library/react';
import App from './App';

test('renders MTI hero content', () => {
  render(<App />);
  expect(
    screen.getByRole('heading', {
      name: /Refined interior solutions for homes, offices, and retail spaces/i,
    })
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Book consultation/i })).toBeInTheDocument();
});
