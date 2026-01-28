# Component Architecture

Guidelines for structuring, splitting, and composing React components.

---

## 200-Line Threshold

Components exceeding ~200 lines should be evaluated for splitting. Signs you need to split:

- Multiple unrelated responsibilities
- Deeply nested JSX
- Many useState/useEffect hooks
- Hard to understand at a glance

---

## Container/Presentational Separation

```tsx
// Container - handles data and logic
function ArtworkListContainer() {
  const artworks = useQuery(api.artworks.list);
  const deleteArtwork = useMutation(api.artworks.remove);

  if (!artworks) return <Loading />;

  return (
    <ArtworkList
      artworks={artworks}
      onDelete={deleteArtwork}
    />
  );
}

// Presentational - pure rendering
function ArtworkList({ artworks, onDelete }: Props) {
  return (
    <ul>
      {artworks.map(artwork => (
        <ArtworkItem
          key={artwork._id}
          artwork={artwork}
          onDelete={() => onDelete({ id: artwork._id })}
        />
      ))}
    </ul>
  );
}
```

---

## Hook Extraction Patterns

Extract complex logic into custom hooks:

```tsx
// BAD - logic cluttering component
function ArtworkForm() {
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => { /* 20 lines */ };
  const handleSubmit = async () => { /* 30 lines */ };
  // ... 50+ more lines of form logic

  return <form>...</form>;
}

// GOOD - extracted hook
function useArtworkForm(initialData?: Artwork) {
  const [formData, setFormData] = useState({
    title: initialData?.title ?? "",
    year: initialData?.year ?? "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createArtwork = useMutation(api.artworks.create);
  const updateArtwork = useMutation(api.artworks.update);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (formData.year && isNaN(Number(formData.year))) {
      newErrors.year = "Year must be a number";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      if (initialData) {
        await updateArtwork({ id: initialData._id, ...formData });
      } else {
        await createArtwork(formData);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return { formData, setFormData, errors, isSubmitting, handleSubmit };
}

// Clean component
function ArtworkForm({ artwork }: Props) {
  const { formData, setFormData, errors, isSubmitting, handleSubmit } =
    useArtworkForm(artwork);

  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={formData.title}
        onChange={e => setFormData(d => ({ ...d, title: e.target.value }))}
        error={errors.title}
      />
      {/* ... */}
    </form>
  );
}
```

---

## Composition Over Props

```tsx
// BAD - prop explosion
<Card
  title="Artwork"
  subtitle="Details"
  headerAction={<Button>Edit</Button>}
  footerContent={<Button>Save</Button>}
  showBorder
  padding="large"
/>

// GOOD - composition
<Card>
  <Card.Header>
    <Card.Title>Artwork</Card.Title>
    <Button>Edit</Button>
  </Card.Header>
  <Card.Body>
    {/* content */}
  </Card.Body>
  <Card.Footer>
    <Button>Save</Button>
  </Card.Footer>
</Card>
```

---

## Component File Structure

For complex components, use a folder:

```
ArtworkForm/
  index.tsx           # Main component, re-exports
  ArtworkForm.tsx     # Core component
  FormFields.tsx      # Sub-components
  useArtworkForm.ts   # Custom hook
  types.ts            # TypeScript types
```

---

## Migration: ArtworkForm.tsx

Current state: 481 lines, multiple responsibilities.

Split into:

1. **useArtworkForm.ts** - Form state and submission logic
2. **useDropzone.ts** - Drag-drop file handling
3. **FormFields.tsx** - Input field components
4. **ImageUpload.tsx** - Image upload UI
5. **ArtworkForm.tsx** - Main form component (~100 lines)

```tsx
// After refactor
function ArtworkForm({ artwork, onSuccess }: Props) {
  const form = useArtworkForm(artwork);
  const dropzone = useDropzone({ onDrop: form.handleImageDrop });

  return (
    <form onSubmit={form.handleSubmit}>
      <FormFields
        data={form.data}
        errors={form.errors}
        onChange={form.setField}
      />
      <ImageUpload
        image={form.data.image}
        dropzone={dropzone}
        onRemove={form.removeImage}
      />
      <SubmitButton loading={form.isSubmitting} />
    </form>
  );
}
```
