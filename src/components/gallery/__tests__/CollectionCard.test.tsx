import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CollectionCard, CabinetCard } from '../CollectionCard'

describe('CollectionCard', () => {
  const mockCollection = {
    _id: 'col1' as const,
    name: 'Abstract Works',
    description: 'A collection of abstract paintings',
    slug: 'abstract-works',
    coverImageUrl: 'http://example.com/cover.jpg',
    artworkCount: 12,
  }

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>)
  }

  it('renders collection name', () => {
    renderWithRouter(<CollectionCard collection={mockCollection} index={0} />)
    expect(screen.getByText('Abstract Works')).toBeInTheDocument()
  })

  it('renders collection description', () => {
    renderWithRouter(<CollectionCard collection={mockCollection} index={0} />)
    expect(screen.getByText('A collection of abstract paintings')).toBeInTheDocument()
  })

  it('renders artwork count with "works" plural', () => {
    renderWithRouter(<CollectionCard collection={mockCollection} index={0} />)
    expect(screen.getByText('12 works')).toBeInTheDocument()
  })

  it('renders artwork count with "work" singular', () => {
    const singleArtwork = { ...mockCollection, artworkCount: 1 }
    renderWithRouter(<CollectionCard collection={singleArtwork} index={0} />)
    expect(screen.getByText('1 work')).toBeInTheDocument()
  })

  it('links to collection page', () => {
    renderWithRouter(<CollectionCard collection={mockCollection} index={0} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/collection/abstract-works')
  })

  it('renders cover image when available', () => {
    renderWithRouter(<CollectionCard collection={mockCollection} index={0} />)
    const img = screen.getByAltText('Abstract Works')
    expect(img).toHaveAttribute('src', 'http://example.com/cover.jpg')
  })

  it('shows placeholder when no cover image', () => {
    const noCover = { ...mockCollection, coverImageUrl: null }
    renderWithRouter(<CollectionCard collection={noCover} index={0} />)
    expect(screen.getByText('No cover image')).toBeInTheDocument()
  })

  it('does not render description when missing', () => {
    const noDesc = { ...mockCollection, description: undefined }
    renderWithRouter(<CollectionCard collection={noDesc} index={0} />)
    expect(screen.queryByText('A collection of abstract paintings')).not.toBeInTheDocument()
  })

  it('applies animation delay based on index', () => {
    renderWithRouter(<CollectionCard collection={mockCollection} index={2} />)
    const link = screen.getByRole('link')
    expect(link).toHaveStyle({ animationDelay: '200ms' })
  })

  it('has hover animation classes', () => {
    renderWithRouter(<CollectionCard collection={mockCollection} index={0} />)
    const link = screen.getByRole('link')
    expect(link.className).toContain('hover:-translate-y-2')
    expect(link.className).toContain('hover:shadow-2xl')
  })
})

describe('CabinetCard', () => {
  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>)
  }

  it('renders Cabinet title', () => {
    renderWithRouter(<CabinetCard count={5} index={0} />)
    expect(screen.getByText('Cabinet of Curiosities')).toBeInTheDocument()
  })

  it('renders Cabinet description', () => {
    renderWithRouter(<CabinetCard count={5} index={0} />)
    expect(screen.getByText('Uncategorized works and experiments')).toBeInTheDocument()
  })

  it('links to cabinet page', () => {
    renderWithRouter(<CabinetCard count={5} index={0} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/collection/cabinet-of-curiosities')
  })

  it('renders work count with plural', () => {
    renderWithRouter(<CabinetCard count={5} index={0} />)
    expect(screen.getByText('5 works')).toBeInTheDocument()
  })

  it('renders work count with singular', () => {
    renderWithRouter(<CabinetCard count={1} index={0} />)
    expect(screen.getByText('1 work')).toBeInTheDocument()
  })

  it('renders zero works', () => {
    renderWithRouter(<CabinetCard count={0} index={0} />)
    expect(screen.getByText('0 works')).toBeInTheDocument()
  })

  it('has italic title styling', () => {
    renderWithRouter(<CabinetCard count={5} index={0} />)
    const title = screen.getByText('Cabinet of Curiosities')
    expect(title.className).toContain('italic')
  })

  it('applies animation delay based on index', () => {
    renderWithRouter(<CabinetCard count={5} index={3} />)
    const link = screen.getByRole('link')
    expect(link).toHaveStyle({ animationDelay: '300ms' })
  })

  it('renders SVG icon', () => {
    renderWithRouter(<CabinetCard count={5} index={0} />)
    const svg = document.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('has hover animation classes', () => {
    renderWithRouter(<CabinetCard count={5} index={0} />)
    const link = screen.getByRole('link')
    expect(link.className).toContain('hover:-translate-y-2')
    expect(link.className).toContain('hover:shadow-2xl')
  })
})
