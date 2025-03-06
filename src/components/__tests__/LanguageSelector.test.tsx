import { render, screen, fireEvent } from '@testing-library/react';
import LanguageSelector from '../LanguageSelector';
import useGraphStore from '../../store/useGraphStore';
import { getAvailableCodeLanguages } from '../../utils/codeGenerator/index';

// Mock the graph store
jest.mock('../../store/useGraphStore', () => jest.fn());
jest.mock('../../utils/codeGenerator/index', () => ({
  getAvailableCodeLanguages: jest.fn()
}));

describe('LanguageSelector', () => {
  beforeEach(() => {
    // Mock implementation for useGraphStore
    (useGraphStore as jest.MockedFunction<typeof useGraphStore>).mockReturnValue({
      selectedLanguage: 'Python',
      setSelectedLanguage: jest.fn(),
    } as any);
    
    // Mock implementation for getAvailableCodeLanguages
    (getAvailableCodeLanguages as jest.MockedFunction<typeof getAvailableCodeLanguages>).mockReturnValue([
      'Python', 'TypeScript', 'C++', 'Java', 'Go'
    ]);
  });
  
  it('renders with the correct selected language', () => {
    render(<LanguageSelector />);
    expect(screen.getByRole('combobox')).toHaveValue('Python');
  });
  
  it('renders all available language options', () => {
    render(<LanguageSelector />);
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(5);
    expect(options[0]).toHaveValue('Python');
    expect(options[1]).toHaveValue('TypeScript');
    expect(options[2]).toHaveValue('C++');
    expect(options[3]).toHaveValue('Java');
    expect(options[4]).toHaveValue('Go');
  });
  
  it('calls setSelectedLanguage when a different language is selected', () => {
    const setSelectedLanguageMock = jest.fn();
    (useGraphStore as jest.MockedFunction<typeof useGraphStore>).mockReturnValue({
      selectedLanguage: 'Python',
      setSelectedLanguage: setSelectedLanguageMock,
    } as any);
    
    render(<LanguageSelector />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Java' } });
    expect(setSelectedLanguageMock).toHaveBeenCalledWith('Java');
  });
  
  it('applies compact styling when compact prop is true', () => {
    render(<LanguageSelector compact={true} />);
    const select = screen.getByRole('combobox');
    expect(select).toHaveStyle({ padding: '0.25rem 0.4rem', fontSize: '0.7rem' });
  });
  
  it('applies regular styling when compact prop is false', () => {
    render(<LanguageSelector compact={false} />);
    const select = screen.getByRole('combobox');
    expect(select).toHaveStyle({ padding: '0.35rem 0.5rem', fontSize: '0.75rem' });
  });
  
  it('applies custom width when width prop is provided', () => {
    render(<LanguageSelector width="200px" />);
    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('style', expect.stringContaining('width: 100%'));
  });
}); 